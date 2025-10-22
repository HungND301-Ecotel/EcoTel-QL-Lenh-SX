const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Report = require('../models/Report');
const Job = require('../models/Job');
const mongoose = require('mongoose');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const { ROLE, JOB_TYPE } = require('../config/config');
const { groupTripsVehicle, groupExcavator, groupProduction, groupTripsVehicleProduction, safeQuery } = require('../utils/reportGrouping'); // ⚠️ đường dẫn đúng tới function của bạn nhé

// ------------------
// HÀM GOM CHO XUC (KLD & TLT)
// ------------------
async function summariseExcavatorProduction(reports, selectedDate) {
    const selectedKey = new Date(selectedDate).toISOString().slice(0, 10);

    if (!reports || reports.length === 0) {
        const emptySummary = (code) => ({
            jobType: code,
            productionByDay: [],
            cumulativeTotal: 0,
            selectedDay: {
                date: selectedKey,
                shifts: [{ shift: 1, production: 0 }, { shift: 2, production: 0 }, { shift: 3, production: 0 }],
                dayTotal: 0,
            },
            deviceProductions: []
        });

        return {
            kldSummary: emptySummary('KLD'),
            tltSummary: emptySummary('TLT')
        };
    }

    const tripsRaw = await groupProduction(reports, selectedDate);

    const tripMap = {};
    const deviceMapKLD = {};
    const deviceMapTLT = {};

    for (const t of tripsRaw) {
        if (!t.workingDate) continue;

        const dateKey = new Date(t.workingDate).toISOString().slice(0, 10);
        const shift = Math.max(1, Math.min(3, t.shift || 1));

        // 🔹 Chỉ cộng thiết bị trong NGÀY ĐƯỢC CHỌN
        if (dateKey === selectedKey) {
            const deviceId = t.device?._id?.toString() || t.deviceId?.toString();
            if (deviceId) {
                // --- KLD ---
                if (!deviceMapKLD[deviceId]) {
                    deviceMapKLD[deviceId] = {
                        deviceId,
                        code: t.device?.code || 'N/A',
                        totalProduction: 0
                    };
                }
                deviceMapKLD[deviceId].totalProduction += t.totalCubicMeter || 0;

                // --- TLT ---
                if (!deviceMapTLT[deviceId]) {
                    deviceMapTLT[deviceId] = {
                        deviceId,
                        code: t.device?.code || 'N/A',
                        totalProduction: 0
                    };
                }
                deviceMapTLT[deviceId].totalProduction += t.totalTon || 0;
            }
        }

        const mapKey = `${dateKey}_${shift}`;
        if (!tripMap[mapKey]) {
            tripMap[mapKey] = {
                workingDate: t.workingDate,
                shift,
                totalCubicMeter: 0,
                totalTon: 0
            };
        }

        tripMap[mapKey].totalCubicMeter += t.totalCubicMeter || 0;
        tripMap[mapKey].totalTon += t.totalTon || 0;
    }

    const trips = Object.values(tripMap);
    const groupedByDate = { KLD: {}, TLT: {} };

    // 🔹 Gom theo ngày + ca
    for (const trip of trips) {
        const dateKey = new Date(trip.workingDate).toISOString().slice(0, 10);
        const shift = Math.max(1, Math.min(3, trip.shift || 1));

        const values = { KLD: trip.totalCubicMeter || 0, TLT: trip.totalTon || 0 };

        for (const code of ['KLD', 'TLT']) {
            const value = values[code];
            const group = groupedByDate[code];

            if (!group[dateKey]) {
                const isSelectedDay = dateKey === selectedKey;
                group[dateKey] = {
                    shifts: isSelectedDay ? { 1: 0, 2: 0, 3: 0 } : undefined,
                    dayTotal: 0
                };
            }

            if (dateKey === selectedKey && group[dateKey].shifts) {
                group[dateKey].shifts[shift] += value;
            }

            group[dateKey].dayTotal += value;
        }
    }

    const buildSummary = (code, deviceMap) => {
        const group = groupedByDate[code];
        const productionByDay = Object.keys(group)
            .sort()
            .map((date) => {
                const dayData = group[date];
                const shifts = dayData.shifts
                    ? [1, 2, 3].map((shiftNum) => ({
                        shift: shiftNum,
                        production: dayData.shifts[shiftNum] || 0
                    }))
                    : [];
                return { date, shifts, dayTotal: dayData.dayTotal };
            });

        const cumulativeTotal = productionByDay.reduce((sum, d) => sum + d.dayTotal, 0);
        const selectedDay = productionByDay.find((d) => d.date === selectedKey) || {
            date: selectedKey,
            shifts: [{ shift: 1, production: 0 }, { shift: 2, production: 0 }, { shift: 3, production: 0 }],
            dayTotal: 0
        };

        const deviceProductions = Object.values(deviceMap).map((d) => ({
            deviceId: d.deviceId,
            code: d.code,
            totalProduction: d.totalProduction
        }));

        return {
            jobType: code,
            productionByDay,
            cumulativeTotal,
            selectedDay,
            deviceProductions
        };
    };

    return {
        kldSummary: buildSummary('KLD', deviceMapKLD),
        tltSummary: buildSummary('TLT', deviceMapTLT)
    };
}


