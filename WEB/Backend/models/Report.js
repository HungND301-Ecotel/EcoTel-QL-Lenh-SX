const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Report title is required'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Report type is required'],
        enum: ['daily', 'weekly', 'monthly', 'incident', 'maintenance', 'other']
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required']
    },
    period: {
        startDate: {
            type: Date,
            required: [true, 'Start date is required']
        },
        endDate: {
            type: Date,
            required: [true, 'End date is required']
        }
    },
    content: {
        summary: {
            type: String,
            required: [true, 'Summary is required']
        },
        details: {
            type: String
        },
        attachments: [{
            filename: String,
            path: String,
            mimetype: String,
            size: Number
        }]
    },
    metrics: {
        totalOrders: Number,
        completedOrders: Number,
        cancelledOrders: Number,
        totalDevices: Number,
        activeDevices: Number,
        maintenanceDevices: Number,
        fuelConsumption: Number,
        incidents: Number
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'approved', 'rejected'],
        default: 'draft'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvalDate: Date,
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Indexes
reportSchema.index({ type: 1, 'period.startDate': 1, 'period.endDate': 1 });
reportSchema.index({ department: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdBy: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
