const Task = require('../models/task')



exports.create = async (req, res) => {
    try {
        const { name, typeId } = req.body
        const newTask = new Task({
            name: name,
            typeId: typeId
        });
        await newTask.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}
exports.getAll = async (req, res) => {
    try {
        const tasks = await Task.find().populate('typeId', 'name');
        res.status(200).send({ status: 'success', data: tasks });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}
