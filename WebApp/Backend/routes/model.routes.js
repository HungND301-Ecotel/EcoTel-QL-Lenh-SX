const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const Model = require('../models/Model');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const ExcelJS = require('exceljs');
const xlsx = require('xlsx');
const { ROLE } = require('../config/config');


router.post('/bulk-upsert', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN), async (req, res, next) => {
    try {
        const user = req.user
        const { rows } = req.body;

        for (const row of rows) {
            const materialId = row.id;
            for (const [field, value] of Object.entries(row)) {
                if (field === 'id' || field === 'material' || field === 'acceptedProduct' || field === 'density' || field === 'dryDensity') continue;

                const deviceModelId = field;

                // Tìm record
                const existing = await Model.findOne({ material: materialId, deviceModel: deviceModelId });

                if (value === '' || value === null) {
                    // Nếu đã có mà value rỗng → xóa
                    if (existing) {
                        await Model.deleteOne({ _id: existing._id });
                    }
                } else {
                    if (existing) {
                        // update
                        await Model.updateOne(
                            { _id: existing._id },
                            { $set: { value: Number(value) } }
                        );
                    } else {
                        // create
                        await Model.create({
                            material: materialId,
                            deviceModel: deviceModelId,
                            value: Number(value),
                        });
                    }
                }
            }
        }
        req.logger.info(`🔥${user?.username} Tạo mô hình thành công`);

        res.status(200).send({ status: 'success', message: "Tạo mô hình thành công" });
    } catch (err) {
        req.logger.error("❌ Lỗi khi tạo", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.delete('/', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN), async (req, res, next) => {
    try {
        const user = req.user
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            req.logger.error("❌ Vui lòng chọn bản ghi cần xóa");
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        const result = await Model.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            req.logger.error("❌ không tìm thấy bản ghi cần xóa");

            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }
        req.logger.info(`🔥 ${user?.username}  Đã xóa ${result.deletedCount} bản ghi`);

        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi xóa", err);

        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.put('/:material/:deviceModel', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN), async (req, res, next) => {
    try {
        const user = req.user
        const model = await Model.One({ material: req.body.material, deviceModel: req.body.deviceModel, });
        if (!model) {
            req.logger.error("❌ Sửa thất bại");

            return res.status(404).send({ status: 'error', message: 'Sửa thất bại ' });
        }
        model.value = req.body.value
        await model.save()
        req.logger.info(`🔥 ${user?.username} Sửa mô hình thành công`);

        res.status(200).json({
            status: 'success',
            message: 'Sửa thành công'
        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.get('/', verifyToken, async (req, res) => {
    try {
        const models = await Model.find()
        req.logger.info(`🔥 Load thành công`);
        res.status(200).send({ status: 'success', data: models });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

module.exports = router; 