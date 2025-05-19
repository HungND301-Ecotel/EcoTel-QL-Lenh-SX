const route = require('express').Router()
const orderController = require('../controller/Order')
const authentication = require('../verifyToken')


route.post('/create', authentication, orderController.create)
route.get('/getAll', authentication, orderController.getAll)
route.delete('/delete/:id', authentication, orderController.delete)
route.put('/update/:id', authentication, orderController.update)
route.get('/getByUser', authentication, orderController.getByUser)
route.get('/getById/:id', authentication, orderController.getById)

route.post('/scanWork', authentication, orderController.scanWork)








module.exports = route
