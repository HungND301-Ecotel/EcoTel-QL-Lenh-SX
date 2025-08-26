const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const ReportHistory = require('../models/ReportHistory');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const { orderId, device, excavator, fromLocation, toLocation, material, quantity, drillDepth, hardnessF, workingMinutes, distanceKm } = req.body;
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
            distanceKm
        });
        await newReport.save();
        req.logger.info(`✅ Tạo báo cáo thành công cho Order ID: ${orderId}`);
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
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
        const reports = await Report.findByIdAndDelete(req.params.id);
        if (!reports) {
            req.logger.warn(`⚠️ Xóa thất bại - Không tìm thấy báo cáo với ID: ${req.params.id}`);
            res.status(404).send({ status: 'error', message: 'Không tìm thấy dữ liệu' });
        } else {
            req.logger.info(`✅ Xóa báo cáo thành công với ID: ${req.params.id}`);
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

        req.logger.info(`✅ Cập nhật báo cáo thành công cho ID: ${req.params.id}`);
        res.status(200).send({ status: 'success', message: "Sửa thành công", data: report });

    } catch (err) {
        req.logger.error("❌ Lỗi khi cập nhật báo cáo", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

module.exports = router;