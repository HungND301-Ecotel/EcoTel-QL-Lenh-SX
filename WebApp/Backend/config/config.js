const JOB_TYPE = {
    VAN_HANH_XE: 'Vận hành xe',
    VAN_HANH_KHOAN: 'Vận hành khoan',
    VAN_HANH_XE_PHUC_VU: 'Vận hành xe phục vụ',
    VAN_HANH_GAT: 'Vận hành gạt',
    VAN_HANH_XUC: 'Vận hành xúc',
    VAN_HANH_SANG: 'Vận hành sàng',
    SUA_CHUA_BAO_DUONG: 'Sửa chữa, bảo dưỡng',
    VAN_HANH_BOM: 'Vận hành bơm',
    DIEU_HANH_SAN_XUAT: 'Điều hành sản xuất',
    KHAC: 'Khác',
};
const JOB_TYPES = Object.values(JOB_TYPE);

const STATUS_ORDER = {
    PENDING: 'pending',
    INPROGRESS: 'in_progress',
    COMPLETED: 'completed',
    WARNING: 'warning',
    CANCEL: 'cancel',
};
const STATUS_ORDERS = Object.values(STATUS_ORDER);

const ROLE = {
    ADMIN: 'admin',
    DISPATCHER: 'dispatcher',
    MANAGER: 'manager',
    EMPLOYEE: 'employee',
};
const ROLES = Object.values(STATUS_ORDER);


const STATUS_DEVICE = {
    AVAILABLE: 'available',
    IN_USE: 'in_use',
    MAINTENANCE: 'maintenance',
    RETIRED: 'retired',
};
const STATUS_DEVICES = Object.values(STATUS_DEVICE);

const STATUS_REPAIR = {
    INPROGRESS: 'Chưa sửa xong',
    COMPLETED: 'Đã sửa xong',
};
const STATUS_REPAIRS = Object.values(STATUS_REPAIR);

const ACCEPTED_PRODUCT = {
    LAND: 'Đất',
    COAL: 'Than',
};
const ACCEPTED_PRODUCTS = Object.values(ACCEPTED_PRODUCT);


module.exports = {
    JOB_TYPE, JOB_TYPES,
    STATUS_ORDER, STATUS_ORDERS,
    ROLE, ROLES,
    STATUS_DEVICE, STATUS_DEVICES,
    STATUS_REPAIR, STATUS_REPAIRS,
    ACCEPTED_PRODUCT,ACCEPTED_PRODUCTS
};
