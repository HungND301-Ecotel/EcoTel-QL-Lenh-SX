const mongoose = require('mongoose')

const OrderHistory = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    snapshot: { type: Object },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('OrderHistory', OrderHistory)

