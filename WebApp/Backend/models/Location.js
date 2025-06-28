const mongoose = require('mongoose')

const Location = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Location name is required'],
        trim: true
    },
    distance:{
        type:Number
    },
    coordinates: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
},
    {
        timestamps: true
    })
module.exports = mongoose.model('Location', Location)
