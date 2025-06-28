const mongoose = require('mongoose')

const SafetyMeasure = new mongoose.Schema({
    content: {
        type: String,
    },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('SafetyMeasure', SafetyMeasure)
