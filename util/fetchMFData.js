import axios from 'axios'
import { AmfiCategory } from '../models/category.model.js'

async function fetchMFData() {
    try {
        const response = await axios.get(
            'https://www.amfiindia.com/spages/NAVAll.txt',
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    Accept: 'text/plain',
                },
                timeout: 3000,
            }
        )

        const lines = response.data.split('\n').filter((line) => {
            return (
                line.trim() !== '' &&
                !line.startsWith('Scheme Code') &&
                !line.startsWith('--')
            )
        })

        const amfiCategories = []
        const amfiCategoryRegex = /\S.*?Schemes\([^)]*\)/
        const parsedFunds = []

        // Track current category
        let currentAmfiCategory = null
        let currentAmfiCategoryId = null

        // Create a map to store category name to ID mapping
        const categoryMap = new Map()

        for (const line of lines) {
            // Check if this line is a category header
            if (amfiCategoryRegex.test(line)) {
                const categoryMatch = line.match(amfiCategoryRegex)
                if (categoryMatch) {
                    currentAmfiCategory = categoryMatch[0].trim()
                    amfiCategories.push(currentAmfiCategory)

                    // Find or create the category in database to get its ID
                    try {
                        let category = await AmfiCategory.findOne({
                            name: currentAmfiCategory,
                        })
                        if (!category) {
                            category = new AmfiCategory({
                                name: currentAmfiCategory,
                                status: 'unset',
                            })
                            await category.save()
                        }
                        currentAmfiCategoryId = category._id
                        categoryMap.set(
                            currentAmfiCategory,
                            currentAmfiCategoryId
                        )
                    } catch (error) {
                        console.error(
                            `Error handling category ${currentAmfiCategory}:`,
                            error
                        )
                        currentAmfiCategoryId = null
                    }
                }
                continue
            }

            // Process fund data
            const parts = line.split(';')
            if (parts.length < 6) continue

            const [
                _schemeCode,
                isinDivPayout,
                isinDivReinvestment,
                schemeName,
                nav,
                date,
            ] = parts

            if (isinDivPayout === '-' && isinDivReinvestment === '-') {
                continue
            }

            let selectedISIN = null

            if (
                isinDivReinvestment &&
                isinDivReinvestment !== '-' &&
                isinDivReinvestment.trim() !== ''
            ) {
                selectedISIN = isinDivReinvestment.trim()
            } else if (
                isinDivPayout &&
                isinDivPayout !== '-' &&
                isinDivPayout.trim() !== ''
            ) {
                selectedISIN = isinDivPayout.trim()
            }

            if (
                !selectedISIN ||
                !nav?.trim() ||
                nav.trim() === 'N.A.' ||
                isNaN(parseFloat(nav)) ||
                !date?.trim() ||
                !schemeName?.trim()
            ) {
                continue
            }

            const fundEntry = {
                isin: selectedISIN,
                name: schemeName.trim(),
                nav: parseFloat(nav),
                navDate: new Date(date),
                amfiCategory: currentAmfiCategoryId,
                amfiCategoryName: currentAmfiCategory,
            }

            parsedFunds.push(fundEntry)
        }

        console.log(`  - Total funds parsed: ${parsedFunds.length}`)
        console.log(`  - Total categories found: ${amfiCategories.length}`)

        return { parsedFunds, amfiCategories, categoryMap }
    } catch (error) {
        console.error('Error fetching MF data:', error)

        if (error.code === 'ETIMEDOUT') {
            console.error('Network timeout - check internet connection')
        } else if (error.response) {
            console.error(`HTTP Error: ${error.response.status}`)
        }

        return { parsedFunds: [], amfiCategories: [], categoryMap: new Map() }
    }
}

export default fetchMFData
