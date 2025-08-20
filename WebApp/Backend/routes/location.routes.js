const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Location = require('../models/Location');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const Order = require('../models/Order');


router.post('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { name, coordinates, distance } = req.body
        const newLocation = new Location({
            name: name,
            distance: distance,
            coordinates: {
                type: 'Point',
                coordinates: [coordinates.lng, coordinates.lat],
            },
        });
        await newLocation.save();
        req.logger.info(`🔥  Tạo thành công`);
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
            req.logger.error("❌Vui lòng chọn bản ghi cần xóa");
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        const result = await Location.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            req.logger.error("❌ không tìm thấy bản ghi cần xóa");
            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }
        req.logger.info(`🔥  Đã xóa ${result.deletedCount} bản ghi`);
        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.put('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const location = await Location.findByIdAndUpdate(req.params.id, {
            ...req.body, coordinates: {
                type: 'Point',
                coordinates: [req.body.coordinates.lng, req.body.coordinates.lat],
            },
        }, { new: true });

        if (!location) {
            req.logger.error("❌ Sửa thất bại");
            return res.status(200).send({ status: 'error', message: 'Sửa thất bại ' });
        }
        req.logger.info(`🔥  Sửa thành công`);
        res.status(200).json({
            status: 'success',
            message: 'Sửa thành công'
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi sửa", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.get('/', verifyToken, async (req, res) => {
    try {
        const query = {}

        if (req.query.name) {
            const regex = new RegExp(req.query.name, 'i');
            query.name = regex;
        }
        const locations = await Location.find(query)
            .collation({ locale: "vi", strength: 1 })
            .sort({ name: 1 });
        req.logger.info(`🔥 Load thành công`);
        res.status(200).send({ status: 'success', data: locations });
    } catch (err) {
        req.logger.error("❌ Lỗi khi load", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const location = await Location.findById(req.params.id)
        if (!location) {
            req.logger.error("❌ Không tìm thấy vị trí");
            return res.status(200).send({ status: 'error', message: 'No location found with that ID' });
        }
        req.logger.info(`🔥 Load thành công`);

        res.status(200).json({
            status: 'success',
            data: location
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi load", err);

        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
module.exports = router; 