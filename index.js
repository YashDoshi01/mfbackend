import express from 'express'
import mongoose from 'mongoose'
import mfRoute from './routes/mf.route.js'
// import dotenv from 'dotenv';
import axios from 'axios'
import xlsx from 'xlsx'
import  insertFundsToMongo  from './util/fundsintomongo.js';
import connectDB from './db.js';
const app = express()
// dotenv.config();
app.use(express.json())
app.use('/api/mutualfund', mfRoute)
connectDB();
function buildISINMap() {
    const workbook = xlsx.readFile('./Model Portfolios_sample.xlsx')
    const sheet = workbook.Sheets['Instruments & Categorise']
    const rows = xlsx.utils.sheet_to_json(sheet)

    const isinMap = {}

    rows.forEach((row, index) => {
        const isin = row['ISIN Code']?.toString().trim()
        const name = row['Instrument Name']?.toString().trim()
        const aaKey = row['AA Key']?.toString().trim()

        // Only process rows with valid ISIN codes (Indian ISINs start with INF)
        if (isin && isin.startsWith('INF') && name && aaKey) {
            const parts = aaKey.split('-').map((s) => s.trim())
            if (parts.length >= 3) {
                const [assetClass, fundType, subCategory] = parts
                isinMap[isin] = {
                    name,
                    assetClass,
                    fundType,
                    subCategory,
                }
            }
        }
    })

    return isinMap
}

// Cache for storing parsed funds to avoid re-parsing on every request
let cachedFunds = null
let cacheTimestamp = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

async function fetchAndPrintNAVs(page = 1, limit = 100, search = '') {
    const isinMap = buildISINMap()

    // Check if we need to refresh the cache
    const now = Date.now()
    if (
        !cachedFunds ||
        !cacheTimestamp ||
        now - cacheTimestamp > CACHE_DURATION
    ) {

        const response = await axios.get(
            'https://www.amfiindia.com/spages/NAVAll.txt',
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    Accept: 'text/plain',
                },
            }
        )

        const lines = response.data.split('\n').filter((line) => {
            // Skip empty lines, headers, and separators
            return (
                line.trim() !== '' &&
                !line.startsWith('Scheme Code') &&
                !line.startsWith('--')
            )
        })

        const parsedFunds = []

        for (const line of lines) {
            const parts = line.split(';')
            if (parts.length < 6) continue

            const [
                schemeCode,
                isinDivPayout,
                isinDivReinvestment,
                schemeName,
                nav,
                date,
            ] = parts

            // Find the first valid ISIN from any of the ISIN fields
            // const navValue = parseFloat(nav);
            // if (isNaN(navValue)) continue;
            let isin = null
            if (
                isinDivPayout &&
                isinDivPayout.trim() !== '' &&
                isinDivPayout !== '-'
            ) {
                isin = isinDivPayout.trim()
            } else if (
                isinDivReinvestment &&
                isinDivReinvestment.trim() !== '' &&
                isinDivReinvestment !== '-'
            ) {
                isin = isinDivReinvestment.trim()
            }

            // Skip if no valid ISIN, NAV, date, or scheme name
            if (
                !isin ||
                !nav?.trim() ||
                nav.trim() === 'N.A.' ||
                isNaN(parseFloat(nav)) ||
                !date?.trim() ||
                !schemeName?.trim()
              ) {
                continue;
              }

            // Check if ISIN is in our mapping
            const info = isinMap[isin]

            parsedFunds.push({
                isin,
                name: schemeName.trim(),
                category: info
                    ? {
                          assetClass: info.assetClass,
                          fundType: info.fundType,
                          subCategory: info.subCategory,
                      }
                    : null, // No category if not in mapping
                nav: nav,
                navDate: new Date(date),
            })
        }

        // Update cache
        cachedFunds = parsedFunds
        cacheTimestamp = now
        await insertFundsToMongo(parsedFunds);
    }

    // Apply search filter if provided
    let filteredFunds = cachedFunds
    if (search) {
        const searchLower = search.toLowerCase()
        filteredFunds = cachedFunds.filter(
            (fund) =>
                fund.name.toLowerCase().includes(searchLower) ||
                fund.isin.toLowerCase().includes(searchLower) ||
                (fund.category &&
                    (fund.category.assetClass
                        ?.toLowerCase()
                        .includes(searchLower) ||
                        fund.category.fundType
                            ?.toLowerCase()
                            .includes(searchLower) ||
                        fund.category.subCategory
                            ?.toLowerCase()
                            .includes(searchLower)))
        )
    }

    // Apply pagination
    const total = filteredFunds.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedFunds = filteredFunds.slice(startIndex, endIndex)

    return {
        data: paginatedFunds,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: endIndex < total,
            hasPrev: startIndex > 0,
        },
    }
}
app.listen(5000, () => {
    console.log(`Server is running on port 5000`)
})

export { fetchAndPrintNAVs }

export default app
