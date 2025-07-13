const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

const ShiftReport = require('../models/ShiftReport');
const Notification = require('../models/Notification');


const OrderHistory = require('../models/OrderHistory');



const Device = require('../models/Device');
const DeviceType = require('../models/DeviceType');



const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const { sendShiftNotification } = require('../utils/email');
const CheckIn = require('../models/CheckIn');

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shift
 *         schema:
 *           type: string
 *       - in: query
 *         name: employee
 *         schema:
 *           type: string
 *       - in: query
 *         name: device
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 */
router.get('/', verifyToken, async (req, res, next) => {
    try {
        const user = req.user
        const query = {};

        if (user?.role !== 'admin') {
            query.createdBy = user._id
        }

        // Filter by employee
        if (req.query.employee) {
            query.assignedTo = req.query.employee;
        }

        // Filter by device
        if (req.query.device) {
            query.device = { $in: Array.isArray(req.query.device) ? req.query.device : [req.query.device] };
        }

        if (req.query.startTime && req.query.endTime) {
            const endTime = new Date(req.query.endTime);
            endTime.setHours(23, 59, 59, 999);
            query.workingDate = {
                $gte: new Date(req.query.startTime),
                $lte: new Date(endTime)
            };
        } else if (req.query.startTime) {
            query.workingDate = {
                $gte: new Date(req.query.startTime)
            };
        } else if (req.query.endTime) {
            const endTime = new Date(req.query.endTime);
            endTime.setHours(23, 59, 59, 999);
            query.workingDate = {
                $lte: new Date(endTime)
            };
        }

        const orders = await Order.find(query)
            .populate('assignedTo', 'username fullName salaryCode')
            .populate('job', 'name type content')
            .populate('devicesToProduce.deviceType')
            .populate('device', 'code')
            .populate('excavator', 'code')
            .populate('location', 'name')
            .populate('material', 'name')
            .populate('shift')
            .populate({
                path: "assistants",
                select: "username fullName",
            })
            .populate('safetyMeasure')
            .populate({
                path: "shiftReport",
                populate: [
                    {
                        path: "vehicleReports.vehicle",
                        select: "code"  // chọn field cần thiết
                    },
                    {
                        path: "vehicleReports.excavator",
                        select: "code"
                    },
                    {
                        path: "vehicleSummaries.vehicle",
                        select: "code"
                    },
                ]
            })
            .populate('createdBy', 'username fullName salaryCode')
            .populate('updatedBy', 'username fullName')
            .sort('-createdAt')


        res.status(200).json({
            status: 'success',
            results: orders.length,
            data:
                orders

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })

    }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shift
 *               - employee
 *               - device
 *               - location
 *               - workContent
 *             properties:
 *               shift:
 *                 type: string
 *               employee:
 *                 type: string
 *               device:
 *                 type: string
 *               location:
 *                 type: string
 *               workContent:
 *                 type: string
 *               safetyMeasures:
 *                 type: string
 */
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
            excavator, location, material, workContent,
            note,
            safetyMeasure,
            department
        } = req.body;

        const exitOrder = await Order.findOne({ assignedTo: assignedTo, shift: shift, workingDate: workingDate })

        if (exitOrder) {
            return res.status(400).send({ status: 'error', message: 'Không thể tạo nhiều lệnh cho 1 công nhân trong cùng 1 thời gian làm việc' })
        }


        if (devicesToProduce?.length > 0) {
            for (const item of devicesToProduce) {
                const { deviceType, quantity } = item;

                try {
                    // Lấy tất cả thiết bị theo loại và phòng ban
                    const type = await DeviceType.findById(deviceType);
                    const devices = await Device.find({ department: department, category: deviceType });

                    // Nếu không tìm thấy bất kỳ thiết bị nào theo loại đó
                    if (!devices || devices.length === 0) {
                        return res.status(400).send({
                            status: 'error',
                            message: `Loại phương tiện ${type?.name} không tồn tại trong đơn vị`
                        });
                    }

                    // Lọc ra những thiết bị đang sẵn sàng
                    const deviceActive = devices.filter(d => d.status === "available");

                    if (quantity > deviceActive.length) {
                        return res.status(400).send({
                            status: 'error',
                            message: `Số lượng yêu cầu (${quantity}) vượt quá số lượng phương tiện khả dụng (${deviceActive.length}) cho loại ${type?.name}`
                        });
                    }

                    console.log(`✅ Đủ số lượng cho loại phương tiện ${type?.name}`);
                } catch (err) {
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
            distance,
            liftHeight,
            safetyMeasure,
            excavator, location, material, workContent, note,
            createdBy: req.user._id
        });

        await Notification.createNotification({
            title: "Lệnh mới",
            message: "Tạo lệnh mới",
            type: "order",
            recipient: assignedTo,
            sender: req.userId
        });

        res.status(201).json({
            status: 'success',
            message: 'Tạo thành công',
            data:
                order

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })

    }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   patch:
 *     summary: Update order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled]
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               workResult:
 *                 type: string
 *               fuelConsumption:
 *                 type: number
 */
