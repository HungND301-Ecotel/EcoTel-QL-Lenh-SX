const mongoose = require('mongoose')

const CheckIn = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    },
    imageUrl: {
        type: String,
    },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('CheckIn', CheckIn)
