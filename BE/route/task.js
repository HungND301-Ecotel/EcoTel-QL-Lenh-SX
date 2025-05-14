const route = require('express').Router()
const taskController = require('../controller/Task')


route.post('/create', taskController.create)
route.get('/getAll', taskController.getAll)





module.exports = route
