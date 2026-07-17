import React from "react";
import { Button, Tooltip, CircularProgress, type ButtonProps } from "@mui/material";

export interface ActionButtonSquareProps extends Omit<ButtonProps, "onClick"> {
    title: string; // Nội dung của Tooltip
    icon: React.ReactNode; // Icon hiển thị mặc định
    activeIcon?: React.ReactNode; // Icon hiển thị khi đang ở trạng thái active
    isActive?: boolean; // Trạng thái bật/tắt (VD: Mở/Đóng panel chi tiết)
    isLoading?: boolean; // Trạng thái đang tải (hiện vòng xoay)
    onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    rotateDegrees?: number; // Số độ xoay khi hover (VD: -180, 90, 180)
    activeColor?: string; // Màu chủ đạo (mặc định theo giao diện Hà Tu: #1976d2)
}

const ActionButtonSquare: React.FC<ActionButtonSquareProps> = ({
    title,
    icon,
    activeIcon,
    isActive = false,
    isLoading = false,
    onClick,
    rotateDegrees = 0,
    activeColor = "#1976d2",
    sx,
    ...rest
}) => {
    const currentIcon = isActive && activeIcon ? activeIcon : icon;

    return (
        <Tooltip title={title}>
            <span> {/* Bọc thẻ span để Tooltip hoạt động ngay cả khi Button bị disabled */}
                <Button
                    variant="contained"
                    onClick={onClick}
                    disabled={isLoading || rest.disabled}
                    sx={{
                        minWidth: "40px",
                        width: "40px",
                        height: "40px",
                        p: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: isActive ? "#e3f2fd" : activeColor,
                        border: "1px solid",
                        borderColor: activeColor,
                        boxShadow: "none",
                        "& svg": {
                            color: isActive ? activeColor : "#fff",
                            transition: "transform 0.3s ease",
                        },
                        "&:hover": {
                            bgcolor: "#e3f2fd",
                            borderColor: activeColor,
                            boxShadow: "none",
                            "& svg": {
                                color: activeColor,
                                // Chỉ áp dụng hiệu ứng xoay nếu rotateDegrees được truyền vào khác 0
                                transform: rotateDegrees ? `rotate(${rotateDegrees}deg)` : "none",
                            },
                        },
                        ...sx, // Cho phép ghi đè style từ bên ngoài nếu cần
                    }}
                    {...rest}
                >
                    {isLoading ? (
                        <CircularProgress size={20} sx={{ color: "inherit" }} />
                    ) : (
                        currentIcon
                    )}
                </Button>
            </span>
        </Tooltip>
    );
};

export default ActionButtonSquare;