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

router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        const reports = await Report.findByIdAndDelete(req.params.id)
        if (!reports) {
            res.status(404).send({ status: 'error', message: 'Không tìm thấy dữ liệu' })
        }
        res.status(200).send({ status: 'success', message: 'Xóa thành công', data: reports });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

router.put('/:id', verifyToken, async (req, res) => {
    try {

        const update = await Report.findByIdAndUpdate(req.params.id, req.body, { $new: true })

        if (!update) {
            return res.status(500).send({ status: 'error', message: "Not found", stack: err.stack })
        }

        res.status(200).send({ status: 'success', message: "Sửa thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
module.exports = router