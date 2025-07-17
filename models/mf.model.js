import mongoose from 'mongoose';

<<<<<<< Updated upstream
const MutualFundSchema = new mongoose.Schema({
  schemeCode: String,
  isin: String,
  schemeName: String,
  nav: Number,
  date: Date
=======
const mutualFundSchema = new mongoose.Schema({
    isin: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: [{ type: String }],  // <-- now it's a string array
    nav: { type: Number },
    navDate: { type: Date }
>>>>>>> Stashed changes
});

const mf = mongoose.model('mf', MutualFundSchema);
export default mf;
