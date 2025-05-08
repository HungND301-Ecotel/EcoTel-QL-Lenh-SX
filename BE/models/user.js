const mongoose = require('mongoose')

const User = new mongoose.Schema({
    name: {
        type: String
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String
    },
    phone: {
        type: String
    },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('user', User)