const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Report = require('../models/Report');
const Job = require('../models/Job');
const mongoose = require('mongoose');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const { ROLE, JOB_TYPE } = require('../config/config');
const { groupTripsVehicle, groupExcavator, groupProduction } = require('../utils/reportGrouping'); // ⚠️ đường dẫn đúng tới function của bạn nhé

// ------------------
// HÀM GOM CHO XE (KLD & SLD)
// ------------------
async function summariseVehicleProduction(reports, selectedDate) {
    const selectedKey = new Date(selectedDate).toISOString().slice(0, 10);

    if (!reports || reports.length === 0) {
        // Trả về cấu trúc rỗng cho cả 2 loại (KLD, TLT/KLT)
        const emptySummary = (code) => ({
            jobType: code,
            productionByDay: [],
            cumulativeTotal: 0,
            selectedDay: {
                date: selectedKey,
                // Đảm bảo trả về đủ 3 ca rỗng cho ngày được chọn
                shifts: [{ shift: 1, production: 0 }, { shift: 2, production: 0 }, { shift: 3, production: 0 }],
                dayTotal: 0,
            },
        });
        return {
            kldSummary: emptySummary('KLD'),
            tltSummary: emptySummary('TLT'), // Hoặc kltSummary: emptySummary('KLT')
        };
    }

    // 1. 🔹 GỌI HÀM NHÓM CHUYẾN MỘT LẦN DUY NHẤT
    const tripsRaw = await groupProduction(reports, selectedDate);

    // 2️⃣ Gom lại theo ngày + ca
    const tripMap = {};

    for (const t of tripsRaw) {
        if (!t.workingDate) continue;

        const dateKey = new Date(t.workingDate).toISOString().slice(0, 10);
        const shift = Math.max(1, Math.min(3, t.shift || 1));

        const mapKey = `${dateKey}_${shift}`;
        if (!tripMap[mapKey]) {
            tripMap[mapKey] = {
                workingDate: t.workingDate,
                shift,
                totalCubicMeter: 0,
                totalTon: 0,
            };
        }

        tripMap[mapKey].totalCubicMeter += t.totalCubicMeter || 0;
        tripMap[mapKey].totalTon += t.totalTon || 0;
    }

    // 3️⃣ Chuyển map thành mảng trips chuẩn
    const trips = Object.values(tripMap);

    // Sử dụng cấu trúc để lưu trữ 2 loại sản lượng theo ngày
    const groupedByDate = {
        KLD: {}, // { 'YYYY-MM-DD': { dayTotal: X, shifts: { 1: Y, 2: Z, 3: W } } }
        TLT: {},
    };

    // 2. 🔹 VÒNG LẶP DUY NHẤT ĐỂ TÍNH TOÁN
    for (const trip of trips) {
        if (!trip.workingDate) continue;
        const dateKey = new Date(trip.workingDate).toISOString().slice(0, 10);
        // Đảm bảo shift là số và trong phạm vi 1-3
        const shift = Math.max(1, Math.min(3, trip.shift || 1));

        // Lấy giá trị cho từng loại
        const values = {
            'KLD': trip.totalCubicMeter || 0,
            'TLT': trip.totalTon || 0,
        };

        // Lặp qua từng loại sản lượng và cộng dồn
        for (const code of ['KLD', 'TLT']) {
            const value = values[code];
            const group = groupedByDate[code];

            // 🔹 Khởi tạo ngày (chỉ cần khởi tạo một lần)
            if (!group[dateKey]) {
                const isSelectedDay = dateKey === selectedKey;

                group[dateKey] = {
                    // FIX: Nếu là ngày được chọn, khởi tạo 3 ca với giá trị 0
                    shifts: isSelectedDay ? { 1: 0, 2: 0, 3: 0 } : undefined,
                    dayTotal: 0,
                };
            }

            // 🔹 Cộng dồn
            // FIX: Cộng dồn vào shifts nếu là ngày được chọn
            if (dateKey === selectedKey && group[dateKey].shifts) {
                group[dateKey].shifts[shift] += value;
            }

            // FIX: Luôn cộng dồn vào dayTotal cho TẤT CẢ các ngày
            group[dateKey].dayTotal += value;
        }
    }

    // 3. 🔹 FORMAT DỮ LIỆU TRẢ VỀ CHO CẢ 2 LOẠI
    const finalResult = {};

    for (const code of ['KLD', 'TLT']) {
        const group = groupedByDate[code];

        const productionByDay = Object.keys(group)
            .sort()
            .map((date) => {
                const dayData = group[date];

                let shifts = [];
                if (dayData.shifts) {
                    // FIX: Duyệt qua keys 1, 2, 3 để đảm bảo thứ tự và đủ 3 ca
                    shifts = [1, 2, 3].map((shiftNum) => ({
                        shift: shiftNum,
                        production: dayData.shifts[shiftNum] || 0, // Đảm bảo production là 0 nếu không có dữ liệu
                    }));
                }

                return {
                    date,
                    shifts,
                    dayTotal: dayData.dayTotal,
                };
            });

        const cumulativeTotal = productionByDay.reduce((sum, d) => sum + d.dayTotal, 0);

        // Lấy dữ liệu ngày được chọn
        const selectedDay = productionByDay.find((d) => d.date === selectedKey);

        // Hoặc tạo lại nếu không tìm thấy (trường hợp ngày được chọn không có dữ liệu)
        const finalSelectedDay = selectedDay || {
            date: selectedKey,
            shifts: [{ shift: 1, production: 0 }, { shift: 2, production: 0 }, { shift: 3, production: 0 }],
            dayTotal: 0,
        };

        finalResult[`${code.toLowerCase()}Summary`] = {
            jobType: code,
            // FIX: Chỉ giữ lại các ngày trước hoặc khác ngày được chọn trong productionByDay
            productionByDay,
            cumulativeTotal,
            selectedDay: finalSelectedDay,
        };
    }

    // FIX: Tên trả về phải khớp với tên trong logic (tltSummary)
    // Nếu bạn muốn KLT, hãy đổi tất cả TLT thành KLT
    return finalResult;
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
        // Gom theo ngày + ca
        {
            $group: {
                _id: { date: '$dateStr', shift: '$shiftNum' },
                totalDrill: { $sum: '$drillValue' },
            },
        },
        // Gom lại theo ngày
        {
            $group: {
                _id: '$_id.date',
                shifts: {
                    $push: {
                        shift: '$_id.shift',
                        production: '$totalDrill',
                    },
                },
                dayTotal: { $sum: '$totalDrill' },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const productionByDay = result.map((r) => ({
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

            const { kldSummary, tltSummary } = await summariseVehicleProduction(allVehicleReports, selectedDate);
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

module.exports = router;
