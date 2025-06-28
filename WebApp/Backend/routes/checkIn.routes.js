const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const CheckIn = require('../models/CheckIn');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');



router.get('/:id', verifyToken, async (req, res) => {
    try {

        const checkIns = await CheckIn.find({ orderId: req.params.id })

        res.status(200).send({ status: 'success', data: checkIns });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

module.exports = router; 