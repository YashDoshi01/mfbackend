import { InstrumentCategory } from '../../models/category.model.js'

async function listInstrumentCategories(req, res) {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const skip = (page - 1) * limit

        const total = await InstrumentCategory.countDocuments()
        const categories = await InstrumentCategory.find()
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)

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
        if (!id) {
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
        const skip = (page - 1) * limit

        const total = await InstrumentCategory.countDocuments({
            assetClass: name,
        })
        const categories = await InstrumentCategory.find({ assetClass: name })
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)

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
        if (!id) {
            return res.status(400).json({ error: 'Route ID is required' })
        }

        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const skip = (page - 1) * limit

        const total = await InstrumentCategory.countDocuments({ routeID: id })
        const categories = await InstrumentCategory.find({ routeID: id })
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)

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
        const { name, assetClass, routeID, route, range } = req.body
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
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function updateInstrumentCategory(req, res) {
    try {
        const { id } = req.params
        const { name, assetClass, routeID, route, range } = req.body
        if (!id) {
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
        if (!id) {
            return res.status(400).json({ error: 'Category ID is required' })
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
}
