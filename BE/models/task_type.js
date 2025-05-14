const mongoose = require('mongoose')

const TaskType = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    mode: {
        type: String,
        enum: ['trực tiếp', 'gián tiếp'],
        required: true,
    },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('task_type', TaskType)