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


router.post('/bulk-upsert', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN), async (req, res) => {
    try {
        const user = req.user;
        const { rows } = req.body;

        const ops = []; // chứa các thao tác bulkWrite

        // Duyệt từng vật liệu (material)
        for (const row of rows) {
            const materialId = row.id;

            // Lấy toàn bộ model hiện có của material để so sánh
            const existingModels = await Model.find({ material: materialId });
            const mapExisting = new Map(existingModels.map(m => [m.deviceModel.toString(), m]));

            // Duyệt từng field của dòng
            for (const [field, rawValue] of Object.entries(row)) {
                if (['id', 'material', 'acceptedProduct', 'density', 'dryDensity'].includes(field)) continue;

                const deviceModelId = field;
                const newValue = rawValue === '' || rawValue === null || rawValue === undefined ? null : Number(rawValue);

                const existing = mapExisting.get(deviceModelId);

                if (existing) {
                    // Nếu có rồi -> chỉ cập nhật nếu khác giá trị
                    if (existing.value !== newValue) {
                        ops.push({
                            updateOne: {
                                filter: { _id: existing._id },
                                update: {
                                    $set: { value: newValue },
                                    $push: {
                                        valueHistory: {
                                            value: existing.value ?? null,
                                            effectiveDate: new Date(),
                                        },
                                    },
                                },
                            },
                        });
                    }
                } else {
                    // Nếu chưa có -> tạo mới
                    ops.push({
                        insertOne: {
                            document: {
                                material: materialId,
                                deviceModel: deviceModelId,
                                value: newValue,
                                valueHistory: [],
                            },
                        },
                    });
                }
            }
        }

        // Nếu có thao tác -> thực hiện bulkWrite
        if (ops.length > 0) {
            await Model.bulkWrite(ops);
        }

        req.logger.info(`🔥 ${user?.username} thực hiện bulk upsert ${ops.length} thay đổi`);
        res.status(200).send({
            status: 'success',
            message: `Cập nhật mô hình thành công (${ops.length} thay đổi)`,
        });

    } catch (err) {
        req.logger.error("❌ Lỗi khi bulk upsert", err);
        res.status(500).send({
            status: 'error',
            message: err.message,
            stack: err.stack,
        });
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