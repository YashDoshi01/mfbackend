import { Route } from '../../models/category.model.js'

async function listRoutes(req, res) {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const search = req.query.search || ''
        const skip = (page - 1) * limit

        const query = {}

        if (search) {
            const regex = new RegExp(search, 'i') // case-insensitive search
            query.$or = [{ name: regex }, { assetClass: regex }]
        }

        const [routes, total] = await Promise.all([
            Route.find(query).sort({ name: 1 }).skip(skip).limit(limit),
            Route.countDocuments(query),
        ])

        const totalPages = Math.ceil(total / limit)

        res.json({
            routes,
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
        console.error('Error fetching routes:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function fetchRoutesById(req, res) {
    try {
        const { id } = req.params
        if (!id) {
            return res.status(400).json({ error: 'Route ID is required' })
        }
        const route = await Route.findById(id)
        if (!route) {
            return res.status(404).json({ error: 'Route not found' })
        }
        res.json(route)
    } catch (error) {
        console.error('Error fetching route:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function fetchRoutesByAssetClassId(req, res) {
    try {
        const { id } = req.params
        if (!id) {
            return res.status(400).json({ error: 'Asset class ID is required' })
        }

        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const search = req.query.search || ''
        const skip = (page - 1) * limit

        const query = { assetClassID: id }

        if (search) {
            const regex = new RegExp(search, 'i')
            query.$or = [{ name: regex }, { assetClass: regex }]
        }

        const [routes, total] = await Promise.all([
            Route.find(query).sort({ name: 1 }).skip(skip).limit(limit),
            Route.countDocuments(query),
        ])

        if (total === 0) {
            return res
                .status(404)
                .json({ error: 'No routes found for this asset class' })
        }

        const totalPages = Math.ceil(total / limit)

        res.json({
            routes,
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
        console.error('Error fetching routes:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function addRoute(req, res) {
    try {
        const { name, assetClass, assetClassID } = req.body
        if (!name || !assetClass || !assetClassID) {
            return res.status(400).json({
                error: 'Name, asset class, and asset class ID are required',
            })
        }
        const newRoute = new Route({ name, assetClass, assetClassID })
        await newRoute.save()
        res.status(201).json(newRoute)
    } catch (error) {
        console.error('Error adding route:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function updateRoute(req, res) {
    try {
        const { id } = req.params
        if (!id) {
            return res.status(400).json({ error: 'Route ID is required' })
        }
        const { name, assetClassID, assetClass } = req.body
        if (!name || !assetClassID || !assetClass) {
            return res.status(400).json({
                error: 'Name, asset class ID, and asset class are required',
            })
        }
        const updatedRoute = await Route.findByIdAndUpdate(
            id,
            { name, assetClass, assetClassID },
            { new: true }
        )
        if (!updatedRoute) {
            return res.status(404).json({ error: 'Route not found' })
        }
        res.json(updatedRoute)
    } catch (error) {
        console.error('Error updating route:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function deleteRoute(req, res) {
    try {
        const { id } = req.params
        if (!id) {
            return res.status(400).json({ error: 'Route ID is required' })
        }
        const deletedRoute = await Route.findByIdAndDelete(id)
        if (!deletedRoute) {
            return res.status(404).json({ error: 'Route not found' })
        }
        res.json({ message: 'Route deleted successfully' })
    } catch (error) {
        console.error('Error deleting route:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

export {
    addRoute,
    fetchRoutesById,
    fetchRoutesByAssetClassId,
    listRoutes,
    updateRoute,
    deleteRoute,
}
