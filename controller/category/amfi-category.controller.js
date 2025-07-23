import {
    AmfiCategory,
    InstrumentCategory,
} from '../../models/category.model.js'

async function listAmfiCategories(req, res) {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const search = req.query.search || ''
        const skip = (page - 1) * limit

        let pipeline = []

        if (search) {
            // Escape special regex characters including parentheses
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const regex = new RegExp(escapedSearch, 'i')

            // Use aggregation pipeline to search category name, mutual fund names, and ISIN
            pipeline = [
                {
                    $lookup: {
                        from: 'mutualfunds',
                        localField: '_id',
                        foreignField: 'amfiCategory',
                        as: 'mutualFunds',
                    },
                },
                {
                    $match: {
                        $or: [
                            { name: regex }, // Search in AMFI category name
                            { 'mutualFunds.name': regex }, // Search in mutual fund names
                            { 'mutualFunds.isin': regex }, // Search in ISIN numbers
                        ],
                    },
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        status: 1,
                        instrumentCategorySchema: 1,
                        fundCount: { $size: '$mutualFunds' }, // Optional: include fund count
                    },
                },
                { $sort: { name: 1 } },
                { $skip: skip },
                { $limit: limit },
            ]
        } else {
            // No search, use simple find
            pipeline = [
                {
                    $lookup: {
                        from: 'mutualfunds',
                        localField: '_id',
                        foreignField: 'amfiCategory',
                        as: 'mutualFunds',
                    },
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        status: 1,
                        instrumentCategorySchema: 1,
                        fundCount: { $size: '$mutualFunds' },
                    },
                },
                { $sort: { name: 1 } },
                { $skip: skip },
                { $limit: limit },
            ]
        }

        // Get total count for pagination
        let countPipeline = []
        if (search) {
            // Use the same escaped search for count pipeline
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const regex = new RegExp(escapedSearch, 'i')
            countPipeline = [
                {
                    $lookup: {
                        from: 'mutualfunds',
                        localField: '_id',
                        foreignField: 'amfiCategory',
                        as: 'mutualFunds',
                    },
                },
                {
                    $match: {
                        $or: [
                            { name: regex },
                            { 'mutualFunds.name': regex },
                            { 'mutualFunds.isin': regex },
                        ],
                    },
                },
                { $count: 'total' },
            ]
        } else {
            countPipeline = [{ $count: 'total' }]
        }

        const [categories, totalResult] = await Promise.all([
            AmfiCategory.aggregate(pipeline, { allowDiskUse: true }),
            AmfiCategory.aggregate(countPipeline, { allowDiskUse: true }),
        ])

        const total = totalResult.length > 0 ? totalResult[0].total : 0
        const totalPages = Math.ceil(total / limit)

        res.status(200).json({
            categories,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        })
    } catch (error) {
        console.error('Error fetching AMFI categories:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}



async function allAmfiCategories(req, res) {
    try {
        const search = req.query.search || ''
        
        let pipeline = []

        if (search) {
            // Escape special regex characters including parentheses
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const regex = new RegExp(escapedSearch, 'i')

            // Use aggregation pipeline to search category name, mutual fund names, and ISIN
            pipeline = [
                {
                    $lookup: {
                        from: 'mutualfunds',
                        localField: '_id',
                        foreignField: 'amfiCategory',
                        as: 'mutualFunds',
                    },
                },
                {
                    $match: {
                        $or: [
                            { name: regex }, // Search in AMFI category name
                            { 'mutualFunds.name': regex }, // Search in mutual fund names
                            { 'mutualFunds.isin': regex }, // Search in ISIN numbers
                        ],
                    },
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        status: 1,
                        instrumentCategorySchema: 1,
                        fundCount: { $size: '$mutualFunds' }, // Optional: include fund count
                    },
                },
                { $sort: { name: 1 } },
            ]
        } else {
            // No search, use simple find
            pipeline = [
                {
                    $lookup: {
                        from: 'mutualfunds',
                        localField: '_id',
                        foreignField: 'amfiCategory',
                        as: 'mutualFunds',
                    },
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        status: 1,
                        instrumentCategorySchema: 1,
                        fundCount: { $size: '$mutualFunds' },
                    },
                },
                { $sort: { name: 1 } },
            ]
        }

        const categories = await AmfiCategory.aggregate(pipeline, { allowDiskUse: true })
        res.status(200).json(categories)
    } catch (error) {
        console.error('Error fetching all AMFI categories:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}


async function getAmfiCategoryById(req, res) {
    try {
        const { id } = req.params
        if (!id || !id.trim() || id.length !== 24) {
            throw new Error('AMFI Category ID is required')
        }
        const category = await AmfiCategory.findById(id)
        if (!category) {
            throw new Error('AMFI Category not found')
        }
        res.status(200).json(category)
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function addAmfiCategory(req, res) {
    try {
        const { name } = req.body
        if (!name) {
            throw new Error('AMFI Category name is required')
        }
        const existingCategory = await AmfiCategory.findOne({ name })
        if (existingCategory) {
            throw new Error('AMFI Category already exists')
        }

        const newCategory = new AmfiCategory({ name })
        await newCategory.save()
        res.status(201).json(newCategory)
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function updateAmfiCategoryStatus(req, res) {
    try {
        const { categoryId, status } = req.body
        if (!categoryId || !status) {
            throw new Error('Category ID and status are required')
        }
        if (!['set', 'unset'].includes(status)) {
            throw new Error('Status must be either "set" or "unset"')
        }
        const updatedCategory = await AmfiCategory.findByIdAndUpdate(
            categoryId,
            { status },
            { new: true }
        )
        if (!updatedCategory) {
            throw new Error('AMFI Category not found')
        }
        res.status(200).json(updatedCategory)
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function linkInstrumentCategoryToAmfiCategory(req, res) {
    console.log(req.body)
    try {
        const { instrumentCategoryId, amfiCategoryId } = req.body
        if (!instrumentCategoryId || !amfiCategoryId) {
            throw new Error(
                'Instrument Category ID and AMFI Category ID are required'
            )
        }
        const instrumentCategory = await InstrumentCategory.findById(
            instrumentCategoryId
        )
        if (!instrumentCategory) {
            throw new Error('Instrument Category not found')
        }

        const amfiCategory = await AmfiCategory.findById(amfiCategoryId)
        if (!amfiCategory) {
            throw new Error('AMFI Category not found')
        }

        amfiCategory.instrumentCategorySchema = instrumentCategory._id
        amfiCategory.status = 'set'
        await amfiCategory.save()
        res.status(200).json({
            message: 'Instrument Category linked to AMFI Category successfully',
        })
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function updateAmfiCategory(req, res) {
    const { id, name } = req.body
    if (!id || !id.trim() || id.length !== 24 || !name || name.trim() === '') {
        return res.status(400).json({ error: 'ID and name are required' })
    }
    try {
        const updatedCategory = await AmfiCategory.findByIdAndUpdate(
            id,
            { name, status: 'unset' },
            { new: true }
        )
        if (!updatedCategory) {
            throw new Error('AMFI Category not found')
        }
        res.status(200).json(updatedCategory)
    } catch (error) {
        console.error('Error updating AMFI category:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function deleteAmfiCategory(req, res) {
    const { id } = req.params
    if (!id || !id.trim() || id.length !== 24) {
        return res.status(400).json({ error: 'ID is required' })
    }
    try {
        const deletedCategory = await AmfiCategory.findByIdAndDelete(id)
        if (!deletedCategory) {
            throw new Error('AMFI Category not found')
        }
        res.status(200).json({ message: 'AMFI Category deleted successfully' })
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
}

export {
    listAmfiCategories,
    allAmfiCategories,
    getAmfiCategoryById,
    addAmfiCategory,
    updateAmfiCategoryStatus,
    linkInstrumentCategoryToAmfiCategory,
    updateAmfiCategory,
    deleteAmfiCategory,
}
