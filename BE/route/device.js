const route = require('express').Router()
const deviceController = require('../controller/Device')


route.post('/create', deviceController.create)
route.get('/getAll', deviceController.getAll)
route.put('/update/:id', deviceController.update)






module.exports = route
