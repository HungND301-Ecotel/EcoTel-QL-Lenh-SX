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