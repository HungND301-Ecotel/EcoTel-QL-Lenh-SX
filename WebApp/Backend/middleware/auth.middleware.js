const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorHandler');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
    try {
        // 1) Check if token exists
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).send({ status: 'error', message: 'You are not logged in! Please log in to get access.' });
        }

        // 2) Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3) Check if user still exists
        const currentUser = await User.findById(decoded.userId)
            .populate('department')
            .populate('position')
            .populate({
                path: 'role',
                select: 'name value permission',
                populate: { path: 'permission', select: 'code' }
            })
        if (!currentUser) {
            req.logger.warn(`⚠️ Không tìm thấy user`);
            return res.status(401).send({ status: 'error', message: 'The user belonging to this token no longer exists.' });
        }

        if (currentUser.passwordChangedAt) {
            const changedTimestamp = Math.floor(currentUser.passwordChangedAt.getTime() / 1000);
            if (decoded.iat < changedTimestamp) {
                req.logger.warn(`⚠️ Vui lòng login lại ${currentUser?.username}`);
                return res.status(401).send({ status: 'error', message: 'Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.' });
            }
        }
        let userObj = currentUser.toObject();

        userObj.role = currentUser.role?.name;
        userObj.permission = currentUser.role?.permission?.map(p => p.code);
        // Grant access to protected route
        req.user = userObj;
        req.userId = userObj._id;
        next();
    } catch (err) {
        console.log('Invalid token. Please log in again!')
        res.status(401).send({ status: 'error', message: 'Invalid token. Please log in again!' });
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            return res.status(403).send({ status: 'error', message: 'You do not have permission to perform this action' });
        }
        next();
    };
};

const checkPermission = (permission) => {
    return (req, res, next) => {
        const user = req.user; // từ token decode ra
        if (!user.permission.includes(permission)) {
            return res.status(403).send({ status: 'error', message: 'You do not have permission to perform this action' });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    restrictTo,
    checkPermission
}; 