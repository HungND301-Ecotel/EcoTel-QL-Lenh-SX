import { useQuery } from "@tanstack/react-query";
import api from "../config/api.config";

const RoleService = {
    getAll: async (params?: Record<string, any>): Promise<any[]> => {
        const res = await api.get('/roles', { params });
        return res.data.data
    },
};

export default RoleService;