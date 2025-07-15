import express from 'express'
import { fetchAndPrintNAVs } from '../index.js'
const mfRoute = express.Router()

mfRoute.get('/', (req, res) => res.send('Hello from Mutual Funds'))

mfRoute.get('/list-mf', (req, res) => {
    fetchAndPrintNAVs().then((result) => res.send(result))
})

export default mfRoute