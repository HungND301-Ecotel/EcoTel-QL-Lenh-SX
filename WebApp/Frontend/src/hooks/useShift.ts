import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ShiftService from "../services/shiftService";
import { ShiftFilterState, ShiftFormInput } from "../types/Shift";

export const SHIFT_KEYS = {
  all: ["shifts"] as const,
  lists: () => [...SHIFT_KEYS.all, "list"] as const,
  list: (filters: ShiftFilterState & { page?: number; pageSize?: number }) =>
    [...SHIFT_KEYS.lists(), { ...filters }] as const,
  details: () => [...SHIFT_KEYS.all, "detail"] as const,
  detail: (id: string) => [...SHIFT_KEYS.details(), id] as const,
};

// 1. Hook lấy danh sách Ca làm việc
export const useShifts = (
  filters: ShiftFilterState & { page?: number; pageSize?: number } = {},
  enabled = true,
) => {
  return useQuery({
    queryKey: SHIFT_KEYS.list(filters),
    queryFn: () => ShiftService.getAll(filters),
    enabled,
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
  });
};

// 2. Hook lấy chi tiết 1 Ca
export const useShift = (id: string | undefined) => {
  return useQuery({
    queryKey: SHIFT_KEYS.detail(id || ""),
    queryFn: () => ShiftService.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// 3. Hook tổng hợp Mutations
export const useShiftMutations = () => {
  const queryClient = useQueryClient();

  const invalidateList = () => {
    queryClient.invalidateQueries({ queryKey: SHIFT_KEYS.lists() });
  };

  const create = useMutation({
    mutationFn: (data: Partial<ShiftFormInput>) => ShiftService.create(data),
    onSuccess: () => invalidateList(),
  });

  const update = useMutation({
    mutationFn: (data: Partial<ShiftFormInput> & { _id: string }) =>
      ShiftService.update(data),
    onSuccess: (res) => {
      invalidateList();
      if (res.data?._id) {
        queryClient.setQueryData(SHIFT_KEYS.detail(res.data._id), res.data);
      }
    },
  });

  const remove = useMutation({
    mutationFn: (ids: string[]) => ShiftService.delete(ids),
    onSuccess: () => invalidateList(),
  });

  return { create, update, remove };
};
