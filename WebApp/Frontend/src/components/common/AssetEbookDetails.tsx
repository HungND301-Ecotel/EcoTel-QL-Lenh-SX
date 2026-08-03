import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
} from "@mui/material";
import {
  Delete,
  Download,
  Save,
  UploadFile,
  Visibility,
} from "@mui/icons-material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import api from "../../config/api.config";
import { showErrorAlert, showSuccessAlert, showConfirmAlert } from "../Alert";

interface AssetEbookDetailsProps {
  asset: any;
}

// ---- Helpers ----------------------------------------------------------

const formatDateParts = (value?: any) => {
  if (!value) return { day: "", month: "", year: "" };
  if (
    typeof value === "object" &&
    value !== null &&
    ("day" in value || "month" in value || "year" in value)
  ) {
    return {
      day: value.day ?? "",
      month: value.month ?? "",
      year: value.year ?? "",
    };
  }
  if (typeof value === "string") {
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return { year: isoMatch[1], month: isoMatch[2], day: isoMatch[3] };
    }
    const dmyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmyMatch) {
      return {
        day: dmyMatch[1].padStart(2, "0"),
        month: dmyMatch[2].padStart(2, "0"),
        year: dmyMatch[3],
      };
    }
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) return { day: "", month: "", year: "" };
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: String(d.getMonth() + 1).padStart(2, "0"),
    year: String(d.getFullYear()),
  };
};

const combineDateParts = (dateObj: any) => {
  if (!dateObj) return "";
  if (typeof dateObj === "string") return dateObj;
  const { day, month, year } = dateObj;
  if (!day && !month && !year) return "";
  const y = year ? String(year).padStart(4, "0") : "";
  const m = month ? String(month).padStart(2, "0") : "";
  const d = day ? String(day).padStart(2, "0") : "";
  if (y && m && d) {
    return `${y}-${m}-${d}`;
  }
  if (d || m || y) {
    return `${y}-${m}-${d}`.replace(/^-+|-+$/g, "");
  }
  return "";
};

const fmt = (value: any, unit?: string) => {
  if (value === undefined || value === null || value === "")
    return "................";
  return `${value}${unit ? " " + unit : ""}`;
};

// Set giá trị theo đường dẫn, trả về object mới (immutable)
const setByPath = (obj: any, path: string, value: any) => {
  const keys = path.split(".");
  const result = { ...obj };
  let cursor = result;
  keys.forEach((key, idx) => {
    if (idx === keys.length - 1) {
      cursor[key] = value;
    } else {
      cursor[key] = { ...(cursor[key] || {}) };
      cursor = cursor[key];
    }
  });
  return result;
};

// Lọc bỏ các field rỗng/chưa nhập (undefined, null, "") khỏi object, kể cả lồng nhau
// -> khi lưu chỉ gửi lên đúng những field NGƯỜI DÙNG ĐÃ NHẬP, field nào không nhập
//    sẽ không có trong payload nên backend giữ nguyên giá trị cũ, không bị ghi đè thành rỗng
const stripEmpty = (obj: any): any => {
  if (obj === null || obj === undefined) return undefined;

  const isPlainObject = (v: any) =>
    v !== null &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    !(v instanceof Date);

  if (isPlainObject(obj)) {
    const result: any = {};
    Object.keys(obj).forEach((key) => {
      const cleaned = stripEmpty(obj[key]);
      if (cleaned !== undefined) result[key] = cleaned;
    });
    return Object.keys(result).length > 0 ? result : undefined;
  }

  if (obj === "") return undefined;
  return obj;
};
// không có đường kẻ chia giữa nhãn và ô nhập, chỉ có viền bao quanh cả cụm.
const FieldCell = ({
  label,
  value,
  type = "text",
  onChange,
  suffix,
  colSpan,
  labelWidth = "20%",
  border = true,
}: {
  label: string;
  value: any;
  type?: string;
  onChange: (val: string) => void;
  suffix?: string;
  colSpan?: number;
  labelWidth?: string;
  border?: boolean;
}) => (
  <TableCell
    colSpan={colSpan}
    sx={{
      border: border ? "1px solid #333" : "none",
      py: 0.5,
      px: border ? 1 : 0,
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: 13,
          whiteSpace: "nowrap",
          flexShrink: 0,
          minWidth: labelWidth,
        }}
      >
        {label}:
      </Typography>
      <TextField
        variant="standard"
        type={type}
        fullWidth
        value={value ?? ""}
        placeholder="............"
        onChange={(e) => onChange(e.target.value)}
        InputProps={{
          disableUnderline: true,
          sx: { fontSize: 13 },
        }}
      />
      {suffix && (
        <Typography
          sx={{ fontSize: 12, color: "text.secondary", whiteSpace: "nowrap" }}
        >
          {suffix}
        </Typography>
      )}
    </Box>
  </TableCell>
);

