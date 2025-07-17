import xlsx from 'xlsx'

function buildISINMap() {
    const workbook = xlsx.readFile('./Model Portfolios_sample.xlsx')
    const sheet = workbook.Sheets['Instruments & Categorise']
    const rows = xlsx.utils.sheet_to_json(sheet)

    const isinMap = {}

    rows.forEach((row, index) => {
        const isin = row['ISIN Code']?.toString().trim()
        const name = row['Instrument Name']?.toString().trim()
        const aaKey = row['AA Key']?.toString().trim()

        if (isin && isin.startsWith('INF') && name && aaKey) {
            const parts = aaKey.split('-').map((s) => s.trim())
            if (parts.length >= 3) {
                const [assetClass, fundType, subCategory] = parts
                isinMap[isin] = {
                    name,
                    assetClass,
                    fundType,
                    subCategory,
                }
            }
        }
    })

    return isinMap
}

export default buildISINMap
