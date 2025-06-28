const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const SafetyMeasure = require('../models/SafetyMeasures');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');


router.post('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { content } = req.body
        const newSafetyMeasure = new SafetyMeasure({
            content: content,
        });
        await newSafetyMeasure.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.delete('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const safetyMeasure = await SafetyMeasure.findByIdAndDelete(req.params.id);

        if (!safetyMeasure) {
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
        const safetyMeasure = await SafetyMeasure.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!safetyMeasure) {
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
        const SafetyMeasures = await SafetyMeasure.find();
        res.status(200).send({ status: 'success', data: SafetyMeasures });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

module.exports = router; 