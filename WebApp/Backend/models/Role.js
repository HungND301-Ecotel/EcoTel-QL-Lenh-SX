const mongoose = require('mongoose')

const Role = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    value: {
        type: String,
        required: [true, 'Value is required'],
        trim: true
    },
    permission: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
    }]
},
    {
        timestamps: true
    })
module.exports = mongoose.model('Role', Role)
