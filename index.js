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
        },
        nav: parseFloat(nav),
        navDate: new Date(date)
      });
    }
  
    console.log(`Total Parsed Mutual Funds: ${parsedFunds.length}`);
    console.dir(parsedFunds, { depth: null, maxArrayLength: 10 });
  }
  fetchAndPrintNAVs().catch(console.error);
app.listen(5000, () => {
    console.log(`Server is running on port 5000`);
});

export default app;