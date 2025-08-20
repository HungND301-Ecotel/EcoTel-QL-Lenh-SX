const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Job = require('../models/Job');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const { logger } = require('../utils/logger');


router.post('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { name, type } = req.body
        const existingJob = await Job.findOne({ name });
        if (existingJob) {
            req.logger.error('❌ Tên công việc đã tồn tại')
            return res.status(400).send({ status: 'error', message: 'Tên công việc đã tồn tại' });
        }
        const newJob = new Job({
            name: name,
            type: type,
        });
        await newJob.save();
        req.logger.info('🔥 Tạo công việc')
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        req.logger.error("❌ Lỗi khi tạo công việc", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.delete('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            req.logger.error("❌ Vui lòng chọn bản ghi cần xóa");
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        const result = await Job.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            req.logger.error("❌ không tìm thấy bản ghi cần xóa");
            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }
        req.logger.info(`🔥  Đã xóa ${result.deletedCount} bản ghi`);
        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi tạo công việc", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.put('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!job) {
            req.logger.error("❌ Không tìm thấy công việc");
            return res.status(404).send({ status: 'error', message: 'Sửa thất bại ' });
        }
        req.logger.info(`🔥 Sửa công việc thành công`);
        res.status(200).json({
            status: 'success',
            message: 'Sửa thành công'
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi sửa công việc", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
// Get device usage history
router.get('/', verifyToken, async (req, res) => {
    try {
        const query = {}

        if (req.query.name) {
            const regex = new RegExp(req.query.name, 'i'); // không phân biệt hoa thường
            query.name = regex;
        }
        const jobs = await Job.find(query);
        res.status(200).send({ status: 'success', data: jobs });
    } catch (err) {
        req.logger.error("❌ Lỗi khi load công việc", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

module.exports = router; 