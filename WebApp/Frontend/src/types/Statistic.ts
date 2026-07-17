export interface TripInput {
    cargoType: string | null;
    tripCount: number;
    loadingHeight: number;
    loadingModel: string; // 'd', 'r', số...
    weightInTons: number;
    underload: number;
}

export interface GroupInput {
    excavatorId: string | null;
    loadingLocation: string | null;
    unloadingLocation: string | null;
    shuntingVehicle: string | null;
    trips: TripInput[];
}

export interface StatisticFormInput {
    workingDate: string | null; // Sẽ convert sang Date ISO khi gửi
    shift: string | null;
    vehicleId: string | null;
    driverLicenseId: string | null;
    staffLicenseId: string | null;
    initialGas: number;
    additionalGas: number;
    finalGas: number;
    vehicleSource: "INTERNAL" | "OUTSOURCED";
    groups: GroupInput[];
}

// --- CÁC TYPE CHO BẢNG HIỂN THỊ DỮ LIỆU ---
export interface StatisticFilterState {
    startTime?: string;
    endTime?: string;
    vehicleSource?: "INTERNAL" | "OUTSOURCED";
    vehicleTeam?: string;
    page?: number;
    limit?: number;
}

export interface StatisticRow {
    _id: string;
    workingDate: string;
    shift: any;
    device: any;
    driver: any;
    staff: any;
    excavator: any;
    fromLocation: any;
    toLocation: any;
    material: any;
    quantity: number;
    loadingModel: string;
    totalTon: number;
    underload: number;
    ton: number;
    cubicMeter: number;
    production: number;
    // Các trường Fuel được BE mix vào
    initialGas: number;
    additionalGas: number;
    finalGas: number;
    vehicleType: string;
    quality: string;
}