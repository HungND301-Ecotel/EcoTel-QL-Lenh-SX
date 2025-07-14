const mongoose = require('mongoose')

const History = new mongoose.Schema({
    entity: { type: mongoose.Schema.Types.ObjectId, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    snapshot: { type: Object },
},
    {
        timestamps: true
    })
module.exports = mongoose.model('History', History)

