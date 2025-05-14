const route = require('express').Router()
const tasktypeController = require('../controller/TaskType')


route.post('/create', tasktypeController.create)




module.exports = route
