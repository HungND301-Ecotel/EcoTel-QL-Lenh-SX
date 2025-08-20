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

        req.logger.info(`🔥 Load dữ liệu đơn vị thành công`);
        res.status(200).json({
            status: 'success',
            results: departments.length,
            data:
                departments

        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi load đơn vị", err);
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
router.post('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { name, code, description } = req.body;

        // Check if department with same code exists
        const existingCodeDepartment = await Department.findOne({ code });
        if (existingCodeDepartment) {
            req.logger.error("❌ Mã đơn vị đã tồn tại");
            return res.status(400).send({ status: 'error', message: 'Mã đơn vị đã tồn tại' });
        }
        const existingNameDepartment = await Department.findOne({ name });
        if (existingNameDepartment) {
            req.logger.error("❌ Tên đơn vị đã tồn tại");
            return res.status(400).send({ status: 'error', message: 'Tên đơn vị đã tồn tại' });
        }
        const department = await Department.create({
            name,
            code,
            description,
        });

        req.logger.info(`🔥  Tạo mới đơn vị thành công`);
        res.status(201).json({
            status: 'success',
            data:
                department
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi tạo đơn vị", err);
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
            req.logger.error("❌ không tìm thấy đơn vị");
            return res.status(404).send({ status: 'error', message: 'No department found with that ID' });
        }
        req.logger.info(`🔥 Load đơn vị thành công`);
        res.status(200).json({
            status: 'success',
            data:
                department

        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi load đơn vị", err);
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
            req.logger.error("❌ không tìm thấy đơn vị");
            return res.status(404).send({ status: 'error', message: 'No department found with that ID' });
        }
        req.logger.info(`🔥  Sửa đơn vị thành công`);
        res.status(200).json({
            status: 'success',
            data:
                department

        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi sửa đơn vị", err);
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
router.delete('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            req.logger.error("❌ Chọn bản ghi cần xóa");
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        const result = await Department.deleteMany({ _id: { $in: ids } });
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
        req.logger.error("❌ Lỗi khi xóa bản ghi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

module.exports = router; 