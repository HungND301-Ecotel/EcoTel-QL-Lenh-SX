const Device = require('../models/device')



exports.create = async (req, res) => {
    try {
        const { name, code } = req.body
        const newDevice = new Device({
            name: name,
        });
        await newDevice.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}
exports.getAll = async (req, res) => {
    try {
        const devices = await Device.find();
        res.status(200).send({ status: 'success', data: devices });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}