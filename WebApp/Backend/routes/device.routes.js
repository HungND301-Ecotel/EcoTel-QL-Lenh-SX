const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Device = require('../models/Device');
const DeviceType = require('../models/DeviceType');

const { verifyToken, restrictTo } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Get all devices
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 */
router.get('/', verifyToken, async (req, res, next) => {
    try {
        const user = req.user
        const query = {}

        if (req.query.q) {
            const regex = new RegExp(req.query.q, 'i');
            query.$or = [
                { code: regex },
                { name: regex },
                { vehicleNumber: regex },
                { material: regex },
                { vehicleNumber: regex },
                { vehicleNumber: regex }
            ];
        }
        if (req.query.department) {
            query.department = req.query.department;
        }
        if (user.role === "manager") {
            query.department = user.department._id;
        }
        const devices = await Device.find(query)
            .populate('department', 'name code')
            .populate('category')

        res.status(200).json({
            status: 'success',
            results: devices.length,
            data:
                devices
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});


router.get('/excavators/all', verifyToken, async (req, res, next) => {
    try {
        const allTypes = await DeviceType.find();
        const targetTypes = allTypes
            .filter(type => type.name.toLowerCase().includes("máy xúc"))
            .map(type => type._id);

        const query = {}


        if (targetTypes) {
            query.category = { $in: targetTypes };
        }

        const devices = await Device.find(query).populate('category').populate('department', 'name code')


        res.status(200).json({
            status: 'success',
            results: devices.length,
            data:
                devices
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});


/**
 * @swagger
 * /api/devices:
 *   post:
 *     summary: Create new device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - model
 *               - serialNumber
 *               - department
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [truck, excavator, bulldozer, crane, other]
 *               model:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               department:
 *                 type: string
 *               specifications:
 *                 type: object
 */
router.post('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { name, code, vehicleNumber, category, material, fuelType, capacity, power, coordinates, department, status } = req.body;
        const existingDevice = await Device.findOne({ code });
        if (existingDevice) {
            return res.status(400).send({ status: 'error', message: 'Mã thiết bị đã tồn tại' });
        }
        const device = await Device.create({
            name,
            code,
            department,
            vehicleNumber,
            category,
            material,
            fuelType,
            capacity, power,
            status,
            coordinates: {
                type: 'Point',
                coordinates: [coordinates.lng, coordinates.lat],
            },
            createdBy: req.user._id
        });

        res.status(201).json({
            status: 'success',
            data:
                device

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

/**
 * @swagger
 * /api/devices/{id}:
 *   get:
 *     summary: Get device by ID
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const device = await Device.findById(req.params.id)
            .populate('category')
            .populate('department', 'name code')
            .populate('createdBy', 'username fullName')
            .populate('updatedBy', 'username fullName');

        if (!device) {
            return res.status(200).send({ status: 'error', message: 'No device found with that ID' });
        }

        res.status(200).json({
            status: 'success',
            data:
                device

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

/**
 * @swagger
 * /api/devices/{id}:
 *   patch:
 *     summary: Update device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [truck, excavator, bulldozer, crane, other]
 *               model:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               department:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [available, in_use, maintenance, retired]
 *               specifications:
 *                 type: object
 *               lastMaintenance:
 *                 type: string
 *                 format: date-time
 *               nextMaintenance:
 *                 type: string
 *                 format: date-time
 */
router.put('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const device = await Device.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                coordinates: {
                    type: 'Point',
                    coordinates: [req.body.coordinates.lng, req.body.coordinates.lat],
                },
                updatedBy: req.user._id
            },
            {
                new: true,
                runValidators: true
            }
        )

        if (!device) {
            return res.status(404).json({ status: 'error', message: 'No device found with that ID' });
        }

        res.status(200).json({
            status: 'success',
            data:
                device

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

/**
 * @swagger
 * /api/devices/{id}:
 *   delete:
 *     summary: Delete device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const device = await Device.findByIdAndDelete(req.params.id);

        if (!device) {
            return res.status(404).json({ status: 'error', message: 'No device found with that ID' });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});


module.exports = router; 