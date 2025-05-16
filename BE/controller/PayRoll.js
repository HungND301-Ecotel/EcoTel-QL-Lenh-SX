const PayRoll = require('../models/pay_roll')



exports.create = async (req, res) => {
    try {
        const { code, userId } = req.body
        const newPayroll = new PayRoll({
            userId: userId,
            code: code,
        });
        await newPayroll.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}
exports.getByCode = async (req, res) => {
    try {
        const payroll = await PayRoll.findOne({ code: req.params.code }).populate('userId', 'name');
        if (!payroll) {
            return res.status(404).send({ status: 'error', message: 'Not found' });
        }
        res.status(200).send({ status: 'success', data: payroll });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}