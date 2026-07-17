import React from "react";
import { TextField, Tooltip, IconButton, TextFieldProps } from "@mui/material";

// 1. Hàm tạo style hover dùng chung cho các nút
export const getHoverStyle = (
  colorMode: "info" | "primary" | "success" | "error" | "warning",
) => ({
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    bgcolor: `${colorMode}.main`,
    color: `${colorMode}.contrastText`,
  },
});

// 2. Component Nút bấm hiện đại
interface ModernIconButtonProps {
  icon: React.ElementType;
  color: "info" | "primary" | "success" | "error" | "warning";
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  tabIndex?: number;
}

export const ModernIconButton: React.FC<ModernIconButtonProps> = ({
  icon: Icon,
  color,
  tooltip,
  onClick,
  disabled,
  tabIndex,
}) => (
  <Tooltip title={tooltip}>
    <span>
      <IconButton
        tabIndex={tabIndex}
        color={color}
        size="small"
        onClick={onClick}
        disabled={disabled}
        sx={{
          ...getHoverStyle(color),
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Icon size={18} />
      </IconButton>
    </span>
  </Tooltip>
);

// 3. Component Khung nhập liệu hiện đại
export const ModernTextField = (props: TextFieldProps) => (
  <TextField
    {...props}
    size="small"
    fullWidth
    sx={{
      "& .MuiOutlinedInput-root": {
        borderRadius: 2,
        bgcolor: "background.paper",
        transition: "all 0.2s ease-in-out",
        "&:hover fieldset": {
          borderColor: "primary.main",
        },
        "&.Mui-focused fieldset": {
          borderWidth: "1px",
          // Tạo hiệu ứng glow nhẹ màu primary khi focus
          boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main}20`,
        },
      },
      "& .MuiInputBase-root.Mui-disabled": {
        bgcolor: "action.disabledBackground",
      },
      ...props.sx,
    }}
  />
);
