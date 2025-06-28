const mongoose = require('mongoose')

const DeviceType = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'DeviceType is required'],
        trim: true
    },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('DeviceType', DeviceType)
