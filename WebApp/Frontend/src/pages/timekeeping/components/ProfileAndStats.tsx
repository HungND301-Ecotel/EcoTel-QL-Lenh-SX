import React from "react";
import { Paper, Box, Avatar, Typography, Grid } from "@mui/material";
import { Award, Calendar, AlertTriangle } from "lucide-react";
import { Employee } from "../types";

interface ProfileAndStatsProps {
  selectedEmployee: Employee;
  stats: {
    totalWorkingDays: number;
    totalAbsentDays: number;
    totalLateDays: number;
    totalShortHours: number;
  };
  initials: string;
  getAvatarStyle: (code: string) => { bg: string; text: string };
}

export default function ProfileAndStats({
  selectedEmployee,
  stats,
  initials,
  getAvatarStyle,
}: ProfileAndStatsProps) {
  const selectedAvatarColors = getAvatarStyle(selectedEmployee.code);

  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "divider",
        p: 2.5,
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        justifyContent: "space-between",
        alignItems: "center",
        gap: 3,
        bgcolor: "#ffffff",
      }}
    >
      {/* Profile details */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          pr: { lg: 3 },
          borderRight: { lg: "1px solid" },
          borderColor: { lg: "divider" },
          minWidth: { lg: 280 },
          width: { xs: "100%", lg: "auto" },
        }}
      >
        <Avatar
          sx={{
            width: 56,
            height: 56,
            fontSize: "14px",
            fontWeight: 600,
            bgcolor: selectedAvatarColors.bg,
            color: selectedAvatarColors.text,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: "#777169", fontWeight: 500 }}>
            Mã NV: {selectedEmployee.code}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#000000" }}>
            {selectedEmployee.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Box
              sx={{
                bgcolor: "#f5f3f1",
                color: "#000000",
                fontSize: "10px",
                px: 1,
                py: 0.25,
                fontWeight: 500,
                borderRadius: "4px",
              }}
            >
              {selectedEmployee.team}
            </Box>
            <Box
              sx={{
                bgcolor: "#f5f3f1",
                color: "#777169",
                fontSize: "10px",
                px: 1,
                py: 0.25,
                fontWeight: 500,
                borderRadius: "4px",
              }}
            >
              {selectedEmployee.role}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ flexGrow: 1, width: "100%" }}>
        {/* Working Card */}
        <Grid item xs={12} sm={4}>
          <Box
            sx={{
              borderRadius: "12px",
              p: 2,
              bgcolor: "#e6f4ea",
              color: "#137333",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="caption" sx={{ fontWeight: "bold", letterSpacing: "0.05em" }}>
                SỐ NGÀY ĐI LÀM
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5, lineHeight: 1 }}>
                {stats.totalWorkingDays} <Box component="span" sx={{ fontSize: "11px", fontWeight: "normal" }}>ngày</Box>
              </Typography>
            </Box>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                bgcolor: "rgba(255, 255, 255, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Award size={18} />
            </Box>
          </Box>
        </Grid>

        {/* Absent Card */}
        <Grid item xs={12} sm={4}>
          <Box
            sx={{
              borderRadius: "12px",
              p: 2,
              bgcolor: "#fce8e6",
              color: "#c5221f",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="caption" sx={{ fontWeight: "bold", letterSpacing: "0.05em" }}>
                SỐ NGÀY NGHỈ
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5, lineHeight: 1 }}>
                {stats.totalAbsentDays} <Box component="span" sx={{ fontSize: "11px", fontWeight: "normal" }}>ngày</Box>
              </Typography>
            </Box>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                bgcolor: "rgba(255, 255, 255, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calendar size={18} />
            </Box>
          </Box>
        </Grid>

        {/* Late/Short Hours Card */}
        <Grid item xs={12} sm={4}>
          <Box
            sx={{
              borderRadius: "12px",
              p: 2,
              bgcolor: "#fef7e0",
              color: "#b06000",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="caption" sx={{ fontWeight: "bold", letterSpacing: "0.05em" }}>
                ĐI MUỘN / THIẾU GIỜ
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5, lineHeight: 1 }}>
                {stats.totalLateDays + stats.totalShortHours} <Box component="span" sx={{ fontSize: "11px", fontWeight: "normal" }}>ngày</Box>
              </Typography>
            </Box>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                bgcolor: "rgba(255, 255, 255, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={18} />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
