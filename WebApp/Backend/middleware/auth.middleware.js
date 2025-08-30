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
        const currentUser = await User.findById(decoded.userId).populate('department').populate('position')
        if (!currentUser) {
            return res.status(401).send({ status: 'error', message: 'The user belonging to this token no longer exists.' });
        }

        // // 4) Check if user changed password after the token was issued
        // if (currentUser.changedPasswordAfter(decoded.iat)) {
        //     return res.status(401).send({ status: 'error', message: 'User recently changed password! Please log in again.' });
        // }

        // Grant access to protected route
        req.user = currentUser;
        req.userId = currentUser._id;
        next();
    } catch (err) {
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

module.exports = {
    verifyToken,
    restrictTo
}; 