const mongoose = require('mongoose')

const DeviceType = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'DeviceType is required'],
        trim: true
    },
    group:{
        type:String,
        num:['Xe','Máy']
    }
},
    {
        timestamps: true
    })
module.exports = mongoose.model('DeviceType', DeviceType)
