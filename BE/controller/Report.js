const Report = require('../models/report')



exports.create = async (req, res) => {
    try {
        const { orderId, device, fromLocation, toLocation, material, quantity, drillDepth, hardnessF, workingMinutes, distanceKm } = req.body
        const newReport = new Report({
            orderId, device, fromLocation, toLocation, material, quantity, drillDepth, hardnessF, workingMinutes, distanceKm
        });
        await newReport.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}
exports.getByOrder = async (req, res) => {
    try {
        const reports = await Report.find({ orderId: req.params.orderId })
            .sort({ createdAt: -1 })
            .populate("device", "name")
            .populate("fromLocation", "name")
            .populate("toLocation", "name")
            .populate("material", "name")
        res.status(200).send({ status: 'success', data: reports });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}