// Ô trống có viền, dùng để giữ chỗ khi 1 hàng chỉ có 1 field (bên còn lại để trống theo mẫu giấy)
const EmptyCell = ({ colSpan }: { colSpan?: number }) => (
  <TableCell
    colSpan={colSpan}
    sx={{ border: "1px solid #333", py: 0.5, px: 1 }}
  />
);

// Ô field chứa NHIỀU cặp "Nhãn: ô nhập" riêng biệt trong cùng 1 ô bảng
// (VD: "Số xi lanh: ... Bố trí (chữ V): ..." hoặc "Lưu lượng: ... Áp lực: ...")
const MultiFieldCell = ({
  items,
  colSpan,
}: {
  items: Array<{
    label: string;
    value: any;
    onChange: (val: string) => void;
    suffix?: string;
  }>;
  colSpan?: number;
}) => (
  <TableCell
    colSpan={colSpan}
    sx={{ border: "1px solid #333", py: 0.5, px: 1 }}
  >
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "nowrap" }}
    >
      {items.map((item, idx) => (
        <Box
          key={idx}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: 13,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {item.label}:
          </Typography>
          <TextField
            variant="standard"
            fullWidth
            value={item.value ?? ""}
            placeholder="............"
            onChange={(e) => item.onChange(e.target.value)}
            InputProps={{ disableUnderline: true, sx: { fontSize: 13 } }}
          />
          {item.suffix && (
            <Typography
              sx={{
                fontSize: 12,
                color: "text.secondary",
                whiteSpace: "nowrap",
              }}
            >
              {item.suffix}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  </TableCell>
);

// Tiêu đề nhóm (VD: "Các thông số vận hành") kéo dài hết bảng
const SectionHeaderRow = ({
  label,
  colSpan = 4,
}: {
  label: string;
  colSpan?: number;
}) => (
  <TableRow>
    <TableCell
      colSpan={colSpan}
      sx={{
        border: "1px solid #333",
        fontWeight: 700,
        py: 0.75,
        // fontSize: 13.5,
      }}
    >
      {label}
    </TableCell>
  </TableRow>
);

export default function AssetEbookDetails({ asset }: AssetEbookDetailsProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<Array<{
    url: string;
    name: string;
  }> | null>(null);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [previewLoadingAll, setPreviewLoadingAll] = useState(false);

  // Gọi API lấy thông tin mới nhất của thiết bị, bao gồm mảng files
  const { data: deviceDetail, isLoading } = useQuery({
    queryKey: ["device", asset._id],
    queryFn: () =>
      api.get(`/devices/${asset._id}`).then((res) => res.data.data),
  });

  // Sử dụng dữ liệu mới nhất từ API, nếu chưa có thì dùng tạm asset truyền vào
  const currentDevice = deviceDetail || asset;
  const files = currentDevice?.files || [];

  // formData: dữ liệu đang chỉnh sửa trên form (đồng bộ lại mỗi khi có dữ liệu mới từ API)
  const [formData, setFormData] = useState<any>({
    // Thông tin chung
    name: "",
    brand: "", // nhãn hiệu
    model: "", // số loại
    countryOfOrigin: "", // nước sản xuất
    yearOfManufacture: "", // năm sản xuất
    chassisNumber: "", // số khung
    engineNumber: "", // số động cơ

    // Kích thước
    dimensions: {
      length: "", // chiều dài
      width: "", // chiều rộng
      height: "", // chiều cao
      bladeWidth: "", // bề rộng lưỡi gạt
      totalWeight: "", // trọng lượng toàn bộ
      trackWidth: "", // chiều rộng xích
    },

    // Thông số vận hành
    operatingSpecs: {
      travelSpeed: "", // tốc độ di chuyển
      swingSpeed: "", // tốc độ quay toa
      bucketCapacity: "", // dung tích gầu
      groundPressure: "", // áp lực trên nền
      climbingAbility: "", // khả năng leo dốc
      drillHoleDiameter: "", // đường kính lỗ khoan
    },

    // Động cơ
    engine: {
      engineModel: "", // ký hiệu động cơ
      pistonDiameter: "", // đường kính piston
      maxPower: "", // công suất lớn nhất (N)
      cylinderCount: "", // số xi lanh
      layout: "", // bố trí (chữ V)
      pistonStroke: "", // hành trình piston
      maxSpeed: "", // tốc độ lớn nhất
    },

    // Hệ thống thủy lực
    hydraulicSystem: {
      pump1: { name: "", flow: "", pressure: "" }, // bơm thủy lực 1
      pump2: { name: "", flow: "", pressure: "" }, // bơm thủy lực 2
      pump3: { name: "", flow: "", pressure: "" }, // bơm thủy lực 3
      airCompressor: { name: "", flow: "", pressure: "" }, // máy nén khí
    },

    finalDriveType: "", // kiểu bộ truyền lực cuối, di chuyển (gạt xích, máy xúc)

    // Thời gian sử dụng
    receivedDate: { day: "", month: "", year: "" }, // ngày nhận thiết bị
    operationStartDate: { day: "", month: "", year: "" }, // ngày đưa vào sử dụng
  });

  useEffect(() => {
    if (!deviceDetail) return;

    setFormData({
      name: deviceDetail.name,
      brand: deviceDetail.brand,
      model: deviceDetail.model,
      countryOfOrigin: deviceDetail.countryOfOrigin,
      yearOfManufacture: deviceDetail.yearOfManufacture,
      chassisNumber: deviceDetail.chassisNumber,
      engineNumber: deviceDetail.engineNumber,

      dimensions: deviceDetail.dimensions ?? {},
      operatingSpecs: deviceDetail.operatingSpecs ?? {},
      engine: deviceDetail.engine ?? {},
      hydraulicSystem: deviceDetail.hydraulicSystem ?? {},

      finalDriveType: deviceDetail.finalDriveType,
      receivedDate: formatDateParts(deviceDetail.receivedDate),
      operationStartDate: formatDateParts(deviceDetail.operationStartDate),
    });
  }, [deviceDetail]);

  const updateField = (path: string) => (value: string) => {
    setFormData((prev: any) => setByPath(prev, path, value));
  };

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      api.put(`/devices/${currentDevice._id}`, payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device", asset._id] });
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      showSuccessAlert("Lưu thông tin thành công");
    },
    onError: (err: any) => {
      console.error(err);
      showErrorAlert(
        err.response?.data?.message || err.message || "Lưu thông tin thất bại",
      );
    },
  });

  const handleSave = () => {
    const payload = {
      ...formData,
      receivedDate: combineDateParts(formData.receivedDate),
      operationStartDate: combineDateParts(formData.operationStartDate),
    };
    saveMutation.mutate(payload);
  };

  const dimensions = formData?.dimensions || {};
  const operatingSpecs = formData?.operatingSpecs || {};
  const engine = formData?.engine || {};
  const hydraulicSystem = formData?.hydraulicSystem || {};

  const handleDownload = async (file: any) => {
    try {
      const res = await api.get(
        `/uploads/get?key=${encodeURIComponent(file.key)}`,
      );
      const downloadUrl = res.data.data;

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.target = "_blank";
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      console.error(err);
      showErrorAlert(
        err.response.data.message ||
          err.message ||
          "Không thể tải file. Vui lòng thử lại.",
      );
    }
  };

  const handlePreview = async (file: any) => {
    try {
      setPreviewLoadingId(file._id);
      const res = await api.get(
        `/uploads/get?key=${encodeURIComponent(file.key)}`,
      );
      let url = res.data.data;
      const fileName = file.fileName.toLowerCase();

      if (
        fileName.endsWith(".xls") ||
        fileName.endsWith(".xlsx") ||
        fileName.endsWith(".doc") ||
        fileName.endsWith(".docx") ||
        fileName.endsWith(".ppt") ||
        fileName.endsWith(".pptx")
      ) {
        url = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
          url,
        )}`;
      }

      setCurrentPreviewIndex(0);
      setPreviewData([{ url, name: file.fileName }]);
    } catch (err: any) {
      console.error(err);
      showErrorAlert(
        err.response.data.message ||
          err.message ||
          "Không thể xem trước file. Vui lòng thử lại.",
      );
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const handlePreviewAll = async () => {
    if (files.length === 0) return;
    try {
      setPreviewLoadingAll(true);
      const promises = files.map((file: any) =>
        api.get(`/uploads/get?key=${encodeURIComponent(file.key)}`),
      );
      const results = await Promise.all(promises);

      const newPreviewData = results.map((res, index) => {
        let url = res.data.data;
        const fileName = files[index].fileName.toLowerCase();

        if (
          fileName.endsWith(".xls") ||
          fileName.endsWith(".xlsx") ||
          fileName.endsWith(".doc") ||
          fileName.endsWith(".docx") ||
          fileName.endsWith(".ppt") ||
          fileName.endsWith(".pptx")
        ) {
          url = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
            url,
          )}`;
        }

        return { url, name: files[index].fileName };
      });

      setCurrentPreviewIndex(0);
      setPreviewData(newPreviewData);
    } catch (err: any) {
      console.error(err);
      showErrorAlert(
        err.response.data.message ||
          err.message ||
          "Không thể xem trước các file. Vui lòng thử lại.",
      );
    } finally {
      setPreviewLoadingAll(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewData(null);
    setCurrentPreviewIndex(0);
  };

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) =>
      api.delete(`/devices/${currentDevice._id}/files/${fileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device", asset._id] });
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      showSuccessAlert("Xóa file thành công");
    },
    onError: (err: any) => {
      console.error(err);
      showErrorAlert(
        err.response.data.message || err.message || "Xóa file thất bại",
      );
    },
  });

  const handleDelete = async (file: any) => {
    const result = await showConfirmAlert(
      `Bạn có chắc chắn muốn xóa file ${file.fileName}?`,
    );
    if (result.isConfirmed) {
      deleteFileMutation.mutate(file._id);
    }
  };

  const uploadFileMutation = useMutation({
    mutationFn: (fileData: { key: string; fileName: string }) =>
      api.post(`/devices/${currentDevice._id}/files`, fileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device", asset._id] });
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      showSuccessAlert("Thêm file thành công");
      setUploading(false);
    },
    onError: (err: any) => {
      console.error(err);
      showErrorAlert(
        err.response.data.message || err.message || "Upload file thất bại",
      );
      setUploading(false);
    },
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const presignRes = await api.get(
        `/uploads/put?fileName=${encodeURIComponent(file.name)}&type=document`,
      );
      const { uploadUrl, fileKey, contentType } = presignRes.data.data;

      const uploadRes = await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type":
            contentType || file.type || "application/octet-stream",
        },
        validateStatus: (status) => status === 200,
      });
      if (uploadRes.status !== 200) {
        throw new Error(`Upload failed: ${uploadRes.status}`);
      }

      uploadFileMutation.mutate({ key: fileKey, fileName: file.name });
    } catch (err: any) {
      console.error(err);
      showErrorAlert(
        err.response.data.message || err.message || "Upload file thất bại",
      );
      setUploading(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "210mm",
        height: "auto",
        minHeight: "297mm",
        backgroundColor: "#fff",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
        p: 6,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ width: 100 }} />
        <Typography
          variant="h5"
          align="center"
          fontWeight="bold"
          sx={{ letterSpacing: 1 }}
        >
          ĐẶC ĐIỂM THIẾT BỊ
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={
            saveMutation.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Save />
            )
          }
          onClick={handleSave}
          disabled={saveMutation.isPending}
          sx={{ minWidth: 100 }}
        >
          Lưu
        </Button>
      </Box>

      {/* ----- Khối thông tin chung (không viền) ----- */}
      <Table
        size="small"
        sx={{ borderCollapse: "collapse", tableLayout: "fixed", mb: 2 }}
      >
        <TableBody>
          <TableRow>
            <FieldCell
              border={false}
              colSpan={3}
              label="Tên thiết bị"
              value={formData?.name}
              onChange={updateField("name")}
            />
            <FieldCell
              border={false}
              colSpan={3}
              label="Nhãn hiệu"
              value={formData?.brand}
              onChange={updateField("brand")}
            />
          </TableRow>
          <TableRow>
            <FieldCell
              border={false}
              colSpan={2}
              label="Số loại"
              value={formData?.model}
              onChange={updateField("model")}
            />
            <FieldCell
              border={false}
              colSpan={2}
              label="Nước sản xuất"
              value={formData?.countryOfOrigin}
              onChange={updateField("countryOfOrigin")}
            />
            <FieldCell
              border={false}
              colSpan={2}
              label="Năm sản xuất"
              value={formData?.yearOfManufacture}
              onChange={updateField("yearOfManufacture")}
            />
          </TableRow>
          <TableRow>
            <FieldCell
              border={false}
              colSpan={3}
              label="Số khung"
              value={formData?.chassisNumber}
              onChange={updateField("chassisNumber")}
            />
            <FieldCell
              border={false}
              colSpan={3}
              label="Số động cơ"
              value={formData?.engineNumber}
              onChange={updateField("engineNumber")}
            />
          </TableRow>
        </TableBody>
      </Table>

      <Typography
        variant="subtitle1"
        align="center"
        fontWeight="bold"
        sx={{ mb: 1, letterSpacing: 0.5 }}
      >
        CÁC THÔNG SỐ ĐẶC TRƯNG
      </Typography>

      <Table
        size="small"
        sx={{ borderCollapse: "collapse", tableLayout: "fixed", mb: 4 }}
      >
        <TableBody>
          <SectionHeaderRow label="Các thông số kích thước (mm), trọng lượng (kg)" />
          <TableRow>
            <FieldCell
              colSpan={2}
              label="Chiều dài"
              value={dimensions.length}
              onChange={updateField("dimensions.length")}
              suffix="mm"
            />
            <FieldCell
              colSpan={2}
              label="Chiều rộng"
              value={dimensions.width}
              onChange={updateField("dimensions.width")}
              suffix="mm"
            />
          </TableRow>
          <TableRow>
            <FieldCell
              colSpan={2}
              label="Chiều cao"
              value={dimensions.height}
              onChange={updateField("dimensions.height")}
              suffix="mm"
            />
            <EmptyCell colSpan={2} />
          </TableRow>
          <TableRow>
            <FieldCell
              colSpan={2}
              label="Bề rộng lưỡi gạt"
              value={dimensions.bladeWidth}
              onChange={updateField("dimensions.bladeWidth")}
              suffix="mm"
            />
            <FieldCell
              colSpan={2}
              label="Trọng lượng toàn bộ"
              value={dimensions.totalWeight}
              onChange={updateField("dimensions.totalWeight")}
              suffix="kg"
            />
          </TableRow>
          <TableRow>
            <FieldCell
              colSpan={2}
              label="Chiều rộng xích (cỡ lốp)"
              value={dimensions.trackWidth}
              onChange={updateField("dimensions.trackWidth")}
              suffix="mm"
            />
            <EmptyCell colSpan={2} />
          </TableRow>

          <SectionHeaderRow label="Các thông số vận hành" />
          <TableRow>
            <FieldCell
              colSpan={2}
              label="Tốc độ di chuyển"
              value={operatingSpecs.travelSpeed}
              onChange={updateField("operatingSpecs.travelSpeed")}
              suffix="km/h"
            />
            <FieldCell
              colSpan={2}
              label="Áp lực trên nền"
              value={operatingSpecs.groundPressure}
              onChange={updateField("operatingSpecs.groundPressure")}
              suffix="kg/cm²"
            />
          </TableRow>
          <TableRow>
            <FieldCell
              colSpan={2}
              label="Tốc độ quay toa"
              value={operatingSpecs.swingSpeed}
              onChange={updateField("operatingSpecs.swingSpeed")}
              suffix="v/p"
            />
            <FieldCell
              colSpan={2}
              label="Khả năng leo dốc"
              value={operatingSpecs.climbingAbility}
              onChange={updateField("operatingSpecs.climbingAbility")}
              suffix="°"
            />
          </TableRow>
          <TableRow>
            <FieldCell
              colSpan={2}
              label="Dung tích gầu"
              value={operatingSpecs.bucketCapacity}
              onChange={updateField("operatingSpecs.bucketCapacity")}
              suffix="m³"
            />
            <FieldCell
              colSpan={2}
              label="Đường kính lỗ khoan"
              value={operatingSpecs.drillHoleDiameter}
              onChange={updateField("operatingSpecs.drillHoleDiameter")}
              suffix="mm"
            />
          </TableRow>

          <SectionHeaderRow label="Động cơ" />
          <TableRow>
            <FieldCell
              colSpan={2}
              label="Ký hiệu động cơ"
              value={engine.engineModel}
              onChange={updateField("engine.engineModel")}
            />
            <MultiFieldCell
              colSpan={2}
              items={[
                {
                  label: "Số xi lanh",
                  value: engine.cylinderCount,
                  onChange: updateField("engine.cylinderCount"),
                },
                {
                  label: "Bố trí (chữ V)",
                  value: engine.layout,
                  onChange: updateField("engine.layout"),
                },
              ]}
            />
          </TableRow>
          <TableRow>
            <FieldCell
              colSpan={2}
              label="Đường kính Piston"
              value={engine.pistonDiameter}
              onChange={updateField("engine.pistonDiameter")}
              suffix="mm"
            />
            <FieldCell
              colSpan={2}
              label="Hành trình Piston"
              value={engine.pistonStroke}
              onChange={updateField("engine.pistonStroke")}
              suffix="mm"
            />
          </TableRow>
          <TableRow>
            <FieldCell
              colSpan={2}
              label="Công suất lớn nhất (N)"
              value={engine.maxPower}
              onChange={updateField("engine.maxPower")}
              suffix="kw/HP"
            />
            <FieldCell
              colSpan={2}
              label="Tốc độ lớn nhất (ở N)"
              value={engine.maxSpeed}
              onChange={updateField("engine.maxSpeed")}
              suffix="v/p"
            />
          </TableRow>

          <SectionHeaderRow label="Hệ thống công tác thủy lực" />
          <TableRow>
            <FieldCell
              colSpan={2}
              label="Bơm thủy lực 1"
              value={hydraulicSystem.pump1?.name}
              onChange={updateField("hydraulicSystem.pump1.name")}
            />
            <MultiFieldCell
              colSpan={2}
              items={[
                {
                  label: "Lưu lượng",
                  value: hydraulicSystem.pump1?.flow,
                  onChange: updateField("hydraulicSystem.pump1.flow"),
                },
                {
                  label: "Áp lực",
                  value: hydraulicSystem.pump1?.pressure,
                  onChange: updateField("hydraulicSystem.pump1.pressure"),
                },
              ]}
            />
          </TableRow>
          <TableRow>
            <FieldCell
              colSpan={2}
              label="Bơm thủy lực 2"
              value={hydraulicSystem.pump2?.name}
              onChange={updateField("hydraulicSystem.pump2.name")}
            />
            <MultiFieldCell
              colSpan={2}
              items={[
                {
                  label: "Lưu lượng",
                  value: hydraulicSystem.pump2?.flow,
                  onChange: updateField("hydraulicSystem.pump2.flow"),
                },
                {
                  label: "Áp lực",
                  value: hydraulicSystem.pump2?.pressure,
                  onChange: updateField("hydraulicSystem.pump2.pressure"),
                },
              ]}
            />
          </TableRow>
          <TableRow>
            <FieldCell
              colSpan={2}
              label="Bơm thủy lực 3"
              value={hydraulicSystem.pump3?.name}
              onChange={updateField("hydraulicSystem.pump3.name")}
            />
            <MultiFieldCell
              colSpan={2}
              items={[
                {
                  label: "Lưu lượng",
                  value: hydraulicSystem.pump3?.flow,
                  onChange: updateField("hydraulicSystem.pump3.flow"),
                },
                {
                  label: "Áp lực",
                  value: hydraulicSystem.pump3?.pressure,
                  onChange: updateField("hydraulicSystem.pump3.pressure"),
                },
              ]}
            />
          </TableRow>
          <TableRow>
            <FieldCell
              colSpan={2}
              label="Máy nén khí"
              value={hydraulicSystem.airCompressor?.name}
              onChange={updateField("hydraulicSystem.airCompressor.name")}
            />
            <MultiFieldCell
              colSpan={2}
              items={[
                {
                  label: "Lưu lượng",
                  value: hydraulicSystem.airCompressor?.flow,
                  onChange: updateField("hydraulicSystem.airCompressor.flow"),
                },
                {
                  label: "Áp lực",
                  value: hydraulicSystem.airCompressor?.pressure,
                  onChange: updateField(
                    "hydraulicSystem.airCompressor.pressure",
                  ),
                },
              ]}
            />
          </TableRow>

          <TableRow>
            <FieldCell
              colSpan={4}
              label="Kiểu bộ truyền lực cuối, di chuyển"
              value={formData?.finalDriveType}
              onChange={updateField("finalDriveType")}
            />
          </TableRow>
        </TableBody>
      </Table>

      <Box sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: "bold", minWidth: 140 }}>
            Nhận thiết bị:
          </Typography>
          <Typography sx={{ fontSize: 14 }}>ngày</Typography>
          <TextField
            variant="standard"
            type="number"
            value={formData?.receivedDate?.day ?? ""}
            placeholder="..."
            onChange={(e) => updateField("receivedDate.day")(e.target.value)}
            inputProps={{ min: 1, max: 31, style: { textAlign: "center" } }}
            InputProps={{ disableUnderline: false, sx: { fontSize: 14 } }}
            sx={{
              width: 50,
              "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
                appearance: "none",
                margin: 0,
              },
              "& input[type=number]": {
                appearance: "textfield",
                mozAppearance: "textfield",
              },
            }}
          />
          <Typography sx={{ fontSize: 14 }}>tháng</Typography>
          <TextField
            variant="standard"
            type="number"
            value={formData?.receivedDate?.month ?? ""}
            placeholder="..."
            onChange={(e) => updateField("receivedDate.month")(e.target.value)}
            inputProps={{ min: 1, max: 12, style: { textAlign: "center" } }}
            InputProps={{ disableUnderline: false, sx: { fontSize: 14 } }}
            sx={{
              width: 50,
              "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
                appearance: "none",
                margin: 0,
              },
              "& input[type=number]": {
                appearance: "textfield",
                mozAppearance: "textfield",
              },
            }}
          />
          <Typography sx={{ fontSize: 14 }}>năm</Typography>
          <TextField
            variant="standard"
            type="number"
            value={formData?.receivedDate?.year ?? ""}
            placeholder="......"
            onChange={(e) => updateField("receivedDate.year")(e.target.value)}
            inputProps={{ min: 1900, max: 2100, style: { textAlign: "center" } }}
            InputProps={{ disableUnderline: false, sx: { fontSize: 14 } }}
            sx={{
              width: 70,
              "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
                appearance: "none",
                margin: 0,
              },
              "& input[type=number]": {
                appearance: "textfield",
                mozAppearance: "textfield",
              },
            }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: "bold", minWidth: 140 }}>
            Đưa vào sử dụng:
          </Typography>
          <Typography sx={{ fontSize: 14 }}>ngày</Typography>
          <TextField
            variant="standard"
            type="number"
            value={formData?.operationStartDate?.day ?? ""}
            placeholder="..."
            onChange={(e) => updateField("operationStartDate.day")(e.target.value)}
            inputProps={{ min: 1, max: 31, style: { textAlign: "center" } }}
            InputProps={{ disableUnderline: false, sx: { fontSize: 14 } }}
            sx={{
              width: 50,
              "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
                appearance: "none",
                margin: 0,
              },
              "& input[type=number]": {
                appearance: "textfield",
                mozAppearance: "textfield",
              },
            }}
          />
          <Typography sx={{ fontSize: 14 }}>tháng</Typography>
          <TextField
            variant="standard"
            type="number"
            value={formData?.operationStartDate?.month ?? ""}
            placeholder="..."
            onChange={(e) => updateField("operationStartDate.month")(e.target.value)}
            inputProps={{ min: 1, max: 12, style: { textAlign: "center" } }}
            InputProps={{ disableUnderline: false, sx: { fontSize: 14 } }}
            sx={{
              width: 50,
              "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
                appearance: "none",
                margin: 0,
              },
              "& input[type=number]": {
                appearance: "textfield",
                mozAppearance: "textfield",
              },
            }}
          />
          <Typography sx={{ fontSize: 14 }}>năm</Typography>
          <TextField
            variant="standard"
            type="number"
            value={formData?.operationStartDate?.year ?? ""}
            placeholder="......"
            onChange={(e) => updateField("operationStartDate.year")(e.target.value)}
            inputProps={{ min: 1900, max: 2100, style: { textAlign: "center" } }}
            InputProps={{ disableUnderline: false, sx: { fontSize: 14 } }}
            sx={{
              width: 70,
              "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
                appearance: "none",
                margin: 0,
              },
              "& input[type=number]": {
                appearance: "textfield",
                mozAppearance: "textfield",
              },
            }}
          />
        </Box>
      </Box>

      <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #ccc" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">
            Tài liệu đính kèm ({files.length})
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            {files.length > 0 && (
              <Button
                variant="outlined"
                color="info"
                startIcon={
                  previewLoadingAll ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Visibility />
                  )
                }
                onClick={handlePreviewAll}
                disabled={previewLoadingAll || uploading}
                size="small"
              >
                Xem tất cả
              </Button>
            )}
            <input
              type="file"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button
              variant="contained"
              startIcon={
                uploading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <UploadFile />
                )
              }
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || previewLoadingAll}
              size="small"
            >
              Thêm file
            </Button>
          </Box>
        </Box>

        <List>
          {files.map((file: any) => (
            <ListItem key={file._id} divider>
              <ListItemText
                primary={file.fileName}
                primaryTypographyProps={{ fontSize: 14 }}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  color="info"
                  onClick={() => handlePreview(file)}
                  title="Xem trước"
                  disabled={previewLoadingId === file._id}
                  sx={{ mr: 1 }}
                >
                  {previewLoadingId === file._id ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Visibility />
                  )}
                </IconButton>
                <IconButton
                  edge="end"
                  color="primary"
                  onClick={() => handleDownload(file)}
                  title="Tải xuống"
                >
                  <Download />
                </IconButton>
                <IconButton
                  edge="end"
                  color="error"
                  onClick={() => handleDelete(file)}
                  title="Xóa"
                  sx={{ ml: 1 }}
                >
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {files.length === 0 && (
            <Typography
              variant="body2"
              color="textSecondary"
              align="center"
              sx={{ py: 2 }}
            >
              Chưa có tài liệu đính kèm
            </Typography>
          )}
        </List>
      </Box>

      <Dialog
        open={Boolean(previewData)}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="h6">Xem trước tài liệu</Typography>
          {previewData && previewData.length > 1 && (
            <Pagination
              count={previewData.length}
              page={currentPreviewIndex + 1}
              onChange={(e, value) => setCurrentPreviewIndex(value - 1)}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          )}
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            height: "80vh",
            p: 0,
            bgcolor: "#f5f5f5",
          }}
        >
          {previewData &&
            previewData.length > 0 &&
            (() => {
              const item = previewData[currentPreviewIndex];
              const isImage =
                item.name.toLowerCase().endsWith(".jpg") ||
                item.name.toLowerCase().endsWith(".png") ||
                item.name.toLowerCase().endsWith(".jpeg") ||
                item.name.toLowerCase().endsWith(".webp");

              return (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    bgcolor: "white",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {previewData.length > 1 && (
                    <Typography
                      variant="subtitle2"
                      sx={{
                        p: 1.5,
                        bgcolor: "#e0e0e0",
                        flexShrink: 0,
                        fontWeight: "bold",
                      }}
                    >
                      {item.name}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      flexGrow: 1,
                      position: "relative",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      bgcolor: "#fff",
                      overflow: "hidden",
                    }}
                  >
                    {isImage ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        style={{
                          maxWidth: "100%",
                          height: "auto",
                          maxHeight: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <iframe
                        src={item.url}
                        title={item.name}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          border: "none",
                        }}
                      />
                    )}
                  </Box>
                </Box>
              );
            })()}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "flex-end" }}>
          <Button onClick={handleClosePreview}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
