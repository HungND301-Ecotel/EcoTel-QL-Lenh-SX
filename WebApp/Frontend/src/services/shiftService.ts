import { useQuery } from "@tanstack/react-query";
import api from "../config/api.config";
import { Device, Location, Position, Shift } from "../types";

const ShiftService = {
    getAll: async (params?: Record<string, any>): Promise<Shift[]> => {
        const res = await api.get('/shifts', { params });
        return res.data.data
    },
    create: async (data: Partial<Shift>): Promise<any> => {
        const res = await api.post('/shifts', data);
        return res.data
    },
    update: async (data: Partial<Shift>): Promise<any> => {
        const res = await api.put(`/shifts/${data?._id}`, data);
        return res.data
    },
    delete: async (ids: string[]): Promise<any> => {
        const res = await api.delete(`/shifts`, { data: { ids } });
        return res.data.message
    },
};

export default ShiftService;