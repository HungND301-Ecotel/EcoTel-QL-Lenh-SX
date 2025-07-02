const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Material = require('../models/material');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const Order = require('../models/Order');


router.post('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { name, density, masss } = req.body
        const existingMaterial = await Material.findOne({ name });
        if (existingMaterial) {
            return res.status(400).send({ status: 'error', message: 'Tên hàng hóa đã tồn tại' });
        }
        const newMaterial = new Material({
            name: name,
            density: density,
            mass: mass,

        });
        await newMaterial.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.delete('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const material = await Material.findByIdAndDelete(req.params.id);

        if (!material) {
            return res.status(200).send({ status: 'error', message: 'Xóa thất bại ' });
        }

        res.status(204).json({
            status: 'success',
            message: 'Xóa thành công'
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.put('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const material = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!material) {
            return res.status(404).send({ status: 'error', message: 'Sửa thất bại ' });
        }

        res.status(204).json({
            status: 'success',
            message: 'Sửa thành công'
        });
    } catch (err) {
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
        res.status(200).send({ status: 'success', data: materials });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

module.exports = router; 