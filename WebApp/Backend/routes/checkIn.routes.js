const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const CheckIn = require('../models/CheckIn');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');



router.post('/bulk', verifyToken, async (req, res) => {
    try {
        const { ids } = req.body; // mảng orderId

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).send({ status: 'error', message: 'No IDs provided' });
        }

        const checkIns = await CheckIn.find({ orderId: { $in: ids } });

        res.status(200).send({ status: 'success', data: checkIns });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

module.exports = router; 