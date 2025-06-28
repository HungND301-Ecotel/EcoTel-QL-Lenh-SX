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
        const query = {}

        if (req.query.code) {
            const regex = new RegExp(req.query.code, 'i'); // không phân biệt hoa thường
            query.code = regex;
        }
        const departments = await Department.find(query)


        res.status(200).json({
            status: 'success',
            results: departments.length,
            data:
                departments

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
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
router.post('/', verifyToken, restrictTo('admin','manager'), async (req, res, next) => {
    try {
        const { name, code, description } = req.body;

        // Check if department with same code exists
        const existingCodeDepartment = await Department.findOne({ code });
        if (existingCodeDepartment) {
            return res.status(400).send({ status: 'error', message: 'Mã đơn vị đã tồn tại' });
        }
        const existingNameDepartment = await Department.findOne({ name });
        if (existingNameDepartment) {
            return res.status(400).send({ status: 'error', message: 'Tên đơn vị đã tồn tại' });
        }

        const department = await Department.create({
            name,
            code,
            description,
        });

        res.status(201).json({
            status: 'success',
            data:
                department
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
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

        if (!department) {
            return res.status(404).send({ status: 'error', message: 'No department found with that ID' });
        }

        res.status(200).json({
            status: 'success',
            data:
                department

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
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
router.put('/:id', verifyToken, restrictTo('admin', 'manager',), async (req, res, next) => {
    try {
        const department = await Department.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        )
        if (!department) {
            return res.status(404).send({ status: 'error', message: 'No department found with that ID' });
        }

        res.status(200).json({
            status: 'success',
            data:
                department

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
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
router.delete('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const department = await Department.findByIdAndDelete(req.params.id);

        if (!department) {
            return res.status(500).send({ status: 'error', message: 'No department found with that ID' });
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