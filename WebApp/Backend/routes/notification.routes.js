const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth.middleware');


router.post('/', verifyToken, async (req, res, next) => {
    try {
        const { title, message, type, priority, recipient } = req.body
        const notifications = await Notification.createNotification({
            title, message, type, priority, recipient, sender: req.userId
        });

        res.status(200).json({
            status: 'success',
            results: notifications.length,
            data:
                notifications

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: priority
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 */
router.get('/', verifyToken, async (req, res, next) => {
    try {
        const readParam = req.query.read;
        let read;
        if (readParam === 'true') read = true;
        else if (readParam === 'false') read = false;
        const notifications = await Notification.getUserNotifications(req.user._id, {
            type: req.query.type,
            read: read,
            priority: req.query.priority,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            limit: parseInt(req.query.limit) || 20,
            skip: parseInt(req.query.skip) || 0
        });

        res.status(200).json({
            status: 'success',
            results: notifications.length,
            data:
                notifications

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

/**
 * @swagger
 * /api/notifications/unread/count:
 *   get:
 *     summary: Get unread notifications count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/unread/count', verifyToken, async (req, res, next) => {
    try {
        const count = await Notification.getUnreadCount(req.userId);

        res.status(200).json({
            status: 'success',
            data:
                count

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.get('/read/count', verifyToken, async (req, res, next) => {
    try {
        const count = await Notification.getReadCount(req.userId);

        res.status(200).json({
            status: 'success',
            data:
                count

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/:id/read', verifyToken, async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return next(new AppError('No notification found with that ID', 404));
        }

        // Check if user is the recipient
        if (notification.recipient.toString() !== req.user.id) {
            return next(new AppError('You do not have permission to mark this notification as read', 403));
        }

        await notification.markAsRead();

        res.status(200).json({
            status: 'success',
            data:
                notification

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

/**
 * @swagger
 * /api/notifications/read/all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/read/all', verifyToken, async (req, res, next) => {
    try {
        await Notification.updateMany(
            {

                recipient: req.useId,
                read: false
            },
            {
                read: true,
                readAt: Date.now()
            }
        );

        res.status(200).json({
            status: 'success',
            message: 'All notifications marked as read'
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);

        if (!notification) {
            return next(new AppError('No notification found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

module.exports = router; 