// ------------------
// HÀM GOM CHO KHOAN (MKS)
// ------------------
async function summariseDrillingOrdersAggFull(selectedDate, startOfMonth, departmentId) {
    const selectedKey = new Date(selectedDate).toISOString().slice(0, 10);

    const matchStage = {
        $match: {
            workingDate: { $gte: startOfMonth, $lte: selectedDate },
        },
    };
    if (departmentId) {
        matchStage.$match.department = new mongoose.Types.ObjectId(departmentId);
    }

    const result = await Order.aggregate([
        matchStage,
        // Chỉ lấy job loại "VẬN HÀNH KHOAN"
        {
            $lookup: {
                from: 'jobs',
                localField: 'job',
                foreignField: '_id',
                as: 'job',
            },
        },
        { $unwind: '$job' },
        {
            $match: { 'job.type': JOB_TYPE.VAN_HANH_KHOAN },
        },
        // Join sang Report
        {
            $lookup: {
                from: 'reports',
                localField: '_id',
                foreignField: 'orderId',
                as: 'reports',
            },
        },
        { $unwind: '$reports' },
        // Join sang Shift để lấy ca
        {
            $lookup: {
                from: 'shifts',
                localField: 'shift',
                foreignField: '_id',
                as: 'shift',
            },
        },
        { $unwind: { path: '$shift', preserveNullAndEmptyArrays: true } },
        // Chuẩn hóa dữ liệu
        {
            $addFields: {
                dateStr: {
                    $dateToString: { format: '%Y-%m-%d', date: '$workingDate' },
                },
                shiftNum: { $toInt: '$shift.name' },
                drillValue: { $ifNull: ['$reports.drillDepth', 0] },
            },
        },
        {
            $facet: {
                // ---- A. Tính tổng theo ngày và ca ----
                byDate: [
                    {
                        $group: {
                            _id: { date: '$dateStr', shift: '$shiftNum' },
                            totalDrill: { $sum: '$drillValue' }
                        }
                    },
                    {
                        $group: {
                            _id: '$_id.date',
                            shifts: {
                                $push: { shift: '$_id.shift', production: '$totalDrill' }
                            },
                            dayTotal: { $sum: '$totalDrill' }
                        }
                    },
                    { $sort: { _id: 1 } }
                ],

                // ---- B. Tính tổng theo máy trong ngày được chọn ----
                byDevice: [
                    { $match: { dateStr: selectedKey } },
                    {
                        $lookup: {
                            from: 'devices',
                            localField: 'reports.device',
                            foreignField: '_id',
                            as: 'device',
                            pipeline: [{ $project: { code: 1 } }]
                        }
                    },
                    { $unwind: { path: '$device', preserveNullAndEmptyArrays: true } },
                    {
                        $group: {
                            _id: '$device._id',
                            code: { $first: '$device.code' },
                            totalDrill: { $sum: '$drillValue' }
                        }
                    },
                    { $sort: { code: 1 } }
                ]
            }
        }
    ]);

    const { byDate, byDevice } = result[0] || { byDate: [], byDevice: [] };

    const productionByDay = byDate.map((r) => ({
        date: r._id,
        shifts: r.shifts.filter((s) => !!s.shift),
        dayTotal: r.dayTotal,
    }));

    const cumulativeTotal = productionByDay.reduce((sum, d) => sum + d.dayTotal, 0);

    const selectedDay =
        productionByDay.find((d) => d.date === selectedKey) || {
            date: selectedKey,
            shifts: [
                { shift: 1, production: 0 },
                { shift: 2, production: 0 },
                { shift: 3, production: 0 },
            ],
            dayTotal: 0,
        };

    return {
        jobType: 'MKS',
        productionByDay,
        cumulativeTotal,
        selectedDay,
        deviceProductions: byDevice.map(d => ({
            deviceId: d._id,
            code: d.code || 'N/A',
            totalProduction: d.totalDrill
        }))
    };
}



