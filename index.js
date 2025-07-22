import express from 'express'
import dotenv from 'dotenv'
import cron from 'node-cron'
dotenv.config()

import connectDB from './config/db.js'
import mfRoute from './routes/mf.route.js'
import categoryRoute from './routes/category.route.js'
import insertFundsToDB from './util/insertFundsToDB.js'
import insertAmfiCategories from './util/insertCategoryToDB.js'
import fetchMFData from './util/fetchMFData.js'
import populateCategories from './helper/categoryInDB.helper.js'

const app = express()
app.use(express.json())
app.use('/api/mutualfund', mfRoute)
app.use('/api/category', categoryRoute)

// Global error tracking
let consecutiveErrors = 0
const MAX_CONSECUTIVE_ERRORS = 5
let cronJob = null

async function initializeDatabase() {
    try {
        await connectDB()
        console.log('Database connected successfully')
        return true
    } catch (error) {
        console.error('Failed to connect to database:', error)
        return false
    }
}

async function insertFundsAtInterval() {
    // Validate environment variables
    const schedule = process.env.SCHEDULE || '0 9 * * *' // Default: 9 AM daily

    if (!cron.validate(schedule)) {
        console.error(`Invalid cron schedule: ${schedule}`)
        console.error('Using default schedule: 0 9 * * * (9 AM daily)')
        schedule = '0 9 * * *'
    }

    console.log(`Scheduling mutual funds data fetch with cron: ${schedule}`)

    cronJob = cron.schedule(
        schedule,
        async () => {
            try {
                console.log('Starting scheduled mutual funds data fetch...')

                const mutualFundsData = await fetchMFData()

                // Validate fetched data
                if (!mutualFundsData) {
                    throw new Error('fetchMFData returned null or undefined')
                }

                if (!Array.isArray(mutualFundsData)) {
                    throw new Error('fetchMFData did not return an array')
                }

                if (mutualFundsData.length === 0) {
                    console.warn(
                        'fetchMFData returned empty array - no funds to insert'
                    )
                    return
                }

                console.log(`Fetched ${mutualFundsData.length} mutual funds`)

                const result = await insertFundsToDB(mutualFundsData)

                // Reset error counter on success
                consecutiveErrors = 0

                console.log(
                    'Successfully completed scheduled mutual funds data update'
                )

                return result
            } catch (error) {
                consecutiveErrors++
                console.error(
                    `Error in scheduled funds insertion (attempt ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
                    error
                )

                // Stop cron job if too many consecutive errors
                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    console.error(
                        `Too many consecutive errors (${MAX_CONSECUTIVE_ERRORS}). Stopping scheduled updates.`
                    )
                    console.error(
                        'Manual intervention required. Restart the server to resume scheduled updates.'
                    )

                    if (cronJob) {
                        cronJob.stop()
                    }
                }

                throw error
            }
        },
        {
            scheduled: true,
            timezone: process.env.TIMEZONE || 'Asia/Kolkata',
        }
    )

    return cronJob
}

// Initial data load function
async function performInitialDataLoad() {
    try {
        console.log('Performing initial data load...')

        const { parsedFunds: mutualFundsData, amfiCategories } =
            await fetchMFData()

        if (
            mutualFundsData &&
            Array.isArray(mutualFundsData) &&
            mutualFundsData.length > 0
        ) {
            Promise.all([
                populateCategories(),
                insertAmfiCategories(amfiCategories),
                insertFundsToDB(mutualFundsData),
            ])
            console.log(
                `Initial data load completed: ${mutualFundsData.length} funds loaded and categories populated`
            )
        } else {
            console.warn('Initial data load failed - no valid data received')
        }
    } catch (error) {
        console.error('Initial data load failed:', error)
    }
}

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...')
    if (cronJob) {
        cronJob.stop()
        console.log('Cron job stopped')
    }
    process.exit(0)
})

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...')
    if (cronJob) {
        cronJob.stop()
        console.log('Cron job stopped')
    }
    process.exit(0)
})

// Add health check endpoint
app.get('/api/mutualfund/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        cronJobActive: cronJob ? cronJob.getStatus() : 'not initialized',
        consecutiveErrors,
        environment: {
            schedule: process.env.SCHEDULE || '0 9 * * *',
            timezone: process.env.TIMEZONE || 'Asia/Kolkata',
        },
    })
})

// Start server with proper initialization
async function startServer() {
    const port = process.env.PORT || 5000

    try {
        const dbConnected = await initializeDatabase()

        if (!dbConnected) {
            console.error('Cannot start server without database connection')
            process.exit(1)
        }

        // Start the server
        app.listen(port, async () => {
            console.log(`Server is running on port ${port}`)
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)

            // Perform initial data load
            await performInitialDataLoad()

            // Start scheduled updates
            await insertFundsAtInterval()

            console.log('Server initialization completed')
        })
    } catch (error) {
        console.error('Failed to start server:', error)
        process.exit(1)
    }
}

// Start the application
startServer().catch((error) => {
    console.error('Unhandled error during server startup:', error)
    process.exit(1)
})

export { insertFundsAtInterval, performInitialDataLoad }
export default app
