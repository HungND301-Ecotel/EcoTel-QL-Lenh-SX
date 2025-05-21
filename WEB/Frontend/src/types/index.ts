export interface User {
    _id: string;
    username: string;
    password?: string;
    fullName: string;
    email: string;
    role: 'admin' | 'user';
    department: string | { _id: string; name: string };
    createdAt?: string;
    updatedAt?: string;
}

export interface Department {
    _id: string;
    name: string;
    code: string;
    description?: string;
    manager?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Device {
    _id: string;
    name: string;
    type: 'truck' | 'excavator' | 'bulldozer' | 'crane' | 'other';
    model: string;
    serialNumber: string;
    location: string;
    department: string | { _id: string; name: string };
    status: 'available' | 'in_use' | 'maintenance' | 'retired';
    specifications?: Record<string, any>;
    lastMaintenance?: string;
    nextMaintenance?: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Shift {
    _id: string;
    name: string;
    startTime: string;
    endTime: string;
    department: string;
    createdAt: string;
    updatedAt: string;
}

export interface Order {
    _id: string;
    orderNumber: string;
    shift: string;
    employee: string;
    device: string;
    location: string;
    workContent: string;
    safetyMeasures?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    startTime?: string;
    endTime?: string;
    workResult?: string;
    fuelConsumption?: number;
    handoverReport?: {
        equipmentStatus: string;
        notes: string;
        nextShift?: string;
        createdAt: string;
        createdBy: string;
    };
    createdBy: string;
    updatedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Report {
    _id: string;
    title: string;
    type: 'daily' | 'weekly' | 'monthly' | 'incident' | 'maintenance' | 'other';
    content: string;
    department: string | { _id: string; name: string };
    startDate?: string;
    endDate?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}
export interface Material {
    _id: string;
    name: string;
    type: 'material' | 'waste' | 'drilling' | 'roadwork' | 'repair' | 'other',
    createdAt?: string;
    updatedAt?: string;
}
export interface Location {
    _id: string;
    name: string;
    type: 'dumping' | 'screening' | 'station' | 'warehouse' | 'crushing' | 'drilling' | 'road' | 'other',
    coordinates: {
        lat:Number,
        lng:Number
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