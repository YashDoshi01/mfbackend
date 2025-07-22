import { AmfiCategory } from '../models/category.model.js'

async function insertAmfiCategories(amfiCategories) {
    try {
        console.log(`Processing ${amfiCategories.length} AMFI categories...`)

        if (!Array.isArray(amfiCategories) || amfiCategories.length === 0) {
            console.warn('No AMFI categories provided or invalid input')
            return { inserted: 0, existing: 0, total: 0 }
        }

        let insertedCount = 0
        let existingCount = 0
        const errors = []

        // Process categories one by one to handle duplicates properly
        for (const categoryName of amfiCategories) {
            try {
                if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
                    console.warn('Skipping invalid category name:', categoryName)
                    continue
                }

                const trimmedName = categoryName.trim()

                // Check if category already exists
                const existingCategory = await AmfiCategory.findOne({ name: trimmedName })

                if (!existingCategory) {
                    // Create new category
                    const newCategory = new AmfiCategory({
                        name: trimmedName,
                        status: 'unset' // Default status as per schema
                    })

                    await newCategory.save()
                    insertedCount++
                    console.log(`✅ Created AMFI Category: ${trimmedName}`)
                } else {
                    existingCount++
                    console.log(`⏭️ AMFI Category already exists: ${trimmedName}`)
                }
            } catch (error) {
                console.error(`❌ Error processing category "${categoryName}":`, error.message)
                errors.push({ category: categoryName, error: error.message })
            }
        }

        const result = {
            inserted: insertedCount,
            existing: existingCount,
            total: insertedCount + existingCount,
            errors: errors.length > 0 ? errors : undefined
        }

        console.log(`🎉 AMFI Categories processing completed:`)
        
        if (errors.length > 0) {
            console.log(`  - Errors: ${errors.length}`)
        }

        return result

    } catch (error) {
        console.error('❌ Error inserting AMFI categories:', error)
        throw error
    }
}

export default insertAmfiCategories