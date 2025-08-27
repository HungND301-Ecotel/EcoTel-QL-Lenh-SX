const mongoose = require('mongoose')

const SafetyMeasure = new mongoose.Schema({
    name:{
        type:String
    },
    content: {
        type: String,
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
    },
    position: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position',
    }],
},
    {
        timestamps: true
    })
module.exports = mongoose.model('SafetyMeasure', SafetyMeasure)
