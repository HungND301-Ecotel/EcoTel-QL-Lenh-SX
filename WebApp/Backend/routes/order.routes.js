const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

const ShiftReport = require('../models/ShiftReport');
const Notification = require('../models/Notification');

const History = require('../models/History');
const User = require('../models/User')
const mongoose = require('mongoose')



const Device = require('../models/Device');
const DeviceType = require('../models/DeviceType');

const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const { sendShiftNotification } = require('../utils/email');
const CheckIn = require('../models/CheckIn');


router.get('/', verifyToken, async (req, res, next) => {
    try {
        const user = req.user;
        const query = {};

        // Các bộ lọc chung
        if (req.query.employee) {
            query.assignedTo = new mongoose.Types.ObjectId(req.query.employee);
        }
        if (req.query.status) {
            query.status = req.query.status;
        }
        if (req.query.device) {
            query.device = new mongoose.Types.ObjectId(req.query.device);
        }
        if (req.query.startTime && req.query.endTime) {
            const endTime = new Date(req.query.endTime);
            endTime.setHours(23, 59, 59, 999);
            query.workingDate = {
                $gte: new Date(req.query.startTime),
                $lte: new Date(endTime)
            };
        } else if (req.query.startTime) {
            query.workingDate = { $gte: new Date(req.query.startTime) };
        } else if (req.query.endTime) {
            const endTime = new Date(req.query.endTime);
            endTime.setHours(23, 59, 59, 999);
            query.workingDate = { $lte: new Date(endTime) };
        }

        let orders;

        if (user?.role === 'manager' && user?.department) {

            orders = await Order.find({ department: user?.department?._id })
                .populate('assignedTo', 'username fullName salaryCode department')
                .populate('job', 'name type content')
                .populate('devicesToProduce.deviceType')
                .populate('device', 'code')
                .populate('excavator', 'code')
                .populate('location', 'name')
                .populate('material', 'name')
                .populate('shift')
                .populate({
                    path: "assistants",
                    select: "username fullName salaryCode",
                })
                .populate({
                    path: "shiftReport",
                    populate: [
                        {
                            path: "vehicleSummaries.vehicle",
                            select: "code"
                        },
                    ]
                })
                .populate('createdBy', 'username fullName salaryCode')
                .populate('updatedBy', 'username fullName')
                .sort({ workingDate: -1 });

        } else {
            // Trường hợp người dùng khác: sử dụng Mongoose find() thông thường
            if (user?.role === 'dispatcher') {
                const dispatcherIds = await User.find(
                    { role: 'dispatcher' },
                    '_id'
                ).lean();

                const ids = dispatcherIds.map(d => d._id);
                query.$or = [
                    { department: user.department._id },
                    { createdBy: { $in: ids } }
                ];
            }
            if (req.query.department) {
                query.department = new mongoose.Types.ObjectId(req.query.department);
            }
            orders = await Order.find(query)
                .populate('assignedTo', 'username fullName salaryCode department')
                .populate('job', 'name type content')
                .populate('devicesToProduce.deviceType')
                .populate('device', 'code')
                .populate('excavator', 'code')
                .populate('location', 'name')
                .populate('material', 'name')
                .populate('shift')
                .populate({
                    path: "assistants",
                    select: "username fullName salaryCode",
                })
                .populate({
                    path: "shiftReport",
                    populate: [
                        {
                            path: "vehicleSummaries.vehicle",
                            select: "code"
                        },
                    ]
                })
                .populate('createdBy', 'username fullName salaryCode')
                .populate('updatedBy', 'username fullName')
                .sort({ workingDate: -1 });
        }
        orders.sort((a, b) => {
            // 1. So sánh workingDate (DESC)
            const dateA = new Date(a.workingDate);
            const dateB = new Date(b.workingDate);
            if (dateA > dateB) return -1;
            if (dateA < dateB) return 1;

            // 2. So sánh shift.name (DESC)
            const nameA = a.shift?.name ? String(a.shift.name) : "";
            const nameB = b.shift?.name ? String(b.shift.name) : "";
            return nameB.localeCompare(nameA);  // DESC
        });
        req.logger.info(`✅ Load lệnh sản xuất thành công`);
        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: orders
        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});
router.post('/checkExist', verifyToken, async (req, res, next) => {
    try {
        const {
            assignedTo,
            workingDate,
            shift,
        } = req.body;
        const exitOrder = await Order.findOne({ assignedTo: assignedTo, shift: shift, workingDate: workingDate })
            .populate('assignedTo', 'fullName salaryCode')

        req.logger.info(`✅ Kiểm tra lệnh thành công`);

        res.status(200).json({
            status: 'success',
            data:
                exitOrder

        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })

    }
});
router.post('/', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const {
            assignedTo,
            job,
            devicesToProduce,
            workingDate,
            device,
            distance,
            liftHeight,
            shift,
            shiftHour,
            excavator, location, material, workContent,
            note,
            safetyMeasure,
            safetyMeasureSpecific,
            department,
            previous_order_id
        } = req.body;


        const user = await User.findById(assignedTo)
        if (devicesToProduce?.length > 0) {
            if (!user) {
                req.logger.warn(`✅ Không tìm thấy người dùng công với ID: ${assignedTo}`);
                return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng' })
            }
            for (const item of devicesToProduce) {
                const { deviceType, quantity } = item;

                try {
                    const type = await DeviceType.findById(deviceType);

                    const devices = await Device.find({ department: user.department, category: deviceType });

                    if (!devices || devices.length === 0) {
                        req.logger.warn(`    - Cảnh báo: Loại phương tiện ${type?.name} không tồn tại trong đơn vị.`);
                        return res.status(400).send({
                            status: 'error',
                            message: `Loại phương tiện ${type?.name} không tồn tại trong đơn vị`
                        });
                    }

                    const deviceActive = devices.filter(d => d.status === "available");

                    if (quantity > devices.length) {
                        req.logger.warn(`    - Cảnh báo: Số lượng yêu cầu (${quantity}) vượt quá khả dụng (${deviceActive.length}) cho ${type?.name}.`);
                        return res.status(400).send({
                            status: 'error',
                            message: `Số lượng yêu cầu (${quantity}) vượt quá số lượng phương tiện khả dụng (${deviceActive.length}) cho loại ${type?.name}`
                        });
                    }

                    req.logger.info(`    - Kiểm tra thành công: Đủ số lượng cho ${type?.name}.`);
                } catch (err) {
                    req.logger.error("❌ Lỗi khi kiểm tra loại phương tiện.", err);
                    return res.status(500).send({
                        status: 'error',
                        message: `Lỗi khi kiểm tra loại phương tiện: ${err.message}`
                    });
                }
            }
        }

        // Generate order number
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const orderNumber = `${year}${month}${day}${random}`;

        const order = await Order.create({
            orderNumber,
            assignedTo,
            job,
            devicesToProduce,
            workingDate,
            device,
            shift,
            shiftHour,
            distance,
            liftHeight,
            safetyMeasure,
            safetyMeasureSpecific,
            previous_order_id,
            excavator, location, material, workContent, note,
            department: user?.department,
            createdBy: req.user._id
        });
        req.logger.info(`✅ Tạo lệnh thành công với ID: ${order._id}`);

        req.logger.info("🔔 Gửi thông báo đến người dùng.");
        await Notification.createNotification({
            title: "Lệnh mới",
            message: "Tạo lệnh mới",
            type: "order",
            recipient: assignedTo,
            sender: req.userId
        });
        req.logger.info(`✅ Gửi thông báo thành công cho người dùng ${assignedTo}`);

        res.status(201).json({
            status: 'success',
            message: 'Tạo thành công',
            data:
                order

        });
        req.logger.info("✨ Kết thúc xử lý request thành công.");
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
        req.logger.error("🚨 Kết thúc xử lý request với lỗi.");

    }
});

