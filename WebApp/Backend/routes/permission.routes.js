const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Permission = require('../models/Permission');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');

router.post('/', async (req, res, next) => {
    try {
        const { name, code } = req.body;

        const existingPermission = await Permission.findOne({ name, code });
        if (existingPermission) {
            req.logger.warn(`⚠️ Permission đã tồn tại: ${name}`);
            return res.status(400).send({ status: 'error', message: 'Permission đã tồn tại' });
        }

        const newPermission = new Permission({
            name,
            code
        });
        await newPermission.save();
        req.logger.info(`✅ Tạo Permission thành công: ${newPermission.name}`);
        res.status(200).send({ status: 'success', message: 'Tạo thành công' });
    } catch (err) {
        req.logger.error('❌ Lỗi khi tạo Permission', err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

router.delete('/', async (req, res, next) => {
    try {
        const user = req.user;
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            req.logger.warn('⚠️ Yêu cầu xóa không có IDs hợp lệ');
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        const result = await Permission.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            req.logger.info('ℹ️ Không tìm thấy bản ghi để xóa');
            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }

        req.logger.info(`✅ ${user?.username}  Xóa thành công ${result.deletedCount} bản ghi`);
        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
        });
    } catch (err) {
        req.logger.error('❌ Lỗi khi xóa Permission', err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const user = req.user;
        const Permission = await Permission.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!Permission) {
            req.logger.warn(`⚠️ Cập nhật thất bại - Không tìm thấy Permission với ID: ${req.params.id}`);
            return res.status(404).send({ status: 'error', message: 'Sửa thất bại ' });
        }

        req.logger.info(`✅ ${user?.username} Cập nhật Permission thành công cho ID: ${req.params.id}`);
        res.status(200).json({
            status: 'success',
            message: 'Sửa thành công'
        });
    } catch (err) {
        req.logger.error('❌ Lỗi khi cập nhật Permission', err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});


router.get('/', async (req, res) => {
    try {
        const query = {};

        if (req.query.name) {
            const regex = new RegExp(req.query.name, 'i'); // không phân biệt hoa thường
            query.name = regex;
        }

        const Permissions = await Permission.find(query).sort({ 'createdAt': 1 })
        req.logger.info(`✅ Load thành công`);
        res.status(200).send({ status: 'success', data: Permissions });
    } catch (err) {
        req.logger.error('❌ Lỗi khi lấy danh sách chức vụ', err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});
module.exports = router;