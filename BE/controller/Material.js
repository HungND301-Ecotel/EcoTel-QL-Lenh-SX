const Material = require('../models/material')



exports.create = async (req, res) => {
    try {
        const { name, code } = req.body
        const newMaterial = new Material({
            name: name,
        });
        await newMaterial.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}
exports.getAll = async (req, res) => {
    try {
        const materials = await Material.find();
        res.status(200).send({ status: 'success', data: materials });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}