router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const { status, ...body } = req.body;
        const { id } = req.params;

        // 1. Lấy đơn hàng hiện tại để kiểm tra
        const order = await Order.findById(id).lean();

        if (!order) {
            req.logger.warn("⚠️ Lỗi 404 - Không tìm thấy lệnh với ID này.");
            return res.status(404).send({ status: 'error', message: 'Không tìm thấy lệnh với ID này.' });
        }

        // 2. Chuẩn bị đối tượng cập nhật
        let updateObject = { ...body, updatedBy: req.user._id };

        // 3. Xử lý logic trạng thái
        switch (status) {
            case "in_progress":
                if (order.status !== "in_progress") {
                    updateObject.startTime = new Date();
                    updateObject.resumeTime = new Date();
                } else {
                    updateObject.resumeTime = new Date();
                }
                if (order.device && order.device.length > 0) {
                    const lastDeviceId = order.device[order.device.length - 1];
                    req.logger.info(`    - Tìm thấy phương tiện: ${lastDeviceId}`);
                    await Device.updateOne({ _id: lastDeviceId }, { status: "in_use" });
                }
                updateObject.status = status;
                break;

            case "completed":
                updateObject.endTime = new Date();
                updateObject.status = status;
                if (order.device && order.device.length > 0) {
                    const lastDeviceId = order.device[order.device.length - 1];
                    req.logger.info(`    - Giải phóng phương tiện cuối cùng: ${lastDeviceId}`);
                    await Device.updateOne({ _id: lastDeviceId }, { status: "available" });
                }
                break;

            case "cancel":
            case "warning":
                updateObject.status = status;
                if (order.device && order.device.length > 0) {
                    const lastDeviceId = order.device[order.device.length - 1];
                    req.logger.info(`    - Giải phóng phương tiện cuối cùng: ${lastDeviceId}`);
                    await Device.updateOne({ _id: lastDeviceId }, { status: "available" });
                }
                break;
            default:
                updateObject.status = status;
                break;
        }

        // 4. Thực hiện cập nhật
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            updateObject,
            { new: true }
        )
            .populate({ path: "assignedTo", select: "_id fullName phone salaryCode" })
            .populate('job', 'name type content')
            .populate('device', 'code')
            .populate('excavator', 'code')
            .populate('devicesToProduce.deviceType', 'name')
            .populate('location', 'name')
            .populate('material', 'name')
            .populate('shift')
            .populate({ path: "assistants", select: "username fullName salaryCode" })
            .populate({
                path: "shiftReport",
                populate: [{ path: "vehicleSummaries.vehicle", select: "code" }]
            })
            .populate({ path: "createdBy", select: "_id fullName phone salaryCode" })
            .sort('-createdAt');

        // 5. Tạo lịch sử và thông báo (chỉ khi có thay đổi trạng thái cần ghi nhận)
        if (order.status !== updatedOrder.status) {
            await Notification.createNotification({
                title: "Trạng thái lệnh",
                message: updatedOrder.status === "warning" ? "Báo lệnh lỗi" : "Chỉnh sửa lệnh",
                type: "order",
                recipient: req.userId.toString() === updatedOrder.assignedTo?._id.toString() ? updatedOrder.createdBy._id : updatedOrder.assignedTo._id,
                sender: req.userId
            });

            const snapshot = updatedOrder.toObject();
            const newHistory = new History({
                entity: updatedOrder._id,
                changedBy: req.userId,
                snapshot: snapshot
            });
            await newHistory.save();
            req.logger.info(`    - Lịch sử đã được ghi lại.`);
        } else {
            req.logger.info("ℹ️ Trạng thái lệnh không thay đổi. Bỏ qua việc tạo thông báo và lịch sử.");
        }

        if (updatedOrder.shiftReport?.handoverNotes) {
            const nextOrder = await Order.findOne({ previous_order_id: order._id });
            if (nextOrder) {
                nextOrder.note = updatedOrder.shiftReport.handoverNotes;
                await nextOrder.save();
            } else {
                // ghi log hoặc xử lý nếu không có nextOrder
                req.logger?.warn?.(`Không tìm thấy nextOrder cho order ${order._id}`);
            }
        }


        // 6. Gửi phản hồi
        res.status(200).json({
            status: 'success',
            message: 'Sửa thành công',
            data: updatedOrder
        });
        req.logger.info("✨ Kết thúc xử lý request thành công.");

    } catch (err) {
        req.logger.error("❌ Lỗi khi cập nhật lệnh", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});
