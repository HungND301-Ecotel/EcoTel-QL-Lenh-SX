import api from "../config/api.config";

const StatisticService = {
  /**
   * 1. Lấy danh sách Thống kê dạng phẳng cho bảng DataGrid
   */
  getAll: async (params?: Record<string, any>): Promise<any> => {
    // API này trả về cả cục { data, totalDocs, statusCounts } nên ta return res.data
    const res = await api.get("/statistics/list", { params });
    return res.data;
  },

  /**
   * 2. Lấy dữ liệu khởi tạo cho Dropdown trong Modal (Xe tải, Máy xúc, Lái xe...)
   */
  getInitData: async (): Promise<any> => {
    const res = await api.get("/statistics/init-data");
    return res.data.data;
  },

  /**
   * 3. Lưu toàn bộ dữ liệu phức tạp từ Modal (Batch Save)
   */
  batchSave: async (data: any): Promise<any> => {
    const res = await api.post("/statistics/batch-save", data);
    return res.data;
  },

  batchDelete: async (ids: string[]): Promise<any> => {
    const res = await api.delete("/statistics/batch-delete", { data: { ids } });
    return res.data;
  },

  batchUpdate: async (reportId: string, data: any): Promise<any> => {
    const res = await api.put(`/statistics/batch-update/${reportId}`, data);
    return res.data;
  },

  /**
   * 4. Xuất file Excel cho danh sách Thống kê
   */
  exportFileList: async (
    mode: "INTERNAL" | "OUTSOURCED",
    selectedIds: string[],
    isSelectedAll: boolean,
    status?: string,
    startDate?: string,
    endDate?: string,
  ) => {
    const res = await api.post(
      `/statistics/export`,
      {
        mode: mode,
        orderIds: selectedIds,
        isSelectAll: isSelectedAll,
        status,
        startDate,
        endDate,
      },
      {
        responseType: "blob",
      },
    );

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Bao_Cao_Thong_Ke.xlsx`);

    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * 5. Import Excel
   */
  importExcel: async (file: File, mode: "INTERNAL" | "OUTSOURCED") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);

    const res = await api.post("/statistics/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
};

export default StatisticService;
