const mongoose = require('mongoose')

const DeviceModel = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Model name is required'],
        trim: true
    },

},
    {
        timestamps: true
    })
module.exports = mongoose.model('DeviceModel', DeviceModel)
