const route = require('express').Router()
const shiftreportController = require('../controller/ShiftReport')


route.post('/create', shiftreportController.create)
route.get('/getByOrder/:orderId', shiftreportController.getByOrder)






module.exports = route
