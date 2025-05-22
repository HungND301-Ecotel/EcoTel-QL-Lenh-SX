const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Order = require('../models/Order');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const { sendShiftNotification } = require('../utils/email');

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shift
 *         schema:
 *           type: string
 *       - in: query
 *         name: employee
 *         schema:
 *           type: string
 *       - in: query
 *         name: device
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 */
router.get('/', verifyToken, async (req, res, next) => {
    try {
        const query = {};

        // Filter by shift
        if (req.query.shift) {
            query.shift = req.query.shift;
        }

        // Filter by employee
        if (req.query.employee) {
            query.employee = req.query.employee;
        }

        // Filter by device
        if (req.query.device) {
            query.device = req.query.device;
        }

        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }

        const orders = await Order.find(query)
            .populate('shift', 'name date startTime endTime')
            .populate('employee', 'username fullName')
            .populate('device', 'name type model')
            .populate('createdBy', 'username fullName')
            .populate('updatedBy', 'username fullName')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: orders.length,
            data:
                orders

        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shift
 *               - employee
 *               - device
 *               - location
 *               - workContent
 *             properties:
 *               shift:
 *                 type: string
 *               employee:
 *                 type: string
 *               device:
 *                 type: string
 *               location:
 *                 type: string
 *               workContent:
 *                 type: string
 *               safetyMeasures:
 *                 type: string
 */
router.post('/', verifyToken, restrictTo('admin', 'manager', 'supervisor'), async (req, res, next) => {
    try {
        const {
            shift,
            employee,
            device,
            location,
            workContent,
            safetyMeasures
        } = req.body;

        // Generate order number
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const orderNumber = `ORD${year}${month}${day}${random}`;

        const order = await Order.create({
            orderNumber,
            shift,
            employee,
            device,
            location,
            workContent,
            safetyMeasures,
            status: 'pending',
            createdBy: req.user.id
        });

        // Send notification to employee
        try {
            await sendShiftNotification(order);
        } catch (emailErr) {
            console.error('Failed to send notification:', emailErr);
        }

        res.status(201).json({
            status: 'success',
            data:
                order

        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
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
        const order = await Order.findById(req.params.id)
            .populate('shift', 'name date startTime endTime')
            .populate('employee', 'username fullName')
            .populate('device', 'name type model')
            .populate('createdBy', 'username fullName')
            .populate('updatedBy', 'username fullName');

        if (!order) {
            return next(new AppError('No order found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data:
                order

        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   patch:
 *     summary: Update order
 *     tags: [Orders]
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
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled]
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               workResult:
 *                 type: string
 *               fuelConsumption:
 *                 type: number
 */
router.patch('/:id', verifyToken, async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return next(new AppError('No order found with that ID', 404));
        }

        // Check if user has permission to update
        if (req.user.role === 'employee' && order.employee.toString() !== req.user.id) {
            return next(new AppError('You do not have permission to update this order', 403));
        }

        // Update order
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                updatedBy: req.user.id
            },
            {
                new: true,
                runValidators: true
            }
        )
            .populate('shift', 'name date startTime endTime')
            .populate('employee', 'username fullName')
            .populate('device', 'name type model')
            .populate('createdBy', 'username fullName')
            .populate('updatedBy', 'username fullName');

        res.status(200).json({
            status: 'success',
            data:
                updatedOrder

        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/orders/{id}/handover:
 *   post:
 *     summary: Create handover report
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - equipmentStatus
 *               - nextShift
 *             properties:
 *               equipmentStatus:
 *                 type: string
 *               notes:
 *                 type: string
 *               nextShift:
 *                 type: string
 */
router.post('/:id/handover', verifyToken, async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return next(new AppError('No order found with that ID', 404));
        }

        // Check if user has permission to create handover report
        if (order.employee.toString() !== req.user.id) {
            return next(new AppError('You do not have permission to create handover report for this order', 403));
        }

        // Check if order is completed
        if (order.status !== 'completed') {
            return next(new AppError('Cannot create handover report for non-completed order', 400));
        }

        // Create handover report
        order.handoverReport = {
            equipmentStatus: req.body.equipmentStatus,
            notes: req.body.notes,
            nextShift: req.body.nextShift,
            createdAt: Date.now(),
            createdBy: req.user.id
        };

        await order.save();

        res.status(200).json({
            status: 'success',
            data:
                order

        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router; 