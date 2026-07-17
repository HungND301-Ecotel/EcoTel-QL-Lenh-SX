import React, { useState } from "react";
import {
  Tooltip,
  Button,
  SxProps,
  Theme,
  CircularProgress,
} from "@mui/material";
import { CloudUpload } from "@mui/icons-material"; // Dùng tạm icon của MUI vì em chưa đưa file ảnh cho nút Import

interface ImportExcelButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  sx?: SxProps<Theme>;
}

const ImportExcelButton: React.FC<ImportExcelButtonProps> = ({
  onClick,
  isLoading = false,
  sx,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  return (
    <Tooltip title="Nhập Excel">
      <Button
        variant="contained"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        disabled={isLoading}
        sx={{
          minWidth: "40px",
          width: "40px",
          height: "40px",
          p: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#1976d2", // Màu xanh dương (giống nút Thêm của em)
          border: "1px solid",
          borderColor: "#1976d2",
          boxShadow: "none",
          "&:hover": {
            bgcolor: "#e3f2fd", // Màu xanh dương nhạt
            borderColor: "#1976d2",
            boxShadow: "none",
            "& svg": { color: "#1976d2" }, // Đổi màu icon khi hover
          },
          ...sx,
        }}
      >
        {isLoading ? (
          <CircularProgress
            size={20}
            sx={{ color: isHovered ? "#1976d2" : "#fff" }}
          />
        ) : (
          <CloudUpload
            sx={{
              color: isHovered ? "#1976d2" : "#fff",
              width: 20,
              height: 20,
            }}
          />
        )}
      </Button>
    </Tooltip>
  );
};

export default ImportExcelButton;
