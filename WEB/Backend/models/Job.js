const mongoose = require('mongoose')

const Job = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Job name is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['vehicle', 'drilling', 'service', 'grading', 'excavation', 'other'],
    },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('Job', Job)
