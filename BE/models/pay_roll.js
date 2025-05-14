const mongoose = require('mongoose')

const Payroll = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    code: {
        type: String,
        required: true,
        require: true
    }
},
    {
        timestamps: true
    })
module.exports = mongoose.model('pay_roll', Payroll)