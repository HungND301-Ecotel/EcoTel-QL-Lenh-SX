const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const History = require('../models/History');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');


router.post('/', verifyToken, async (req, res, next) => {
    try {
        const { entity, snapshot } = req.body
        const newHistory = new History({
            entity, snapshot, changeBy: req.userId
        });
        await newHistory.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {

        const historys = await History.find({ entity: req.params.id }).populate("changedBy", "fullName")

        res.status(200).send({ status: 'success', data: historys });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

module.exports = router; 