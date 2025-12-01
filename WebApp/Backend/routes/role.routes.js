const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Role = require('../models/Role');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const { ROLE } = require('../config/config');

router.post('/', async (req, res, next) => {
    try {
        const { name, value } = req.body;

        const existingRole = await Role.findOne({ name, value });
        if (existingRole) {
            req.logger.warn(`⚠️ Role đã tồn tại: ${name}`);
            return res.status(400).send({ status: 'error', message: 'Role đã tồn tại' });
        }

        const newRole = new Role({
            name,
            value
        });
        await newRole.save();
        req.logger.info(`✅ Tạo role thành công: ${newRole.name}`);
        res.status(200).send({ status: 'success', message: 'Tạo thành công' });
    } catch (err) {
        req.logger.error('❌ Lỗi khi tạo role', err);
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

        const result = await Role.deleteMany({ _id: { $in: ids } });
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
        req.logger.error('❌ Lỗi khi xóa role', err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});
router.put('/update/:id', async (req, res) => {
    try {
        const role = await Role.findById(req.params.id)
        if (!role) {
            req.logger.warn(`⚠️ Cập nhật thất bại - Không tìm thấy role với ID: ${req.params.id}`);
            return res.status(404).json({
                success: 'error',
                message: 'Không tìm thấy role'
            });
        }

        const roleUpdate = await Role.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        )

        req.logger.info(`✅ ${req.user?.username} Cập nhật role thành công`);
        res.json({
            status: 'success',
            data: roleUpdate
        });
    } catch (error) {
        req.logger.error("❌ Lỗi khi cập nhật role", error);
        res.status(500).json({
            status: 'error',
            message: 'Cập nhật role thất bại',
            error: error.message
        });
    }
});
router.patch(
    "/:roleId/permission",
    verifyToken, async (req, res) => {
        try {
            const user = req.user;
            const { roleId } = req.params;
            const { permissionId, allow } = req.body;

            const role = await Role.findById(roleId);
            if (!role) {
                return res.status(404).send({
                    status: "error",
                    message: "Role không tồn tại",
                });
            }

            if (allow === true) {
                // PUSH (thêm permission)
                if (!role.permission.includes(permissionId)) {
                    role.permission.push(permissionId);
                }
            } else {
                // PULL (xóa permission)
                role.permission = role.permission.filter(id => id.toString() !== permissionId.toString());
                console.log(role.permission)
            }

            await role.save();
            req.logger.info(`✅ ${user?.username}  ${allow ? "Đã cấp quyền" : "Đã hủy quyền"} `);

            res.status(200).send({
                status: "success",
                message: allow ? "Đã cấp quyền" : "Đã hủy quyền",
                data: role.permission,
            });
        } catch (err) {
            req.logger.error('❌ Lỗi khi cấp quyền', err);
            res.status(500).send({
                status: "error",
                message: err.message,
            });
        }
    }
);


router.get('/', async (req, res) => {
    try {
        const query = {};

        if (req.query.name) {
            const regex = new RegExp(req.query.name, 'i'); // không phân biệt hoa thường
            query.name = regex;
        }

        const Roles = await Role.find(query).sort({ 'createdAt': 1 })
        req.logger.info(`✅ Load thành công`);
        res.status(200).send({ status: 'success', data: Roles });
    } catch (err) {
        req.logger.error('❌ Lỗi khi lấy danh sách chức vụ', err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});
module.exports = router;