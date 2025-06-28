const mongoose = require('mongoose')

const Job = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Job name is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['Vận hành xe' , 'Vận hành khoan' , 'Vận hành xe phục vụ' , 'Vận hành gạt' , 'Vận hành xúc' , 'Khác'],
    },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('Job', Job)
