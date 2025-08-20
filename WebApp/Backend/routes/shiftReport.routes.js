const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const ShiftReport = require('../models/ShiftReport');
const Device = require('../models/Device');

const { verifyToken, restrictTo } = require('../middleware/auth.middleware');


router.post('/', verifyToken, async (req, res, next) => {
    try {
        const { orderId, assignedTo, vehicleSummaries, handoverHours, otherHours, handoverNotes, risks } = req.body;

        if (vehicleSummaries) {
            for (var item of vehicleSummaries) {
                const device = await Device.findById(item.vehicle);
                device.status = item.status === "good" ? "available" : "maintenance";
                await device.save();
            }
        }
        const newShiftReport = new ShiftReport({
            orderId, assignedTo, vehicleSummaries, handoverHours, otherHours, handoverNotes, risks
        });
        await newShiftReport.save();
        req.logger.info(`✅ Tạo báo cáo ca thành công với Order ID: ${orderId}`);
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        req.logger.error("❌ Lỗi khi tạo báo cáo ca", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const shiftReport = await ShiftReport.findOne({ orderId: req.params.id });
        if (shiftReport) {
            req.logger.info(`✅ Tìm thấy báo cáo ca với Order ID: ${req.params.id}`);
        } else {
            req.logger.warn(`⚠️ Không tìm thấy báo cáo ca với Order ID: ${req.params.id}`);
        }
        res.status(200).send({ status: 'success', data: shiftReport });
    } catch (err) {
        req.logger.error("❌ Lỗi khi lấy báo cáo ca", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

router.put('/:id', verifyToken, async (req, res) => {
    try {
        const update = await ShiftReport.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!update) {
            req.logger.warn(`⚠️ Cập nhật thất bại - Không tìm thấy báo cáo ca với ID: ${req.params.id}`);
            return res.status(500).send({ status: 'error', message: "Not found", stack: err.stack });
        }
        if (req.body.vehicleSummaries) {
            req.logger.info("ℹ️ Cập nhật trạng thái các thiết bị trong báo cáo ca đã chỉnh sửa.");
            for (var item of req.body.vehicleSummaries) {
                const device = await Device.findById(item.vehicle);
                device.status = item.status === "good" ? "available" : "maintenance";
                await device.save();
            }
        }

        req.logger.info(`✅ Cập nhật báo cáo ca thành công cho ID: ${req.params.id}`);
        res.status(200).send({ status: 'success', message: "Sửa thành công" });
    } catch (err) {
        req.logger.error("❌ Lỗi khi cập nhật báo cáo ca", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

module.exports = router;