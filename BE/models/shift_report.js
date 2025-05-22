const mongoose = require('mongoose')

const ShiftReport = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'order',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    travelHours: {
        type: Number,
    },
    repairHours: {
        type: Number,
    },
    handoverHours: {
        type: Number,
    },
    otherHours: {
        type: Number,
    },
    handoverNotes: {
        type: String,
    },
    risks: {
        type: String,
    },
}, {
    timestamps: true
})

module.exports = mongoose.model('shift_report', ShiftReport)