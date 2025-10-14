const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Report = require('../models/Report');
const mongoose = require('mongoose');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const { ROLE, JOB_TYPE } = require('../config/config');
const { groupTripsVehicle } = require('../utils/reportGrouping'); // ⚠️ đường dẫn đúng tới function của bạn nhé

// ------------------
// HÀM GOM CHO XE (KLD & SLD)
// ------------------
async function summariseVehicleProductionByType(reports, workingDate, code) {
    const trips = await groupTripsVehicle(reports, workingDate);
    const groupedByDate = {};


    for (const trip of trips) {
        const dateKey = new Date(workingDate).toISOString().slice(0, 10);
        const shift = trip.shift || 1;

        if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = { shifts: {}, dayTotal: 0 };
        }

        if (!groupedByDate[dateKey].shifts[shift]) {
            groupedByDate[dateKey].shifts[shift] = { total: 0 };
        }

        // 🔹 Xác định loại giá trị cần lấy
        let value = 0;
        if (code === 'KLD') value = trip.production || 0;
        if (code === 'SLD') value = trip.totalCubicMeter || 0;
        if (code === 'KLT') value = trip.totalTon || 0;

        // Cộng dồn
        groupedByDate[dateKey].shifts[shift].total += value;
        groupedByDate[dateKey].dayTotal += value;
    }

    // 🔹 Format trả về chuẩn frontend
    const productionByDay = Object.keys(groupedByDate).map((date) => {
        const dayData = groupedByDate[date];
        const shifts = Object.keys(dayData.shifts).map((shift) => ({
            shift: Number(shift),
            production: dayData.shifts[shift].total,
        }));

        return {
            date,
            shifts,
            dayTotal: dayData.dayTotal,
        };
    });

    const cumulativeTotal = productionByDay.reduce((sum, d) => sum + d.dayTotal, 0);

    return {
        jobType: code, // KLD hoặc SLD
        productionByDay,
        cumulativeTotal,
    };
}

// ------------------
// HÀM GOM CHO KHOAN (MKS)
// ------------------
async function summariseDrillingOrders(orders) {
    const resultMap = {};

    for (const order of orders) {
        const dateKey = new Date(order.workingDate).toISOString().slice(0, 10);
        const shiftNum = order.shift?.name ? Number(order.shift.name) : 0;

        const reports = await Report.find({ orderId: order._id });
        for (const r of reports) {
            const value = r.drillDepth || 0;

            if (!resultMap[dateKey]) {
                resultMap[dateKey] = { shifts: {}, dayTotal: 0 };
            }

            resultMap[dateKey].shifts[shiftNum] =
                (resultMap[dateKey].shifts[shiftNum] || 0) + value;
            resultMap[dateKey].dayTotal += value;
        }
    }

    // Chuyển sang dạng mảng
    const productionByDay = Object.keys(resultMap)
        .sort()
        .map((date) => {
            const dayData = resultMap[date];
            const shifts = Object.keys(dayData.shifts).map((s) => ({
                shift: Number(s),
                production: dayData.shifts[s],
            }));
            return {
                date,
                shifts,
                dayTotal: dayData.dayTotal,
            };
        });

    const cumulativeTotal = productionByDay.reduce((sum, d) => sum + d.dayTotal, 0);

    return {
        jobType: 'MKS',
        productionByDay,
        cumulativeTotal,
    };
}

// ------------------
// ROUTE /analysics
// ------------------
router.get(
    '/',
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

            // ------------------
            // 1️⃣ Lấy các order khoan
            // ------------------
            const orders = await Order.find(query)
                .populate('shift', 'name')
                .populate('job', 'type');
            const drillingOrders = orders.filter(o => o.job?.type === JOB_TYPE.VAN_HANH_KHOAN);

            const drillingSummary = await summariseDrillingOrders(drillingOrders);

            const vehicleOrders = orders.filter(o => o.job?.type === JOB_TYPE.VAN_HANH_XE);

            let allVehicleReports = [];
            for (const order of vehicleOrders) {
                const reports = await Report.find({ orderId: order._id })
                    .populate({
                        path: "device",
                        select: 'code material',
                        populate: { path: 'material', selcct: 'name value' }
                    })
                    .populate("material", "name")
                    .populate("excavator", "code")
                    .populate("fromLocation", "name")
                    .populate("toLocation", "name")
                // Gắn thông tin shift để tổng hợp
                allVehicleReports.push(...reports);
            }

            const sldSummary = await summariseVehicleProductionByType(allVehicleReports, selectedDate, 'SLD');
            const kldSummary = await summariseVehicleProductionByType(allVehicleReports, selectedDate, 'KLD');
            const kltSummary = await summariseVehicleProductionByType(allVehicleReports, selectedDate, 'KLT');


            // ------------------
            // 3️⃣ Tổng hợp tất cả
            // ------------------
            const response = [drillingSummary, sldSummary, kldSummary, kltSummary];

            res.status(200).json({
                status: 'success',
                message: 'Tính sản lượng tổng hợp thành công',
                data: response,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ status: 'error', message: err.message });
        }
    }
);

module.exports = router;
