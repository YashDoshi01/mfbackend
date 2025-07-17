import express from 'express';
const mfRoute = express.Router();


<<<<<<< Updated upstream
=======
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
mfRoute.post('/:fundId/category', async (req, res) => {
    try {
      const { fundId } = req.params
      const { category } = req.body
        console.log("received")
      if (!category || category.trim() === '') {
        return res.status(400).json({ error: 'Category is required' })
      }
  
      const fund = await MutualFund.findById(fundId)
      if (!fund) {
        return res.status(404).json({ error: 'Mutual Fund not found' })
        console.log("not found")
      }
  
      if (!fund.categories) {
        fund.categories = []
      }
  
      const categoryLower = category.trim().toLowerCase()
      const exists = fund.category.some(c => c.toLowerCase() === categoryLower)
      
      if (!exists) {
        fund.category.push(category.trim())
        await fund.save()
      }
  
      res.json({
        message: 'Category added successfully',
        fund,
      })
    } catch (error) {
      console.error('Error adding category:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })
  
export default mfRoute
>>>>>>> Stashed changes
