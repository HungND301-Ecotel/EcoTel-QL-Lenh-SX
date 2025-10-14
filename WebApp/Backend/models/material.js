const mongoose = require('mongoose')

const Material = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Material name is required'],
        trim: true
    },
    // ty trong quy am
    density: {
        type: Number
    },
    // ty trong khong quy am
    dryDensity: {
        type: Number
    },
    // Lịch sử thay đổi tỷ trọng quy ẩm
    acceptedProduct: {
        type: String
    },
    // Lịch sử thay đổi tỷ trọng không quy ẩm
    densityHistory: [{
        value: Number,
        effectiveDate: Date,
    }],
    dryDensityHistory: [
        {
            value: Number,
            effectiveDate: {
                type: Date,
                default: Date.now,
            },
        }],

},
    {
        timestamps: true
    })
module.exports = mongoose.model('Material', Material)
