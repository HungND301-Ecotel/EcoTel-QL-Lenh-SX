const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Equipment = require('../models/Equipment');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const { body, validationResult } = require('express-validator');
const Department = require('../models/Department');
const ProductionOrder = require('../models/ProductionOrder');

/**
 * @swagger
 * /api/equipment:
 *   get:
 *     summary: Get all equipment
 *     tags: [Equipment]
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

        const equipment = await Equipment.find(query)
            .populate('department', 'name code')
            .populate('createdBy', 'username fullName')
            .populate('updatedBy', 'username fullName');

        res.status(200).json({
            status: 'success',
            results: equipment.length,
            data: 
                equipment
            
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/equipment:
 *   post:
 *     summary: Create new equipment
 *     tags: [Equipment]
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

        // Check if equipment with same serial number exists
        const existingEquipment = await Equipment.findOne({ serialNumber });
        if (existingEquipment) {
            return next(new AppError('Equipment with this serial number already exists', 400));
        }

        const equipment = await Equipment.create({
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
            data: 
                equipment
            
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/equipment/{id}:
 *   get:
 *     summary: Get equipment by ID
 *     tags: [Equipment]
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
        const equipment = await Equipment.findById(req.params.id)
            .populate('department', 'name code')
            .populate('createdBy', 'username fullName')
            .populate('updatedBy', 'username fullName');

        if (!equipment) {
            return next(new AppError('No equipment found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: 
                equipment
            
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/equipment/{id}:
 *   patch:
 *     summary: Update equipment
 *     tags: [Equipment]
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
 */
router.patch('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const equipment = await Equipment.findByIdAndUpdate(
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
            .populate('department', 'name code')
            .populate('createdBy', 'username fullName')
            .populate('updatedBy', 'username fullName');

        if (!equipment) {
            return next(new AppError('No equipment found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: 
                equipment
            
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/equipment/{id}:
 *   delete:
 *     summary: Delete equipment
 *     tags: [Equipment]
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
        const equipment = await Equipment.findByIdAndDelete(req.params.id);

        if (!equipment) {
            return next(new AppError('No equipment found with that ID', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
});

// Lấy lịch sử sử dụng thiết bị
router.get('/:id/history', verifyToken, async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id);
        if (!equipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }

        const history = await ProductionOrder.find({ equipment: equipment._id })
            .populate('shift', 'name date startTime endTime')
            .populate('employee', 'username fullName')
            .populate('createdBy', 'username fullName')
            .sort({ startTime: -1 });

        res.json(history);
    } catch (err) {
        console.error('Get equipment history error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router; 