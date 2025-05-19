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
        const devices = await Report.find({ orderid: req.params.orderId })
            .populate("orderId", "name")
            .populate("device", "name")
            .populate("fromLocation", "name")
            .populate("toLocation", "name")
            .populate("material", "name")
            .populate("orderId", "name")
            .populate("orderId", "name")
        res.status(200).send({ status: 'success', data: devices });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}