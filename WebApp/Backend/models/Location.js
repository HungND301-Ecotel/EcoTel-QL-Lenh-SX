const mongoose = require('mongoose')

const Location = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Location name is required'],
        trim: true
    },
    distance: {
        type: Number
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
    }
},
    {
        timestamps: true
    })
module.exports = mongoose.model('Location', Location)
