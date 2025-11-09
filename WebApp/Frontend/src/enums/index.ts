export enum JobTypeEnum {
    VEHICLE = "Vận hành xe",
    DRILL = "Vận hành khoan",
    SERVICE_VEHICLE = "Vận hành xe phục vụ",
    DOZER = "Vận hành gạt",
    EXCAVATOR = "Vận hành xúc",
    SIEVE = "Vận hành sàng",
    MAINTENANCE = "Sửa chữa, bảo dưỡng",
    PUMP = "Vận hành bơm",
    DISPATCHER = "Điều hành sản xuất",
    OTHER = "Khác"
}
export enum StatusDeviceEnum {
    AVAILABLE = 'available',
    IN_USE = 'in_use',
    MAINTENANCE = 'maintenance',
    RETIRED = 'retired',
};

export enum StatusOrderEnum {
    PENDING = 'pending',
    INPROGRESS = 'in_progress',
    COMPLETED = 'completed',
    WARNING = 'warning',
    CANCEL = 'cancel',
};
export enum RoleEnum {
    ADMIN = 'admin',
    DISPATCHER = 'dispatcher',
    MANAGER = 'manager',
    EMPLOYEE = 'employee',
};

export enum StatusRepairEnum {
    INPROGRESS = 'Chưa sửa xong',
    COMPLETED = 'Đã sửa xong',
}

export enum AcceptedProductEnum {
    LAND = 'Đất',
    COAL = 'Than',
};

export enum DeviceTypeEnum {
    VEHICLE = 'Xe',
    MACHINE = 'Máy',
};

export enum ReportEnum {
    INACTIVE_VEHICLES = 'Xe không hoạt động',
    EXCAVATOR_TRIP_LIST = 'Biểu chấm chuyến máy xúc',
    CAR_TRIP_LIST = 'Biểu chấm chuyến xe',
    WORK_REPORT_SLIP = 'Phiếu báo công',
    TIMESHEET = 'Bảng chấm công',
    MEAL_REPORT_SLIP = 'Phiếu báo ăn',
    SHIFT_HANDOVER = 'Giao nhận ca',
    STAFF_SHIFT_HANDOVER = 'Giao ca cán bộ',
    SHIFT_SUMMARY_GRADER = 'Tổng hợp số liệu trong ca (Máy gạt)',
    SHIFT_SUMMARY_DRILL = 'Tổng hợp số liệu trong ca (Máy khoan)',
    SHIFT_SUMMARY_EXCAVATOR = 'Tổng hợp số liệu trong ca (Máy xúc)',
    SHIFT_SUMMARY_CAR = 'Tổng hợp số liệu trong ca (Ô tô)',
    DATE_TRIP_CAR = 'Báo cáo chuyến',
    DAILY_PRODUCTION_EXCAVATOR_REPORT = 'Bản tổng hợp thống kê than, đất',
    DAILY_PRODUCTION_CAR_REPORT = 'Báo cáo sản lượng ngày',
    PRODUCTIVITY_CAR_REPORT = 'Báo cáo năng suất đầu xe',
    // Các báo cáo bị comment:
    // IN_KIND_ALLOWANCE_SLIP: 'Phiếu bồi dưỡng hiện vật',
    // OIL_RECEIPT_SLIP: 'Phiếu lĩnh dầu',
    // PRODUCTION_FUEL_MONITORING: 'Theo dõi sản lượng, nhiên liệu, dầu mỡ'
};