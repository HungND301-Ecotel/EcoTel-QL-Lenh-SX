const express = require('express');
const router = express.Router();
const Report = require('../models/Report')
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');



router.post('/', verifyToken, async (req, res, next) => {
    try {
        const { orderId, device, excavator, fromLocation, toLocation, material, quantity, drillDepth, hardnessF, workingMinutes, distanceKm } = req.body
        const newReport = new Report({
            orderId, device, excavator, fromLocation, toLocation, material, quantity, drillDepth, hardnessF, workingMinutes, distanceKm
        });
        await newReport.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})
router.get('/getByOrder/:orderId', verifyToken, async (req, res, next) => {
    try {
        const reports = await Report.find({ orderId: req.params.orderId })
            .sort({ createdAt: -1 })
            .populate("device", "code")
            .populate("excavator", "code")
            .populate("fromLocation", "name")
            .populate("toLocation", "name")
            .populate("material", "name")
        res.status(200).send({ status: 'success', data: reports });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})
module.exports = router