import React, { useRef } from "react";
import { Box, Button } from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility,
  VisibilityOff,
  RotateLeft,
} from "@mui/icons-material";
import { Control } from "react-hook-form";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ActionButtonSquare from "../../../../components/buttons/ActionButtonSquare/ActionButtonSquare";
import FormDatePicker from "../../../../components/fields/FormDatePicker/FormDatePicker";
import FormAutocompleteField from "../../../../components/fields/FormAutocompleteField/FormAutocompleteField";
import ExportExcelButton from "../../../../components/buttons/ExportExcelButton/ExportExcelButton";
import ImportExcelButton from "../../../../components/buttons/ImportExcelButton/ImportExcelButton";

export interface StatisticsToolbarProps {
  control: Control<any>;
  vehicleDepartments: any[];
  onAdd: () => void;
  onDelete: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  isImporting: boolean;
  isLoading: boolean;
  showDetail?: boolean;
  onToggleDetail?: () => void;
  onRefresh?: () => void;
}

const StatisticsToolbar: React.FC<StatisticsToolbarProps> = ({
  control,
  vehicleDepartments,
  onAdd,
  onDelete,
  onExport,
  onImport,
  isImporting,
  isLoading,
  showDetail,
  onToggleDetail,
  onRefresh,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: { xs: "wrap", lg: "nowrap" },
        gap: 2,
        width: "100%",
        alignItems: "center",
      }}
    >
      {/* 1. KHỐI BÊN TRÁI: Thêm / Xóa */}
      <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{ height: "40px" }}
        >
          Thêm (Alt + N)
        </Button>
        <Button
          variant="contained"
          startIcon={<DeleteIcon />}
          color="error"
          onClick={onDelete}
          sx={{ height: "40px" }}
        >
          Xóa
        </Button>
      </Box>

      {/* 2. KHỐI Ở GIỮA: Bộ lọc (Tự động chiếm hết chỗ trống và chia đều) */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          sx={{
            flexGrow: 1,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
            minWidth: 0,
          }}
        >
          <FormDatePicker
            name="startTime"
            control={control}
            label="Từ ngày"
            format="DD/MM/YYYY"
            size="small"
            fullWidth
          />
          <FormDatePicker
            name="endTime"
            control={control}
            label="Đến ngày"
            format="DD/MM/YYYY"
            size="small"
            fullWidth
          />
          <FormAutocompleteField
            name="department"
            control={control}
            label="Đơn vị"
            options={vehicleDepartments}
            valueKey="_id"
            getOptionLabel={(option: any) => option.name || option.code || ""}
            size="small"
            sx={{ width: "100%" }}
            limitOptions={20}
          />
        </Box>
      </LocalizationProvider>

      {/* 3. KHỐI BÊN PHẢI: Action Buttons */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexShrink: 0, // Không cho phép các nút bấm bị bóp méo
          ml: { xs: "auto", lg: 0 }, // QUAN TRỌNG: Nếu rớt dòng thì tự động dạt sang phải
        }}
      >
        <ExportExcelButton onClick={onExport} />

        <ImportExcelButton
          onClick={() => fileInputRef.current?.click()}
          isLoading={isImporting}
        />
        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept=".xlsx, .xls"
          onChange={handleFileChange}
        />

        {onToggleDetail && (
          <ActionButtonSquare
            title={showDetail ? "Đóng chi tiết" : "Xem chi tiết"}
            icon={<Visibility sx={{ width: 22, height: 22 }} />}
            activeIcon={<VisibilityOff sx={{ width: 22, height: 22 }} />}
            isActive={showDetail}
            onClick={(e) => {
              e.stopPropagation();
              onToggleDetail();
            }}
          />
        )}

        {onRefresh && (
          <ActionButtonSquare
            title="Làm mới dữ liệu"
            icon={<RotateLeft sx={{ width: 22, height: 22 }} />}
            isLoading={isLoading}
            rotateDegrees={-180}
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default StatisticsToolbar;
