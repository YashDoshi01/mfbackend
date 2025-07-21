import { AssetClass } from '../../models/category.model.js'

async function listAssetClasses(req, res) {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const skip = (page - 1) * limit

        const total = await AssetClass.countDocuments()
        const assetClasses = await AssetClass.find()
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)

        const totalPages = Math.ceil(total / limit)

        res.json({
            assetClasses,
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
        console.error('Error fetching asset classes:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function fetchAssetClassById(req, res) {
    try {
        const { id } = req.params
        if (!id) {
            return res.status(400).json({ error: 'Asset class ID is required' })
        }
        const assetClass = await AssetClass.findById(id)
        if (!assetClass) {
            return res.status(404).json({ error: 'Asset class not found' })
        }
        res.json(assetClass)
    } catch (error) {
        console.error('Error fetching asset class:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function addAssetClass(req, res) {
    try {
        const { name } = req.body
        if (!name) {
            return res
                .status(400)
                .json({ error: 'Asset class name is required' })
        }
        const newAssetClass = new AssetClass({ name })
        await newAssetClass.save()
        res.status(201).json(newAssetClass)
    } catch (error) {
        console.error('Error adding asset class:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function updateAssetClass(req, res) {
    try {
        const { id } = req.params
        const { name } = req.body
        if (!id) {
            return res.status(400).json({ error: 'Asset class ID is required' })
        }
        if (!name) {
            return res
                .status(400)
                .json({ error: 'Asset class name is required' })
        }
        const updatedAssetClass = await AssetClass.findByIdAndUpdate(
            id,
            { name },
            { new: true }
        )
        if (!updatedAssetClass) {
            return res.status(404).json({ error: 'Asset class not found' })
        }
        res.json(updatedAssetClass)
    } catch (error) {
        console.error('Error updating asset class:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function deleteAssetClass(req, res) {
    try {
        const { id } = req.params
        if (!id) {
            return res.status(400).json({ error: 'Asset class ID is required' })
        }
        const deletedAssetClass = await AssetClass.findByIdAndDelete(id)
        if (!deletedAssetClass) {
            return res.status(404).json({ error: 'Asset class not found' })
        }
        res.json({ message: 'Asset class deleted successfully' })
    } catch (error) {
        console.error('Error deleting asset class:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

export {
    addAssetClass,
    listAssetClasses,
    fetchAssetClassById,
    updateAssetClass,
    deleteAssetClass,
}
