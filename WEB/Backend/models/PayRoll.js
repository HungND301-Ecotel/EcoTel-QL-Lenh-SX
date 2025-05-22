const mongoose = require('mongoose')

const Payroll = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    code: {
        type: String,
        required: true,
        require: true
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
    },
    baseSalary: {
        type: Number,
    },
    bonus: {
        type: Number,
    },
    allowance: {
        type: Number
    },
    note: {
        type: String
    }
},
    {
        timestamps: true
    })
Payroll.index({ createdAt: -1 });
module.exports = mongoose.model('PayRoll', Payroll)

// lưu thông tin thẻ lương