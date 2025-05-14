const mongoose = require('mongoose')

const Task = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    typeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "task_type",
        required: true,
    }
},
    {
        timestamps: true
    })
module.exports = mongoose.model('task', Task)