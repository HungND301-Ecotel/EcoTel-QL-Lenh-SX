import React, { useState } from "react";
import { Box, IconButton, Pagination, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AssetEbookCover from "./AssetEbookCover";
import AssetEbookDetails from "./AssetEbookDetails";

interface AssetEbookProps {
  asset: any;
  onClose: () => void;
}

export default function AssetEbook({ asset, onClose }: AssetEbookProps) {
  const [page, setPage] = useState(1);
  const totalPages = 2; // Ví dụ 2 trang

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
      }}
    >
      {/* Header with Close Button and Pagination */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" color="primary" fontWeight="bold">
          Lý lịch phương tiện
        </Typography>

        {/* Pagination at the top */}
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>

        <IconButton onClick={onClose} color="error" title="Đóng">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content Area */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          p: 2,
          borderRadius: 2,
        }}
      >
        {page === 1 && <AssetEbookCover asset={asset} />}
        {page === 2 && <AssetEbookDetails asset={asset} />}
      </Box>
    </Box>
  );
}
