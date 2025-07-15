import express from 'express'
import { fetchAndPrintNAVs } from '../index.js'
import MutualFund from '../models/mf.model.js'
const mfRoute = express.Router()

mfRoute.get('/', (req, res) => res.send('Hello from Mutual Funds'))

mfRoute.get('/list-mf', async (req, res) => {
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
})

mfRoute.get('/stats', async (req, res) => {
    try {
        // Get first page with limit 1 just to get total count
        const result = await fetchAndPrintNAVs(1, 1)
        res.json({
            totalFunds: result.pagination.total,
            message: 'Use /list-mf endpoint with pagination parameters',
        })
    } catch (error) {
        console.error('Error fetching stats:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

mfRoute.get('/insert-mf', async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 100
    const search = req.query.search || ''
    const result = await fetchAndPrintNAVs(page, limit, search)
    res.json(result)
})
export default mfRoute
