const mongoose = require('mongoose')

const Model = new mongoose.Schema({
    material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
    },
    deviceModel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeviceModel',
    },
    value:{
        type:Number
    }
},
    {
        timestamps: true
    })
module.exports = mongoose.model('Model', Model)
