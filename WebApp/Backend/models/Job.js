const mongoose = require('mongoose')
const { JOB_TYPES } = require('../config/config')

const Job = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Job name is required'],
        trim: true
    },
    type: {
        type: String,
        enum: JOB_TYPES,
    },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('Job', Job)
