import MutualFund from '../models/mf.model.js';

async function insertFundsToMongo(funds) {
    let inserted = 0;
let updated = 0;

for (const fund of funds) {
  const existing = await MutualFund.findOne({ isin: fund.isin });

  if (existing) {
    await MutualFund.updateOne({ isin: fund.isin }, fund);
    updated++;
  } else {
    await MutualFund.create(fund);
    inserted++;
  }
}

console.log(`Inserted: ${inserted}, Updated: ${updated}`);
}
export default insertFundsToMongo;
