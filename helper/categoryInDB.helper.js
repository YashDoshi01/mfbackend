import {
    AssetClass,
    Route,
    InstrumentCategory,
} from '../models/category.model.js'
// Define your data objects here
const ASSET_CLASSES = [
    { name: 'Equity' },
    { name: 'Debt' },
    { name: 'Commodity' },
]

const ROUTES = [
    { name: 'Mutual Funds', assetClassName: 'Equity' },
    { name: 'Core Direct', assetClassName: 'Equity' },
    { name: 'Tactical', assetClassName: 'Equity' },
    { name: 'Mutual Funds', assetClassName: 'Debt' },
    { name: 'Direct Debt', assetClassName: 'Debt' },
    { name: 'Venture Debt', assetClassName: 'Debt' },
    { name: 'Mutual Funds', assetClassName: 'Commodity' },
]

const INSTRUMENT_CATEGORIES = [
    {
        name: 'MF International',
        routeName: 'Mutual Funds',
        assetClassName: 'Equity',
    },
    {
        name: 'ETF Large Cap',
        routeName: 'Mutual Funds',
        assetClassName: 'Equity',
    },
    {
        name: 'MF Blue Chip',
        routeName: 'Mutual Funds',
        assetClassName: 'Equity',
    },
    {
        name: 'MF Mid Cap',
        routeName: 'Mutual Funds',
        assetClassName: 'Equity',
    },
    {
        name: 'MF Small Cap',
        routeName: 'Mutual Funds',
        assetClassName: 'Equity',
    },
    {
        name: 'MF Sectoral',
        routeName: 'Mutual Funds',
        assetClassName: 'Equity',
    },
    {
        name: 'MF Thematic',
        routeName: 'Mutual Funds',
        assetClassName: 'Equity',
    },
    {
        name: 'MF Flexicap',
        routeName: 'Mutual Funds',
        assetClassName: 'Equity',
    },
    {
        name: 'Large Cap',
        routeName: 'Core Direct',
        assetClassName: 'Equity',
        range: { min: 300, max: 1000 },
    },
    {
        name: 'Mid Cap',
        routeName: 'Core Direct',
        assetClassName: 'Equity',
        range: { min: 200, max: 300 },
    },
    {
        name: 'Small Cap',
        routeName: 'Core Direct',
        assetClassName: 'Equity',
        range: { min: 100, max: 200 },
    },
    {
        name: 'Micro Cap',
        routeName: 'Core Direct',
        assetClassName: 'Equity',
        range: { min: 0, max: 100 },
    },
    {
        name: 'Tactical Direct',
        routeName: 'Tactical',
        assetClassName: 'Equity',
    },
    {
        name: 'Tactical F&O',
        routeName: 'Tactical',
        assetClassName: 'Equity',
    },
    {
        name: 'MF Short Term',
        routeName: 'Mutual Funds',
        assetClassName: 'Debt',
    },
    {
        name: 'MF Mid Term',
        routeName: 'Mutual Funds',
        assetClassName: 'Debt',
    },
    {
        name: 'MF Long Term',
        routeName: 'Mutual Funds',
        assetClassName: 'Debt',
    },
    {
        name: 'MF Dynamic',
        routeName: 'Mutual Funds',
        assetClassName: 'Debt',
    },
    {
        name: 'MF Credit Risk',
        routeName: 'Mutual Funds',
        assetClassName: 'Debt',
    },
    {
        name: 'Direct Short Term',
        routeName: 'Direct Debt',
        assetClassName: 'Debt',
    },
    {
        name: 'Direct Mid Term',
        routeName: 'Direct Debt',
        assetClassName: 'Debt',
    },
    {
        name: 'Venture Debt',
        routeName: 'Venture Debt',
        assetClassName: 'Debt',
    },
    {
        name: 'Gold',
        routeName: 'Mutual Funds',
        assetClassName: 'Commodity',
    },
]

