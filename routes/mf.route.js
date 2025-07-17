import express from 'express'
import { listMutualFunds, getStats, addCategory } from '../controller/mf.controller.js'

const mfRoute = express.Router()

mfRoute.get('/', (req, res) => res.send('Hello from Mutual Funds'))

mfRoute.get('/list-mf', listMutualFunds)

mfRoute.get('/stats', getStats)

mfRoute.post('/:fundId/category', addCategory)

export default mfRoute
