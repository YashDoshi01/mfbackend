import mongoose from 'mongoose';

const MutualFundSchema = new mongoose.Schema({
  schemeCode: String,
  isin: String,
  schemeName: String,
  nav: Number,
  date: Date
});

const mf = mongoose.model('mf', MutualFundSchema);
export default mf;
