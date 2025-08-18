const mongoose = require('mongoose')

const Position = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    note: {
        type: String
    }
},
    {
        timestamps: true
    })
module.exports = mongoose.model('Position', Position)

