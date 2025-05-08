const mongoose = require('mongoose')


const connect = async () => {
    try {
        await mongoose.connect("mongodb+srv://nguyentuandatntd2k2:Datnguyen37@shop.l7tkp.mongodb.net/Lenh_Sx")
        console.log('Db connected')
    } catch (err) {
        console.log("Db connect error", err)
    }
}
module.exports = { connect }