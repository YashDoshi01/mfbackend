import express from 'express'
import { fetchAndPrintNAVs } from '../index.js'
const mfRoute = express.Router()

mfRoute.get('/', (req, res) => res.send('Hello from Mutual Funds'))

mfRoute.get('/list-mf', async (req, res) => {
    try {
        // Extract pagination parameters from query string
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 100
        const search = req.query.search || ''

        // Validate parameters
        if (page < 1) {
            return res
                .status(400)
                .json({ error: 'Page must be greater than 0' })
        }
        if (limit < 1 || limit > 1000) {
            return res
                .status(400)
                .json({ error: 'Limit must be between 1 and 1000' })
        }

        const result = await fetchAndPrintNAVs(page, limit, search)
        res.json(result)
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

export default mfRoute
