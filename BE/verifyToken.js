const jwt = require('jsonwebtoken');
const User = require('./models/user');

const authentication = async (req, res, next) => {
    let idToken = '';
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        idToken = req.headers.authorization.split(' ')[1];
    }
    if (!idToken) {
        return res.status(401).send({ status: 'error', message: 'Bạn chưa xác thực người dùng.' })
    }
    const tokenDetail = jwt.verify(idToken, process.env.JWT_SECRET);
    const freshUser = await User.findById(tokenDetail.userId);
    if (!freshUser) {
        return res.status(404).send({ status: 'error', message: 'Người dùng không tồn tại.' })
    }
    req.user = freshUser;
    return next();
};
module.exports = authentication;
