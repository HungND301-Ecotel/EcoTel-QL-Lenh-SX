const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs')
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const handleUpload = require('../utils/uploadImage');
const xlsx = require('xlsx');


// Get all users
router.get('/', verifyToken, async (req, res) => {
    try {
        const user = req.user
        const query = {}

        if (user?.role === "manager") {
            query.department = user?.department?._id;
        }

        if (req.query.department) {
            query.department = req.query.department
        }

        if (user?.role === "dispatcher") {
            query.role = 'manager';
        }

        if (req.query.q) {
            const regex = new RegExp(req.query.q, 'i');
            query.$or = [
                { salaryCode: regex },
                { fullName: regex },
            ];
        }
        const users = await User.find(query)
            .populate('department', 'name code')
            .populate('position', 'name')
            .sort('-createdAt')
        res.json({
            status: 'success',
            data: users
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Lấy danh sách người dùng thất bại',
            error: error.message
        });
    }
});

// Get user by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('department').populate('position', 'name');
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy người dùng'
            });
        }
        res.json({
            status: 'success',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Lấy thông tin người dùng thất bại',
            error: error.message
        });
    }
});


// Get user by salaryCode
router.get('/salaryCode/:code', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ salaryCode: req.params.code });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy người dùng'
            });
        }
        res.json({
            status: 'success',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Lấy thông tin người dùng thất bại',
            error: error.message
        });
    }
});


// Update user
router.put('/update/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate("position")

        if (!user) {
            return res.status(404).json({
                success: 'error',
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            status: 'success',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Cập nhật người dùng thất bại',
            error: error.message
        });
    }
});

// Change password
router.put('/changepass', verifyToken, async (req, res) => {
    try {
        const { old_pass, newpass, repass } = req.body
        const user = await User.findById(req.user._id)
        if (!user) {
            return res.status(404).send({ status: 'error', message: "Không tìm thấy người dùng" })
        }

        const IsPassword = await bcrypt.compare(old_pass, user.password)
        if (!IsPassword) {
            return res.status(400).send({ status: 'error', message: "Mật khẩu cũ không chính xác" })
        }
        if (!newpass) {
            return res.status(400).send({ status: 'error', message: "Nhập mật khẩu mới" })
        }
        if (newpass !== repass) {
            return res.status(404).send({ status: 'error', message: "Mật khẩu nhập lại không khớp" })
        }
        const hashedPassword = await bcrypt.hash(newpass, 10);
        user.password = hashedPassword;
        await user.save();
        res.status(200).send({
            status: 'success',
            message: "Đổi mật khẩu thành công",
        })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
// add phone
router.put('/addphone', verifyToken, async (req, res) => {
    try {
        const body = req.body
        const userUpdate = await User.findByIdAndUpdate(req.user._id, body, {
            new: true,
            runValidators: true
        }).populate("position")
        if (!userUpdate) {
            return res.status(404).send({ status: 'error', message: "Thêm số điện thoại không thành công" })
        };
        const userData = userUpdate.toObject()
        delete userData.password
        res.status(200).send({
            status: 'success',
            message: "Thêm số điện thoại thành công",
            data: userData
        })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

// Delete user
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy người dùng'
            });
        }
        res.json({
            status: 'success',
            message: 'Xóa người dùng thành công'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Xóa người dùng thất bại',
            error: error.message
        });
    }
});


// Delete user
router.post('/importFile', handleUpload, verifyToken, async (req, res) => {
    try {
        const fileUrl = req.file.path;
        console.log(fileUrl)
        if (!req.file) {
            return res.status(400).send({ status: 'error', message: 'Vui lòng thử lại' });
        }

        const axios = require('axios');
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

        const workbook = xlsx.read(response.data, { type: 'buffer' });
        const sheet = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet]);

        await User.insertMany(data);
        res.status(200).json({
            status: 'success',
            message: 'Tải thành cồng',
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Tải thất bại',
            error: error.message
        });
    }
});
module.exports = router; 