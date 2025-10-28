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
    },
    quantityUpdateTimes: [{
        time: Date,
        quantity: {
            type: Number,
            default: 1
        }
    }],
    totalProduction: {
        type: Number,
        default: 0
    },
    totalCubicMeter: {
        type: Number,
        default: 0
    },
    totalTon: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

Report.index({ orderId: 1 });
Report.index({ material: 1 });
Report.index({ quantity: 1 });
Report.index({ excavator: 1 });
Report.index({ device: 1 });
Report.index({ toLocation: 1 });
Report.index({ fromLocation: 1 });
Report.index({ drillDepth: 1 });




module.exports = mongoose.model('Report', Report)