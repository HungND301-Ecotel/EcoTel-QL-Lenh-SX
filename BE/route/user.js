const route = require('express').Router()
const userController = require('../controller/User')
const authentication = require('../verifyToken')


route.post('/register', userController.register)
route.post('/login', userController.login)
route.put('/changepass', authentication, userController.changepass)
route.put('/update', authentication, userController.update)



module.exports = route
