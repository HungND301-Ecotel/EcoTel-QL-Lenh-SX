const mongoose = require('mongoose')

const Device = new mongoose.Schema({
    name: {
        // mã/ tên thiết bị
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    }
},
    {
        timestamps: true
    })
module.exports = mongoose.model('device', Device)
//thiết bị