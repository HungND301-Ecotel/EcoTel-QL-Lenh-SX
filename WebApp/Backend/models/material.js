const mongoose = require('mongoose')

const Material = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Material name is required'],
        trim: true
    },
    density: {
        type: Number
    },
    acceptedProduct: {
        type: String
    },

},
    {
        timestamps: true
    })
module.exports = mongoose.model('Material', Material)
