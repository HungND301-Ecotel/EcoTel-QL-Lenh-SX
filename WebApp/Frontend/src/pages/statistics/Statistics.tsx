import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useStatistics,
  useStatisticInitData,
  useStatisticMutations,
} from "../../hooks/useStatistic";
import {
  Box,
  Grid,
  IconButton,
  Typography,
  Tooltip,
  Paper,
  AlertColor,
  LinearProgress,
  Breadcrumbs,
  DialogContent,
  Dialog,
  DialogTitle,
  Divider,
} from "@mui/material";
import { format } from "date-fns";
import { Edit as EditIcon, CancelOutlined } from "@mui/icons-material";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";

import {
  AlertSnackbar,
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { useAtom } from "jotai";
import { useLocation } from "react-router-dom";
import { userAtom } from "../../atoms/userAtoms";

import { GridColDef } from "@mui/x-data-grid";
import { StatusOrderEnum } from "../../enums/index";
import StatisticService from "../../services/statisticService";
import { parseAxiosError } from "../../utils/handleApiError";
import { ImportResponse } from "../../types/ImportResponse";
import StatisticsToolbar from "./components/StatisticsToolbar/StatisticsToolbar";
import CustomDataGrid from "../../components/Table/CustomDataGrid";
import { StatisticsModal } from "./components/StatisticsModal/StatisticsModal";
import ImportErrorDialog from "../../components/Modal/ImportErrorDialog";

const Statistics: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [value, _setValue] = useState("");
  const [_user] = useAtom(userAtom);
  const queryClient = useQueryClient();
  const [info, setInfo] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [importResponse, setImportResponse] = useState<ImportResponse | null>(
    null,
  );
  const [openImportErrorModal, setOpenImportErrorModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [vehicleDepartments, setVehicleDepartments] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // SỬA LỖI 2: Dùng form để quản lý toàn bộ bộ lọc
  const { control, watch } = useForm({
    defaultValues: {
      startTime: null,
      endTime: null,
      department: "",
    },
  });
  const { startTime, endTime, department } = watch();

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setSelectedOrder(null);
        setStatsModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const location = useLocation();
  const pageMode = location.pathname.includes("external-trucks")
    ? "OUTSOURCED"
    : "INTERNAL";

  const formRef = useRef<HTMLDivElement>(null);

  const [serverFilters, _setServerFilters] = useState<
    Record<string, string | null>
  >({});

  // 2. Tạo object chứa TOÀN BỘ các tham số bộ lọc (từ form, grid, URL...)
  const filterParams = {
    page,
    limit: pageSize,
    department: department || undefined,
    startTime: startTime ? dayjs(startTime).format("YYYY-MM-DD") : undefined,
    endTime: endTime ? dayjs(endTime).format("YYYY-MM-DD") : undefined,
    q: value,
    vehicleSource: pageMode, // "INTERNAL" hoặc "OUTSOURCED"
    // Gộp thêm các filter do người dùng bấm trực tiếp trên DataGrid (nếu có)
    ...serverFilters,
  };

  // 3. GỌI HOOK LẤY DANH SÁCH (Hook sẽ tự track filterParams để refetch)
  const {
    data: statsRes,
    isLoading,
    refetch: refetchOrder,
  } = useStatistics(filterParams as any);

  // Bóc tách dữ liệu chuẩn xác
  const orders = statsRes?.data || [];
  const total = statsRes?.totalDocs || 0;

  // 4. GỌI HOOK LẤY DỮ LIỆU KHỞI TẠO (Cho Dropdown Đơn vị, Đội xe)
  const { data: initData } = useStatisticInitData(true);

  // 5. GỌI HOOK MUTATIONS (Để xóa)
  const { batchDelete } = useStatisticMutations();

  useEffect(() => {
    if (initData?.trucks) {
      const deptsMap = new Map();
      initData.trucks.forEach((t: any) => {
        if (t.department && t.department._id) {
          deptsMap.set(t.department._id, t.department);
        }
      });
      setVehicleDepartments(Array.from(deptsMap.values()));
    }
  }, [initData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        setSelectedOrder(null);
        setStatsModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isSelectAll = orders.length > 0 && selectedIds.length === orders.length;

  const [isDownloadLoading, setIsDownloadLoading] = useState(false);

  const reportListorderExcel = useMutation({
    mutationFn: () =>
      StatisticService.exportFileList(
        pageMode as "INTERNAL" | "OUTSOURCED",
        selectedIds,
        isSelectAll,
        undefined,
        startTime ? dayjs(startTime).format("YYYY-MM-DD") : undefined,
        endTime ? dayjs(endTime).format("YYYY-MM-DD") : undefined,
      ),
    onMutate: () => {
      setIsDownloadLoading(true);
    },
    onSuccess: () => {
      showSuccessAlert("Xuất file thành công");
      setIsDownloadLoading(false);
    },
    onError: async (error: any) => {
      setIsDownloadLoading(false);
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const handleClose = () => {
    setSelectedOrder(null);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      return showErrorAlert("Không tìm thấy bản ghi cần xóa");
    }
    const message = `Bạn có thể xóa ${selectedIds.length} bản ghi. Bạn có muốn xóa?`;

    showConfirmAlert(message).then((result) => {
      if (result.isConfirmed) {
        batchDelete
          .mutateAsync(selectedIds)
          .then(() => {
            setSelectedIds([]);
            showSuccessAlert("Xóa thành công");
            handleClose();
          })
          .catch((error: any) => {
            showErrorAlert(error.response?.data?.message || "Lỗi khi xóa");
          });
      }
    });
  };

  const colSTT: GridColDef = {
    headerName: "STT",
    field: "number",
    width: 50,
    minWidth: 50,
    maxWidth: 50,
    align: "center",
    headerAlign: "center",
    renderCell: (p: any) => {
      let index = -1;
      if (p.api && p.api.getAllRowIds) {
        index = p.api.getAllRowIds().indexOf(p.id);
      } else {
        const rowId = p.id || p.row?._id;
        index = orders.findIndex((o: any) => o._id === rowId);
      }
      return index !== -1 ? page * pageSize + index + 1 : "-";
    },
  };

  const colEdit: GridColDef = {
    headerName: "Sửa",
    field: "actions",
    width: 60,
    align: "left",
    headerAlign: "left",
    filterable: false,
    sortable: false,
    disableColumnMenu: true,
    renderCell: (p: any) => (
      <IconButton
        color="primary"
        onClick={() => {
          setSelectedOrder(p.row);
          setStatsModalOpen(true);
        }}
      >
        <Tooltip title="Sửa thống kê">
          <EditIcon />
        </Tooltip>
      </IconButton>
    ),
  };

  const orderColumns: GridColDef[] =
    pageMode === "INTERNAL"
      ? [
          colSTT,
          {
            headerName: "Số xe",
            field: "vehicle",
            width: 100,
            renderCell: (p: any) => p.row.device?.code || "",
          },
          { headerName: "Loại xe", field: "vehicleType", width: 100 },
          { headerName: "Chất lượng", field: "quality", width: 100 },
          {
            headerName: "Đội xe",
            field: "vehicleTeam",
            width: 170,
            renderCell: (p: any) => {
              const dept = p.row.device?.department?.code || "";
              return dept || "";
            },
          },
          {
            headerName: "Số sổ lương lái",
            field: "salaryCode",
            width: 130,
            align: "left",
            renderCell: (p: any) => p.row.driver?.salaryCode || "",
          },
          {
            headerName: "Lái xe",
            field: "driver",
            width: 150,
            renderCell: (p: any) => p.row.driver?.fullName || "",
          },
          {
            headerName: "Đội lái",
            field: "driverTeam",
            width: 170,
            renderCell: (p: any) => p.row.driver?.department?.code || "",
          },
          {
            headerName: "Số sổ lương cán bộ",
            field: "staffLicenseId",
            width: 150,
            align: "left",
            renderCell: (p: any) => p.row.staff?.salaryCode || "",
          },
          {
            headerName: "Ca làm việc",
            field: "shift",
            width: 100,
            align: "left",
            renderCell: (p: any) => p.row.shift?.name || p.row.shift || "",
          },
          {
            headerName: "Lệnh xe ngày",
            field: "workingDate",
            width: 120,
            align: "left",
            renderCell: (p: any) =>
              p.row.workingDate
                ? format(new Date(p.row.workingDate), "dd/MM/yyyy")
                : "",
          },
          {
            headerName: "Gas tồn đầu",
            field: "initialGas",
            width: 100,
            align: "left",
          },
          {
            headerName: "Dầu nhờn lĩnh",
            field: "additionalGas",
            width: 100,
            align: "left",
          },
          {
            headerName: "Gas tồn cuối",
            field: "finalGas",
            width: 100,
            align: "left",
          },
          {
            headerName: "Gas tiêu thụ",
            field: "consumedGas",
            width: 100,
            align: "left",
            renderCell: (p: any) => {
              if (
                p.row.initialGas === "" &&
                p.row.additionalGas === "" &&
                p.row.finalGas === ""
              ) {
                return "";
              }
              return (
                (Number(p.row.initialGas) || 0) +
                (Number(p.row.additionalGas) || 0) -
                (Number(p.row.finalGas) || 0)
              );
            },
          },
          {
            headerName: "Thiết bị xúc",
            field: "excavator",
            width: 100,
            renderCell: (p: any) => p.row.excavator?.code || "",
          },
          {
            headerName: "Vị trí chất tải",
            field: "fromLocation",
            width: 130,
            renderCell: (p: any) => p.row.fromLocation?.symbol || "",
          },
          {
            headerName: "Vị trí dỡ tải",
            field: "toLocation",
            width: 130,
            renderCell: (p: any) => p.row.toLocation?.symbol || "",
          },
          {
            headerName: "Xe quay tải",
            field: "shuntingVehicle",
            width: 100,
            renderCell: (p: any) => p.row.shuntingVehicle?.code || "",
          },
          { headerName: "Độ cao chất tải", field: "loadingHeight", width: 130 },
          {
            headerName: "Loại hàng",
            field: "material",
            width: 120,
            renderCell: (p: any) => p.row.material?.symbol || "",
          },
          {
            headerName: "Số chuyến",
            field: "tripCount",
            width: 90,
            align: "left",
            renderCell: (p: any) => p.row.totalQuantity || p.row.quantity || 0,
          },
          { headerName: "Mô hình chất tải", field: "loadingModel", width: 130 },
          {
            headerName: "Tấn (Cân)",
            field: "weight",
            width: 90,
            align: "left",
            renderCell: (p: any) => p.row.totalTon || 0,
          },
          {
            headerName: "Trừ vơi tải",
            field: "underload",
            width: 100,
            align: "left",
          },
          colEdit,
        ]
      : [
          colSTT,
          {
            headerName: "Số xe",
            field: "vehicle",
            width: 100,
            renderCell: (p: any) => p.row.device?.code || "",
          },
          {
            headerName: "Đơn vị thuê ngoài",
            field: "team",
            width: 150,
            renderCell: (p: any) => p.row.device?.department?.code || "",
          },
          { headerName: "Loại xe", field: "vehicleType", width: 100 },
          {
            headerName: "Ca làm việc",
            field: "shift",
            width: 100,
            align: "left",
            renderCell: (p: any) => p.row.shift?.name || p.row.shift || "",
          },
          {
            headerName: "Lệnh xe ngày",
            field: "workingDate",
            width: 120,
            align: "left",
            renderCell: (p: any) =>
              p.row.workingDate
                ? format(new Date(p.row.workingDate), "dd/MM/yyyy")
                : "",
          },
          {
            headerName: "Thiết bị xúc",
            field: "excavator",
            width: 100,
            renderCell: (p: any) => p.row.excavator?.code || "",
          },
          {
            headerName: "Vị trí chất tải",
            field: "fromLocation",
            width: 130,
            renderCell: (p: any) => p.row.fromLocation?.symbol || "",
          },
          {
            headerName: "Vị trí dỡ tải",
            field: "toLocation",
            width: 130,
            renderCell: (p: any) => p.row.toLocation?.symbol || "",
          },
          {
            headerName: "Xe quay tải",
            field: "shuntingVehicle",
            width: 100,
            renderCell: (p: any) => p.row.shuntingVehicle?.code || "",
          },
          { headerName: "Độ cao chất tải", field: "loadingHeight", width: 130 },
          {
            headerName: "Loại hàng",
            field: "material",
            width: 120,
            renderCell: (p: any) => p.row.material?.symbol || "",
          },
          {
            headerName: "Số chuyến",
            field: "tripCount",
            width: 90,
            align: "left",
            renderCell: (p: any) => p.row.totalQuantity || p.row.quantity || 0,
          },
          { headerName: "Mô hình chất tải", field: "loadingModel", width: 130 },
          {
            headerName: "Trừ vơi tải",
            field: "underload",
            width: 100,
            align: "left",
          },
          colEdit,
        ];

  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity?: AlertColor;
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Hàm xử lý upload mới (Nhận thẳng file từ OrderToolbar trả lên)
  const handleImportFile = async (file: File) => {
    setIsImporting(true);
    try {
      const res = await StatisticService.importExcel(
        file,
        pageMode as "INTERNAL" | "OUTSOURCED",
      );
      const summary = res as ImportResponse;
      setImportResponse(summary);
      setOpenImportErrorModal(true);
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
    } catch (error: any) {
      showErrorAlert(
        error.response?.data?.message || "Lỗi hệ thống khi Import file!",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refetchOrder();
      setAlert({
        open: true,
        message: "Cập nhật thành công",
        severity: "success",
      });
    } catch (e) {
      setAlert({ open: true, message: "Cập nhật thất bại", severity: "error" });
    }
  };

  return (
    <Box>
      <AlertSnackbar alert={alert} setAlert={setAlert} />

      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Typography>Thống kê</Typography>
        <Typography color="text.primary" sx={{ fontWeight: 500 }}>
          {pageMode === "OUTSOURCED" ? "Xe thuê ngoài" : "Xe trong mỏ"}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h3" color={"blue"}>
          {pageMode === "OUTSOURCED"
            ? "Thống kê xe thuê ngoài"
            : "Thống kê xe trong mỏ"}
        </Typography>
      </Box>

      {/* --- THANH CÔNG CỤ (TOOLBAR) ĐÃ ĐƯỢC GIẢI PHÓNG KHỎI ACCORDION --- */}
      <Paper
        ref={formRef}
        elevation={0}
        sx={{
          p: 2, // Thêm padding cho rộng rãi
          mb: 2, // Cách DataGrid ở dưới một chút
          border: "1px solid",
          borderColor: "divider", // Đường viền mỏng theo chuẩn MUI v7
          borderRadius: 2, // Bo góc cho mềm mại
          backgroundColor: "#fff",
        }}
      >
        <StatisticsToolbar
          control={control}
          vehicleDepartments={vehicleDepartments}
          onAdd={() => {
            setSelectedOrder(null);
            setStatsModalOpen(true);
          }}
          onDelete={handleDelete}
          onExport={() => reportListorderExcel.mutate()}
          onImport={handleImportFile}
          isImporting={isImporting}
          isLoading={isLoading}
          showDetail={showDetail}
          onToggleDetail={() => setShowDetail(!showDetail)}
          onRefresh={handleRefresh}
        />
      </Paper>

      {isDownloadLoading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" align="center">
            Đang xử lý...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {/* <Box
        sx={{
          display: "flex",
          width: "100%",
          height: "70vh",
          mb: 2,
          mt: 2,
          overflow: "hidden",
        }}
      > */}
      <Box
        sx={{
          width: showDetail ? "75%" : "100%",
          transition: "width 0.3s ease",
          // height: "100%",
        }}
      >
        <CustomDataGrid
          // SỬA TẠI ĐÂY: Truyền dữ liệu và phân trang
          rows={orders}
          defaultColumns={orderColumns.map((col) => ({
            ...col,
            id: col.field,
            label: col.headerName ?? "",
          }))}
          // // contextMenuActions={isAdmin ? contextActions : []}
          // pinnedColumns={["number", "vehicle", "actions"]}
          isLoading={isLoading}
          onSelectionChange={setSelectedIds}
          // onRefresh={() => handleRefresh()}
          getRowId={(row: any) => row._id}
          paginationMode="server"
          rowCount={total}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          onRowClick={(params) => setSelectedRow(params.row)}
          sx={{
            minHeight: 500,
            height: 600,
            "& .MuiDataGrid-main": {
              overflow: "auto",
            },
          }}
        />
        {/* <DataGrid
            pageSizeOptions={[20, 50, 100]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            columns={orderColumns}
            rows={orders}
            rowCount={total}
            loading={isLoading}
            disableRowSelectionOnClick
            getRowId={(row) => row._id}
            rowSelectionModel={
              {
                type: "include",
                ids: new Set(selectedOrders.map((o) => o._id)),
              } as any
            }
            onRowSelectionModelChange={(model: any) => {
              const newIdsArray = Array.from(model?.ids || []);
              const selected = orders.filter((row: any) =>
                newIdsArray.includes(row._id),
              );
              setSelectedOrders(selected);
            }}
            onRowClick={(params) => setSelectedRow(params.row)}
            getRowClassName={(params) => {
              const record = params.row;
              let base = "";

              switch (record.status) {
                case StatusOrderEnum.PENDING:
                  base = "row-pending";
                  break;
                case StatusOrderEnum.INPROGRESS:
                  base = "row-in-progress";
                  break;
                case StatusOrderEnum.COMPLETED:
                  base = "row-completed";
                  break;
                case StatusOrderEnum.WARNING:
                  base = "row-warning";
                  break;
                case StatusOrderEnum.CANCEL:
                  base = "row-cancel";
                  break;
              }
              return `${base} ${selectedRow?._id === record._id ? "row-selected" : ""}`;
            }}
            disableVirtualization={true}
            filterMode="server"
            initialState={{
              density: "compact",
            }}
            slots={{ toolbar: GridToolbar }}
            localeText={{
              toolbarColumns: "Cột",
              toolbarFilters: "Bộ lọc",
              toolbarDensity: "Mật độ",
              toolbarExport: "Xuất dữ liệu",
            }}
            slotProps={{
              filterPanel: { disableAddFilterButton: false },
              toolbar: {
                csvOptions: { disableToolbarButton: true },
                printOptions: { disableToolbarButton: true },
              },
            }}
            onFilterModelChange={(model) => {
              const filters: Record<string, string> = {};
              model.items.forEach((item) => {
                if (item.value) {
                  filters[item.field] = item.value;
                }
              });
              setServerFilters(filters);
            }}
            sx={{
              "& .MuiDataGrid-virtualScroller": { overflowX: "auto" },
              "& .MuiDataGrid-columnHeaderCheckbox, & .MuiDataGrid-cellCheckbox":
                {
                  position: "sticky !important",
                  left: "0 !important",
                  zIndex: "11 !important",
                  backgroundColor: "#fff !important",
                },
              '& .MuiDataGrid-columnHeader[data-field="number"], & .MuiDataGrid-cell[data-field="number"]':
                {
                  position: "sticky !important",
                  left: "50px !important",
                  zIndex: "11 !important",
                  backgroundColor: "#fff !important",
                },
              '& .MuiDataGrid-columnHeader[data-field="vehicle"], & .MuiDataGrid-cell[data-field="vehicle"]':
                {
                  position: "sticky !important",
                  left: "100px !important",
                  zIndex: "11 !important",
                  backgroundColor: "#fff !important",
                  boxShadow: "2px 0 4px -2px rgba(0,0,0,0.2) !important",
                },
              '& .MuiDataGrid-columnHeader[data-field="team"], & .MuiDataGrid-cell[data-field="team"]':
                {
                  position: "sticky !important",
                  left: "200px !important",
                  zIndex: "11 !important",
                  backgroundColor: "#fff !important",
                  boxShadow: "2px 0 4px -2px rgba(0,0,0,0.2) !important",
                },
              "& .MuiDataGrid-columnHeader[data-field='edit']": {
                position: "sticky !important",
                right: "0px !important",
                zIndex: "13 !important",
                backgroundColor: "#fff !important",
                boxShadow: "-2px 0 4px -2px rgba(0,0,0,0.2) !important",
              },
              "& .MuiDataGrid-cell[data-field='edit']": {
                position: "sticky !important",
                right: "0px !important",
                zIndex: "11 !important",
                backgroundColor: "#fff !important",
                boxShadow: "-2px 0 4px -2px rgba(0,0,0,0.2) !important",
              },
              "& .MuiDataGrid-virtualScrollerContent": {
                width: "100% !important",
              },
              "& .MuiDataGrid-columnHeaders": { zIndex: "12 !important" },
              "& .MuiDataGrid-row:hover .MuiDataGrid-cell": {
                backgroundColor: "#f5f5f5",
              },
              "& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field='number'], & .MuiDataGrid-row:hover .MuiDataGrid-cellCheckbox, & .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field='vehicle'], & .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field='team'], & .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field='edit']":
                { backgroundColor: "#f5f5f5 !important" },
              "& .MuiDataGrid-main": {
                flexGrow: 0,
                flexShrink: 1,
                flexBasis: "auto",
              },
            }}
          /> */}
      </Box>

      <Box
        sx={{
          width: showDetail ? "25%" : "0%",
          transition: "width 0.3s ease",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: "100%",
            minWidth: "250px",
            height: "100%",
            pl: 2,
            boxSizing: "border-box",
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              p: 2,
              border: "1px solid #ddd",
              borderRadius: 1,
              bgcolor: "background.paper",
              boxShadow: 2,
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="h6" fontWeight="bold">
                Chi tiết lệnh
              </Typography>
              <IconButton onClick={() => setShowDetail(false)} size="small">
                <CancelOutlined />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 1 }} />

            <Box
              sx={{
                flexGrow: 1,
                overflowY: "auto",
                pr: 1,
                "& .MuiTypography-root": { mb: 1.5, fontSize: "0.9rem" },
              }}
            >
              {selectedRow ? (
                pageMode === "INTERNAL" ? (
                  <>
                    <Typography>
                      <strong>Số xe:</strong>{" "}
                      {selectedRow.device?.code || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Loại xe:</strong>{" "}
                      {selectedRow.vehicleType || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Chất lượng:</strong>{" "}
                      {selectedRow.quality || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Đội:</strong>{" "}
                      {(() => {
                        const dept =
                          selectedRow.device?.department?.code ||
                          selectedRow.device?.department?.name ||
                          "";
                        return dept || "N/A";
                      })()}
                    </Typography>
                    <Typography>
                      <strong>Số sổ lương lái:</strong>{" "}
                      {selectedRow.driver?.salaryCode || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Lái xe:</strong>{" "}
                      {selectedRow.driver?.fullName || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Đội:</strong>{" "}
                      {(() => {
                        const dept =
                          selectedRow.driver?.department?.name ||
                          selectedRow.driver?.department?.code ||
                          "";
                        if (dept) return `${dept}`;
                        return dept || "N/A";
                      })()}
                    </Typography>
                    <Typography>
                      <strong>Số sổ lương cán bộ:</strong>{" "}
                      {selectedRow.staff?.salaryCode || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Ca làm việc:</strong>{" "}
                      {selectedRow.shift?.name || selectedRow.shift || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Lệnh xe ngày:</strong>{" "}
                      {selectedRow.workingDate
                        ? format(
                            new Date(selectedRow.workingDate),
                            "dd/MM/yyyy",
                          )
                        : "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Gas tồn đầu:</strong>{" "}
                      {selectedRow.initialGas || 0}
                    </Typography>
                    <Typography>
                      <strong>Dầu nhờn lĩnh:</strong>{" "}
                      {selectedRow.additionalGas || 0}
                    </Typography>
                    <Typography>
                      <strong>Gas tồn cuối:</strong> {selectedRow.finalGas || 0}
                    </Typography>
                    <Typography>
                      <strong>Gas tiêu thụ:</strong>{" "}
                      {(selectedRow.initialGas || 0) +
                        (selectedRow.additionalGas || 0) -
                        (selectedRow.finalGas || 0)}
                    </Typography>
                    <Typography>
                      <strong>Thiết bị xúc:</strong>{" "}
                      {selectedRow.excavator?.code || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Vị trí chất tải:</strong>{" "}
                      {selectedRow.fromLocation?.symbol || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Vị trí dỡ tải:</strong>{" "}
                      {selectedRow.toLocation?.symbol || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Xe quay tải:</strong>{" "}
                      {selectedRow.shuntingVehicle?.code || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Độ cao chất tải:</strong>{" "}
                      {selectedRow.loadingHeight || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Loại hàng:</strong>{" "}
                      {selectedRow.material?.symbol || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Số chuyến:</strong>{" "}
                      {selectedRow.totalQuantity || selectedRow.quantity || 0}
                    </Typography>
                    <Typography>
                      <strong>Mô hình chất tải:</strong>{" "}
                      {selectedRow.loadingModel || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Tấn (Cân):</strong> {selectedRow.totalTon || 0}
                    </Typography>
                    <Typography>
                      <strong>Trừ vơi tải:</strong> {selectedRow.underload || 0}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography>
                      <strong>Số xe:</strong>{" "}
                      {selectedRow.device?.code || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Đội thuê ngoài:</strong>{" "}
                      {selectedRow.device?.department?.code ||
                        selectedRow.device?.department?.name ||
                        "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Loại xe:</strong>{" "}
                      {selectedRow.vehicleType || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Dung tích:</strong> {selectedRow.quality || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Ca làm việc:</strong>{" "}
                      {selectedRow.shift?.name || selectedRow.shift || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Lệnh xe ngày:</strong>{" "}
                      {selectedRow.workingDate
                        ? format(
                            new Date(selectedRow.workingDate),
                            "dd/MM/yyyy",
                          )
                        : "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Thiết bị xúc:</strong>{" "}
                      {selectedRow.excavator?.code || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Vị trí chất tải:</strong>{" "}
                      {selectedRow.fromLocation?.symbol || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Vị trí dỡ tải:</strong>{" "}
                      {selectedRow.toLocation?.symbol || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Xe quay tải:</strong>{" "}
                      {selectedRow.shuntingVehicle?.code || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Độ cao chất tải:</strong>{" "}
                      {selectedRow.loadingHeight || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Loại hàng:</strong>{" "}
                      {selectedRow.material?.symbol || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Số chuyến:</strong>{" "}
                      {selectedRow.totalQuantity || selectedRow.quantity || 0}
                    </Typography>
                    <Typography>
                      <strong>Mô hình chất tải:</strong>{" "}
                      {selectedRow.loadingModel || "N/A"}
                    </Typography>
                    <Typography>
                      <strong>Trừ vơi tải:</strong> {selectedRow.underload || 0}
                    </Typography>
                  </>
                )
              ) : (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="100%"
                >
                  <Typography color="text.secondary">
                    Chọn một hàng để xem chi tiết
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      {/* </Box> */}

      <Dialog
        open={info}
        onClose={() => setInfo(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "primary.main",
            color: "white",
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Thông tin chi tiết thống kê
          </Typography>
          <IconButton onClick={() => setInfo(false)} sx={{ color: "white" }}>
            <CancelOutlined />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, bgcolor: "background.paper" }}>
          {selectedRow ? (
            <Box>
              <Typography
                variant="subtitle1"
                color="primary"
                fontWeight="bold"
                sx={{ mb: 1 }}
              >
                1. THÔNG TIN CHUNG
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>Lệnh xe ngày: </strong>
                    {selectedRow.workingDate
                      ? format(new Date(selectedRow.workingDate), "dd/MM/yyyy")
                      : ""}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>Ca làm việc: </strong>{" "}
                    {selectedRow.shift?.name || selectedRow.shift}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>Đơn vị/Phòng ban: </strong>{" "}
                    {selectedRow.assignedTo?.department?.code}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>CB trực ca: </strong>{" "}
                    {selectedRow.staff?.fullName || ""}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>Sổ lương CB: </strong>{" "}
                    {selectedRow.staff?.salaryCode || ""}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ my: 2, borderBottom: "1px dashed #ccc" }} />

              <Typography
                variant="subtitle1"
                color="primary"
                fontWeight="bold"
                sx={{ mb: 1 }}
              >
                2. PHƯƠNG TIỆN & LÁI XE
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {pageMode === "OUTSOURCED" && (
                  <Grid item xs={12} md={4}>
                    <Typography>
                      <strong>Đơn vị thuê ngoài: </strong>{" "}
                      {selectedRow.device?.department?.code ||
                        selectedRow.device?.department?.name ||
                        selectedRow.team ||
                        "N/A"}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>Số xe: </strong> {selectedRow.device?.code}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>Loại xe: </strong> {selectedRow.vehicleType}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>
                      {pageMode === "OUTSOURCED" ? "Dung tích" : "Chất lượng"}
                      :{" "}
                    </strong>
                    {selectedRow.quality}
                  </Typography>
                </Grid>

                {pageMode === "INTERNAL" && (
                  <>
                    <Grid item xs={12} md={4}>
                      <Typography>
                        <strong>Đội: </strong>
                        {(() => {
                          const dept =
                            selectedRow.device?.department?.name ||
                            selectedRow.device?.department?.code ||
                            "";
                          if (dept) return `${dept}`;
                          return dept || "";
                        })()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography>
                        <strong>Tên lái xe: </strong>{" "}
                        {selectedRow.driver?.fullName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography>
                        <strong>Sổ lương lái xe: </strong>{" "}
                        {selectedRow.driver?.salaryCode}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>

              {pageMode === "INTERNAL" && (
                <>
                  <Box sx={{ my: 2, borderBottom: "1px dashed #ccc" }} />
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    fontWeight="bold"
                    sx={{ mb: 1 }}
                  >
                    3. NHIÊN LIỆU
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={3}>
                      <Typography>
                        <strong>Gas tồn đầu: </strong>{" "}
                        {selectedRow.initialGas || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography>
                        <strong>Dầu nhờn lĩnh: </strong>{" "}
                        {selectedRow.additionalGas || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography>
                        <strong>Gas tồn cuối: </strong>{" "}
                        {selectedRow.finalGas || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography>
                        <strong style={{ color: "red" }}>Gas tiêu thụ: </strong>
                        {(
                          Number(selectedRow.initialGas || 0) +
                          Number(selectedRow.additionalGas || 0) -
                          Number(selectedRow.finalGas || 0)
                        ).toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </>
              )}

              <Box sx={{ my: 2, borderBottom: "1px dashed #ccc" }} />

              <Typography
                variant="subtitle1"
                color="primary"
                fontWeight="bold"
                sx={{ mb: 1 }}
              >
                {pageMode === "INTERNAL"
                  ? "4. VẬN HÀNH & SẢN LƯỢNG"
                  : "3. VẬN HÀNH & SẢN LƯỢNG"}
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>Máy xúc: </strong> {selectedRow.excavator?.code}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>Vị trí chất tải: </strong>{" "}
                    {selectedRow.fromLocation?.symbol}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>Vị trí dỡ tải: </strong>{" "}
                    {selectedRow.toLocation?.symbol}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>Xe quay tải: </strong>{" "}
                    {selectedRow.shuntingVehicle?.code}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>Độ cao chất tải: </strong>{" "}
                    {selectedRow.loadingHeight}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>Mô hình chất tải: </strong>{" "}
                    {selectedRow.loadingModel}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>Loại hàng: </strong> {selectedRow.material?.symbol}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>Số chuyến: </strong>{" "}
                    {selectedRow.totalQuantity || selectedRow.quantity || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>
                    <strong>Trừ vơi tải: </strong> {selectedRow.underload || 0}
                  </Typography>
                </Grid>
                {pageMode === "INTERNAL" && (
                  <Grid item xs={12} md={4}>
                    <Typography>
                      <strong>Tấn (Cân): </strong> {selectedRow.totalTon || 0}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Box sx={{ my: 2, borderBottom: "1px dashed #ccc" }} />

              <Typography
                variant="subtitle1"
                color="primary"
                fontWeight="bold"
                sx={{ mb: 1 }}
              >
                {pageMode === "INTERNAL"
                  ? "5. THÔNG KHÁC"
                  : "4. THÔNG TIN KHÁC"}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography>
                    <strong>Công việc: </strong> {selectedRow.job?.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography>
                    <strong>Trạng thái lệnh: </strong>
                    <span
                      style={{
                        color:
                          selectedRow.status === StatusOrderEnum.COMPLETED
                            ? "green"
                            : selectedRow.status === StatusOrderEnum.WARNING
                              ? "red"
                              : selectedRow.status ===
                                  StatusOrderEnum.INPROGRESS
                                ? "orange"
                                : "inherit",
                      }}
                    >
                      {selectedRow.status === StatusOrderEnum.PENDING
                        ? "Chưa nhận lệnh"
                        : selectedRow.status === StatusOrderEnum.INPROGRESS
                          ? "Đã nhận lệnh"
                          : selectedRow.status === StatusOrderEnum.COMPLETED
                            ? "Đã hoàn thành"
                            : selectedRow.status === StatusOrderEnum.WARNING
                              ? "Lỗi"
                              : "Đã hủy"}
                    </span>
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography>
                    <strong>Nội dung lệnh: </strong> {selectedRow.workContent}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography>
                    <strong>Nội dung bàn giao ca: </strong> {selectedRow?.note}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Typography align="center" color="text.secondary">
              Vui lòng chọn một lệnh sản xuất để xem chi tiết.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      <StatisticsModal
        open={statsModalOpen}
        onClose={() => {
          setStatsModalOpen(false);
          setSelectedOrder(null);
        }}
        mode={pageMode}
        initialValues={selectedOrder}
      />

      <ImportErrorDialog
        open={openImportErrorModal}
        onClose={() => setOpenImportErrorModal(false)}
        summary={importResponse}
        errors={importResponse?.invalidRows || []}
      />
    </Box>
  );
};

export default Statistics;
