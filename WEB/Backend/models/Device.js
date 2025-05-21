const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Device name is required'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Device type is required'],
        enum: ['truck', 'excavator', 'bulldozer', 'crane', 'other']
    },
    model: {
        type: String,
        required: [true, 'Device model is required']
    },
    serialNumber: {
        type: String,
        required: [true, 'Serial number is required'],
        unique: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required']
    },
    status: {
        type: String,
        enum: ['available', 'in_use', 'maintenance', 'retired'],
        default: 'available'
    },
    specifications: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    lastMaintenance: {
        type: Date
    },
    nextMaintenance: {
        type: Date
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
deviceSchema.index({ type: 1, status: 1 });
deviceSchema.index({ department: 1 });

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
