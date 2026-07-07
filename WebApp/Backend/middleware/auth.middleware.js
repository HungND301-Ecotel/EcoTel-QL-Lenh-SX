const jwt = require("jsonwebtoken");
const { verifyPortalToken } = require("../utils/portalVerifier");
const User = require("../models/User");

/**
 * Middleware xác thực Token (hỗ trợ cả Token Local và Token Portal)
 */
const verifyToken = async (req, res, next) => {
  try {
    // 1) Lấy token từ header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).send({
        status: "error",
        message: "You are not logged in! Please log in to get access.",
      });
    }

    let decoded;
    let tokenType = "LOCAL";

    // 2) Giải mã và xác thực token
    try {
      // Thử verify bằng Local Secret Key trước
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (localErr) {
      try {
        // Nếu fail, thử verify bằng Portal JWKS (RSA)
        decoded = await verifyPortalToken(token);
        tokenType = "app";
      } catch (portalErr) {
        req.logger.warn(
          `⚠️ Token không hợp lệ cho cả Local lẫn Portal: ${portalErr.message}`,
        );
        return res.status(401).send({
          status: "error",
          message: "Invalid or expired token. Please log in again!",
        });
      }
    }

    // 3) Thiết lập req.user và req.userId tương ứng
    if (tokenType === "LOCAL") {
      // ── LUỒNG LOCAL TOKEN ──
      const currentUser = await User.findById(decoded.userId)
        .populate("department")
        .populate("position");
      if (!currentUser) {
        req.logger.warn(
          `⚠️ Không tìm thấy user local cho ID: ${decoded.userId}`,
        );
        return res.status(401).send({
          status: "error",
          message: "The user belonging to this token no longer exists.",
        });
      }

      if (currentUser.passwordChangedAt) {
        const changedTimestamp = Math.floor(
          currentUser.passwordChangedAt.getTime() / 1000,
        );
        if (decoded.iat < changedTimestamp) {
          req.logger.warn(
            `⚠️ Mật khẩu đã thay đổi, yêu cầu login lại: ${currentUser?.username}`,
          );
          return res.status(401).send({
            status: "error",
            message: "Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.",
          });
        }
      }

      req.user = currentUser.toObject();
      req.user.tokenType = "LOCAL";
      req.userId = currentUser._id;
    } else {
      // ── LUỒNG app TOKEN ──
      // Trích xuất trực tiếp thông tin và permissions từ Portal Token
      req.user = {
        _id: decoded.userId || decoded.sub,
        username: decoded.username || decoded.sub,
        fullName: decoded.fullName || decoded.sub,
        companyId: decoded.companyId,
        permissions: decoded.permissions || null,
        tokenType: "app",
      };
      req.userId = req.user._id;
    }

    next();
  } catch (err) {
    res.status(401).send({
      status: "error",
      message: "Invalid token. Please log in again!",
    });
  }
};

/**
 * Middleware kiểm tra quyền theo role (Duy trì cho các route cũ chưa chuyển sang requirePermission)
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Nếu là Portal token, ta bypass restrictTo cũ hoặc kiểm tra quyền qua resource/action
    // Để không làm gãy các endpoint cũ khi gọi bằng Portal token:
    // Nếu là portal token, coi như có role hợp lệ hoặc kiểm tra logic tương ứng.
    if (req.user?.tokenType === "app") {
      return next(); // Portal token dùng requirePermission middleware, cho phép qua restrictTo
    }

    if (!roles.includes(req.user?.role)) {
      return res.status(403).send({
        status: "error",
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  restrictTo,
};
