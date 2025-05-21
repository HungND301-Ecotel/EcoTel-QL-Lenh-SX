const mongoose = require('mongoose');

const productionOrderSchema = new mongoose.Schema({
    shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shift',
        required: true
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: true
    },
    location: {
        type: String,
        required: true
    },
    workContent: {
        type: String,
        required: true
    },
    safetyMeasures: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    workResult: {
        type: String
    },
    fuelConsumption: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    handoverReport: {
        equipmentStatus: String,
        notes: String,
        nextShift: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shift'
        },
        createdAt: Date,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }
}, {
    timestamps: true
});

// Indexes
productionOrderSchema.index({ shift: 1, employee: 1 });
productionOrderSchema.index({ equipment: 1 });
productionOrderSchema.index({ status: 1 });
productionOrderSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model('ProductionOrder', productionOrderSchema); 