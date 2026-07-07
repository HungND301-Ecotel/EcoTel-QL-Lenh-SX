/**
 * Middleware kiểm tra quyền truy cập tài nguyên (tương đương PermissionFilter của Java)
 *
 * @param {string} resource - Tên module/tài nguyên (vd: 'devices', 'orders', 'users')
 * @param {string} action - Hành động mong muốn (c: create, r: read, u: update, d: delete, a: approve)
 */
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized: Bạn cần đăng nhập để thực hiện hành động này.",
      });
    }

    // 1. Trường hợp sử dụng Token Local: Tạm thời cho phép full-access (Full bypass như phương án A)
    if (user.tokenType === "LOCAL") {
      return next();
    }

    // 2. Trường hợp sử dụng Token Portal: Kiểm tra permissions claim trích xuất từ JWT
    const permissions = user.permissions;

    if (!permissions) {
      return res.status(403).json({
        status: "error",
        message: "Access Denied: Không tìm thấy quyền hạn đi kèm tài khoản.",
      });
    }

    // Lấy quyền của module cụ thể
    const perm = permissions[resource];
    if (!perm) {
      return res.status(403).json({
        status: "error",
        message: `Access Denied: Bạn không có quyền truy cập vào tài nguyên '${resource}'.`,
      });
    }

    // Kiểm tra quyền cụ thể dựa trên action (c, r, u, d, a)
    let hasAccess = false;
    switch (action) {
      case "c": // create
        hasAccess = !!perm.c;
        break;
      case "r": // read
        hasAccess = !!perm.r;
        break;
      case "u": // update
        hasAccess = !!perm.u;
        break;
      case "d": // delete
        hasAccess = !!perm.d;
        break;
      case "a": // approve
        hasAccess = !!perm.a;
        break;
      default:
        hasAccess = false;
    }

    if (!hasAccess) {
      return res.status(403).json({
        status: "error",
        message: `Access Denied: Bạn không có quyền thực hiện hành động '${action}' trên tài nguyên '${resource}'.`,
      });
    }

    next();
  };
};

module.exports = {
  requirePermission,
};