router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate('shiftReport');

        if (!order) {
            return res.status(404).send({ status: 'error', message: 'No order found with that ID' });
        }

        // Update order
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                updatedBy: req.user._id
            },
            {
                new: true,
            }
        )
            .populate({
                path: "assignedTo",
                select: "_id fullName phone salaryCode",
            })
            .populate('job', 'name type content')
            .populate('device', 'code')
            .populate('excavator', 'code')
            .populate('location', 'name')
            .populate('material', 'name')
            .populate('safetyMeasure')
            .populate('shift')
            .populate({
                path: "assistants",
                select: "username fullName",
            })
            .populate({
                path: "shiftReport",
                populate: [
                    {
                        path: "vehicleReports.vehicle",
                        select: "code"  // chọn field cần thiết
                    },
                    {
                        path: "vehicleReports.excavator",
                        select: "code"
                    },
                    {
                        path: "vehicleSummaries.vehicle",
                        select: "code"
                    }
                ]
            })
            .populate({
                path: "createdBy",
                select: "_id fullName phone salaryCode",

            })
            .sort('-createdAt');

        const notification = await Notification.createNotification({
            title: "Trạng thái lệnh",
            message: updatedOrder.status === "warning" ? "Báo lệnh lỗi" : "Chỉnh sửa lệnh",
            type: "order",
            recipient: req.userId.toString() === updatedOrder.assignedTo?._id.toString() ? updatedOrder.createdBy._id : updatedOrder.assignedTo._id,
            sender: req.userId
        });

        if (updatedOrder.status === "warning" || updatedOrder.status === "cancel") {

            if (order && order.device && order.device.length > 0) {
                const lastVehicle = order.device[order.device.length - 1];
                await Device.findByIdAndUpdate(lastVehicle, { status: "available" }, { new: true });
            }

            const snapshot = updatedOrder.toObject();

            // Gán endTime bằng resumeTime
            snapshot.endTime = updatedOrder.updatedAt;
            snapshot.startTime = updatedOrder.resumeTime;
            const newOrderHistory = new OrderHistory({
                orderId: updatedOrder._id,
                changedBy: req.userId,
                snapshot: snapshot
            })
            await newOrderHistory.save();

        }


        res.status(200).json({
            status: 'success',
            message: 'Sửa thành công',
            data:
                updatedOrder

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.delete('/:id', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id).populate('shiftReport')
        if (!order) {
            return res.status(500).send({ status: 'success', message: 'Xóa thất bại' });
        }
        if (order.shiftReport) {
            await ShiftReport.findByIdAndDelete(order.shiftReport._id)
        }
        await Notification.createNotification({
            title: "Xóa lệnh",
            message: "Xóa lệnh",
            type: "order",
            recipient: order.assignedTo,
            sender: req.userId
        });


        res.status(200).send({ status: 'success', message: 'Xóa thành công' });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.get('/user', verifyToken, async (req, res, next) => {
    try {
        const orders = await Order.find({ assignedTo: req.user._id, status: { $ne: "cancel" } })
            .sort('-createdAt')
            .populate({
                path: "assignedTo",
                select: "username fullName phone salaryCode",
            })
            .populate('job', 'name type content')
            .populate('devicesToProduce.deviceType')
            .populate('device', 'code')
            .populate('excavator', 'code')
            .populate('location', 'name')
            .populate('material', 'name')
            .populate('safetyMeasure')
            .populate('shift')
            .populate({
                path: "assistants",
                select: "username fullName",
            })
            .populate({
                path: "shiftReport",
                populate: [
                    {
                        path: "vehicleReports.vehicle",
                        select: "code"  // chọn field cần thiết
                    },
                    {
                        path: "vehicleReports.excavator",
                        select: "code"
                    },
                    {
                        path: "vehicleSummaries.vehicle",
                        select: "code"
                    }
                ]
            })
            .populate({
                path: "createdBy",
                select: "username fullName phone salaryCode",
            })
        res.status(200).send({ status: 'success', data: orders });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const orders = await Order.findById(req.params.id)
            .populate({
                path: "assignedTo",
                select: "username fullName phone salaryCode",
            })
            .populate('job', 'name type content')
            .populate('devicesToProduce.deviceType')
            .populate('device', 'code')
            .populate('excavator', 'code')
            .populate('location', 'name')
            .populate('material', 'name')
            .populate('safetyMeasure')
            .populate('shift')
            .populate({
                path: "assistants",
                select: "username fullName",
            })
            .populate({
                path: "shiftReport",
                populate: [
                    {
                        path: "vehicleReports.vehicle",
                        select: "code"  // chọn field cần thiết
                    },
                    {
                        path: "vehicleReports.excavator",
                        select: "code"
                    },
                    {
                        path: "vehicleSummaries.vehicle",
                        select: "code"
                    }
                ]
            })
            .populate({
                path: "createdBy",
                select: "fullName phone salaryCode",
            })
            .sort({ createdAt: -1 })


        res.status(200).send({ status: 'success', data: orders });
    } catch (err) {
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

        if (!order.shiftReport && order.isScanned === "in_progress") {
            return res
                .status(400)
                .send({ status: "error", message: "Bạn cần báo công trước" });
        }

        const vehicle = await Device.findById(deviceId)
        if (!vehicle) {
            return res.status(404).send({ status: 'error', message: 'Không tìm thấy thiết bị' });
        }
        if (vehicle.code !== deviceCode) {
            return res.status(400).send({ status: 'error', message: 'Thiết bị không khớp' });
        }
        if (!vehicle.coordinates || !vehicle.coordinates.coordinates || vehicle.coordinates.coordinates.length !== 2) {
            return res.status(400).send({ status: 'error', message: 'Thiết bị chưa có tọa độ hợp lệ' });
        }

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
            status = "in_progress"
        } else if (order.isScanned === "in_progress" && !order.endTime) {
            endTime = new Date();
            status = "completed"
        }
        if (order.isScanned === "pending") {
            status = "in_progress"
        }
        const orderUpdate = await Order.findByIdAndUpdate(orderId, {
            isScanned: order.isScanned === "pending" ? "in_progress" : order.isScanned === "in_progress" ? "completed" : "completed",
            resumeTime: order.isScanned === "pending" ? new Date() : order.resumeTime,
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
            .populate('safetyMeasure')
            .populate('shift')
            .populate({
                path: "assistants",
                select: "username fullName",
            })
            .populate({
                path: "createdBy",
                select: "_id fullName phone salaryCode",
            })
        if (!orderUpdate) {
            return res.status(404).send({ status: 'error', message: 'Không tìm thấy lệnh làm việc' });
        }
        if (orderUpdate.status === "completed") {

            const snapshot = orderUpdate.toObject();

            // Gán endTime bằng resumeTime
            snapshot.endTime = orderUpdate.updatedAt;
            snapshot.startTime = orderUpdate.resumeTime;
            const newOrderHistory = new OrderHistory({
                orderId: orderUpdate._id,
                changedBy: req.userId,
                snapshot: snapshot
            })
            await newOrderHistory.save();

        }


        let deviceStatus = vehicle.status;
        if (orderUpdate.status === "in_progress") {
            deviceStatus = "in_use"
        } else if (orderUpdate.status === "completed") {
            deviceStatus = "available"
        }
        const device = await Device.findByIdAndUpdate(deviceId, { status: deviceStatus }, { new: true });
        if (!device) {
            return res.status(404).send({ status: 'error', message: 'Không tìm thấy thiết bị' });
        }
        await Notification.createNotification({
            title: "Trạng thái công việc",
            message: orderUpdate.status === "in_progress" ? "Bắt đầu công việc" : "Kết thúc công việc",
            type: "order",
            recipient: orderUpdate.createdBy?._id,
            sender: req.userId
        });

        res.status(200).send({
            status: 'success',
            message: orderUpdate.isScanned === "in_progress" ? 'Đã bắt đầu công việc' : 'Đã kết thúc công việc',
            data: orderUpdate
        });

    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message });
    }
});


router.post('/checkin', verifyToken, async (req, res, next) => {
    try {
        const { lat, lng, orderId, file } = req.body;

        console.log(req.body)


        const order = await Order.findById(orderId).populate('shiftReport')
        if (!order) {
            return res.status(404).send({ status: 'error', message: 'Không tìm thấy lệnh làm việc' });
        }

        if (!file) {
            return res.status(400).send({ status: 'error', message: 'Vui lòng thử lại' });
        }


        if (!order.shiftReport && order.isScanned === "in_progress") {
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
        let startTime = order.startTime;
        let endTime = order.endTime;
        let status = order.status;



        if (!order.startTime) {
            startTime = new Date();
            status = "in_progress"
        } else if (order.isScanned === "in_progress" && !order.endTime) {
            endTime = new Date();
            status = "completed"
        }
        if (order.isScanned === "pending") {
            status = "in_progress"
        }
        const orderUpdate = await Order.findByIdAndUpdate(orderId, {
            isScanned: order.isScanned === "pending" ? "in_progress" : order.isScanned === "in_progress" ? "completed" : "completed",
            resumeTime: order.isScanned === "pending" ? new Date() : order.resumeTime,
            startTime,
            endTime,
            status,
        }, { new: true }).populate({
            path: "assignedTo",
            select: "username fullName phone salaryCode",

        })
            .populate('job', 'name type content')
            .populate('device', 'code')
            .populate('excavator', 'code')
            .populate('location', 'name')
            .populate('material', 'name')
            .populate('safetyMeasure')
            .populate('shift')
            .populate({
                path: "assistants",
                select: "username fullName",
            })
            .populate({
                path: "createdBy",
                select: "_id fullName phone salaryCode",
            })
        if (!orderUpdate) {
            return res.status(404).send({ status: 'error', message: 'Không tìm thấy lệnh làm việc' });
        }

        const newCheckIn = new CheckIn({
            orderId: orderUpdate._id,
            imageUrl: file
        })
        await newCheckIn.save()

        if (orderUpdate.status === "completed") {

            const snapshot = orderUpdate.toObject();

            // Gán endTime bằng resumeTime
            snapshot.endTime = orderUpdate.updatedAt;
            snapshot.startTime = orderUpdate.resumeTime;
            const newOrderHistory = new OrderHistory({
                orderId: orderUpdate._id,
                changedBy: req.userId,
                snapshot: snapshot
            })
            await newOrderHistory.save();

        }

        if (order && order.device && order.device.length > 0) {
            const lastVehicle = order.device[order.device.length - 1];

            await Device.findByIdAndUpdate(lastVehicle, {
                status: orderUpdate.status === "in_progress" ? "in_use" : "available"
            }, { new: true });
        }

        await Notification.createNotification({
            title: "Trạng thái công việc",
            message: orderUpdate.status === "in_progress" ? "Bắt đầu công việc" : "Kết thúc công việc",
            type: "order",
            recipient: orderUpdate.createdBy?._id,
            sender: req.userId
        });


        res.status(200).send({
            status: 'success',
            message: orderUpdate.isScanned === "in_progress" ? 'Đã bắt đầu công việc' : 'Đã kết thúc công việc',
            data: orderUpdate
        });

    } catch (err) {
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