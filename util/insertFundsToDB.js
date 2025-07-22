import pLimit from 'p-limit'
import MutualFund from '../models/mf.model.js'

async function insertFundsToDB(funds) {
    if (funds.length === 0) {
        console.log('No funds to insert')
        return
    }

    try {
        await upsertMutualFundsInBatches(funds)
        console.log('Funds inserted successfully')
    } catch (error) {
        console.error('Error inserting funds:', error)
    }
}

function chunkArray(array, size) {
    const result = []
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size))
    }
    return result
}

export async function upsertMutualFundsInBatches(
    data,
    batchSize = 1000,
    concurrency = 4
) {
    const now = new Date()
    const limit = pLimit(concurrency)
    const chunks = chunkArray(data, batchSize)

    const tasks = chunks.map((chunk) =>
        limit(async () => {
            const isins = chunk.map((fund) => fund.isin)
            const existingDocs = await MutualFund.find(
                { isin: { $in: isins } },
                { isin: 1, nav: 1, navDate: 1, amfiCategory: 1 }
            ).lean()

            const existingMap = new Map(
                existingDocs.map((doc) => [
                    doc.isin,
                    {
                        nav: doc.nav,
                        navDate: doc.navDate,
                        amfiCategory: doc.amfiCategory,
                    },
                ])
            )

            const ops = []

            for (const fund of chunk) {
                const existing = existingMap.get(fund.isin)

                if (!existing) {
                    ops.push({
                        updateOne: {
                            filter: { isin: fund.isin },
                            update: {
                                $set: { ...fund, updatedAt: now },
                                $setOnInsert: { createdAt: now },
                            },
                            upsert: true,
                        },
                    })
                } else {
                    // Check if any field has changed
                    const hasChanges =
                        existing.nav !== fund.nav ||
                        existing.navDate?.getTime() !==
                            fund.navDate?.getTime() ||
                        existing.amfiCategory?.toString() !==
                            fund.amfiCategory?.toString()

                    if (hasChanges) {
                        ops.push({
                            updateOne: {
                                filter: { isin: fund.isin },
                                update: {
                                    $set: { ...fund, updatedAt: now },
                                },
                            },
                        })
                    }
                }
            }

            if (ops.length > 0) {
                try {
                    const res = await MutualFund.bulkWrite(ops, {
                        ordered: false,
                        writeConcern: { w: 'majority' },
                    })

                    console.log(
                        `Batch processed: ${res.upsertedCount} inserted, ${res.modifiedCount} updated`
                    )
                } catch (error) {
                    console.error('BulkWrite error:', error)
                    throw error
                }
            } else {
                console.log('Batch: no changes')
            }
        })
    )

    await Promise.all(tasks)
    console.log('✅ All mutual fund data processed.')
}
export default insertFundsToDB
