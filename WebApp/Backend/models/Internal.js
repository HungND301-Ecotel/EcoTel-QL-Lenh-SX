const mongoose = require('mongoose');

const internalSchema = new mongoose.Schema({
    month: { type: String, required: true }, // e.g. "11/2025"
    area: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true }, // khu vực
    fromLevel: { type: Number, required: true }, // từ mức (cao độ)
    toLevel: { type: Number, required: true },   // đến mức
    distanceKm: { type: Number, required: true }, // cung độ (km)
    liftHight: { type: Number }, // chiều cao nâng tải (m)
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Location" }, // tuyến đường tham chiếu (nếu có)
    note: { type: String },
    addedAt: { type: Date }, // thời gian bổ sung
}, {
    timestamps: true
});

// Indexes
internalSchema.index({ createdAt: -1 });
internalSchema.index({ month: 1 });


const Internal = mongoose.model('Internal', internalSchema);
module.exports = Internal;
