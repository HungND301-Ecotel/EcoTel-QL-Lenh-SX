const mongoose = require('mongoose')

const Material = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('material', Material)
// lưu chủng loại/loại hàng