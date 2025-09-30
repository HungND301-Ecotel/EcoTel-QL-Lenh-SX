import { useQuery } from "@tanstack/react-query";
import api from "../config/api.config";
import { Department } from "../types";

const DepartmentService = {
    getAll: async (params?: Record<string, any>): Promise<Department[]> => {
        const res = await api.get('/departments', { params });
        return res.data.data;
    },
    create: async (data: Partial<Department>): Promise<any> => {
        const res = await api.post('/departments', data);
        return res.data
    },
    update: async (data: Partial<Department>): Promise<any> => {
        const res = await api.put(`/departments/${data?._id}`, data);
        return res.data
    },
    delete: async (ids: string[]): Promise<any> => {
        const res = await api.delete(`/departments`, { data: { ids } });
        return res.data.message
    }
};

export default DepartmentService;