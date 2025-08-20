const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Material = require('../models/material');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const Order = require('../models/Order');


router.post('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { name, density, mass } = req.body
        const existingMaterial = await Material.findOne({ name });
        if (existingMaterial) {
            req.logger.error("❌ Tên vật liệu đã tồn tại");
            return res.status(400).send({ status: 'error', message: 'Tên hàng hóa đã tồn tại' });
        }
        const newMaterial = new Material({
            name: name,
            density: density,
            mass: mass,

        });
        await newMaterial.save();
        req.logger.info(`🔥 Tạo thành công`);

        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        req.logger.error("❌ Lỗi khi tạo", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.delete('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            req.logger.error("❌ Vui lòng chọn bản ghi cần xóa");
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        const result = await Material.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            req.logger.error("❌ không tìm thấy bản ghi cần xóa");

            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }
        req.logger.info(`🔥 Đã xóa ${result.deletedCount} bản ghi`);

        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi xóa", err);

        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.put('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const material = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!material) {
            req.logger.error("❌ Sửa thất bại");

            return res.status(404).send({ status: 'error', message: 'Sửa thất bại ' });
        }
        req.logger.info(`🔥 Sửa thành công`);

        res.status(200).json({
            status: 'success',
            message: 'Sửa thành công'
        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
// Get device usage history
router.get('/', verifyToken, async (req, res) => {
    try {
        const query = {}

        if (req.query.name) {
            const regex = new RegExp(req.query.name, 'i');
            query.name = regex;
        }

        const materials = await Material.find(query);
        req.logger.info(`🔥 Load thành công`);
        res.status(200).send({ status: 'success', data: materials });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const material = await Material.findById(req.params.id)
        if (!material) {
            req.logger.error("❌ không tìm thấy bản ghi ");

            return res.status(200).send({ status: 'error', message: 'No material found with that ID' });
        }
        req.logger.info(`🔥 Load thành công`);

        res.status(200).json({
            status: 'success',
            data: material
        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
module.exports = router; 