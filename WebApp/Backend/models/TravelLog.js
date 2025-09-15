const mongoose = require('mongoose');

const travelLogSchema = new mongoose.Schema({
    excavator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
    },
    distance: {
        type: Number
    },
}, {
    timestamps: true
});

// Indexes
travelLogSchema.index({ createdAt: -1 });

const Order = mongoose.model('TravelLog', travelLogSchema);
module.exports = Order;
