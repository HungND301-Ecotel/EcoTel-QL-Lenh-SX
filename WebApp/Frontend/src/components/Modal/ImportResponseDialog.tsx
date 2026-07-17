import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  Stack,
  Alert,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { ImportResponse } from "../../types/ImportResponse";

interface ImportResponseDialogProps {
  open: boolean;
  onClose: () => void;
  response?: ImportResponse | null;
}

const ImportResponseDialog: React.FC<ImportResponseDialogProps> = ({
  open,
  onClose,
  response,
}) => {
  // Chuẩn hóa dữ liệu tương thích cả hai kiểu truyền (response hoặc errors)
  let displayResponse: ImportResponse = response || {
    totalProcessed: 0,
    insertedCount: 0,
    updatedCount: 0,
    deletedCount: 0,
    invalidCount: 0,
    invalidRows: [],
  };

  const { insertedCount, updatedCount, invalidCount, invalidRows } =
    displayResponse;

  // Chỉ hiển thị tối đa 100 lỗi đầu tiên
  const displayErrors = invalidRows ? invalidRows.slice(0, 100) : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1.5,
          boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="h5" fontWeight={700} color="primary.main">
            Import dữ liệu thành công
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Tổng số dòng đã xử lý:{" "}
          <strong>{displayResponse.totalProcessed}</strong> dòng.
        </Typography>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          py: 2,
          backgroundColor: "#fafafa",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.1)",
            borderRadius: 4,
          },
        }}
      >
        {/* Dashboard 4 Cards thống kê */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          {/* Card Inserted */}
          <Box
            sx={{
              bgcolor: "#edf7ed",
              border: "1px solid #c3e6cb",
              borderRadius: 2,
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              boxShadow: "0 2px 4px rgba(46, 125, 50, 0.05)",
            }}
          >
            <CheckCircleIcon sx={{ color: "#2e7d32", fontSize: 28, mb: 1 }} />
            <Typography variant="body2" fontWeight={600} color="#1b5e20">
              Thêm mới
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              color="#2e7d32"
              sx={{ mt: 0.5 }}
            >
              {insertedCount}
            </Typography>
          </Box>

          {/* Card Updated */}
          <Box
            sx={{
              bgcolor: "#e5f6fd",
              border: "1px solid #b3e5fc",
              borderRadius: 2,
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              boxShadow: "0 2px 4px rgba(2, 136, 209, 0.05)",
            }}
          >
            <EditIcon sx={{ color: "#0288d1", fontSize: 28, mb: 1 }} />
            <Typography variant="body2" fontWeight={600} color="#01579b">
              Cập nhật
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              color="#0288d1"
              sx={{ mt: 0.5 }}
            >
              {updatedCount}
            </Typography>
          </Box>

          {/* Card Deleted */}
          <Box
            sx={{
              bgcolor: "#f5f5f5",
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
            }}
          >
            <DeleteIcon sx={{ color: "#757575", fontSize: 28, mb: 1 }} />
            <Typography variant="body2" fontWeight={600} color="#424242">
              Đã xóa
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              color="#757575"
              sx={{ mt: 0.5 }}
            >
              0
            </Typography>
          </Box>

          {/* Card Lỗi */}
          <Box
            sx={{
              bgcolor: "#fdeded",
              border: "1px solid #f5c6cb",
              borderRadius: 2,
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              boxShadow: "0 2px 4px rgba(211, 47, 47, 0.05)",
            }}
          >
            <ErrorIcon sx={{ color: "#d32f2f", fontSize: 28, mb: 1 }} />
            <Typography variant="body2" fontWeight={600} color="#c62828">
              Bị lỗi
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              color="#d32f2f"
              sx={{ mt: 0.5 }}
            >
              {invalidCount}
            </Typography>
          </Box>
        </Box>

        {/* Danh sách lỗi nếu có */}
        {invalidCount > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              color="error.main"
              sx={{ mb: 1 }}
            >
              Danh Sách Lỗi Chi Tiết{" "}
              {invalidCount > 100 &&
                `(Hiển thị 100 trên tổng số ${invalidCount} lỗi)`}
              :
            </Typography>

            {invalidCount > 100 && (
              <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                Tệp Excel chứa quá nhiều lỗi. Hệ thống chỉ hiển thị{" "}
                <strong>100 dòng lỗi đầu tiên</strong>. Vui lòng kiểm tra lại
                toàn bộ tệp Excel của bạn.
              </Alert>
            )}

            <List disablePadding>
              {displayErrors.map((item, index) => (
                <ListItem
                  key={index}
                  disableGutters
                  sx={{
                    mb: 1.2,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "#fff",
                    border: "1px solid",
                    borderColor: "error.light",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 24,
                      height: 24,
                      borderRadius: "50%",
                      bgcolor: "error.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "error.contrastText",
                      fontSize: 12,
                      fontWeight: "bold",
                      mt: 0.2,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Stack spacing={0.5} sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      color="error.dark"
                      fontWeight={600}
                      sx={{ lineHeight: 1.5 }}
                    >
                      {item.error}
                    </Typography>
                    {item.row && Object.keys(item.row).length > 0 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          bgcolor: "#fdfefe",
                          p: 1,
                          borderRadius: 1,
                          border: "1px dashed #e0e0e0",
                          fontFamily: "monospace",
                          display: "inline-block",
                          wordBreak: "break-all",
                        }}
                      >
                        Dữ liệu dòng:{" "}
                        {Object.entries(item.row)
                          .filter(
                            ([_, v]) =>
                              v !== undefined && v !== null && v !== "",
                          )
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" | ")}
                      </Typography>
                    )}
                  </Stack>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {invalidCount === 0 && (
          <Box
            sx={{
              py: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <CheckCircleIcon
              sx={{ color: "success.main", fontSize: 48, mb: 1 }}
            />
            <Typography
              variant="subtitle1"
              fontWeight={600}
              color="success.main"
            >
              Tất cả dữ liệu hợp lệ và đã được nhập thành công!
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "flex-end" }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          sx={{ px: 3, borderRadius: 2, fontWeight: 600, boxShadow: "none" }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportResponseDialog;
