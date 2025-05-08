const express = require('express')
const { connect } = require('./config/db')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(express.json())
app.use(cors())

const userRoute = require('./route/user')







app.use('/api/user', userRoute)



const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server runing on port ${PORT}`)
    connect()
})