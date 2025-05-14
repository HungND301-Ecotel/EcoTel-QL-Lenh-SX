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
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    }
},
    {
        timestamps: true
    })
User.virtual('payroll', {
    ref: 'pay_roll',
    localField: '_id',
    foreignField: 'userId',
    justOne: true,
});
User.set('toObject', { virtuals: true });
User.set('toJSON', { virtuals: true });
module.exports = mongoose.model('user', User)