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
    description: {
        // biện pháp an toàn chung
        type: String,
    },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('task_type', TaskType)

// lưu các loại công việc (vận hành xúc, khoan ...)