const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const DeviceType = require('../models/DeviceType');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');


router.post('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { name } = req.body
        const existingDeviceType = await DeviceType.findOne({ name });
        if (existingDeviceType) {
            return res.status(400).send({ status: 'error', message: 'Tên loại phương tiện đã tồn tại' });
        }
        const newDeviceType = new DeviceType({
            name: name,
        });
        await newDeviceType.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.delete('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const DeviceType = await DeviceType.findByIdAndDelete(req.params.id);

        if (!DeviceType) {
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
        const DeviceType = await DeviceType.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!DeviceType) {
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
router.get('/', verifyToken, async (req, res) => {
    try {
        const DeviceTypes = await DeviceType.find();
        res.status(200).send({ status: 'success', data: DeviceTypes });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const DeviceTypes = await DeviceType.findById(req.params.id);
        res.status(200).send({ status: 'success', data: DeviceTypes });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

module.exports = router; 