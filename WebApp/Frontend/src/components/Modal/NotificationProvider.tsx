import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  LinearProgress,
  TextField,
  Button,
} from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";

type ModalType = "success" | "error" | "warning" | "info" | "confirm";

interface ModalState {
  open: boolean;
  type: ModalType;
  title: string;
  message: string;
  confirmWord?: string;
  onConfirm?: () => void;
  errorList?: string[];
}

interface ModalContextType {
  showModal: (type: ModalType, title: string, message: string) => void;
  showConfirm: (
    title: string,
    message: string,
    confirmWord: string,
    onConfirm: () => void,
  ) => void;
  showErrorList: (title: string, message: string, errors: string[]) => void;
}

const NotificationContext = createContext<ModalContextType | null>(null);

export const useNotification = () => useContext(NotificationContext)!;

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<ModalState>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [inputValue, setInputValue] = useState("");

  const showModal = (type: ModalType, title: string, message: string) => {
    setState({ open: true, type, title, message });
  };

  const showConfirm = (
    title: string,
    message: string,
    confirmWord: string,
    onConfirm: () => void,
  ) => {
    setState({
      open: true,
      type: "confirm",
      title,
      message,
      confirmWord,
      onConfirm,
    });
  };

  const showErrorList = (title: string, message: string, errors: string[]) => {
    setState({ open: true, type: "error", title, message, errorList: errors });
  };

  const handleClose = () => {
    setState((prev) => ({
      ...prev,
      open: false,
      confirmWord: undefined,
      onConfirm: undefined,
    }));
    setInputValue("");
    setProgress(100);
  };

  const renderIcon = () => {
    if (state.type === "error")
      return <ErrorIcon sx={{ fontSize: 60, color: "error.main" }} />;

    if (state.type === "warning")
      return <WarningIcon sx={{ fontSize: 60, color: "warning.main" }} />;

    if (state.type === "info")
      return <InfoIcon sx={{ fontSize: 60, color: "info.main" }} />;

    // Cho cả trường hợp "success" và "confirm"
    if (state.type === "confirm")
      return <WarningIcon sx={{ fontSize: 60, color: "error.main" }} />;

    return <CheckCircleIcon sx={{ fontSize: 60, color: "success.main" }} />;
  };

  useEffect(() => {
    const handleUserInteraction = () => {
      handleClose();
    };

    const isSticky =
      state.type === "confirm" ||
      (state.errorList && state.errorList.length > 0);

    if (!state.open || isSticky) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (!state.open || state.type === "confirm") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // 1. Khởi tạo lại Progress
    setProgress(100);
    const duration = 2000;
    const intervalTime = 50;
    const decrement = 100 / (duration / intervalTime);
    let currentProgress = 100;

    // 2. Xóa các timer cũ tránh trùng lặp
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    // 3. Chạy thanh Progress và đếm ngược đóng modal
    intervalRef.current = setInterval(() => {
      currentProgress -= decrement;
      setProgress(Math.max(currentProgress, 0));
    }, intervalTime);

    timerRef.current = setTimeout(() => {
      handleClose();
    }, duration);

    // 4. FIX LỖI: Dùng setTimeout để trì hoãn việc lắng nghe sự kiện click
    // Việc này giúp tránh bắt nhầm chính cái Click vừa mở Modal
    const listenDelay = setTimeout(() => {
      document.addEventListener("click", handleUserInteraction);
    }, 100); // Trễ 100ms cho an toàn

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      clearTimeout(listenDelay); // Xóa luôn cái delay nếu component unmount
      document.removeEventListener("click", handleUserInteraction);
    };
  }, [state.open, state.type, state.message]); // Chạy lại khi modal mở hoặc nội dung đổi

  const getBorderColor = () => {
    if (state.type === "error") return "error.main";
    if (state.type === "warning") return "warning.main";
    if (state.type === "info") return "info.main";
    if (state.type === "confirm") return "error.main";
    return "success.main";
  };

  return (
    <NotificationContext.Provider
      value={{ showModal, showConfirm, showErrorList }}
    >
      {children}

      <Dialog
        open={state.open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "4px",
            border: "1px solid", // Tách viền ra
            borderColor: getBorderColor(), // Để sx tự lấy mã màu trong Theme
            boxShadow: 24,
          },
        }}
      >
        <Box
          sx={{
            textAlign: "center",
            pt: 5,
            pb: state.type === "confirm" ? 2 : 3,
          }}
        >
          {renderIcon()}

          <DialogTitle sx={{ fontWeight: 700, textAlign: "center", pb: 1 }}>
            {state.title}
          </DialogTitle>

          <DialogContent
            sx={{
              // Ẩn thanh cuộn
              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            {/* LỜI NHẮN CHÍNH */}
            <Typography
              sx={{
                textAlign: "center",
                whiteSpace: "pre-line",
                mb: state.type === "confirm" || state.errorList ? 2 : 0,
              }}
            >
              {state.message}
            </Typography>

            {/* KIỂM TRA VÀ RENDER DANH SÁCH LỖI */}
            {state.errorList && state.errorList.length > 0 && (
              <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
                {state.errorList.map((error, index) => (
                  <Box
                    component="li"
                    key={index}
                    sx={{
                      mb: 1,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "#fff1f0",
                      border: "1px solid #ffa39e",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                    }}
                  >
                    {/* Vòng tròn số thứ tự */}
                    <Box
                      sx={{
                        minWidth: 24,
                        height: 24,
                        borderRadius: "50%",
                        bgcolor: "#ff4d4f",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "text.primary",
                        fontSize: 12,
                        fontWeight: "bold",
                        mt: 0.2,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography
                      variant="body2"
                      color="#cf1322"
                      sx={{ lineHeight: 1.6, textAlign: "left" }}
                    >
                      {error}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Ô NHẬP LIỆU CHO CONFIRM */}
            {state.type === "confirm" && state.confirmWord && (
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, color: "text.secondary" }}
                >
                  Vui lòng nhập <b>{state.confirmWord}</b> để xác nhận:
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={state.confirmWord}
                  autoComplete="off"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                />
              </Box>
            )}
          </DialogContent>

          {/* Phần chân Modal: Nút bấm (cho Confirm) hoặc Progress (cho Notify) */}
          {state.type === "confirm" ? (
            <Box sx={{ display: "flex", gap: 1, px: 3, pb: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClose}
                sx={{
                  color: "text.secondary",
                  borderColor: "divider",
                  borderRadius: "4px",
                }}
              >
                Hủy
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="error"
                disabled={inputValue !== state.confirmWord}
                onClick={() => {
                  state.onConfirm?.();
                  handleClose();
                }}
                sx={{ borderRadius: "4px", fontWeight: 600 }}
              >
                Xác nhận
              </Button>
            </Box>
          ) : state.errorList && state.errorList.length > 0 ? (
            // TRƯỜNG HỢP MỚI: Hiển thị nút "Đóng" tĩnh cho danh sách lỗi
            <Box sx={{ display: "flex", px: 3, pb: 2, mt: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClose}
                sx={{
                  color: "text.primary",
                  borderColor: "divider",
                  borderRadius: "4px",
                  fontWeight: 600,
                }}
              >
                Đóng
              </Button>
            </Box>
          ) : (
            // TRƯỜNG HỢP CŨ: Thanh chạy cho thông báo thường
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                mt: 2,
                height: 6,
                borderRadius: "4px",
                backgroundColor: "action.disabledBackground",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: getBorderColor(),
                },
              }}
            />
          )}
        </Box>
      </Dialog>
    </NotificationContext.Provider>
  );
};
