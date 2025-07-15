import express from 'express';
import mongoose from 'mongoose';
// import mfRoute from './routes/mf.route.js';
// import dotenv from 'dotenv';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
const app = express();
// dotenv.config();

app.use(express.json());
// app.use('/api/mutualfund', mfRoute);

async function fetchMFData() {
    const res = await axios.get('https://www.amfiindia.com/spages/NAVAll.txt');
    const cleanedText = res.data
      .split('\n')
      .filter(line =>
        line.trim() !== '' &&
        !line.startsWith('Scheme Code') &&
        !line.startsWith('--')
      )
      .join('\n');
    const records = parse(cleanedText, {
        delimiter: ';',
        columns: ['schemeCode', 'isin', 'schemeName', 'nav', 'date'],
        skip_empty_lines: true,
        relax_column_count: true,
      });
      console.log(records);
    //   for (const row of records) {
    //     const { schemeCode, isin, schemeName, nav, date } = row;
    //     if (!schemeCode || !nav || !date) continue;
    //     console.log(schemeCode, isin, schemeName, nav, date);
    // }
}


fetchMFData();

app.listen(5000, () => {
    console.log(`Server is running on port 5000`);
});

export default app;