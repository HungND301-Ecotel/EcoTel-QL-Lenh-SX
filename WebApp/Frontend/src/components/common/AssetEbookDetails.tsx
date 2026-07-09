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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
} from "@mui/material";
import { Delete, Download, UploadFile, Visibility } from "@mui/icons-material";
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
  const [previewData, setPreviewData] = useState<Array<{ url: string; name: string }> | null>(null);
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
          url
        )}`;
      }

      setCurrentPreviewIndex(0);
      setPreviewData([{ url, name: file.fileName }]);
    } catch (err) {
      console.error(err);
      showErrorAlert("Không thể xem trước file. Vui lòng thử lại.");
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const handlePreviewAll = async () => {
    if (files.length === 0) return;
    try {
      setPreviewLoadingAll(true);
      const promises = files.map((file: any) =>
        api.get(`/uploads/get?key=${encodeURIComponent(file.key)}`)
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
            url
          )}`;
        }

        return { url, name: files[index].fileName };
      });

      setCurrentPreviewIndex(0);
      setPreviewData(newPreviewData);
    } catch (err) {
      console.error(err);
      showErrorAlert("Không thể xem trước các file. Vui lòng thử lại.");
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

      const uploadRes = await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        validateStatus: (status) => status === 200,
      });
      if (uploadRes.status !== 200) {
        throw new Error(`Upload failed: ${uploadRes.status}`);
      }

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
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Typography variant="h6">
            Xem trước tài liệu
          </Typography>
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
          {previewData && previewData.length > 0 && (() => {
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
                    sx={{ p: 1.5, bgcolor: "#e0e0e0", flexShrink: 0, fontWeight: "bold" }}
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
