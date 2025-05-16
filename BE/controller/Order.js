const Order = require('../models/order')



exports.create = async (req, res) => {
    try {
        const { taskId, workingDate, assignedTo, deviceId, excavatorId, locationId, materialId, description } = req.body
        console.log(req.body)

        const newOrder = new Order({
            taskId: taskId,
            workingDate: workingDate,
            assignedTo: assignedTo,
            createdBy: req.user._id,
            deviceId: deviceId,
            excavatorId: excavatorId,
            locationId: locationId,
            materialId: materialId,
            materialId: materialId,
            description: description
        });
        await newOrder.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}
exports.getAll = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate({
                path: "taskId",
                select: "name typeId",
                populate: {
                    path: "typeId",
                    select: "name mode description",
                }
            })
            .populate({
                path: "assignedTo",
                select: "name",
                populate: {
                    path: "payroll", // virtual field trong User
                }
            })
            .populate("createdBy", "name")
            .populate("deviceId", "name")
            .populate("locationId", "name")
            .populate("excavatorId", "name")
            .populate("materialId", "name")
            .populate("assistants", "name")


        res.status(200).send({ status: 'success', data: orders });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}
exports.delete = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id)
        if (!order) {
            return res.status(500).send({ status: 'success', message: 'Xóa thất bại' });
        }

        res.status(200).send({ status: 'success', message: 'Xóa thành công' });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}
exports.update = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body)
        if (!order) {
            return res.status(500).send({ status: 'success', message: 'Cập nhật thất bại' });
        }

        res.status(200).send({ status: 'success', message: 'Cập nhật thành công' });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}

exports.getByUser = async (req, res) => {
    try {
        const orders = await Order.find({ assignedTo: req.user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: "taskId",
                select: "name typeId",
                populate: {
                    path: "typeId",
                    select: "name mode description",
                }
            })
            .populate({
                path: "assignedTo",
                select: "name",
                populate: {
                    path: "payroll", // virtual field trong User
                }
            })
            .populate("createdBy", "name")
            .populate("deviceId", "name")
            .populate("locationId", "name")
            .populate("excavatorId", "name")
            .populate("materialId", "name")
            .populate("assistants", "name")


        res.status(200).send({ status: 'success', data: orders });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}