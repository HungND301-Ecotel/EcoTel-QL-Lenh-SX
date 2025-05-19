const Order = require('../models/order')
const Device = require('../models/device')




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
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true })
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
        if (!order) {
            return res.status(500).send({ status: 'success', message: 'Cập nhật thất bại' });
        }

        res.status(200).send({ status: 'success', message: 'Cập nhật thành công', data: order });
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
            .populate("createdBy", "name phone")
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


exports.getById = async (req, res) => {
    try {
        const orders = await Order.findById(req.params.id)
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

exports.scanWork = async (req, res) => {
    try {
        const { deviceId, orderId, action } = req.body;

        if (!['start', 'end'].includes(action)) {
            return res.status(400).send({ status: 'error', message: 'Hành động không hợp lệ. Chỉ chấp nhận start hoặc end.' });
        }

        const deviceStatus = action === 'start' ? 'active' : 'inactive';
        const timeField = action === 'start' ? { start_time: new Date() } : { end_time: new Date() };

        const device = await Device.findByIdAndUpdate(deviceId, { status: deviceStatus }, { new: true });
        if (!device) {
            return res.status(404).send({ status: 'error', message: 'Không tìm thấy thiết bị' });
        }

        const order = await Order.findByIdAndUpdate(orderId, timeField, { new: true }).populate({
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
            .populate("assistants", "name");
        if (!order) {
            return res.status(404).send({ status: 'error', message: 'Không tìm thấy lệnh làm việc' });
        }

        res.status(200).send({
            status: 'success',
            message: action === 'start' ? 'Đã bắt đầu công việc' : 'Đã kết thúc công việc',
            data: order
        });

    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message });
    }
};
