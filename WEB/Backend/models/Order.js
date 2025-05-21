const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: [true, 'Order number is required'],
        unique: true
    },
    shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shift',
        required: [true, 'Shift is required']
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Employee is required']
    },
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
        required: [true, 'Device is required']
    },
    location: {
        type: String,
        required: [true, 'Location is required']
    },
    workContent: {
        type: String,
        required: [true, 'Work content is required']
    },
    safetyMeasures: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    workResult: {
        type: String
    },
    fuelConsumption: {
        type: Number
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
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
orderSchema.index({ shift: 1 });
orderSchema.index({ employee: 1 });
orderSchema.index({ device: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
