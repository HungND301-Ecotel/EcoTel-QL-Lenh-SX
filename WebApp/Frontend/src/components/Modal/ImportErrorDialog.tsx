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
  Grid,
} from "@mui/material";
import {
  Error as ErrorIcon,
  CheckCircleOutline,
  Autorenew,
  DeleteOutline,
} from "@mui/icons-material";

interface ImportSummary {
  totalProcessed: number;
  insertedCount: number;
  updatedCount: number;
  invalidCount: number;
  deletedCount?: number;
}

interface InvalidRow {
  row: any;
  error: string;
}

interface ImportErrorDialogProps {
  open: boolean;
  onClose: () => void;
  summary: ImportSummary | null;
  errors: InvalidRow[];
}

const ImportErrorDialog: React.FC<ImportErrorDialogProps> = ({
  open,
  onClose,
  summary,
  errors,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <ErrorIcon color="warning" sx={{ fontSize: 32 }} />
          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1 }}>
            Báo cáo kết quả Import Dữ Liệu
          </Typography>
        </Stack>

        {/* Bảng thống kê số lượng */}
        {summary && (
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Box
                sx={{
                  p: 1.5,
                  border: "1px solid",
                  borderColor: "success.main",
                  borderRadius: 2,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 0.5 }}
                >
                  <CheckCircleOutline color="success" fontSize="small" />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    Thêm mới
                  </Typography>
                </Stack>
                <Typography variant="h5" color="success.main" fontWeight={700}>
                  {summary.insertedCount}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box
                sx={{
                  p: 1.5,
                  border: "1px solid",
                  borderColor: "info.main",
                  borderRadius: 2,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 0.5 }}
                >
                  <Autorenew color="info" fontSize="small" />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    Cập nhật
                  </Typography>
                </Stack>
                <Typography variant="h5" color="info.main" fontWeight={700}>
                  {summary.updatedCount}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box
                sx={{
                  p: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 0.5 }}
                >
                  <DeleteOutline color="action" fontSize="small" />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    Đã xóa
                  </Typography>
                </Stack>
                <Typography variant="h5" color="text.primary" fontWeight={700}>
                  {summary.deletedCount || 0}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box
                sx={{
                  p: 1.5,
                  border: "1px solid",
                  borderColor: "error.main",
                  borderRadius: 2,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 0.5 }}
                >
                  <ErrorIcon color="error" fontSize="small" />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    Lỗi
                  </Typography>
                </Stack>
                <Typography variant="h5" color="error.main" fontWeight={700}>
                  {summary.invalidCount}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          "&::-webkit-scrollbar": { display: "none" },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ mb: 2, color: "error.main" }}
        >
          Chi tiết {errors?.length || 0} dòng dữ liệu không hợp lệ:
        </Typography>

        <List sx={{ pt: 0 }}>
          {(errors || []).map((item, index) => (
            <ListItem
              key={index}
              disableGutters
              sx={{
                mb: 1.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "background.default",
                border: "1px solid",
                borderColor: "error.main",
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: "50%",
                  bgcolor: "error.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "background.paper",
                  fontSize: 13,
                  fontWeight: "bold",
                }}
              >
                {index + 1}
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="error.main"
                  fontWeight={600}
                  sx={{ lineHeight: 1.6 }}
                >
                  {item.error}
                </Typography>
              </Box>
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          sx={{ fontWeight: 600 }}
        >
          Xác nhận đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportErrorDialog;
