const ShiftReport = require('../models/shift_report')



exports.create = async (req, res) => {
    try {
        const { orderId, assignedTo, travelHours, repairHours, handoverHours,otherHours, handoverNotes, risks } = req.body
        const newReport = new ShiftReport({
            orderId, assignedTo, travelHours, repairHours, handoverHours,otherHours, handoverNotes, risks
        });
        await newReport.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}
exports.getByOrder = async (req, res) => {
    try {
        const reports = await ShiftReport.findOne({ orderId: req.params.orderId })
            .populate("orderId", "name")
            .populate("assignedTo", "name")
        res.status(200).send({ status: 'success', data: reports });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}