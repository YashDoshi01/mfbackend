import express from 'express'

import {
    listInstrumentCategories,
    allInstrumentCategories,
    addInstrumentCategory,
    fetchInstrumentCategoryById,
    fetchInstrumentCategoriesByAssetClass,
    fetchInstrumentCategoriesByRouteId,
    updateInstrumentCategory,
    deleteInstrumentCategory,
} from '../../controller/instrumentCategoryController.js'

import {
    addAssetClass,
    listAssetClasses,
    allAssetClasses,
    fetchAssetClassById,
    updateAssetClass,
    deleteAssetClass,
} from '../../controller/assetClassController.js'

import {
    addRoute,
    allRoutes,
    fetchRoutesById,
    fetchRoutesByAssetClassId,
    listRoutes,
    updateRoute,
    deleteRoute,
} from '../../controller/routesController.js'

import {
    listAmfiCategories,
    allAmfiCategories,
    getAmfiCategoryById,
    addAmfiCategory,
    updateAmfiCategoryStatus,
    linkInstrumentCategoryToAmfiCategory,
    updateAmfiCategory,
    deleteAmfiCategory,
} from '../../controller/amfiCategoryController.js'

const categoryRoute = express.Router()

categoryRoute.get('/', (req, res) => res.send('Hello from Categories'))

categoryRoute.get('/list-asset-classes', listAssetClasses)
categoryRoute.get('/asset-classes/all', allAssetClasses)
categoryRoute.get('/asset-classes/:id', fetchAssetClassById)

categoryRoute.post('/add-asset-class', addAssetClass)
categoryRoute.put('/update-asset-class/:id', updateAssetClass)
categoryRoute.delete('/delete-asset-class/:id', deleteAssetClass)

categoryRoute.get('/list-routes', listRoutes)
categoryRoute.get('/routes/all', allRoutes)
categoryRoute.get('/routes/:id', fetchRoutesById)
categoryRoute.get('/routes/asset-class/:id', fetchRoutesByAssetClassId)

categoryRoute.post('/add-route', addRoute)
categoryRoute.put('/update-route/:id', updateRoute)
categoryRoute.delete('/delete-route/:id', deleteRoute)

categoryRoute.get('/list-instrument-categories', listInstrumentCategories)
categoryRoute.get('/instrument-categories/all', allInstrumentCategories)
categoryRoute.get('/instrument-categories/:id', fetchInstrumentCategoryById)
categoryRoute.get(
    '/instrument-categories/asset-class/:name',
    fetchInstrumentCategoriesByAssetClass
)
categoryRoute.get(
    '/instrument-categories/route/:id',
    fetchInstrumentCategoriesByRouteId
)

categoryRoute.post('/add-instrument-category', addInstrumentCategory)
categoryRoute.put('/update-instrument-category/:id', updateInstrumentCategory)
categoryRoute.delete(
    '/delete-instrument-category/:id',
    deleteInstrumentCategory
)

categoryRoute.get('/list-amfi-categories', listAmfiCategories)
categoryRoute.get('/amfi-categories/all', allAmfiCategories)
categoryRoute.get('/amfi-categories/:id', getAmfiCategoryById)
categoryRoute.post('/add-amfi-category', addAmfiCategory)
categoryRoute.put('/update-amfi-category/:id', updateAmfiCategory)
categoryRoute.put('/update-amfi-category-status/:id', updateAmfiCategoryStatus)
categoryRoute.put(
    '/link-instrument-category-to-amfi-category',
    linkInstrumentCategoryToAmfiCategory
)
categoryRoute.delete('/delete-amfi-category/:id', deleteAmfiCategory)

export default categoryRoute
