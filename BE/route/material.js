const route = require('express').Router()
const materialController = require('../controller/Material')


route.post('/create', materialController.create)
route.get('/getAll', materialController.getAll)





module.exports = route
