const mongoose = require('mongoose')

const Order = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "task",
        required: true,
    },
    start_time: {
        type: Date,
        default: Date.now
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    deviceId: {//thiết bị
        type: mongoose.Schema.Types.ObjectId,
        ref: "device",
    },
    excavatorId: {//máy xúc
        type: mongoose.Schema.Types.ObjectId,
        ref: "device",
    },
    locationId: {//vị trí
        type: mongoose.Schema.Types.ObjectId,
        ref: "location",
    },
    materialId: {//chủng loại
        type: mongoose.Schema.Types.ObjectId,
        ref: "material",
    },
    description: {//nội dung
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'completed'],
        default: 'pending'
    }
},
    {
        timestamps: true
    })
module.exports = mongoose.model('order', Order)
// lưu lệnh