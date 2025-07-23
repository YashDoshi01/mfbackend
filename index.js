import express from 'express'
import dotenv from 'dotenv'
import cron from 'node-cron'
import mongoose from 'mongoose'
import cors from 'cors'
dotenv.config()

import connectDB from './config/db.js'
import mfRoute from './routes/v1/mutualFundRoute.js'
import categoryRoute from './routes/v1/categoryRoute.js'
import insertFundsToDB from './util/insertFundsToDB.js'
import insertAmfiCategories from './util/insertCategoryToDB.js'
import fetchMFData from './util/fetchMFData.js'
import populateCategories from './helper/categoryInDBHelper.js'

const app = express()

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}

app.use(cors(corsOptions))
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

async function closeAllConnections() {
    try {
        // Close all mongoose connections
        await mongoose.connection.close()
        console.log('All database connections closed')
    } catch (error) {
        console.error('Error closing database connections:', error)
    }
}

async function establishFinalConnection() {
    try {
        // Establish the final optimized connection
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Final optimized database connection established')
        return true
    } catch (error) {
        console.error('Failed to establish final connection:', error)
        return false
    }
}

async function insertFundsAtInterval() {
    // Validate environment variables
    let schedule = process.env.SCHEDULE || '0 9 * * *' // Default: 9 AM daily

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

                const { parsedFunds: mutualFundsData, amfiCategories } =
                    await fetchMFData()

                // Validate fetched data
                if (!mutualFundsData || !Array.isArray(mutualFundsData)) {
                    throw new Error('fetchMFData did not return valid data')
                }

                if (mutualFundsData.length === 0) {
                    console.warn(
                        'fetchMFData returned empty array - no funds to insert'
                    )
                    return
                }

                console.log(`Fetched ${mutualFundsData.length} mutual funds`)

                // Process both funds and categories
                await Promise.all([
                    insertFundsToDB(mutualFundsData),
                    insertAmfiCategories(amfiCategories),
                ])

                // Reset error counter on success
                consecutiveErrors = 0

                console.log(
                    'Successfully completed scheduled mutual funds data update'
                )
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

// Initial data load function with connection management
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
            // Process all data in parallel during startup
            await Promise.all([
                populateCategories(),
                insertAmfiCategories(amfiCategories),
                insertFundsToDB(mutualFundsData),
            ])

            console.log(
                `Initial data load completed: ${mutualFundsData.length} funds loaded with category assignments`
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
    mongoose.connection.close()
    process.exit(0)
})

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...')
    if (cronJob) {
        cronJob.stop()
        console.log('Cron job stopped')
    }
    mongoose.connection.close()
    process.exit(0)
})

// Add health check endpoint
app.get('/api/mutualfund/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        cronJobActive: cronJob ? cronJob.getStatus() : 'not initialized',
        consecutiveErrors,
        dbConnection:
            mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: {
            schedule: process.env.SCHEDULE || '0 9 * * *',
            timezone: process.env.TIMEZONE || 'Asia/Kolkata',
        },
    })
})

// Start server with proper initialization and connection management
async function startServer() {
    const port = process.env.PORT || 5000

    try {
        // Initial database connection for setup
        const dbConnected = await initializeDatabase()

        if (!dbConnected) {
            console.error('Cannot start server without database connection')
            process.exit(1)
        }

        // Perform initial data load with existing connection
        await performInitialDataLoad()

        // Close all connections after startup
        console.log('Closing startup connections...')
        await closeAllConnections()

        // Wait a moment for connections to fully close
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Establish final optimized connection
        const finalConnected = await establishFinalConnection()

        if (!finalConnected) {
            console.error('Cannot establish final database connection')
            process.exit(1)
        }

        // Force garbage collection if available
        if (global.gc) {
            global.gc()
            console.log('Garbage collection triggered after startup')
        }

        // Start the server
        app.listen(port, async () => {
            console.log(`Server is running on port ${port}`)
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)

            // Start scheduled updates
            await insertFundsAtInterval()

            console.log(
                'Server initialization completed with optimized connection'
            )
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
