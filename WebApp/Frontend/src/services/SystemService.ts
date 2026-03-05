import api from "../config/api.config";
import { SystemInfo } from "../types";

const SystemService = {
  getAll: async (): Promise<SystemInfo> => {
    const res = await api.get("/system-info");
    return res.data;
  },
};

export default SystemService;
