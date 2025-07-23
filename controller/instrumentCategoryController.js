import { InstrumentCategory, AmfiCategory } from '../models/categoryModels.js'

async function allInstrumentCategories(req, res) {
    try {
        const search = req.query.search || ''
        const assetClass = req.query.assetClass || ''
        const route = req.query.route || ''
        const query = {}

        // Add asset class filter if provided
        if (assetClass) {
            query.assetClass = assetClass
        }

        // Add route filter if provided
        if (route) {
            query.route = route
        }

        // Add search functionality
        if (search) {
            const regex = new RegExp(search, 'i')
            query.$or = [
                { name: regex },
                { assetClass: regex },
                { route: regex },
                { amfiCategory: regex },
            ]
        }

        const categories = await InstrumentCategory.find(query).sort({
            name: 1,
        })
        res.json(categories)
    } catch (error) {
        console.error('Error fetching instrument categories:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function listInstrumentCategories(req, res) {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const search = req.query.search || ''
        const skip = (page - 1) * limit
        const assetClass = req.query.assetClass || ''
        const route = req.query.route || ''
        const query = {}

        // Add asset class filter if provided
        if (assetClass) {
            query.assetClass = assetClass
        }

        // Add route filter if provided
        if (route) {
            query.route = route
        }

        // Add search functionality
        if (search) {
            const regex = new RegExp(search, 'i')
            query.$or = [
                { name: regex },
                { assetClass: regex },
                { route: regex },
                { amfiCategory: regex },
            ]
        }

        const [categories, total] = await Promise.all([
            InstrumentCategory.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),
            InstrumentCategory.countDocuments(query),
        ])

        const totalPages = Math.ceil(total / limit)

        res.json({
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
        console.error('Error fetching instrument categories:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function fetchInstrumentCategoryById(req, res) {
    try {
        const { id } = req.params
        if (!id || id.trim() === '' || id.length !== 24) {
            return res.status(400).json({ error: 'Category ID is required' })
        }
        const category = await InstrumentCategory.findById(id)
        if (!category) {
            return res.status(404).json({ error: 'Category not found' })
        }
        res.json(category)
    } catch (error) {
        console.error('Error fetching category:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function fetchInstrumentCategoriesByAssetClass(req, res) {
    try {
        const { name } = req.params
        if (!name) {
            return res
                .status(400)
                .json({ error: 'Asset class name is required' })
        }

        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const search = req.query.search || ''
        const skip = (page - 1) * limit

        const query = { assetClass: name }

        if (search) {
            const regex = new RegExp(search, 'i')
            query.$or = [
                { name: regex },
                { route: regex },
                { amfiCategory: regex },
            ]
        }

        const [categories, total] = await Promise.all([
            InstrumentCategory.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),
            InstrumentCategory.countDocuments(query),
        ])

        if (total === 0) {
            return res.status(404).json({ error: 'Categories not found' })
        }

        const totalPages = Math.ceil(total / limit)

        res.json({
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
        console.error('Error fetching categories:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function fetchInstrumentCategoriesByRouteId(req, res) {
    try {
        const { id } = req.params
        if (!id || id.trim() === '' || id.length !== 24) {
            return res.status(400).json({ error: 'Route ID is required' })
        }

        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const search = req.query.search || ''
        const skip = (page - 1) * limit

        const query = { routeID: id }

        if (search) {
            const regex = new RegExp(search, 'i')
            query.$or = [
                { name: regex },
                { assetClass: regex },
                { route: regex },
                { amfiCategory: regex },
            ]
        }

        const [categories, total] = await Promise.all([
            InstrumentCategory.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),
            InstrumentCategory.countDocuments(query),
        ])

        if (total === 0) {
            return res.status(404).json({ error: 'Categories not found' })
        }

        const totalPages = Math.ceil(total / limit)

        res.json({
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
        console.error('Error fetching categories:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function addInstrumentCategory(req, res) {
    try {
        let { name, assetClass, routeID, route, range } = req.body
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' })
        }
        if (!routeID) {
            return res.status(400).json({ error: 'Route ID is required' })
        }
        if (!route) {
            return res.status(400).json({ error: 'Route name is required' })
        }
        if (!assetClass) {
            return res.status(400).json({ error: 'Asset class is required' })
        }
        if (!range) {
            range = { min: null, max: null }
        }
        const newCategory = new InstrumentCategory({
            name,
            assetClass,
            routeID,
            route,
            range,
        })
        await newCategory.save()
        res.status(201).json(newCategory)
    } catch (error) {
        console.error('Error adding category:', error)
        res.status(501).json({ error: 'Internal server error' })
    }
}

async function updateInstrumentCategory(req, res) {
    console.log('Updating instrument category')
    try {
        const { id } = req.params
        let { name, assetClass, routeID, route, range } = req.body
        if (!id || id.trim() === '' || id.length !== 24) {
            return res.status(400).json({ error: 'Category ID is required' })
        }
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' })
        }
        if (!routeID) {
            return res.status(400).json({ error: 'Route ID is required' })
        }
        if (!route) {
            return res.status(400).json({ error: 'Route name is required' })
        }
        if (!range) {
            range = { min: null, max: null }
        }
        const updatedCategory = await InstrumentCategory.findByIdAndUpdate(
            id,
            { name, assetClass, routeID, route, range },
            { new: true }
        )
        if (!updatedCategory) {
            return res.status(404).json({ error: 'Category not found' })
        }
        res.json(updatedCategory)
    } catch (error) {
        console.error('Error updating category:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function deleteInstrumentCategory(req, res) {
    try {
        const { id } = req.params
        if (!id || id.trim() === '' || id.length !== 24) {
            return res.status(400).json({ error: 'Category ID is required' })
        }
        const assignedAmfiCategories = await AmfiCategory.find({
            instrumentCategorySchema: id,
        })

        if (assignedAmfiCategories.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete instrument category. It is assigned to one or more AMFI categories.',
                assignedCategories: assignedAmfiCategories.map((cat) => ({
                    id: cat._id,
                    name: cat.name,
                })),
            })
        }
        const deletedCategory = await InstrumentCategory.findByIdAndDelete(id)
        if (!deletedCategory) {
            return res.status(404).json({ error: 'Category not found' })
        }
        res.json({ message: 'Category deleted successfully' })
    } catch (error) {
        console.error('Error deleting category:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

export {
    listInstrumentCategories,
    addInstrumentCategory,
    fetchInstrumentCategoryById,
    fetchInstrumentCategoriesByAssetClass,
    fetchInstrumentCategoriesByRouteId,
    updateInstrumentCategory,
    deleteInstrumentCategory,
    allInstrumentCategories,
}
