const route = require('express').Router()
const payrollController = require('../controller/PayRoll')


route.post('/create', payrollController.create)
route.get('/getByCode/:code', payrollController.getByCode)





module.exports = route
