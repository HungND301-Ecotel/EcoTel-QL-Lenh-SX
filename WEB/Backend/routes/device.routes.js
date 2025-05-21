const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Device = require('../models/Device');
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
        const query = {};

        // Filter by type
        if (req.query.type) {
            query.type = req.query.type;
        }

        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Filter by department
        if (req.query.department) {
            query.department = req.query.department;
        }

        const devices = await Device.find(query)
            .populate('department', 'name code')
            .populate('createdBy', 'username fullName')
            .populate('updatedBy', 'username fullName');

        res.status(200).json({
            status: 'success',
            results: devices.length,
            data: {
                devices
            }
        });
    } catch (err) {
        next(err);
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
        const { name, type, model, serialNumber, department, specifications } = req.body;

        // Check if device with same serial number exists
        const existingDevice = await Device.findOne({ serialNumber });
        if (existingDevice) {
            return next(new AppError('Device with this serial number already exists', 400));
        }

        const device = await Device.create({
            name,
            type,
            model,
            serialNumber,
            department,
            specifications,
            createdBy: req.user.id
        });

        res.status(201).json({
            status: 'success',
            data: {
                device
            }
        });
    } catch (err) {
        next(err);
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
            .populate('department', 'name code')
            .populate('createdBy', 'username fullName')
            .populate('updatedBy', 'username fullName');

        if (!device) {
            return next(new AppError('No device found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                device
            }
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
            data: {
                device
            }
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
router.delete('/:id', verifyToken, restrictTo('admin'), async (req, res, next) => {
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

// Get device usage history
router.get('/:id/history', verifyToken, async (req, res) => {
    try {
        const device = await Device.findById(req.params.id);
        if (!device) {
            return res.status(404).json({status:'error', message: 'Device not found' });
        }

        const history = await Order.find({ device: device._id })
            .populate('shift', 'name date startTime endTime')
            .populate('employee', 'username fullName')
            .populate('createdBy', 'username fullName')
            .sort({ startTime: -1 });

        res.json(history);
    } catch (err) {
        console.error('Get device history error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router; 