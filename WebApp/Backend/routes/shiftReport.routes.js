const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const ShiftReport = require('../models/ShiftReport');
const Device = require('../models/Device');

const { verifyToken, restrictTo } = require('../middleware/auth.middleware');


router.post('/', verifyToken, async (req, res, next) => {
    try {
        const { orderId, assignedTo, vehicleReports, vehicleSummaries, handoverHours, otherHours, handoverNotes, risks } = req.body

        if (vehicleSummaries) {
            for (var item of vehicleSummaries) {
                const device = await Device.findById(item.vehicle)
                device.status = item.status === "good" ? "available" : "maintenance"
                await device.save()
            }
        }
        const newShiftReport = new ShiftReport({
            orderId, assignedTo, vehicleReports, vehicleSummaries, handoverHours, otherHours, handoverNotes, risks
        });
        await newShiftReport.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {

        const shiftReport = await ShiftReport.findOne({ orderId: req.params.id })

        res.status(200).send({ status: 'success', data: shiftReport });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

module.exports = router; 