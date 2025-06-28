const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const OrderHistory = require('../models/OrderHistory');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');


router.post('/', verifyToken, async (req, res, next) => {
    try {
        const { orderId, snapshot } = req.body
        const newOrderHistory = new OrderHistory({
            orderId, snapshot, changeBy: req.userId
        });
        await newOrderHistory.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {

        const orderHistorys = await OrderHistory.find({ orderId: req.params.id }).populate("changedBy","fullName")

        res.status(200).send({ status: 'success', data: orderHistorys });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

module.exports = router; 