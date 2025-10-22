const mongoose = require('mongoose');

const travelLogSchema = new mongoose.Schema({
    excavator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
    },
    workingDate: {
        type: Date
    },
    shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shift',
    },
    area: {
        type: String
    },
    routes: [{
        location: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
        },
        material: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Material',
        },
        excavationLevel: String,
        dumpHeightActual: String,
        fullDistanceKm: Number,
        fullLiftHeightM: Number,
        localMinHeightM: Number,
        localMaxHeightM: Number,
        localDistanceKm: Number,
        localLiftHeightM: Number,
    }],
}, {
    timestamps: true
});

// Indexes
travelLogSchema.index({ createdAt: -1 });
travelLogSchema.index({ excavator: 1 });
travelLogSchema.index({ workingDate: 1 });
travelLogSchema.index({ shift: 1 });


const Order = mongoose.model('TravelLog', travelLogSchema);
module.exports = Order;
