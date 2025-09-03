export interface User {
    _id: string;
    username: string;
    password?: string;
    fullName: string;
    gender: string;
    email?: string;
    phone?: string;
    avatar?: string;
    signature?: string;
    salaryCode?: String;
    department?: string,
    position?: string,
    role?: string,
    active: boolean,
    createdAt?: string;
    updatedAt?: string;
}

export interface Department {
    _id: string;
    name: string;
    code: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface Position {
    _id: string;
    name: string;
    note?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface DeviceType {
    _id: string;
    name: string;
    group: 'Xe' | 'Máy',
    createdAt?: string;
    updatedAt?: string;
}

export interface SafetyMeasure {
    _id: string;
    name: string;
    content: string;
    job?: string[],
    position?: string[],
    createdAt?: string;
    updatedAt?: string;
}
export interface Device {
    _id: string;
    name?: string;
    code: string;
    department: string;
    vehicleNumber?: string;
    category?: string;
    material?: string,
    fuelType?: string
    capacity?: number
    power?: number
    coordinates: {
        lat: number
        lng: number,
    },
    status: 'available' | 'in_use' | 'maintenance' | 'retired';
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}


export interface Order {
    _id: string;
    orderNumber: string;
    assignedTo: string;
    job: string;
    workingDate: Date;
    shift?: string;
    shiftHour?: string;
    devicesToProduce?: {
        deviceType: string,
        quantity: number,
    }[],
    startTime?: Date;
    endTime?: Date;
    device?: string[];
    excavator?: string[];
    location?: string[];
    material?: string[];
    distance?: number;
    liftHeight?: number;
    workContent?: string;
    assistants?: string[];
    status: 'pending' | 'in_progress' | 'completed' | 'warning' | 'cancel';
    previous_order_id?: string,
    note?: string;
    safetyMeasure?: string;
    safetyMeasureSpecific?: string;
    temporaryError?: string
    department?: string;
    createdBy: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Material {
    _id: string;
    name: string;
    density?: number;
    mass?: number;
    createdAt?: string;
    updatedAt?: string;
}
export interface Job {
    _id: string;
    name: string;
    type: 'Vận hành xe' | 'Vận hành khoan' | 'Vận hành xe phục vụ' | 'Vận hành gạt' | 'Vận hành xúc' | 'Vận hành sàng' | 'Khác',
    createdAt?: string;
    updatedAt?: string;
}
export interface Shift {
    _id: string;
    name: number;
    startTime: string;
    endTime: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface ShiftReportType {
    _id: string;
    orderId: string,
    assignedTo: string,
    vehicleSummaries:
    {
        vehicle?: string,
        repairHours?: number,
        travelHours?: number,
        fuelRemain?: number,
        fuelReceived?: number,
        fuelRemainEnd?: number,
        status?: string,
        note?: string,
        gpsStatus?: string,
        sealStatus?: string,
    }[],
    handoverHours?: number,
    otherHours?: number,
    handoverNotes?: string,
    risks?: string,
    createdAt?: string;
    updatedAt?: string;
}

export interface Report {
    _id: string;
    device: string,
    excavator?: string,
    fromLocation?: string,
    toLocation?: string,
    material?: string,
    distanceKm?: number,
    drillDepth?: number,
    hardnessF?: number,
    workingMinutes?: number,
    quantity?: number,
}
export interface Location {
    _id: string;
    name: string;
    distance: number; // in meters
    coordinates: {
        lat: number
        lng: number,
    },
    createdAt?: string;
    updatedAt?: string;
}

export interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    recipient: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
} 