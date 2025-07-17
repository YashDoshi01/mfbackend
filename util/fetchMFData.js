import axios from 'axios'
import buildISINMap from './buildISINMap.js'

async function fetchMFData() {
    try {
        const isinMap = buildISINMap()

        // Check if ISIN map is empty
        if (Object.keys(isinMap).length === 0) {
            console.warn('ISIN map is empty - no instruments to match against')
            return []
        }

        const response = await axios.get(
            'https://www.amfiindia.com/spages/NAVAll.txt',
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    Accept: 'text/plain',
                },
                timeout: 30000, // Add timeout
            }
        )

        const lines = response.data.split('\n').filter((line) => {
            return (
                line.trim() !== '' &&
                !line.startsWith('Scheme Code') &&
                !line.startsWith('--')
            )
        })

        const parsedFunds = []
        let processedCount = 0
        let skippedCount = 0

        for (const line of lines) {
            const parts = line.split(';')
            if (parts.length < 6) {
                skippedCount++
                continue
            }

            const [
                schemeCode,
                isinDivPayout,
                isinDivReinvestment,
                schemeName,
                nav,
                date,
            ] = parts

            // Skip if both ISINs are missing
            if (isinDivPayout === '-' && isinDivReinvestment === '-') {
                skippedCount++
                continue
            }

            // Find the best ISIN to use (prefer one that exists in our map)
            let selectedISIN = null
            let selectedInfo = null

            // Check reinvestment ISIN first (usually more common)
            if (
                isinDivReinvestment &&
                isinDivReinvestment !== '-' &&
                isinDivReinvestment.trim() !== ''
            ) {
                const reinvestISIN = isinDivReinvestment.trim()
                const info = isinMap[reinvestISIN]
                if (info) {
                    selectedISIN = reinvestISIN
                    selectedInfo = info
                }
            }

            // If reinvestment ISIN not found in map, try payout ISIN
            if (
                !selectedISIN &&
                isinDivPayout &&
                isinDivPayout !== '-' &&
                isinDivPayout.trim() !== ''
            ) {
                const payoutISIN = isinDivPayout.trim()
                const info = isinMap[payoutISIN]
                if (info) {
                    selectedISIN = payoutISIN
                    selectedInfo = info
                }
            }

            // If neither ISIN found in map, use any available ISIN
            if (!selectedISIN) {
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
            }

            // Skip if no valid ISIN or other required fields are missing
            if (
                !selectedISIN ||
                !nav?.trim() ||
                nav.trim() === 'N.A.' ||
                isNaN(parseFloat(nav)) ||
                !date?.trim() ||
                !schemeName?.trim()
            ) {
                skippedCount++
                continue
            }

            // Create fund entry with selected ISIN
            const fundEntry = {
                isin: selectedISIN,
                name: schemeName.trim(),
                nav: parseFloat(nav),
                navDate: new Date(date),
            }

            // Add category info if available
            if (selectedInfo) {
                fundEntry.category = {
                    assetClass: selectedInfo.assetClass,
                    fundType: selectedInfo.fundType,
                    subCategory: selectedInfo.subCategory,
                }
                processedCount++
            } else {
                fundEntry.category = null
                skippedCount++
            }

            parsedFunds.push(fundEntry)
        }

        console.log(`fetchMFData completed:`)
        console.log(`  - Total lines processed: ${lines.length}`)
        console.log(`  - Funds matched: ${processedCount}`)
        console.log(`  - Lines skipped: ${skippedCount}`)
        console.log(`  - ISINs in map: ${Object.keys(isinMap).length}`)
        console.log(`  - Total funds parsed: ${parsedFunds.length}`)

        return parsedFunds
    } catch (error) {
        console.error('Error fetching MF data:', error)

        // Return empty array but log the specific error
        if (error.code === 'ETIMEDOUT') {
            console.error('Network timeout - check internet connection')
        } else if (error.response) {
            console.error(`HTTP Error: ${error.response.status}`)
        }

        return []
    }
}

export default fetchMFData
