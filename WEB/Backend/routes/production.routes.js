const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const ProductionOrder = require('../models/ProductionOrder');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/production:
 *   get:
 *     summary: Get all production orders
 *     tags: [Production]
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
 *         name: equipment
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

        // Filter by equipment
        if (req.query.equipment) {
            query.equipment = req.query.equipment;
        }

        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }

        const productionOrders = await ProductionOrder.find(query)
            .populate('shift', 'name date startTime endTime')
            .populate('employee', 'username fullName')
            .populate('equipment', 'name type model')
            .populate('createdBy', 'username fullName')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: productionOrders.length,
            data: {
                productionOrders
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/production:
 *   post:
 *     summary: Create new production order
 *     tags: [Production]
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
 *               - equipment
 *               - location
 *               - workContent
 *             properties:
 *               shift:
 *                 type: string
 *               employee:
 *                 type: string
 *               equipment:
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
            equipment,
            location,
            workContent,
            safetyMeasures
        } = req.body;

        const productionOrder = await ProductionOrder.create({
            shift,
            employee,
            equipment,
            location,
            workContent,
            safetyMeasures,
            createdBy: req.user.id
        });

        res.status(201).json({
            status: 'success',
            data: {
                productionOrder
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/production/{id}:
 *   get:
 *     summary: Get production order by ID
 *     tags: [Production]
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
        const productionOrder = await ProductionOrder.findById(req.params.id)
            .populate('shift', 'name date startTime endTime')
            .populate('employee', 'username fullName')
            .populate('equipment', 'name type model')
            .populate('createdBy', 'username fullName');

        if (!productionOrder) {
            return next(new AppError('No production order found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                productionOrder
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/production/{id}:
 *   patch:
 *     summary: Update production order
 *     tags: [Production]
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
        const productionOrder = await ProductionOrder.findById(req.params.id);

        if (!productionOrder) {
            return next(new AppError('No production order found with that ID', 404));
        }

        // Check if user has permission to update
        if (req.user.role === 'employee' && productionOrder.employee.toString() !== req.user.id) {
            return next(new AppError('You do not have permission to update this production order', 403));
        }

        // Update production order
        const updatedOrder = await ProductionOrder.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        )
            .populate('shift', 'name date startTime endTime')
            .populate('employee', 'username fullName')
            .populate('equipment', 'name type model')
            .populate('createdBy', 'username fullName');

        res.status(200).json({
            status: 'success',
            data: {
                productionOrder: updatedOrder
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/production/{id}/handover:
 *   post:
 *     summary: Create handover report
 *     tags: [Production]
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
        const productionOrder = await ProductionOrder.findById(req.params.id);

        if (!productionOrder) {
            return next(new AppError('No production order found with that ID', 404));
        }

        // Check if user has permission to create handover report
        if (productionOrder.employee.toString() !== req.user.id) {
            return next(new AppError('You do not have permission to create handover report for this order', 403));
        }

        // Check if order is completed
        if (productionOrder.status !== 'completed') {
            return next(new AppError('Cannot create handover report for non-completed order', 400));
        }

        // Create handover report
        productionOrder.handoverReport = {
            equipmentStatus: req.body.equipmentStatus,
            notes: req.body.notes,
            nextShift: req.body.nextShift,
            createdAt: Date.now(),
            createdBy: req.user.id
        };

        await productionOrder.save();

        res.status(200).json({
            status: 'success',
            data: {
                productionOrder
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router; 