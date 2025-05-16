const mongoose = require('mongoose')

const Order = new mongoose.Schema({
    taskId: {// cv
        type: mongoose.Schema.Types.ObjectId,
        ref: "task",
        required: true,
    },
    workingDate: {//ngày làm vc
        type: Date,
    },
    start_time: {// tg bắt đầu
        type: Date,
    },
    end_time: {//tg kết thúc
        type: Date,
    },
    assignedTo: {//ng nhận
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    createdBy: {// ng giao
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
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
    status: {// trạng thái
        type: String,
        enum: ['pending', 'accepted', 'completed'],
        default: 'pending'
    },
    assistants: [
        // mảng các phụ máy
        { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    ]
},
    {
        timestamps: true
    })
module.exports = mongoose.model('order', Order)
// lưu lệnh