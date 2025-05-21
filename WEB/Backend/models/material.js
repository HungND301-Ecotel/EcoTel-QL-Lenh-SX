const mongoose = require('mongoose')

const Material = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Material name is required'],
        trim: true
    },
    type: {
        type: String,
        num: ['dumping', 'screening', 'station', 'warehouse', 'crushing', 'drilling', 'road', 'other'],
    },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('Material', Material)