// ------------------
// ROUTE /analysics
// ------------------

router.get('/vhk', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res) => {
    try {
        const { date, department } = req.query;
        const user = req.user;

        if (!date) return res.status(400).json({ status: 'error', message: 'Thiếu tham số date' });

        const selected = new Date(date);
        const selectedDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 23, 59, 59, 999);
        const startOfMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);

        const departmentId =
            user?.role === ROLE.MANAGER
                ? user?.department?._id
                : [ROLE.ADMIN, ROLE.DISPATCHER].includes(user?.role)
                    ? department
                    : null;

        const drillingSummary = await summariseDrillingOrdersAggFull(selectedDate, startOfMonth, departmentId);

        res.status(200).json({
            status: 'success',
            message: 'Tính sản lượng tổng hợp thành công',
            data: [drillingSummary],
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});



router.get(
    '/vhx',
    verifyToken,
    restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER),
    async (req, res) => {
        try {
            const { date, department } = req.query;
            const user = req.user;

            if (!date) {
                return res.status(400).json({ status: 'error', message: 'Thiếu tham số date' });
            }

            const selected = new Date(date);
            const selectedDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 23, 59, 59, 999);
            const startOfMonth = new Date(selected.getFullYear(), selected.getMonth(), 1, 0, 0, 0, 0);

            let query = { workingDate: { $gte: startOfMonth, $lte: selectedDate } };

            // Giới hạn theo phòng ban / user
            if (user?.role === ROLE.MANAGER && user?.department) {
                query.department = new mongoose.Types.ObjectId(user.department._id);
            } else if ([ROLE.ADMIN, ROLE.DISPATCHER].includes(user?.role) && department) {
                query.department = new mongoose.Types.ObjectId(department);
            }

            const jobsVehicle = await Job.find({ type: JOB_TYPE.VAN_HANH_XUC }).select('_id');
            const jobIdVehicle = jobsVehicle.map(j => j._id);
            const vehicleOrders = await Order.aggregate([
                // 1. Lọc Order theo ngày, phòng ban và Job ID
                {
                    $match: {
                        ...query,
                        job: { $in: jobIdVehicle }, // jobIdVehicle từ Job.find({ type: JOB_TYPE.VAN_HANH_XUC })
                    },
                },
                {
                    $lookup: {
                        from: 'shifts', // Tên collection chứa thông tin ca (shifts)
                        localField: 'shift', // Trường reference trong Order
                        foreignField: '_id', // Trường ID trong collection shifts
                        as: 'shiftDetails', // Tên mảng tạm chứa kết quả lookup
                    },
                },

                // 3. 🔹 Unwind (giải nén) mảng shiftDetails
                // Vì trường 'shift' thường là reference 1:1, ta dùng $unwind để biến mảng thành object
                {
                    $unwind: {
                        path: '$shiftDetails',
                        preserveNullAndEmptyArrays: true, // Giữ lại Order nếu không có shift
                    },
                },

                // 4. 🔹 PROJECT (Chọn và Định hình lại dữ liệu)
                {
                    $project: {
                        // Giữ lại các trường cần thiết để truy vấn Report
                        _id: 1,
                        workingDate: 1,
                        // ⚠️ CHỌN shift và CHỈ LẤY TRƯỜNG 'name'
                        shift: '$shiftDetails.name',
                        // Bạn có thể thêm các trường khác nếu cần (ví dụ: department: 1, job: 1)
                    },
                }
            ]);

            // 1. Truy vấn TẤT CẢ Reports chỉ trong MỘT LẦN (sử dụng $in)

            let allVehicleReports = [];
            for (const order of vehicleOrders) {
                const reports = await Report.find({ orderId: order._id })
                    // ... các populate khác (giữ nguyên) ...
                    .populate("device", 'code material')
                    .populate("material", "name")
                    .populate("excavator", "code")
                    .populate("fromLocation", "name")
                    .populate("toLocation", "name");

                // ⚠️ BƯỚC SỬA LỖI QUAN TRỌNG NHẤT: Gán Shift và WorkingDate
                const shiftNum = order.shift ? Number(order.shift) : 1;

                const reportsWithOrderInfo = reports.map(r => ({
                    // toObject() cần thiết để thêm thuộc tính mới vào object Mongoose
                    ...r.toObject(),
                    shift: shiftNum, // <-- Gán thông tin Ca từ Order
                    workingDate: order.workingDate, // <-- Gán thông tin Ngày từ Order (nếu cần)
                }));

                allVehicleReports.push(...reportsWithOrderInfo);
            }

            const { kldSummary, tltSummary } = await summariseExcavatorProduction(allVehicleReports, selectedDate);
            res.status(200).json({
                status: 'success',
                message: 'Tính sản lượng tổng hợp thành công',
                data: [kldSummary, tltSummary],
            });
        } catch (err) {
            console.log(err)
            res.status(500).json({ status: 'error', message: err.message });
        }
    }
);
router.get(
    '/tkm',
    verifyToken,
    restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER),
    async (req, res) => {
        try {
            const { date, department } = req.query;
            const user = req.user;

            if (!date) {
                return res.status(400).json({ status: 'error', message: 'Thiếu tham số date' });
            }

            const selected = new Date(date);
            const selectedDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 23, 59, 59, 999);
            const startOfMonth = new Date(selected.getFullYear(), selected.getMonth(), 1, 0, 0, 0, 0);

            let query = { workingDate: { $gte: startOfMonth, $lte: selectedDate } };

            // Giới hạn theo phòng ban / user
            if (user?.role === ROLE.MANAGER && user?.department) {
                query.department = new mongoose.Types.ObjectId(user.department._id);
            } else if ([ROLE.ADMIN, ROLE.DISPATCHER].includes(user?.role) && department) {
                query.department = new mongoose.Types.ObjectId(department);
            }

            const jobsVehicle = await Job.find({ type: JOB_TYPE.VAN_HANH_XE }).select('_id');
            const jobIdVehicle = jobsVehicle.map(j => j._id);
            const vehicleOrders = await Order.aggregate([
                // 1. Lọc Order theo ngày, phòng ban và Job ID
                {
                    $match: {
                        ...query,
                        job: { $in: jobIdVehicle }, // jobIdVehicle từ Job.find({ type: JOB_TYPE.VAN_HANH_XUC })
                    },
                },
                {
                    $lookup: {
                        from: 'shifts', // Tên collection chứa thông tin ca (shifts)
                        localField: 'shift', // Trường reference trong Order
                        foreignField: '_id', // Trường ID trong collection shifts
                        as: 'shiftDetails', // Tên mảng tạm chứa kết quả lookup
                    },
                },

                // 3. 🔹 Unwind (giải nén) mảng shiftDetails
                // Vì trường 'shift' thường là reference 1:1, ta dùng $unwind để biến mảng thành object
                {
                    $unwind: {
                        path: '$shiftDetails',
                        preserveNullAndEmptyArrays: true, // Giữ lại Order nếu không có shift
                    },
                },

                // 4. 🔹 PROJECT (Chọn và Định hình lại dữ liệu)
                {
                    $project: {
                        // Giữ lại các trường cần thiết để truy vấn Report
                        _id: 1,
                        workingDate: 1,
                        // ⚠️ CHỌN shift và CHỈ LẤY TRƯỜNG 'name'
                        shift: '$shiftDetails',
                        // Bạn có thể thêm các trường khác nếu cần (ví dụ: department: 1, job: 1)
                    },
                }
            ]);

            // 1. Truy vấn TẤT CẢ Reports chỉ trong MỘT LẦN (sử dụng $in)
            const orderIds = vehicleOrders.map(o => o._id);
            const allReports = await safeQuery(() =>
                Report.find({ orderId: { $in: orderIds } })
                    .populate({
                        path: "device",
                        select: "code material",
                    })
                    .populate("material", "name")
                    .populate("excavator", "code")
                    .populate("fromLocation", "name")
                    .populate("toLocation", "name")
            )

            // 🔹 2. Tạo map để tra thông tin Order nhanh
            const orderMap = new Map();
            for (const o of vehicleOrders) {
                orderMap.set(o._id.toString(), {
                    shift: o.shift,
                    workingDate: o.workingDate,
                });
            }
            // 🔹 3. Gán thông tin Order vào Report
            const allVehicleReports = allReports.map(r => {
                const orderInfo = orderMap.get(r.orderId?.toString());
                return {
                    ...r.toObject(),
                    shift: orderInfo?.shift,
                    workingDate: orderInfo?.workingDate,
                };
            });

            // nhóm và tính toán
            const tripsRaw = await groupTripsVehicleProduction(allVehicleReports);

            // tổng hợp
            const tripMap = {};
            for (const t of tripsRaw) {
                if (!t.workingDate) continue;
                const dateKey = new Date(t.workingDate).toISOString().slice(0, 10);
                const shift = Number(t.shift) || 1;
                const mapKey = `${dateKey}_${shift}`;
                tripMap[mapKey] = tripMap[mapKey] || { workingDate: t.workingDate, shift, production: 0 };
                tripMap[mapKey].production += t.production || 0;
            }

            const grouped = Object.values(tripMap);
            const selectedKey = new Date(selectedDate).toISOString().slice(0, 10);

            // 🔹 tính sản lượng theo xe trong ngày
            const tripsToday = tripsRaw.filter(t => {
                if (!t.workingDate) return false;
                const dKey = new Date(t.workingDate).toISOString().slice(0, 10);
                return dKey === selectedKey;
            });
            const deviceMap = {};
            for (const t of tripsToday) {
                const devId = t.device?._id?.toString();
                if (!devId) continue;

                if (!deviceMap[devId]) {
                    deviceMap[devId] = {
                        deviceId: devId,
                        code: t.device?.code || 'N/A',
                        totalProduction: 0,
                    };
                }

                deviceMap[devId].totalProduction += t.production || 0;
            }

            // 🔹 Chuyển về mảng
            const deviceProductions = Object.values(deviceMap);
            //

            const byDate = {};
            for (const trip of grouped) {
                const dKey = new Date(trip.workingDate).toISOString().slice(0, 10);
                const s = trip.shift;
                byDate[dKey] = byDate[dKey] || { shifts: { 1: 0, 2: 0, 3: 0 }, dayTotal: 0 };
                byDate[dKey].shifts[s] += trip.production;
                byDate[dKey].dayTotal += trip.production;
            }

            const productionByDay = Object.keys(byDate).sort().map(date => ({
                date,
                shifts: [1, 2, 3].map(i => ({ shift: i, production: byDate[date].shifts[i] || 0 })),
                dayTotal: byDate[date].dayTotal,
            }));

            const selectedDay = productionByDay.find(d => d.date === selectedKey) || {
                date: selectedKey,
                shifts: [{ shift: 1, production: 0 }, { shift: 2, production: 0 }, { shift: 3, production: 0 }],
                dayTotal: 0,
            };

            const result = {
                jobType: 'SLD',
                productionByDay,
                cumulativeTotal: productionByDay.reduce((sum, d) => sum + d.dayTotal, 0),
                selectedDay,
                deviceProductions
            };
            res.status(200).json({
                status: 'success',
                message: 'Tính sản lượng tổng hợp thành công',
                data: [result],
            });
        } catch (err) {
            console.log(err)
            res.status(500).json({ status: 'error', message: err.message });
        }
    }
);

module.exports = router