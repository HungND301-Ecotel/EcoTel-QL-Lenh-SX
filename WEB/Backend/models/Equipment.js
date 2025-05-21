const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['truck', 'excavator', 'bulldozer', 'crane', 'other']
    },
    model: {
        type: String,
        required: true
    },
    serialNumber: {
        type: String,
        required: true,
        unique: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    status: {
        type: String,
        enum: ['available', 'in_use', 'maintenance', 'retired'],
        default: 'available'
    },
    specifications: {
        type: Map,
        of: String
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
equipmentSchema.index({ type: 1, status: 1 });
equipmentSchema.index({ department: 1 });
equipmentSchema.index({ serialNumber: 1 }, { unique: true });

module.exports = mongoose.model('Equipment', equipmentSchema); 