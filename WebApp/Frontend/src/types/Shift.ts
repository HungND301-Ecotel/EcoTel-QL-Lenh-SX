export interface Shift {
    _id: string;
    name: number;
    startTime?: string;
    endTime?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ShiftFormInput {
    name: number;
    startTime?: string;
    endTime?: string;
}

export interface ShiftFilterState {
    q?: string;
}

export interface ShiftRow extends Shift {
    _id: string;
}

