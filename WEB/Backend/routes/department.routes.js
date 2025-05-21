const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Department = require('../models/Department');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', verifyToken, async (req, res, next) => {
    try {
        const departments = await Department.find()
            .populate('manager', 'username fullName email');

        res.status(200).json({
            status: 'success',
            results: departments.length,
            data: {
                departments
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/departments:
 *   post:
 *     summary: Create a new department
 *     tags: [Departments]
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
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               manager:
 *                 type: string
 */
router.post('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { name, code, description, manager } = req.body;

        // Check if department with same code exists
        const existingDepartment = await Department.findOne({ code });
        if (existingDepartment) {
            return next(new AppError('Department with this code already exists', 400));
        }

        const department = await Department.create({
            name,
            code,
            description,
            manager
        });

        res.status(201).json({
            status: 'success',
            data: {
                department
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Departments]
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
        const department = await Department.findById(req.params.id)
            .populate('manager', 'username fullName email');

        if (!department) {
            return next(new AppError('No department found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                department
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/departments/{id}:
 *   patch:
 *     summary: Update department
 *     tags: [Departments]
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
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               manager:
 *                 type: string
 *               isActive:
 *                 type: boolean
 */
router.put('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const department = await Department.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('manager', 'username fullName email');

        if (!department) {
            return next(new AppError('No department found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                department
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/departments/{id}:
 *   delete:
 *     summary: Delete department
 *     tags: [Departments]
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
        const department = await Department.findByIdAndDelete(req.params.id);

        if (!department) {
            return next(new AppError('No department found with that ID', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router; 