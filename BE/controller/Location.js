const Location = require('../models/location')



exports.create = async (req, res) => {
    try {
        const { name } = req.body
        const newLocation = new Location({
            name: name,
        });
        await newLocation.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}
exports.getAll = async (req, res) => {
    try {
        const locations = await Location.find();
        res.status(200).send({ status: 'success', data: locations });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}