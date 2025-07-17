<<<<<<< Updated upstream
import express from 'express';
import mongoose from 'mongoose';
// import mfRoute from './routes/mf.route.js';
// import dotenv from 'dotenv';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import xlsx from 'xlsx';
const app = express();
// dotenv.config();

app.use(express.json());
// app.use('/api/mutualfund', mfRoute);

function buildISINMap() {
  const workbook = xlsx.readFile('./Model Portfolios_sample.xlsx');
  const sheet = workbook.Sheets['Instruments & Categorise'];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const isinMap = {};

  rows.forEach(row => {
    const isin = row['ISIN Code']?.toString().trim();
    const name = row['Instrument Name']?.toString().trim();
    const aaKey = row['AA Key']?.toString().trim();

    if (isin && name && aaKey) {
      const [assetClass, fundType, subCategory] = aaKey.split('-').map(s => s.trim());
      isinMap[isin] = {
        name,
        assetClass,
        fundType,
        subCategory
      };
    }
  });

  return isinMap;
}


  async function fetchAndPrintNAVs() {
    const isinMap = buildISINMap();
  
    const response = await axios.get('https://www.amfiindia.com/spages/NAVAll.txt', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/plain'
      }
    });
  
    const lines = response.data
      .split('\n')
      .filter(line =>
        line.trim() !== '' &&
        !line.startsWith('Scheme Code') &&
        !line.startsWith('--')
      )
      .join('\n');
  
    const records = parse(lines, {
      delimiter: ';',
      columns: ['schemeCode', 'isin', 'placeholder', 'schemeName', 'nav', 'date'],
      skip_empty_lines: true,
      relax_column_count: true
    });
  
    const parsedFunds = [];
  
    for (const row of records) {
      const { isin, schemeName, nav, date } = row;
      if (!isin || !isinMap[isin] || !nav || !date) continue;
  
      const info = isinMap[isin];
  
      parsedFunds.push({
        isin,
        name: schemeName.trim(),
        category: {
          assetClass: info.assetClass,
          fundType: info.fundType,
          subCategory: info.subCategory
=======
import express from 'express'
import mfRoute from './routes/mf.route.js'
// import dotenv from 'dotenv';
import axios from 'axios'
import  insertFundsToMongo  from './util/fundsintomongo.js';
import connectDB from './db.js';
import cors from "cors"
const app = express()
// dotenv.config();
app.use(express.json())
app.use(cors())
app.use('/api/mutualfund', mfRoute)
connectDB();
let cachedFunds = null
let cacheTimestamp = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
async function fetchAndPrintNAVs(page = 1, limit = 100, search = '') {

    const now = Date.now()
    if (
        !cachedFunds ||
        !cacheTimestamp ||
        now - cacheTimestamp > CACHE_DURATION
    ) {
        const response = await axios.get(
            'https://www.amfiindia.com/spages/NAVAll.txt',
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    Accept: 'text/plain',
                },
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
            if (parts.length < 6) continue

            const [
                schemeCode,
                isinDivPayout,
                isinDivReinvestment,
                schemeName,
                nav,
                date,
            ] = parts

            let isin = null
            if (isinDivPayout?.trim() && isinDivPayout !== '-') {
                isin = isinDivPayout.trim()
            } else if (isinDivReinvestment?.trim() && isinDivReinvestment !== '-') {
                isin = isinDivReinvestment.trim()
            }

            if (
                !isin ||
                !nav?.trim() ||
                nav.trim() === 'N.A.' ||
                isNaN(parseFloat(nav)) ||
                !date?.trim() ||
                !schemeName?.trim()
            ) {
                continue
            }

            // Default category to empty array
            parsedFunds.push({
                isin,
                name: schemeName.trim(),
                category: [], // ← empty array
                nav: nav,
                navDate: new Date(date),
            })
        }

        // Update cache
        cachedFunds = parsedFunds
        cacheTimestamp = now
        await insertFundsToMongo(parsedFunds)
    }

    // Apply search
    let filteredFunds = cachedFunds
    if (search) {
        const searchLower = search.toLowerCase()
        filteredFunds = cachedFunds.filter(
            (fund) =>
                fund.name.toLowerCase().includes(searchLower) ||
                fund.isin.toLowerCase().includes(searchLower) ||
                (fund.category &&
                    fund.category.some((cat) => cat.toLowerCase().includes(searchLower)))
        )
    }

    const total = filteredFunds.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedFunds = filteredFunds.slice(startIndex, endIndex)

    return {
        data: paginatedFunds,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: endIndex < total,
            hasPrev: startIndex > 0,
>>>>>>> Stashed changes
        },
        nav: parseFloat(nav),
        navDate: new Date(date)
      });
    }
<<<<<<< Updated upstream
  
    console.log(`Total Parsed Mutual Funds: ${parsedFunds.length}`);
    console.dir(parsedFunds, { depth: null, maxArrayLength: 10 });
  }
  fetchAndPrintNAVs().catch(console.error);
=======
}

>>>>>>> Stashed changes
app.listen(5000, () => {
    console.log(`Server is running on port 5000`);
});

export default app;