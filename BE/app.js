const express = require('express')
const { connect } = require('./config/db')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(express.json())
app.use(cors())

const userRoute = require('./route/user')
const tasktypeRoute = require('./route/tasktype')
const taskRoute = require('./route/task')
const deviceRoute = require('./route/device')
const materialRoute = require('./route/material')
const locationRoute = require('./route/location')
const payrollRoute = require('./route/pay_roll')
const orderRoute = require('./route/order')
const reportRoute = require('./route/report')












app.use('/api/user', userRoute)
app.use('/api/tasktype', tasktypeRoute)
app.use('/api/task', taskRoute)
app.use('/api/device', deviceRoute)
app.use('/api/material', materialRoute)
app.use('/api/location', locationRoute)
app.use('/api/payroll', payrollRoute)
app.use('/api/order', orderRoute)
app.use('/api/report', reportRoute)








const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server runing on port ${PORT}`)
    connect()
})