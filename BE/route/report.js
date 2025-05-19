const route = require('express').Router()
const reportController = require('../controller/report')


route.post('/create', reportController.create)
route.get('/getByOrder/:orderId', reportController.getByOrder)






module.exports = route
