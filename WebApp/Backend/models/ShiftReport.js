const mongoose = require('mongoose')

const Shiftreport = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    vehicleReports: [
        {
            vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
            excavator: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
            dumpingLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
            fromLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
            toLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
            workingMinutes: Number,
            distanceKm: Number,
            materialType: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
            drillDepth: Number,
            hardness: Number,
            tripCount: Number,
        }
    ],

    vehicleSummaries: [
        {
            vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
            repairHours: Number,
            travelHours: Number,
            fuelRemain: Number,
            fuelReceived: Number,
            fuelRemainEnd: Number,
            status: String,
            note: String,
            gpsStatus: { type: String, },
            sealStatus: { type: String, },
        }
    ],
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

module.exports = mongoose.model('ShiftReport', Shiftreport)