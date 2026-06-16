import React, { useRef, useState } from "react";
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
} from "@mui/material";
import { Delete, Download, UploadFile } from "@mui/icons-material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import api from "../../config/api.config";
import { showErrorAlert, showSuccessAlert, showConfirmAlert } from "../Alert";
import { StatusDeviceEnum } from "../../enums";

interface AssetEbookDetailsProps {
  asset: any;
}

export default function AssetEbookDetails({ asset }: AssetEbookDetailsProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Gọi API lấy thông tin mới nhất của thiết bị, bao gồm mảng files
  const { data: deviceDetail, isLoading } = useQuery({
    queryKey: ["device", asset._id],
    queryFn: () =>
      api.get(`/devices/${asset._id}`).then((res) => res.data.data),
  });

  // Sử dụng dữ liệu mới nhất từ API, nếu chưa có thì dùng tạm asset truyền vào
  const currentDevice = deviceDetail || asset;
  const files = currentDevice?.files || [];

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
    } catch (err) {
      console.error(err);
      showErrorAlert("Không thể tải file. Vui lòng thử lại.");
    }
  };

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) =>
      api.delete(`/devices/${currentDevice._id}/files/${fileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device", asset._id] });
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      showSuccessAlert("Xóa file thành công");
    },
    onError: () => {
      showErrorAlert("Xóa file thất bại");
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
    onError: () => {
      showErrorAlert("Thêm file thất bại");
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
      const { uploadUrl, fileKey } = presignRes.data.data;

      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      uploadFileMutation.mutate({ key: fileKey, fileName: file.name });
    } catch (err) {
      console.error(err);
      showErrorAlert("Upload file thất bại");
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
        minHeight: "297mm",
        backgroundColor: "#fff",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        p: 6,
      }}
    >
      <Typography
        variant="h5"
        align="center"
        gutterBottom
        fontWeight="bold"
        sx={{ mb: 4 }}
      >
        THÔNG TIN
      </Typography>

      <Box>
        <Typography sx={{ mb: 1.5, fontSize: "1.1rem" }}>
          <strong>Biển số:</strong> {currentDevice?.code}
        </Typography>
        <Typography sx={{ mb: 1.5, fontSize: "1.1rem" }}>
          <strong>Tên phương tiện:</strong> {currentDevice?.name}
        </Typography>
        <Typography sx={{ mb: 1.5, fontSize: "1.1rem" }}>
          <strong>Số máy:</strong> {currentDevice?.vehicleNumber}
        </Typography>
        <Typography sx={{ mb: 1.5, fontSize: "1.1rem" }}>
          <strong>Chủng loại:</strong> {asset?.material?.name}
        </Typography>
        <Typography sx={{ mb: 1.5, fontSize: "1.1rem" }}>
          <strong>Nhiên liệu:</strong> {currentDevice?.fuelType}
        </Typography>
        <Typography sx={{ mb: 1.5, fontSize: "1.1rem" }}>
          <strong>Đơn vị quản lý:</strong>{" "}
          {typeof currentDevice?.department === "object"
            ? currentDevice?.department?.name
            : currentDevice?.department}
        </Typography>
        <Typography sx={{ mb: 1.5, fontSize: "1.1rem" }}>
          <strong>Giờ hoạt động lũy kế:</strong>{" "}
          {currentDevice?.cumulativeHours}
        </Typography>
        <Typography sx={{ mb: 1.5, fontSize: "1.1rem" }}>
          <strong>Trạng thái:</strong>{" "}
          {currentDevice?.status === StatusDeviceEnum.IN_USE
            ? "Đang hoạt động"
            : currentDevice?.status === StatusDeviceEnum.MAINTENANCE
              ? "SC; BD"
              : currentDevice?.status === StatusDeviceEnum.RETIRED
                ? "Niêm cất"
                : currentDevice?.status === StatusDeviceEnum.AVAILABLE
                  ? "Chờ điều động"
                  : currentDevice?.status}
        </Typography>
        <Typography sx={{ mb: 1.5, fontSize: "1.1rem" }}>
          <strong>Ghi chú:</strong> {currentDevice?.note}
        </Typography>
      </Box>

      <Box sx={{ mt: 4, pt: 2, borderTop: "1px solid #ccc" }}>
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
            disabled={uploading}
            size="small"
          >
            Thêm file
          </Button>
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
    </Box>
  );
}
