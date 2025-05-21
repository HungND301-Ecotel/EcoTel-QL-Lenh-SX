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
            return next(new AppError('You are not logged in! Please log in to get access.', 401));
        }
        console.log(token)

        // 2) Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3) Check if user still exists
        const currentUser = await User.findById(decoded.userId);
        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }

        // 4) Check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
            return next(new AppError('User recently changed password! Please log in again.', 401));
        }

        // Grant access to protected route
        req.user = currentUser;
        req.userId = currentUser._id;
        next();
    } catch (err) {
        next(new AppError('Invalid token. Please log in again!', 401));
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};

module.exports = {
    verifyToken,
    restrictTo
}; 