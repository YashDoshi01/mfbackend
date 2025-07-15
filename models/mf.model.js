import mongoose from 'mongoose';

const mutualFundSchema = new mongoose.Schema({
    isin: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: {
        assetClass: String,
        fundType: String,
        subCategory: String
    },
    nav: { type: Number },
    navDate: { type: Date }
});

const MutualFund = mongoose.model('MutualFund', mutualFundSchema);
export default MutualFund;
