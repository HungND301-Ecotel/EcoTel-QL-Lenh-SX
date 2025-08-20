const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Position = require('../models/Position');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');

router.post('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { name, note } = req.body;

        const existingPosition = await Position.findOne({ name });
        if (existingPosition) {
            req.logger.warn(`⚠️ Chức vụ đã tồn tại: ${name}`);
            return res.status(400).send({ status: 'error', message: 'Chức vụ đã tồn tại' });
        }

        const newPosition = new Position({
            name,
            note
        });
        await newPosition.save();
        req.logger.info(`✅ Tạo chức vụ thành công: ${newPosition.name}`);
        res.status(200).send({ status: 'success', message: 'Tạo thành công' });
    } catch (err) {
        req.logger.error('❌ Lỗi khi tạo chức vụ', err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

router.delete('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            req.logger.warn('⚠️ Yêu cầu xóa không có IDs hợp lệ');
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        const result = await Position.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            req.logger.info('ℹ️ Không tìm thấy bản ghi để xóa');
            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }

        req.logger.info(`✅ Xóa thành công ${result.deletedCount} bản ghi`);
        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
        });
    } catch (err) {
        req.logger.error('❌ Lỗi khi xóa chức vụ', err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

router.put('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const position = await Position.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!position) {
            req.logger.warn(`⚠️ Cập nhật thất bại - Không tìm thấy chức vụ với ID: ${req.params.id}`);
            return res.status(404).send({ status: 'error', message: 'Sửa thất bại ' });
        }

        req.logger.info(`✅ Cập nhật chức vụ thành công cho ID: ${req.params.id}`);
        res.status(200).json({
            status: 'success',
            message: 'Sửa thành công'
        });
    } catch (err) {
        req.logger.error('❌ Lỗi khi cập nhật chức vụ', err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

router.get('/', verifyToken, async (req, res) => {
    try {
        const query = {};

        if (req.query.name) {
            const regex = new RegExp(req.query.name, 'i'); // không phân biệt hoa thường
            query.name = regex;
        }

        const positions = await Position.find(query).collation({ locale: "vi", strength: 1 })
            .sort({ name: 1 });
        req.logger.info(`✅ Load thành công`);
        res.status(200).send({ status: 'success', data: positions });
    } catch (err) {
        req.logger.error('❌ Lỗi khi lấy danh sách chức vụ', err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

module.exports = router;