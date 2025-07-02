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
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.delete('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const location = await Location.findByIdAndDelete(req.params.id);

        if (!location) {
            return res.status(404).send({ status: 'error', message: 'Xóa thất bại ' });
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
        const location = await Location.findByIdAndUpdate(req.params.id, {
            ...req.body, coordinates: {
                type: 'Point',
                coordinates: [req.body.coordinates.lng, req.body.coordinates.lat],
            },
        }, { new: true });

        if (!location) {
            return res.status(200).send({ status: 'error', message: 'Sửa thất bại ' });
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
        const query = {}

        if (req.query.name) {
            const regex = new RegExp(req.query.name, 'i');
            query.name = regex;
        }
        if (req.user?.role === "employee") {
            const order = await Order.findOne({ assignedTo: req.userId, status: { $ne: "completed" } })

            query._id = order?.location;
        }
        const locations = await Location.find(query);
        res.status(200).send({ status: 'success', data: locations });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

module.exports = router; 