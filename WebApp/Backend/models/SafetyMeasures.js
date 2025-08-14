const mongoose = require('mongoose')

const SafetyMeasure = new mongoose.Schema({
    content: {
        type: String,
    },
    master_content: {
        type: String,
    },
    jobType: {
        type: String,
        enum: ['Vận hành xe', 'Vận hành khoan', 'Vận hành xe phục vụ', 'Vận hành gạt', 'Vận hành xúc', 'Khác'],
    }
},
    {
        timestamps: true
    })
module.exports = mongoose.model('SafetyMeasure', SafetyMeasure)
