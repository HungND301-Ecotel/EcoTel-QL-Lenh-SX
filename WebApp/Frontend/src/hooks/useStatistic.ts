import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import StatisticService from "../services/statisticService";
import { StatisticFilterState, StatisticFormInput } from "../types/Statistic";

export const STATISTIC_KEYS = {
  all: ["statistics"] as const,
  lists: () => [...STATISTIC_KEYS.all, "list"] as const,
  list: (filters: any) => [...STATISTIC_KEYS.lists(), filters] as const,
  initDatas: () => [...STATISTIC_KEYS.all, "initData"] as const,
};

// 1. Hook lấy danh sách thống kê (Đã tích hợp phân trang chuẩn)
export const useStatistics = (
  params: StatisticFilterState = {},
  enabled = true,
) => {
  return useQuery({
    queryKey: STATISTIC_KEYS.list(params),
    queryFn: () => StatisticService.getAll(params),
    enabled,
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
  });
};

// 2. Hook lấy dữ liệu Dropdown (Chỉ gọi 1 lần khi mở Form)
export const useStatisticInitData = (enabled = false) => {
  return useQuery({
    queryKey: STATISTIC_KEYS.initDatas(),
    queryFn: () => StatisticService.getInitData(),
    enabled,
    staleTime: 30 * 60 * 1000, // Để lâu một chút vì danh mục ít đổi
  });
};

// 3. Hook tổng hợp các hành động (Lưu, Cập nhật, Xóa)
export const useStatisticMutations = () => {
  const queryClient = useQueryClient();

  const invalidateList = () => {
    queryClient.invalidateQueries({ queryKey: STATISTIC_KEYS.lists() });
  };

  const batchSave = useMutation({
    mutationFn: (data: StatisticFormInput) => StatisticService.batchSave(data),
    onSuccess: () => invalidateList(),
  });

  const batchUpdate = useMutation({
    mutationFn: ({
      reportId,
      data,
    }: {
      reportId: string;
      data: StatisticFormInput;
    }) => StatisticService.batchUpdate(reportId, data),
    onSuccess: () => invalidateList(),
  });

  const batchDelete = useMutation({
    mutationFn: (ids: string[]) => StatisticService.batchDelete(ids),
    onSuccess: () => invalidateList(),
  });

  return { batchSave, batchUpdate, batchDelete };
};
