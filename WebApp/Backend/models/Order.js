const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: [true, 'Job is required']
    },
    workingDate: {
        type: Date,
    },
    shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shift',
        required: [true, 'Shift is required']
    },
    devicesToProduce: [{
        deviceType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DeviceType",
        },
        quantity: { type: Number },
    }],
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    resumeTime: {
        type: Date
    },
    device: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
    }],
    excavator: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
    }],
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
    },
    material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
    },
    distance: {
        type: Number
    },
    liftHeight: {
        type: Number
    },
    workContent: {
        type: String,
        required: [true, 'WorkContent is required']
    },
    assistants: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }
    ],
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'warning'],
        default: 'pending'
    },
    isScanned: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending'
    },
    note: {
        type: String,
    },
    active: {
        type: Boolean,
        default: false
    },
    temporaryError: {
        type: String,
    },
    safetyMeasure: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SafetyMeasure',
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
orderSchema.index({ device: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.virtual('shiftReport', {
    ref: 'ShiftReport',         // Model cần populate
    localField: '_id',          // Trường ở Order
    foreignField: 'orderId',      // Trường ở ShiftReport
    justOne: true               // Vì mỗi Order chỉ có 1 ShiftReport
});
orderSchema.set('toObject', { virtuals: true });
orderSchema.set('toJSON', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
