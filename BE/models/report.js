const mongoose = require('mongoose')

const Report = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'order',
        required: true
    },
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'device'
    },
    fromLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'location'
    },
    toLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'location'
    },
    material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "material",
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

module.exports = mongoose.model('report', Report)