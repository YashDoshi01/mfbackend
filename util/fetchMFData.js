import axios from 'axios'

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

        const parsedFunds = []

        for (const line of lines) {
            const parts = line.split(';')
            if (parts.length < 6) {
                continue
            }

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
            }

            fundEntry.category = null

            parsedFunds.push(fundEntry)
        }
        console.log(`  - Total funds parsed: ${parsedFunds.length}`)

        return parsedFunds
    } catch (error) {
        console.error('Error fetching MF data:', error)

        if (error.code === 'ETIMEDOUT') {
            console.error('Network timeout - check internet connection')
        } else if (error.response) {
            console.error(`HTTP Error: ${error.response.status}`)
        }

        return []
    }
}

export default fetchMFData
