const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

const ShiftReport = require('../models/ShiftReport');
const Notification = require('../models/Notification');


const History = require('../models/History');



const Device = require('../models/Device');
const DeviceType = require('../models/DeviceType');



const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const { sendShiftNotification } = require('../utils/email');
const CheckIn = require('../models/CheckIn');


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

        if (req.query.status) {
            query.status = req.query.status;
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
router.post('/checkExist', verifyToken, async (req, res, next) => {
    try {
        const {
            assignedTo,
            workingDate,
            shift,
        } = req.body;
        const exitOrder = await Order.findOne({ assignedTo: assignedTo, shift: shift, workingDate: workingDate })
            .populate('assignedTo', 'fullName salaryCode')


        res.status(200).json({
            status: 'success',
            data:
                exitOrder

        });
    } catch (err) {
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
            department
        } = req.body;


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
            shiftHour,
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
                resumeTime: req.body.status === "in_progress" ? new Date() : order.resumeTime,
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
            .populate('devicesToProduce.deviceType', 'name')
            .populate('location', 'name')
            .populate('material', 'name')
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



        if (updatedOrder.status === "warning" || updatedOrder.status === "cancel" || updatedOrder.status === "completed") {

            if (order && order.device && order.device.length > 0) {
                const lastVehicle = order.device[order.device.length - 1];
                await Device.findByIdAndUpdate(lastVehicle, { status: "available" }, { new: true });
            }

            const snapshot = updatedOrder.toObject();

            // Gán endTime bằng resumeTime
            snapshot.endTime = updatedOrder.updatedAt;
            snapshot.startTime = updatedOrder.resumeTime;
            const newHistory = new History({
                entity: updatedOrder._id,
                changedBy: req.userId,
                snapshot: snapshot
            })
            await newHistory.save();

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
router.delete('/', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        // Lấy danh sách order có trong ids
        const orders = await Order.find({ _id: { $in: ids } }).populate('shiftReport');

        // Lấy tất cả ID của shiftReport
        const shiftReportIds = orders
            .filter(o => o.shiftReport)
            .map(o => o.shiftReport._id);

        // Xóa tất cả ShiftReport liên quan
        if (shiftReportIds.length > 0) {
            await ShiftReport.deleteMany({ _id: { $in: shiftReportIds } });
        }
        // Xóa các order
        const result = await Order.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }


        // Gửi thông báo cho từng người phụ trách
        for (const order of orders) {
            await Notification.createNotification({
                title: "Xóa lệnh",
                message: "Xóa lệnh",
                type: "order",
                recipient: order.assignedTo,
                sender: req.userId
            });
        }

        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
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
        const query = {
            assignedTo: req.user._id
        }
        if (req.query.status) {
            query.status = req.query.status
        } else {
            query.status = { $ne: "cancel" }
        }
        const orders = await Order.find(query)
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

        console.log(orders)
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
                select: "username fullName",
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
        let startTime = order.startTime;
        let endTime = order.endTime;
        let status = order.status;


        const parsedCheckInTime = checkinTime || null;
        const parsedCheckOutTime = checkoutTime || new Date();


        if (checkinTime && !order.startTime) {
            startTime = parsedCheckInTime;
        }
        if (checkoutTime && !order.endTime) {
            endTime = parsedCheckOutTime;
        }

        const orderUpdate = await Order.findByIdAndUpdate(orderId, {
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



        if (checkinFile) {
            const newCheckIn = new CheckIn({
                orderId: orderUpdate._id,
                imageUrl: checkinFile,
                createdAt: parsedCheckInTime,
            });
            await newCheckIn.save();
        }

        if (checkoutFile) {
            const newCheckOut = new CheckIn({
                orderId: orderUpdate._id,
                imageUrl: checkoutFile,
                createdAt: parsedCheckOutTime,
            });
            await newCheckOut.save();
        }


        res.status(200).send({
            status: 'success',
            message: orderUpdate.status === "in_progress" ? 'Check in thành công' : 'Check out thành công',
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