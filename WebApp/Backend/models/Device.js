const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Device code is required'],
        trim: true
    },
    name: {
        type: String,
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
    },
    vehicleNumber: {
        type: String,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeviceType',
    },
    material: {
        type: String,
    },
    fuelType: {
        type: String,
    },
    capacity: {
        type: Number,
    },
    power: {
        type: Number,
    },
    status: {
        type: String,
        enum: ['available', 'in_use', 'maintenance', 'retired'],
        default: 'available'
    },
    coordinates: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    note:{
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
