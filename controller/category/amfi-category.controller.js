import { AmfiCategory } from '../../models/category.model.js'

async function listAmfiCategories() {
    try {
        const categories = await AmfiCategory.find().sort({ name: 1 })
        return categories
    } catch (error) {
        console.error('Error fetching AMFI categories:', error)
        throw error
    }
}

async function getAmfiCategoryById(id) {
    try {
        const category = await AmfiCategory.findById(id)
        if (!category) {
            throw new Error('AMFI Category not found')
        }
        return category
    } catch (error) {
        console.error('Error fetching AMFI category by ID:', error)
        throw error
    }
}

async function addAmfiCategory(name) {
    try {
        const existingCategory = await AmfiCategory.findOne({ name })
        if (existingCategory) {
            throw new Error('AMFI Category already exists')
        }

        const newCategory = new AmfiCategory({ name })
        await newCategory.save()
        console.log(`✅ Created AMFI Category: ${name}`)
        return newCategory
    } catch (error) {
        console.error('Error adding AMFI category:', error)
        throw error
    }
}

async function updateAmfiCategoryStatus(categoryId, status) {
    try {
        if (!['set', 'unset'].includes(status)) {
            throw new Error('Status must be either "set" or "unset"')
        }

        const updatedCategory = await AmfiCategory.findByIdAndUpdate(
            categoryId,
            { status },
            { new: true, runValidators: true }
        )

        if (!updatedCategory) {
            throw new Error('AMFI Category not found')
        }

        console.log(
            `✅ Updated AMFI Category status: ${updatedCategory.name} -> ${status}`
        )
        return updatedCategory
    } catch (error) {
        console.error('Error updating AMFI category status:', error)
        throw error
    }
}

async function updateAmfiCategory(id, name) {
    try {
        const updatedCategory = await AmfiCategory.findByIdAndUpdate(
            id,
            { name , status: 'unset' }, 
            { new: true, runValidators: true }
        )
        if (!updatedCategory) {
            throw new Error('AMFI Category not found')
        }
        console.log(`✅ Updated AMFI Category: ${updatedCategory.name}`)
        return updatedCategory
    } catch (error) {
        console.error('Error updating AMFI category:', error)
        throw error
    }
}

async function deleteAmfiCategory(id) {
    try {
        const deletedCategory = await AmfiCategory.findByIdAndDelete(id)
        if (!deletedCategory) {
            throw new Error('AMFI Category not found')
        }
        console.log(`✅ Deleted AMFI Category: ${deletedCategory.name}`)
        return deletedCategory
    } catch (error) {
        console.error('Error deleting AMFI category:', error)
        throw error
    }
}