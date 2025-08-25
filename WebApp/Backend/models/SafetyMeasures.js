const mongoose = require('mongoose')

const SafetyMeasure = new mongoose.Schema({
    content: {
        type: String,
    },
    master_content: {
        type: String,
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
    },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('SafetyMeasure', SafetyMeasure)
