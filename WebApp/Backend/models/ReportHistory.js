const mongoose = require('mongoose');

const ReportHistory = new mongoose.Schema({
    reportId: { type: mongoose.Schema.Types.ObjectId, required: true },
    sourceType: { type: String, enum: ['Report', 'ShiftReport'], required: true },
    changes: [
        {
            field: { type: String, required: true },
            index: Number,
            oldValue: mongoose.Schema.Types.Mixed,
            newValue: mongoose.Schema.Types.Mixed
        }
    ],
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('ReportHistory', ReportHistory);
