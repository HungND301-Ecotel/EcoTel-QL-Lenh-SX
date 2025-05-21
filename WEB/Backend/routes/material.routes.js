const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Material = require('../models/material');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');


router.post('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { name, type } = req.body
        const newMaterial = new Material({
            name: name,
            type: type
        });
        await newMaterial.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.delete('/:id', verifyToken, restrictTo('admin'), async (req, res, next) => {
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
router.put('/:id', verifyToken, restrictTo('admin'), async (req, res, next) => {
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
        const materials = await Material.find();
        res.status(200).send({ status: 'success', data: materials });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

module.exports = router; 