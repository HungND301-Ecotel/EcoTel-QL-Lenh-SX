import React, { useState } from "react";
import { Tooltip, Button, Box, SxProps, Theme } from "@mui/material";
import ExcelLogo from "../../../../assets/icons/excel.png";
import WExcelLogo from "../../../../assets/icons/w_excel.png";

interface ExportExcelButtonProps {
  onClick: () => void;
  sx?: SxProps<Theme>; // Cho phép tùy chỉnh style từ bên ngoài nếu cần
}

const ExportExcelButton: React.FC<ExportExcelButtonProps> = ({
  onClick,
  sx,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  return (
    <Tooltip title="Xuất Excel">
      <Button
        variant="contained"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        sx={{
          minWidth: "40px",
          width: "40px",
          height: "40px",
          p: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#00900a",
          border: "1px solid",
          borderColor: "#00900a",
          boxShadow: "none",
          "&:hover": {
            bgcolor: "#e9ffea",
            borderColor: "#00900a",
            boxShadow: "none",
          },
          ...sx,
        }}
      >
        <Box
          component="img"
          src={isHovered ? ExcelLogo : WExcelLogo}
          alt="Excel Logo"
          sx={{
            width: 20,
            height: 20,
            objectFit: "contain",
          }}
        />
      </Button>
    </Tooltip>
  );
};

export default ExportExcelButton;
