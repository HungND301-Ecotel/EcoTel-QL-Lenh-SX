const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const PayRoll = require('../models/PayRoll');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');


router.post('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { userId, code, jobId, baseSalary, bonus, allowance, note } = req.body
        const newPayRoll = new PayRoll({
            userId, code, jobId, baseSalary, bonus, allowance, note
        });
        await newPayRoll.save();
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.delete('/:id', verifyToken, restrictTo('admin'), async (req, res, next) => {
    try {
        const payroll = await PayRoll.findByIdAndDelete(req.params.id);

        if (!payroll) {
            return res.status(200).send({ status: 'error', message: 'Xóa thất bại ' });
        }

        res.status(204).json({
            status: 'success',
            message: 'Xóa thành công'
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.put('/:id', verifyToken, restrictTo('admin'), async (req, res, next) => {
    try {
        const payroll = await PayRoll.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!payroll) {
            return res.status(404).send({ status: 'error', message: 'Sửa thất bại ' });
        }

        res.status(204).json({
            status: 'success',
            message: 'Sửa thành công'
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.get('/', verifyToken, async (req, res) => {
    try {
        const payrolls = await PayRoll.find()
            .populate("userId","fullName")
            .populate("jobId","name");
        res.status(200).send({ status: 'success', data:  payrolls  });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

module.exports = router; 