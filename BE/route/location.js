const route = require('express').Router()
const locationController = require('../controller/Location')


route.post('/create', locationController.create)
route.get('/getAll', locationController.getAll)





module.exports = route
