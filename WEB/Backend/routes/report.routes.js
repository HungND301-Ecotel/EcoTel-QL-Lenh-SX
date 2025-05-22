const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Report = require('../models/Report');
const Order = require('../models/Order');
const Device = require('../models/Device');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/reports')
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 */
router.get('/', verifyToken, async (req, res, next) => {
    try {
        const query = {};

        // Filter by type
        if (req.query.type) {
            query.type = req.query.type;
        }

        // Filter by department
        if (req.query.department) {
            query.department = req.query.department;
        }

        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Filter by date range
        if (req.query.startDate || req.query.endDate) {
            query['period.startDate'] = {};
            query['period.endDate'] = {};
            if (req.query.startDate) {
                query['period.startDate'].$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                query['period.endDate'].$lte = new Date(req.query.endDate);
            }
        }

        const reports = await Report.find(query)
            .populate('department', 'name code')
            .populate('createdBy', 'username fullName')
            .populate('updatedBy', 'username fullName')
            .populate('approvedBy', 'username fullName')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: reports.length,
            data:
                reports

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
 * /api/reports:
 *   post:
 *     summary: Create new report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - department
 *               - period.startDate
 *               - period.endDate
 *               - content.summary
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [daily, weekly, monthly, incident, maintenance, other]
 *               department:
 *                 type: string
 *               period.startDate:
 *                 type: string
 *                 format: date
 *               period.endDate:
 *                 type: string
 *                 format: date
 *               content.summary:
 *                 type: string
 *               content.details:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 */
router.post('/', verifyToken, restrictTo('admin', 'manager', 'supervisor'), upload.array('attachments', 5), async (req, res, next) => {
    try {
        const {
            title,
            type,
            department,
            period,
            content
        } = req.body;

        // Calculate metrics
        let safePeriod = period;
        if (typeof safePeriod !== 'string') safePeriod = '{}';
        try {
            safePeriod = JSON.parse(safePeriod);
        } catch (e) {
            safePeriod = {};
        }
        const metrics = await calculateMetrics(department, safePeriod);

        // Process uploaded files
        const attachments = req.files ? req.files.map(file => ({
            filename: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
        })) : [];

        let safeContent = content;
        if (typeof content !== 'string') safeContent = '{}';
        try {
            JSON.parse(safeContent);
        } catch (e) {
            safeContent = '{}';
        }

        const report = await Report.create({
            title,
            type,
            department,
            period: safePeriod,
            content: {
                ...JSON.parse(safeContent),
                attachments
            },
            metrics,
            createdBy: req.user.id
        });

        res.status(201).json({
            status: 'success',
            data:
                report

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
 * /api/reports/{id}:
 *   get:
 *     summary: Get report by ID
 *     tags: [Reports]
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
        const report = await Report.findById(req.params.id)
            .populate('department', 'name code')
            .populate('createdBy', 'username fullName')
            .populate('updatedBy', 'username fullName')
            .populate('approvedBy', 'username fullName')
            .populate('comments.user', 'username fullName');

        if (!report) {
            return next(new AppError('No report found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data:
                report

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
 * /api/reports/{id}:
 *   patch:
 *     summary: Update report
 *     tags: [Reports]
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
 *               title:
 *                 type: string
 *               content:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [draft, submitted, approved, rejected]
 */
router.patch('/:id', verifyToken, async (req, res, next) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return next(new AppError('No report found with that ID', 404));
        }

        // Check if user has permission to update
        if (report.createdBy.toString() !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
            return next(new AppError('You do not have permission to update this report', 403));
        }

        // If status is being updated to approved/rejected
        if (req.body.status && ['approved', 'rejected'].includes(req.body.status)) {
            if (!['admin', 'manager'].includes(req.user.role)) {
                return next(new AppError('Only admin or manager can approve/reject reports', 403));
            }
            req.body.approvedBy = req.user.id;
            req.body.approvalDate = Date.now();
        }

        const updatedReport = await Report.findByIdAndUpdate(
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
            .populate('updatedBy', 'username fullName')
            .populate('approvedBy', 'username fullName');

        res.status(200).json({
            status: 'success',
            data:
                updatedReport

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
 * /api/reports/{id}/comments:
 *   post:
 *     summary: Add comment to report
 *     tags: [Reports]
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 */
router.post('/:id/comments', verifyToken, async (req, res, next) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return next(new AppError('No report found with that ID', 404));
        }

        report.comments.push({
            user: req.user.id,
            content: req.body.content
        });

        await report.save();

        res.status(200).json({
            status: 'success',
            data:
                report

        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Helper function to calculate metrics
async function calculateMetrics(department, period) {
    let safePeriod = period;
    if (typeof safePeriod !== 'string') safePeriod = '{}';
    try {
        safePeriod = JSON.parse(safePeriod);
    } catch (e) {
        safePeriod = {};
    }
    const { startDate, endDate } = safePeriod;

    // Nếu thiếu hoặc không hợp lệ, trả về số liệu mặc định
    if (!startDate || !endDate || isNaN(new Date(startDate)) || isNaN(new Date(endDate))) {
        return {
            totalOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
            totalDevices: 0,
            activeDevices: 0,
            maintenanceDevices: 0,
            fuelConsumption: 0,
            incidents: 0
        };
    }

    const [orders, devices] = await Promise.all([
        Order.find({
            department,
            createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }),
        Device.find({ department })
    ]);

    return {
        totalOrders: orders.length,
        completedOrders: orders.filter(order => order.status === 'completed').length,
        cancelledOrders: orders.filter(order => order.status === 'cancelled').length,
        totalDevices: devices.length,
        activeDevices: devices.filter(device => device.status === 'available').length,
        maintenanceDevices: devices.filter(device => device.status === 'maintenance').length,
        fuelConsumption: orders.reduce((sum, order) => sum + (order.fuelConsumption || 0), 0),
        incidents: orders.filter(order => order.status === 'cancelled').length
    };
}

module.exports = router; 