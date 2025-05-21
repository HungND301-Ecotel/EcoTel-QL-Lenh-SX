const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find().populate('department');
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lấy danh sách người dùng thất bại',
            error: error.message
        });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('department');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lấy thông tin người dùng thất bại',
            error: error.message
        });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const { department, ...updateData } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                ...updateData,
                department: department || null
            },
            { new: true }
        ).populate('department');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Cập nhật người dùng thất bại',
            error: error.message
        });
    }
});

// Change password
router.put('/changepass', async (req, res) => {
    try {
        const { old_pass, newpass, repass } = req.body
        const user = await User.findById(req.user._id)
        if (!user) {
            return res.status(404).send({ status: 'error', message: "Không tìm thấy người dùng" })
        }

        const IsPassword = await bcrypt.compare(old_pass, user.password)
        if (!IsPassword) {
            return res.status(401).send({ status: false, message: "Mật khẩu cũ không chính xác" })
        }
        if (!newpass) {
            return res.status(400).send({ status: false, message: "Nhập mật khẩu mới" })
        }
        if (newpass !== repass) {
            return res.status(404).send({ status: false, message: "Mật khẩu nhập lại không khớp" })
        }
        const hashedPassword = await bcrypt.hash(newpass, 10);
        user.password = hashedPassword;
        await user.save();
        res.status(200).send({
            status: true,
            message: "Đổi mật khẩu thành công",
        })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
// add phone
router.put('/addphone', async (req, res) => {
    try {
        const body = req.body
        const userUpdate = await User.findByIdAndUpdate(req.user._id, body, {
            new: true,
            runValidators: true
        });
        if (!userUpdate) {
            return res.status(404).send({ status: false, message: "Thêm số điện thoại không thành công" })
        };
        const userData = userUpdate.toObject()
        delete userData.password
        res.status(200).send({
            status: true,
            message: "Thêm số điện thoại thành công",
            data: userData
        })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }
        res.json({
            success: true,
            message: 'Xóa người dùng thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Xóa người dùng thất bại',
            error: error.message
        });
    }
});

module.exports = router; 