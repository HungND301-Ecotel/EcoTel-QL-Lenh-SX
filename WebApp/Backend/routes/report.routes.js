const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Order = require('../models/Order');
const ReportHistory = require('../models/ReportHistory');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const { production_van_hanh_xe, production_van_hanh_xuc } = require('../utils/cron');
const { JOB_TYPE } = require('../config/config');


router.post('/', verifyToken, async (req, res, next) => {
    try {
        const { orderId, device, excavator, fromLocation, toLocation, material, quantity, drillDepth, hardnessF, workingMinutes, distanceKm, quantityUpdateTimes } = req.body;
        const newReport = new Report({
            orderId,
            device,
            excavator,
            fromLocation,
            toLocation,
            material,
            quantity,
            drillDepth,
            hardnessF,
            workingMinutes,
            distanceKm,
            quantityUpdateTimes
        });

        await newReport.populate([
            {
                path: "device",
                select: "code material",
            },
            { path: "excavator", select: "code" },
            { path: "fromLocation", select: "name" },
            { path: "toLocation", select: "name" },
            { path: "material", select: "name" }
        ]);
        const result = await caculate(newReport)
        newReport.totalProduction = result.totalProduction;
        newReport.totalCubicMeter = result.totalCubicMeter;
        newReport.totalTon = result.totalTon;
        const report = await newReport.save();

        req.logger.info(`✅ Tạo báo cáo thành công cho Order ID: ${orderId}`);
        res.status(200).send({ status: 'success', message: "Tạo thành công", data: report });
    } catch (err) {
        req.logger.error("❌ Lỗi khi tạo báo cáo", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

router.get('/getByOrder/:orderId', verifyToken, async (req, res, next) => {
    try {
        const reports = await Report.find({ orderId: req.params.orderId })
            .sort({ createdAt: -1 })
            .populate("device", "code")
            .populate("excavator", "code")
            .populate("fromLocation", "name")
            .populate("toLocation", "name")
            .populate("material", "name");
        req.logger.info(`✅ Lấy thành công ${reports.length} báo cáo cho Order ID: ${req.params.orderId}`);
        res.status(200).send({ status: 'success', data: reports });
    } catch (err) {
        req.logger.error("❌ Lỗi khi lấy báo cáo", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        const user = req.user;
        const reports = await Report.findByIdAndDelete(req.params.id);
        if (!reports) {
            req.logger.warn(`⚠️ Xóa thất bại - Không tìm thấy báo cáo với ID: ${req.params.id}`);
            res.status(404).send({ status: 'error', message: 'Không tìm thấy dữ liệu' });
        } else {
            req.logger.info(`✅ ${user?.username}  Xóa báo cáo thành công với ID: ${req.params.id}`);
            res.status(200).send({ status: 'success', message: 'Xóa thành công', data: reports });
        }
    } catch (err) {
        req.logger.error("❌ Lỗi khi xóa báo cáo", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

const trackedFieldsTrip = [
    'quantity',
    'drillDepth',
    'hardnessF',
    'workingMinutes',
    'distanceKm'
];
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const report = await Report.findById(req.params.id);
        if (!report) {
            req.logger.warn(`⚠️ Không tìm thấy báo cáo với ID: ${req.params.id}`);
            return res.status(404).send({ status: 'error', message: "Not found" });
        }

        const updates = req.body;
        const changes = [];

        // So sánh các field cần track
        for (let field of trackedFieldsTrip) {
            if (updates[field] !== undefined && updates[field] !== report[field]) {
                changes.push({
                    field,
                    oldValue: report[field],
                    newValue: updates[field]
                });
            }
        }

        // Nếu có thay đổi → tạo bản ghi lịch sử
        if (changes.length > 0) {
            await ReportHistory.create({
                reportId: report._id,
                sourceType: 'Report',  // báo chuyến
                changes,
                changedBy: req.user._id
            });
        }

        // Ghi đè giá trị mới vào report
        Object.assign(report, updates);
        await report.save();

        req.logger.info(`✅ ${user?.username} Cập nhật báo cáo thành công cho ID: ${req.params.id}`);
        res.status(200).send({ status: 'success', message: "Sửa thành công", data: report });

    } catch (err) {
        req.logger.error("❌ Lỗi khi cập nhật báo cáo", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

router.put('/update/:id', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const report = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!report) {
            req.logger.warn(`⚠️ Không tìm thấy báo cáo với ID: ${req.params.id}`);
            return res.status(404).send({ status: 'error', message: "Not found" });
        }
        await report.populate([
            { path: 'device', select: 'code material' },
            { path: 'excavator', select: 'code' },
            { path: 'fromLocation', select: 'name' },
            { path: 'toLocation', select: 'name' },
            { path: 'material', select: 'name' }
        ]);

        // 4️⃣ Tính toán lại sau cập nhật
        const { totalProduction, totalCubicMeter, totalTon } = await caculate(report);
        report.totalProduction = totalProduction;
        report.totalCubicMeter = totalCubicMeter;
        report.totalTon = totalTon;

        // 5️⃣ Lưu lại kết quả sau tính toán
        await report.save();
        req.logger.info(`✅ ${user?.username} Đồng bộ dữ liệu báo chuyến thành công`);
        res.status(200).send({ status: 'success', message: "Sửa thành công", data: report });

    } catch (err) {
        req.logger.error("❌ Lỗi khi cập nhật báo cáo", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

router.put('/:id/add-trip-time', verifyToken, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate({
                path: "device",
                select: "code material",
            })
            .populate("material", "name")
            .populate("excavator", "code")
            .populate("fromLocation", "name")
            .populate("toLocation", "name");
        if (!report) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy báo chuyến' });
        }

        // Server tự thêm
        report.quantity = (report.quantity ?? 0) + 1;
        report.quantityUpdateTimes = [
            ...(report.quantityUpdateTimes ?? []),
            new Date()  // giờ server
        ];
        const value = await caculate(report)
        report.totalProduction = value.totalProduction
        report.totalCubicMeter = value.totalCubicMeter
        report.totalTon = value.totalTon

        await report.save();

        res.json({ status: 'success', data: report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});
router.put('/:id/remove-trip-time/:timeIndex', verifyToken, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate({
                path: "device",
                select: "code material",
            })
            .populate("material", "name")
            .populate("excavator", "code")
            .populate("fromLocation", "name")
            .populate("toLocation", "name");
        if (!report) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy báo chuyến' });
        }

        const timeIndex = parseInt(req.params.timeIndex, 10);
        if (isNaN(timeIndex) || timeIndex < 0 || timeIndex >= (report.quantityUpdateTimes?.length ?? 0)) {
            return res.status(400).json({ status: 'error', message: 'Index không hợp lệ' });
        }

        // Server tự xoá
        report.quantity = Math.max(0, (report.quantity ?? 0) - 1);
        report.quantityUpdateTimes.splice(timeIndex, 1);

        const value = await caculate(report)
        report.totalProduction = value.totalProduction
        report.totalCubicMeter = value.totalCubicMeter
        report.totalTon = value.totalTon

        await report.save();

        res.json({ status: 'success', data: report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

async function caculate(report) {
    let totalProduction = 0
    let totalCubicMeter = 0
    let totalTon = 0

    let order = report.orderId;
    if (!order || !order.workingDate) {
        order = await Order.findById(report.orderId)
            .populate('job', 'type')
            .populate('shift', 'name')
            .lean();
    }
    report = {
        ...report.toObject(),
        shift: order?.shift,
        workingDate: order?.workingDate,
    }
    const jobType = order.job?.type;
    if (jobType === JOB_TYPE.VAN_HANH_XE) {
        totalProduction = await production_van_hanh_xe(report);
    } else if (jobType === JOB_TYPE.VAN_HANH_XUC) {
        const value = await production_van_hanh_xuc(report);
        totalCubicMeter = value.cubicMeter;
        totalTon = value.ton;
    } else if (jobType === JOB_TYPE.VAN_HANH_KHOAN) {
        totalProduction = report.drillDepth || 0;
    }
    return {
        totalProduction,
        totalCubicMeter,
        totalTon
    }

}

module.exports = router;