const mongoose = require('mongoose')

const Shift = new mongoose.Schema({
    name: {
        type: Number,
        required: [true, 'Shift name is required'],
        trim: true
    },
    startTime: {
        type: String,
    },
    endTime: {
        type: String,
    },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('Shift', Shift)
