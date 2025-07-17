import MutualFund from '../models/mf.model.js'

async function listMutualFunds(req, res) {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 100
        const search = req.query.search || ''
        const skip = (page - 1) * limit

        const query = {}

        if (search) {
            const regex = new RegExp(search, 'i') // case-insensitive search
            query.$or = [
                { name: regex },
                { isin: regex },
                { 'category.assetClass': regex },
                { 'category.fundType': regex },
                { 'category.subCategory': regex },
            ]
        }

        const [data, total] = await Promise.all([
            MutualFund.find(query).skip(skip).limit(limit),
            MutualFund.countDocuments(query),
        ])

        res.json({
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: skip + limit < total,
                hasPrev: skip > 0,
            },
        })
    } catch (error) {
        console.error('Error fetching mutual funds:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function getStats(req, res) {
    try {
        const totalFunds = await MutualFund.countDocuments()
        res.json({ totalFunds })
    } catch (error) {
        console.error('Error fetching stats:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

export { listMutualFunds, getStats }
