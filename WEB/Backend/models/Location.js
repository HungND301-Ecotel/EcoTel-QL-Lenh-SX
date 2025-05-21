const mongoose = require('mongoose')

const Location = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Location name is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['dumping', 'screening', 'station', 'warehouse', 'crushing', 'drilling', 'road', 'other']
    },
    coordinates: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    }
},
    {
        timestamps: true
    })
module.exports = mongoose.model('Location', Location)
