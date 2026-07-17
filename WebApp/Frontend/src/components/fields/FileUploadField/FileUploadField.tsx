import React, { useRef, useState, type ChangeEvent } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import { Eye, FileIcon, UploadCloud, X } from "lucide-react";
import { useNotification } from "../../Modal/NotificationProvider";

interface FileUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<{ file: string }>;
  accept?: string;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  onPreview?: (url: string) => void;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  value,
  onChange,
  onUpload,
  accept = "*/*",
  disabled = false, // Lưu ý: Để false để người dùng còn tương tác được
  error,
  placeholder = "Chưa có file nào được chọn...",
  onPreview,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // State để bắt trạng thái kéo file
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notification = useNotification();

  // --- HÀM XỬ LÝ UPLOAD CHUNG ---
  const processFile = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await onUpload(file);
      if (res.file) {
        onChange(res.file);
        notification.showModal(
          "success",
          "Thành công",
          "Tải file lên thành công!",
        );
      }
    } catch (err: any) {
      console.error(err);
      notification.showModal(
        "error",
        "Lỗi Upload",
        err.response?.data?.error || err.message || "Không thể tải file lên",
      );
    } finally {
      setIsUploading(false);
    }
  };

  // --- EVENT HANDLERS ---
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleClear = () => onChange("");

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={1}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <TextField
        label={label}
        value={value}
        disabled={disabled}
        error={!!error}
        helperText={error}
        placeholder={isDragging ? "Thả file vào đây..." : placeholder}
        fullWidth
        size="small"
        InputProps={{
          readOnly: true,
          startAdornment: value ? (
            <InputAdornment position="start">
              <FileIcon size={18} />
            </InputAdornment>
          ) : null,
          endAdornment: (
            <InputAdornment position="end">
              {value && !disabled && (
                <IconButton size="small" onClick={handleClear} sx={{ mr: 1 }}>
                  <X size={16} />
                </IconButton>
              )}
              <Button
                component="label"
                variant="contained"
                disableElevation
                disabled={disabled || isUploading}
                startIcon={
                  isUploading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <UploadCloud size={16} />
                  )
                }
                sx={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  height: "100%",
                  minWidth: 100,
                  boxShadow: "none",
                }}
              >
                {isUploading ? "Đang tải..." : "Chọn File"}
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  accept={accept}
                  onChange={handleFileSelect}
                />
              </Button>
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            paddingRight: 0,
            bgcolor: isDragging ? "action.hover" : "background.paper", // Hiệu ứng Semantic Color khi kéo vào
            transition: "all 0.2s ease",
            "& fieldset": {
              borderWidth: isDragging ? "2px" : "1px",
              borderStyle: isDragging ? "dashed" : "solid", // Nét đứt khi đang kéo file
              borderColor: isDragging ? "primary.main" : "divider",
            },
          },
        }}
      />

      {value && onPreview && (
        <Box display="flex" alignItems="center">
          <Button
            size="small"
            startIcon={<Eye size={16} />}
            onClick={() => onPreview(value)}
            sx={{ color: "info.main", textTransform: "none" }}
          >
            Xem trước file hiện tại
          </Button>
        </Box>
      )}
    </Box>
  );
};
