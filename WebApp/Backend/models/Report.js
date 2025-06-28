const mongoose = require('mongoose')

const Report = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device'
    },
    excavator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device'
    },
    fromLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    },
    toLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    },
    material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Material",
    },
    quantity: {
        type: Number,
    },
    drillDepth: {
        type: Number,
    },
    hardnessF: {
        type: Number,
    },
    workingMinutes: {
        type: Number,
    },
    distanceKm: {
        type: Number,
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Report', Report)