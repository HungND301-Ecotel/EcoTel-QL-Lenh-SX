const mongoose = require('mongoose')

const Permission = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    code: {
        type: String,
    }
},
    {
        timestamps: true
    })
module.exports = mongoose.model('Permission', Permission)