async function populateCategories() {
    try {
        console.log('Starting category population...')

        // 1. Populate Asset Classes
        console.log('Populating Asset Classes...')
        const assetClassPromises = ASSET_CLASSES.map(async (assetClass) => {
            try {
                const existingAssetClass = await AssetClass.findOne({
                    name: assetClass.name,
                })
                if (!existingAssetClass) {
                    const newAssetClass = new AssetClass(assetClass)
                    await newAssetClass.save()
                    console.log(`✅ Created Asset Class: ${assetClass.name}`)
                    return newAssetClass
                } else {
                    console.log(
                        `⏭️ Asset Class already exists: ${assetClass.name}`
                    )
                    return existingAssetClass
                }
            } catch (error) {
                console.error(
                    `❌ Error creating Asset Class ${assetClass.name}:`,
                    error
                )
                throw error
            }
        })

        const createdAssetClasses = await Promise.all(assetClassPromises)
        const assetClassMap = new Map(
            createdAssetClasses.map((ac) => [ac.name, ac._id])
        )

        // 2. Populate Routes - Check for both name AND assetClassID to avoid conflicts
        console.log('Populating Routes...')
        const routePromises = ROUTES.map(async (route) => {
            try {
                const assetClassID = assetClassMap.get(route.assetClassName)
                if (!assetClassID) {
                    throw new Error(
                        `Asset Class not found: ${route.assetClassName}`
                    )
                }

                // Check for existing route with same name AND same assetClassID
                const existingRoute = await Route.findOne({
                    name: route.name,
                    assetClassID: assetClassID,
                })

                if (!existingRoute) {
                    const newRoute = new Route({
                        name: route.name,
                        assetClassID: assetClassID,
                    })
                    await newRoute.save()
                    console.log(
                        `✅ Created Route: ${route.name} (${route.assetClassName})`
                    )
                    return newRoute
                } else {
                    console.log(
                        `⏭️ Route already exists: ${route.name} (${route.assetClassName})`
                    )
                    return existingRoute
                }
            } catch (error) {
                console.error(`❌ Error creating Route ${route.name}:`, error)
                throw error
            }
        })

        const createdRoutes = await Promise.all(routePromises)

        // Create a composite key map for routes using both name and assetClassName
        const routeMap = new Map()
        createdRoutes.forEach((route) => {
            const assetClass = createdAssetClasses.find((ac) =>
                ac._id.equals(route.assetClassID)
            )
            const compositeKey = `${route.name}|${assetClass.name}`
            routeMap.set(compositeKey, route._id)
        })

        // 3. Populate Instrument Categories - Use composite key to find correct route
        console.log('Populating Instrument Categories...')
        const instrumentCategoryPromises = INSTRUMENT_CATEGORIES.map(
            async (category) => {
                try {
                    // Create composite key to find the correct route
                    const routeCompositeKey = `${category.routeName}|${category.assetClassName}`
                    const routeID = routeMap.get(routeCompositeKey)

                    if (!routeID) {
                        throw new Error(
                            `Route not found: ${category.routeName} for asset class ${category.assetClassName}`
                        )
                    }

                    // Check for existing category with same name AND same routeID
                    const existingCategory = await InstrumentCategory.findOne({
                        name: category.name,
                        routeID: routeID,
                    })

                    if (!existingCategory) {
                        const newCategory = new InstrumentCategory({
                            name: category.name,
                            amfiCategory: category.amfiCategory,
                            assetClass: category.assetClassName,
                            route: category.routeName,
                            routeID: routeID,
                            range: category.range,
                        })
                        await newCategory.save()
                        console.log(
                            `✅ Created Instrument Category: ${category.name} (${category.routeName} - ${category.assetClassName})`
                        )
                        return newCategory
                    } else {
                        console.log(
                            `⏭️ Instrument Category already exists: ${category.name} (${category.routeName} - ${category.assetClassName})`
                        )
                        return existingCategory
                    }
                } catch (error) {
                    console.error(
                        `❌ Error creating Instrument Category ${category.name}:`,
                        error
                    )
                    throw error
                }
            }
        )

        await Promise.all(instrumentCategoryPromises)

        console.log('🎉 Category population completed successfully!')

        // Return summary
        return {
            assetClasses: createdAssetClasses.length,
            routes: createdRoutes.length,
            instrumentCategories: INSTRUMENT_CATEGORIES.length,
        }
    } catch (error) {
        console.error('❌ Error during category population:', error)
        throw error
    }
}

export { populateCategories }
export default populateCategories
