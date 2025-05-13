const User = require('../models/user')
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')


exports.register = async (req, res) => {
    try {
        const { username, name, password } = req.body;
        const user = await User.findOne({ username: username })
        if (user) {
            return res.status(409).send({
                status: 'error',
                message: "Username đã được sử dụng"
            })
        }
        const hashPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name,
            username: username,
            password: hashPassword,
        });
        await newUser.save();
        res.status(200).send({ status: 'success', message: "Đăng kí thành công" });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}
exports.login = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username })
        if (!user) {
            return res.status(404).send({ status: 'error', message: "Không tìm thấy người dùng" })
        }

        const IsPassword = await bcrypt.compare(req.body.password, user.password)
        if (!IsPassword) {
            return res.status(404).send({ status: 'error', message: "Mật khẩu không chính xác" })
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
        const userData = user.toObject()
        delete userData.password
        res.status(200).send({
            status: 'success',
            message: "Đăng nhập thành công",
            data: {
                user: userData,
                token
            }
        })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}
exports.changepass = async (req, res) => {
    try {
        const { old_pass, newpass, repass } = req.body
        const user = await User.findById(req.user._id)
        if (!user) {
            return res.status(404).send({ status: 'error', message: "Không tìm thấy người dùng" })
        }

        const IsPassword = await bcrypt.compare(old_pass, user.password)
        if (!IsPassword) {
            return res.status(401).send({ status: 'error', message: "Mật khẩu cũ không chính xác" })
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
}

exports.update = async (req, res) => {
    try {
        const body = req.body
        const userUpdate = await User.findByIdAndUpdate(req.user._id, body, {
            new: true,
            runValidators: true
        });
        if (!userUpdate) {
            return res.status(404).send({ status: 'error', message: "Cập nhật không thành công" })
        };
        const userData = userUpdate.toObject()
        delete userData.password
        res.status(200).send({
            status: 'success',
            message: "Cập nhật thành công",
            data: userData
        })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
}