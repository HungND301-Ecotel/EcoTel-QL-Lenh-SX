const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const ShiftReport = require('../models/ShiftReport');
const Device = require('../models/Device');
const ReportHistory = require('../models/ReportHistory');


const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const { STATUS_DEVICE, STATUS_REPAIR } = require('../config/config');


router.post('/', verifyToken, async (req, res, next) => {
    try {
        const { orderId, assignedTo, vehicleSummaries, vehicleRepair, handoverHours, handoverNotes, risks } = req.body;
        if (!handoverNotes) {
            req.logger.error(`❌ Tình trạng công việc là bắt buộc: ${orderId}`);
            return res.status(400).send({ status: 'error', message: "Tình trạng công việc là bắt buộc" });
        }
        if (vehicleSummaries) {
            for (var item of vehicleSummaries) {
                const device = await Device.findById(item.vehicle);
                device.note = item.note || "";
                await device.save();
            }
        }
        if (vehicleRepair) {
            for (var item of vehicleRepair) {
                const device = await Device.findById(item.device);
                if (item.status === STATUS_REPAIR.COMPLETED) {
                    device.status = STATUS_DEVICE.AVAILABLE
                }
                device.note = item.noteRepair || "";
                await device.save();
            }
        }
        const newShiftReport = new ShiftReport({
            orderId, assignedTo, vehicleSummaries, vehicleRepair, handoverHours, handoverNotes, risks
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
const trackedFieldsWork = [
    'handoverHours',
    'handoverNotes',
    'risks'
];

router.put('/:id', verifyToken, async (req, res) => {
    try {
        const user = req.user
        const shiftReport = await ShiftReport.findById(req.params.id);
        if (!shiftReport) {
            req.logger.warn(`⚠️ Không tìm thấy báo cáo ca với ID: ${req.params.id}`);
            return res.status(404).send({ status: 'error', message: "Not found" });
        }
        if (!req.body.handoverNotes) {
            req.logger.error(`❌ Tình trạng công việc là bắt buộc`);
            return res.status(400).send({ status: 'error', message: "Tình trạng công việc là bắt buộc" });
        }

        const updates = req.body;
        const changes = [];

        // 🔹 So sánh các field ngoài mảng
        for (let field of trackedFieldsWork) {
            if (updates[field] !== undefined && updates[field] !== shiftReport[field]) {
                changes.push({ field, oldValue: shiftReport[field], newValue: updates[field] });
            }
        }

        // 🔹 So sánh trong mảng vehicleSummaries
        if (Array.isArray(updates.vehicleSummaries)) {
            updates.vehicleSummaries.forEach((updatedItem, index) => {
                const originalItem = shiftReport.vehicleSummaries[index];
                if (!originalItem) return;

                for (let field of [
                    'repairHours', 'fuelRemain',
                    'fuelReceived', 'fuelRemainEnd', 'status', 'note',
                    'gpsStatus', 'sealStatus'
                ]) {
                    if (updatedItem[field] !== undefined && updatedItem[field] !== originalItem[field]) {
                        changes.push({
                            field,
                            index,
                            oldValue: originalItem[field],
                            newValue: updatedItem[field]
                        });
                    }
                }
            });
        }
        // 🔹 So sánh trong mảng vehicleSummaries
        if (Array.isArray(updates.vehicleRepair)) {
            updates.vehicleRepair.forEach((updatedItem, index) => {
                const originalItem = shiftReport.vehicleRepair[index];
                if (!originalItem) return;

                for (let field of [
                    'status', 'noteRepair',
                ]) {
                    if (updatedItem[field] !== undefined && updatedItem[field] !== originalItem[field]) {
                        changes.push({
                            field,
                            index,
                            oldValue: originalItem[field],
                            newValue: updatedItem[field]
                        });
                    }
                }
            });
        }

        // 🔹 Nếu có thay đổi → lưu lịch sử
        if (changes.length > 0) {
            await ReportHistory.create({
                reportId: shiftReport._id,
                sourceType: 'ShiftReport',
                changes,
                changedBy: req.user._id
            });
        }

        // 🔹 Cập nhật status thiết bị theo dữ liệu mới
        if (updates.vehicleSummaries) {
            for (const item of updates.vehicleSummaries) {
                const device = await Device.findById(item.vehicle);
                if (device) {
                    device.status = item.status === "good" ? STATUS_DEVICE.AVAILABLE : STATUS_DEVICE.MAINTENANCE;
                    device.note = item.note || '';
                    await device.save();
                }
            }
        }
        if (updates.vehicleRepair) {
            for (const item of updates.vehicleRepair) {
                const device = await Device.findById(item.device);
                if (device) {
                    device.status = item.status === STATUS_REPAIR.COMPLETED ? STATUS_DEVICE.AVAILABLE : STATUS_DEVICE.MAINTENANCE;
                    device.note = item.noteRepair || '';
                    await device.save();
                }
            }
        }

        // 🔹 Update dữ liệu mới
        Object.assign(shiftReport, updates);
        await shiftReport.save();

        req.logger.info(`✅ ${user?.username} Cập nhật báo cáo ca thành công cho ID: ${req.params.id}`);
        res.status(200).send({ status: 'success', message: "Sửa thành công", data: shiftReport });

    } catch (err) {
        req.logger.error("❌ Lỗi khi cập nhật báo cáo ca", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});


module.exports = router;