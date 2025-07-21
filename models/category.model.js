import mongoose from 'mongoose'

const assetClassSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
})

const routeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: false },
    assetClass: { type: String, required: false },
    assetClassID: { type: mongoose.Schema.Types.ObjectId, ref: 'AssetClass' },
})

// Asset Class and Route Name should be added to the InstrumentCategory model
const instrumentCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: false },
    assetClass: { type: String, required: false },
    route: { type: String, required: false },
    amfiCategory: { type: String, required: false },
    routeID: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    range: {
        min: { type: Number, required: false },
        max: { type: Number, required: false },
    },
})

const AssetClass = mongoose.model('AssetClass', assetClassSchema)
const Route = mongoose.model('Route', routeSchema)
const InstrumentCategory = mongoose.model(
    'InstrumentCategory',
    instrumentCategorySchema
)

export { AssetClass, Route, InstrumentCategory }
