import mongoose from 'mongoose'

const mutualFundSchema = new mongoose.Schema({
  name: String,
  isin: String,
  nav: Number,
  navDate: Date,
  category: [String], // <-- Must be array of string
})

export default mongoose.models.MutualFund || mongoose.model('MutualFund', mutualFundSchema)
