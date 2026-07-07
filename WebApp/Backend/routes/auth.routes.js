const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorHandler');
const { sendPasswordResetEmail } = require('../utils/email');
const User = require('../models/User');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *               - fullName
 *               - position
 *               - department
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               fullName:
 *                 type: string
 *               position:
 *                 type: string
 *                 enum: [admin, manager, supervisor, employee]
 *               department:
 *                 type: string
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password, email, gender, fullName, phone, avatar, signature,
            salaryCode, department, position, role, active } = req.body;

        // Check if user already exists
        let user = await User.findOne({ username });
        if (user) {
            req.logger.error(`❌ Tên đăng nhập đã tồn tại ${username}`);
            return res.status(400).json({
                status: 'error',
                message: 'Tên đăng nhập đã tồn tại'
            });
        }

        if (phone) {
            let exitsPhone = await User.findOne({ phone });
            if (exitsPhone) {
                req.logger.error(`❌ Số điện thoại đã tồn tại ${phone}`);
                return res.status(400).json({
                    status: 'error',
                    message: 'Số điện thoại đã tồn tại'
                });
            }
        }
        if (email) {
            let exitsEmail = await User.findOne({ email });
            if (exitsEmail) {
                req.logger.error(`❌ Email đã tồn tại ${email}`);
                return res.status(400).json({
                    status: 'error',
                    message: 'Email đã tồn tại'
                });
            }
        }
        if (salaryCode) {
            let exitsSalaryCode = await User.findOne({ salaryCode });
            if (exitsSalaryCode) {
                req.logger.error(`❌ Mã thẻ lương đã tồn tại ${salaryCode}`);
                return res.status(400).json({
                    status: 'error',
                    message: 'Mã thẻ lương đã tồn tại'
                });
            }
        }

        // Create new user
        user = new User({
            username,
            password,
            email,
            phone,
            avatar,
            signature,
            fullName,
            department,
            salaryCode,
            position,
            gender,
            role,
            active
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save user
        await user.save();

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        req.logger.info(`🔥  Tạo người dùng thành công user${username} pass${password}`);
        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    position: user.position,
                }
            }
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi tạo người dùng", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;


        // Check if user exists
        const user = await User.findOne({ username }).populate("position").populate("department")
        if (!user) {
            req.logger.error(`❌ Không tìm thấy người dùng ${username}`);
            return res.status(404).send({
                status: 'error', message: 'Không tìm thấy người dùng'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.logger.error(`❌ Mật khẩu ${password} không đúng cho ${username}`);
            return res.status(400).send({
                status: 'error', message: 'Mật khẩu không đúng'
            });
        }

        if (user.active === false) {
            req.logger.error(`❌ Tài khoàn ${username} không hoạt động vui lòng chờ hoặc liên hệ admin để giải quyết.`);
            return res.status(403).send({
                status: 'error', message: 'Tài khoàn không hoạt động vui lòng chờ hoặc liên hệ admin để giải quyết.'
            });
        }

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        req.logger.info(`🔥 Login thành công user ${username}`);
        res.json({
            success: true,
            data: {
                token,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    salaryCode: user.salaryCode,
                    phone: user.phone,
                    department: user.department,
                    role: user.role
                }
            }
        });
    } catch (error) {
        req.logger.error("❌ Đăng nhập thất bại", error);
        res.status(500).send({ status: 'error', message: error.message, stack: error.stack })

    }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 */
router.post('/forgot-password', async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).send({ status: 'error', message: 'There is no user with that email address' });
        }

        // Generate random reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // Send reset email
        await sendPasswordResetEmail(user, resetToken);

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   patch:
 *     summary: Reset password
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - passwordConfirm
 *             properties:
 *               password:
 *                 type: string
 *               passwordConfirm:
 *                 type: string
 */
router.patch('/reset-password/:token', async (req, res, next) => {
    try {
        const user = await User.findOne({
            passwordResetToken: req.params.token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).send({ status: 'error', message: 'Token is invalid or has expired' });
        }

        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Generate new JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.status(200).json({
            status: 'success',
            token
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', verifyToken, async (req, res, next) => {
    try {
        if (req.user && req.user.tokenType === 'PORTAL') {
            req.logger.info(`🔥 Load dữ liệu Portal user thành công ${req.user.username}`);
            return res.status(200).json({
                status: 'success',
                data: {
                    user: {
                        _id: req.user._id,
                        username: req.user.username,
                        fullName: req.user.fullName,
                        role: req.user.role || 'manager', // Default role cho frontend check
                        isPortal: true,
                        permissions: req.user.permissions
                    }
                }
            });
        }

        const user = await User.findById(req.userId).populate("position").populate("department")
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy thông tin user local' });
        }
        req.logger.info(`🔥 Load dữ liệu  người dùng thành công ${user.username}`);
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    salaryCode: user.salaryCode,
                    position: user.position,
                    department: user.department,
                    role: user.role,
                    signature: user.signature,
                    avatar: user.avatar
                }
            }
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi load dữ liệu người dùng", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

const redisClient = require('../utils/redis');

/**
 * @swagger
 * /api/auth/exchange-code:
 *   post:
 *     summary: Exchange OTC code for Portal appToken
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 */
router.post('/exchange-code', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ status: 'error', message: 'Mã code không được để trống' });
        }

        const key = `otc:${code}`;
        // Lấy và xóa key một cách atomic
        const value = await redisClient.get(key);
        if (!value) {
            req.logger.warn(`⚠️ Đổi OTC code thất bại: Mã code không tồn tại hoặc đã hết hạn (key: ${key})`);
            return res.status(401).json({ status: 'error', message: 'Mã code không hợp lệ hoặc đã hết hạn' });
        }
        await redisClient.del(key); // Xóa ngay sau khi dùng

        const [appToken, refreshToken] = value.split('|');
        if (!appToken) {
            return res.status(401).json({ status: 'error', message: 'Token không hợp lệ trong hệ thống Portal' });
        }

        req.logger.info(`🔥 Đổi OTC code thành công`);
        res.status(200).json({
            success: true,
            appToken,
            refreshToken
        });
    } catch (err) {
        req.logger.error('❌ Lỗi khi đổi mã code lấy token:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi hệ thống trao đổi mã xác thực' });
    }
});

module.exports = router; 