router.delete('/', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { ids } = req.body;
        req.logger.info(`🔍 Dữ liệu yêu cầu: ids = ${JSON.stringify(ids)}`);

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            req.logger.warn("⚠️ Lỗi 400 - Vui lòng chọn bản ghi cần xóa.");
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        // Cải thiện logic: Lấy ID của shiftReport và xóa cùng lúc
        req.logger.info("🔄 Tìm kiếm các ShiftReport liên quan...");
        const shiftReportsToDelete = await Order.find({ _id: { $in: ids }, shiftReport: { $exists: true } }).select('shiftReport').lean();
        const shiftReportIds = shiftReportsToDelete.map(o => o.shiftReport);
        req.logger.info(`✅ Tìm thấy ${shiftReportIds.length} ShiftReport liên quan.`);

        if (shiftReportIds.length > 0) {
            req.logger.info("🔄 Bắt đầu xóa các ShiftReport liên quan.");
            await ShiftReport.deleteMany({ _id: { $in: shiftReportIds } });
            req.logger.info("✅ Đã xóa ShiftReport thành công.");
        }

        // Xóa các order và lấy lại để gửi thông báo
        const ordersToDelete = await Order.find({ _id: { $in: ids } }).select('assignedTo').lean();
        const result = await Order.deleteMany({ _id: { $in: ids } });

        if (result.deletedCount === 0) {
            req.logger.warn("⚠️ Không tìm thấy bản ghi để xóa.");
            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }

        req.logger.info(`✅ Đã xóa thành công ${result.deletedCount} bản ghi.`);

        // Gửi thông báo cho từng người phụ trách
        // Sử dụng Promise.all để gửi thông báo song song
        req.logger.info("🔔 Bắt đầu gửi thông báo.");
        const notificationPromises = ordersToDelete.map(order => {
            return Notification.createNotification({
                title: "Xóa lệnh",
                message: "Xóa lệnh",
                type: "order",
                recipient: order.assignedTo,
                sender: req.userId
            });
        });
        await Promise.all(notificationPromises);
        req.logger.info("✅ Đã gửi tất cả thông báo thành công.");

        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
        });
        req.logger.info("✨ Kết thúc xử lý request thành công.");

    } catch (err) {
        req.logger.error("❌ Lỗi khi xóa nhiều bản ghi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.delete('/:id', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {

        const order = await Order.findByIdAndDelete(req.params.id).populate('shiftReport');

        if (!order) {
            req.logger.warn("⚠️ Lỗi 404 - Không tìm thấy lệnh để xóa.");
            return res.status(404).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }

        if (order.shiftReport) {
            await ShiftReport.findByIdAndDelete(order.shiftReport._id);
            req.logger.info("✅ Đã xóa ShiftReport thành công.");
        }

        await Notification.createNotification({
            title: "Xóa lệnh",
            message: "Xóa lệnh",
            type: "order",
            recipient: order.assignedTo,
            sender: req.userId
        });
        req.logger.info("✅ Thông báo đã được gửi.");

        res.status(200).send({ status: 'success', message: 'Xóa thành công' });

    } catch (err) {
        req.logger.error("❌ Lỗi khi xóa một bản ghi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

const orderPopulateOptions = [
    {
        path: "assignedTo",
        select: "username fullName phone salaryCode",
    },
    { path: 'job', select: 'name type content' },
    { path: 'devicesToProduce.deviceType' },
    { path: 'device', select: 'code' },
    { path: 'excavator', select: 'code' },
    { path: 'location', select: 'name' },
    { path: 'material', select: 'name' },
    { path: 'shift' },
    {
        path: "assistants",
        select: "username fullName salaryCode",
    },
    {
        path: "shiftReport",
        populate: [
            { path: "vehicleSummaries.vehicle", select: "code" }
        ]
    },
    {
        path: "createdBy",
        select: "username fullName phone salaryCode",
    }
];
router.get('/user', verifyToken, async (req, res, next) => {
    try {
        const query = { assignedTo: req.user._id };

        if (req.query.status) {
            query.status = req.query.status;
        } else {
            query.status = { $ne: "cancel" };
        }

        const now = new Date()
        now.setUTCHours(0, 0, 0, 0); // Sets the time to the very last millisecond of the day

        query.workingDate = { $lte: now };
        const orders = await Order.find(query)
            .populate(orderPopulateOptions); // Sử dụng biến chung
        orders.sort((a, b) => {
            // 1. So sánh workingDate (DESC)
            const dateA = new Date(a.workingDate);
            const dateB = new Date(b.workingDate);
            if (dateA > dateB) return -1;
            if (dateA < dateB) return 1;

            // 2. So sánh shift.name (DESC)
            const nameA = a.shift?.name ? String(a.shift.name) : "";
            const nameB = b.shift?.name ? String(b.shift.name) : "";
            return nameB.localeCompare(nameA);  // DESC
        });
        req.logger.info(`✅ Đã tìm thấy ${orders.length} lệnh.`);
        res.status(200).send({ status: 'success', data: orders });

    } catch (err) {
        req.logger.error("❌ Lỗi khi lấy danh sách lệnh", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});



router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate(orderPopulateOptions); // Sử dụng biến chung

        if (!order) {
            req.logger.warn("⚠️ Lỗi 404 - Không tìm thấy lệnh.");
            return res.status(404).send({ status: 'error', message: 'Không tìm thấy lệnh với ID này.' });
        }

        req.logger.info("✅ Đã tìm thấy chi tiết lệnh.");
        res.status(200).send({ status: 'success', data: order });

    } catch (err) {
        req.logger.error("❌ Lỗi khi lấy chi tiết lệnh", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.post('/scanWork', verifyToken, async (req, res, next) => {
    try {
        const { deviceId, deviceCode, lat, lng, orderId } = req.body;

        const order = await Order.findById(orderId).populate('shiftReport')
        if (!order) {
            return res.status(404).send({ status: 'error', message: 'Không tìm thấy lệnh làm việc' });
        }

        const vehicle = await Device.findById(deviceId)
        if (!vehicle) {
            return res.status(404).send({ status: 'error', message: 'Không tìm thấy thiết bị' });
        }
        if (vehicle.code !== deviceCode) {
            return res.status(400).send({ status: 'error', message: 'Thiết bị không khớp' });
        }
        // if (!vehicle.coordinates || !vehicle.coordinates.coordinates || vehicle.coordinates.coordinates.length !== 2) {
        //     return res.status(400).send({ status: 'error', message: 'Thiết bị chưa có tọa độ hợp lệ' });
        // }

        // const [deviceLng, deviceLat] = vehicle.coordinates.coordinates; // GeoJSON lưu theo [lng, lat]
        // const distance = getDistanceFromLatLngInMeters(lat, lng, deviceLat, deviceLng);
        // if (distance > 50) {
        //     return res.status(403).send({
        //         status: 'error',
        //         message: `Khoảng cách quá xa. Vui lòng đến gần thiết bị hơn.`,
        //     });
        // }
        let startTime = order.startTime;
        let endTime = order.endTime;
        let status = order.status;



        if (!order.startTime) {
            startTime = new Date();
        } else if (!order.endTime) {
            endTime = new Date();
        }

        const orderUpdate = await Order.findByIdAndUpdate(orderId, {
            startTime,
            endTime,
            status,
        }, { new: true }).populate({
            path: "assignedTo",
            select: "_id username fullName phone salaryCode",

        })
            .populate('job', 'name type content')
            .populate('device', 'code')
            .populate('excavator', 'code')
            .populate('location', 'name')
            .populate('material', 'name')
            .populate('shift')
            .populate({
                path: "assistants",
                select: "username fullName salaryCode",
            })
            .populate({
                path: "createdBy",
                select: "_id fullName phone salaryCode",
            })
        if (!orderUpdate) {
            return res.status(404).send({ status: 'error', message: 'Không tìm thấy lệnh làm việc' });
        }


        let deviceStatus = vehicle.status;
        if (orderUpdate.status === "in_progress") {
            deviceStatus = "in_use"
        } else if (orderUpdate.status === "completed") {
            deviceStatus = "available"
        }
        const device = await Device.findByIdAndUpdate(deviceId, { status: deviceStatus }, { new: true });

        res.status(200).send({
            status: 'success',
            message: orderUpdate.status === "in_progress" ? 'Đã bắt đầu công việc' : 'Đã kết thúc công việc',
            data: orderUpdate
        });

    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message });
    }
});


router.post('/checkin', verifyToken, async (req, res, next) => {
    try {
        const { lat, lng, orderId, checkinFile, checkoutFile, checkinTime, checkoutTime } = req.body;


        const order = await Order.findById(orderId).populate('shiftReport')
        if (!order) {
            return res.status(404).send({ status: 'error', message: 'Không tìm thấy lệnh làm việc' });
        }


        if (!order.shiftReport && order.status === "in_progress") {
            return res
                .status(400)
                .send({ status: "error", message: "Bạn cần báo công trước" });
        }

        // const vehicle = await Device.findById(deviceId)
        // if (!vehicle) {
        //     return res.status(404).send({ status: 'error', message: 'Không tìm thấy thiết bị' });
        // }
        // if (vehicle.code !== deviceCode) {
        //     return res.status(400).send({ status: 'error', message: 'Thiết bị không khớp' });
        // }
        // if (!vehicle.coordinates || !vehicle.coordinates.coordinates || vehicle.coordinates.coordinates.length !== 2) {
        //     return res.status(400).send({ status: 'error', message: 'Thiết bị chưa có tọa độ hợp lệ' });
        // }

        // const [deviceLng, deviceLat] = vehicle.coordinates.coordinates; // GeoJSON lưu theo [lng, lat]
        // const distance = getDistanceFromLatLngInMeters(lat, lng, deviceLat, deviceLng);
        // if (distance > 50) {
        //     return res.status(403).send({
        //         status: 'error',
        //         message: `Khoảng cách quá xa. Vui lòng đến gần thiết bị hơn.`,
        //     });
        // }


        const parsedCheckInTime = checkinTime || null;
        const parsedCheckOutTime = checkoutTime || new Date();


        if (checkinFile) {
            const newCheckIn = new CheckIn({
                orderId: orderId,
                imageUrl: checkinFile,
                createdAt: parsedCheckInTime,
            });
            await newCheckIn.save();
        }

        if (checkoutFile) {
            const newCheckOut = new CheckIn({
                orderId: orderId,
                imageUrl: checkoutFile,
                createdAt: parsedCheckOutTime,
            });
            await newCheckOut.save();
        }


        res.status(200).send({
            status: 'success',
            message: 'Thành công',
        });

    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message });
    }
});
function getDistanceFromLatLngInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // bán kính Trái Đất (mét)
    const lat1Rad = lat1 * Math.PI / 180; //vido
    const lat2Rad = lat2 * Math.PI / 180; //vido
    const deltaLat = (lat2 - lat1) * Math.PI / 180; //chenh lech vi do
    const deltaLon = (lon2 - lon1) * Math.PI / 180; //chenh lech kinh do

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}


module.exports = router; 
