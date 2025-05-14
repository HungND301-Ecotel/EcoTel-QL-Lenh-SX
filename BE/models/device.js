const mongoose = require('mongoose')

const Device = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('device', Device)