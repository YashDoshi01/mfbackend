import mongoose from 'mongoose'

const mutualFundSchema = new mongoose.Schema({
    isin: { type: Object, required: true, unique: true },
    name: { type: String, required: true },
    categories: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InstrumentCategory',
        required: false,
    },
    nav: { type: Number },
    navDate: { type: Date },
})

const MutualFund = mongoose.model('MutualFund', mutualFundSchema)
export default MutualFund
