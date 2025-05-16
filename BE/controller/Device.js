const Device = require('../models/device')



exports.create = async (req, res) => {
    try {
        const { name } = req.body
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
exports.update = async (req, res) => {
    try {
        const device = await Device.findByIdAndUpdate(req.params.id, req.body);
        if (!device) {
            return res.status(200).send({ error: 'success', message:'Cập nhật thất bại' });
        }
        res.status(200).send({ status: 'success', data: 'Cập nhật thành công' });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}