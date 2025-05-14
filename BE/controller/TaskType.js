const TaskType = require('../models/task_type')



exports.create = async (req, res) => {
    try {
        const { name, mode } = req.body
        const newTaskType = new TaskType({
            name: name,
            mode: mode,
            description: description
        });
        await newTaskType.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}
