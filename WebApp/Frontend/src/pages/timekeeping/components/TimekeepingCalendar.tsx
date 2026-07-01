import React from "react";
import { Box, Paper, Typography, Select, MenuItem, FormControl } from "@mui/material";
import { DailyRecord } from "../types";

interface TimekeepingCalendarProps {
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  startOffset: number;
  records: DailyRecord[];
}

const months = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Tháng ${i + 1}`,
}));

const years = [
  { value: "2023", label: "Năm 2023" },
  { value: "2024", label: "Năm 2024" },
  { value: "2025", label: "Năm 2025" },
];

const getCellStyles = (status: DailyRecord["status"]) => {
  switch (status) {
    case "working":
      return {
        backgroundColor: "rgba(230, 244, 234, 0.2)",
        color: "#000000",
        textColorClass: "#137333",
      };
    case "late":
      return {
        backgroundColor: "rgba(232, 240, 254, 0.4)",
        color: "#000000",
        textColorClass: "#0b57d0",
        badgeBg: "#e8f0fe",
        badgeText: "#0b57d0",
        badgeLabel: "MUỘN",
      };
    case "short":
      return {
        backgroundColor: "rgba(254, 247, 224, 0.45)",
        color: "#000000",
        textColorClass: "#b06000",
        badgeBg: "#fef7e0",
        badgeText: "#b06000",
        badgeLabel: "THIẾU",
      };
    case "absent":
      return {
        backgroundColor: "rgba(252, 232, 230, 0.3)",
        color: "#c5221f",
        textColorClass: "rgba(119, 113, 105, 0.4)",
        badgeBg: "#fce8e6",
        badgeText: "#c5221f",
        badgeLabel: "NGHỈ",
      };
    case "future":
    default:
      return {
        backgroundColor: "rgba(245, 243, 241, 0.6)",
        color: "rgba(119, 113, 105, 0.4)",
        textColorClass: "rgba(119, 113, 105, 0.4)",
      };
  }
};

export default function TimekeepingCalendar({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  startOffset,
  records,
}: TimekeepingCalendarProps) {
  return (
    <Box>
      {/* Date selection dropdowns */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mb: 1 }}>
        <FormControl size="small" sx={{ width: 120 }}>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            sx={{
              borderRadius: "8px",
              bgcolor: "#ffffff",
              fontSize: "14px",
            }}
          >
            {months.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ width: 120 }}>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            sx={{
              borderRadius: "8px",
              bgcolor: "#ffffff",
              fontSize: "14px",
            }}
          >
            {years.map((y) => (
              <MenuItem key={y.value} value={y.value}>
                {y.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Blue Header with Legend */}
      <Box
        sx={{
          bgcolor: "#1e3a8a",
          color: "#ffffff",
          px: 2.5,
          py: 2,
          borderTopLeftRadius: "16px",
          borderTopRightRadius: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Typography sx={{ fontWeight: "bold", fontSize: "14px" }}>
          Bảng Chấm Công Tháng {selectedMonth}/{selectedYear}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", fontSize: "12px", fontWeight: 500 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#10b981" }} />
            <Typography variant="caption">Đi Làm</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#ef4444" }} />
            <Typography variant="caption">Nghỉ</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#f59e0b" }} />
            <Typography variant="caption">Thiếu Giờ</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#1a73e8" }} />
            <Typography variant="caption">Đi Muộn</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "#e5e5e5",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            />
            <Typography variant="caption">Chưa Đến</Typography>
          </Box>
        </Box>
      </Box>

      {/* Grid Body */}
      <Paper
        elevation={1}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderTop: "none",
          borderBottomLeftRadius: "16px",
          borderBottomRightRadius: "16px",
          overflow: "hidden",
          bgcolor: "#ffffff",
        }}
      >
        {/* Weekdays Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            bgcolor: "#fdfcfc",
            borderBottom: "1px solid",
            borderColor: "divider",
            textAlign: "center",
          }}
        >
          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day, idx) => (
            <Box
              key={day}
              sx={{
                py: 1.5,
                fontSize: "13px",
                fontWeight: 600,
                color: "#777169",
                borderRight: idx < 6 ? "1px solid" : "none",
                borderColor: "divider",
              }}
            >
              {day}
            </Box>
          ))}
        </Box>

        {/* Days Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            borderLeft: "1px solid",
            borderColor: "divider",
          }}
        >
          {/* Empty Offset cells */}
          {Array.from({ length: startOffset }).map((_, idx) => (
            <Box
              key={`empty-${idx}`}
              sx={{
                minHeight: "96px",
                bgcolor: "rgba(253, 252, 252, 0.2)",
                borderRight: "1px solid",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            />
          ))}

          {/* Actual Day cells */}
          {records.map((record) => {
            const cellStyle = getCellStyles(record.status);
            return (
              <Box
                key={record.date}
                sx={{
                  minHeight: "96px",
                  p: 1.5,
                  borderRight: "1px solid",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  bgcolor: cellStyle.backgroundColor,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "opacity 0.15s",
                  "&:hover": {
                    opacity: 0.9,
                  },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: cellStyle.color,
                    }}
                  >
                    {record.dayNum}
                  </Typography>
                  {cellStyle.badgeLabel && (
                    <Box
                      sx={{
                        fontSize: "9px",
                        fontWeight: "bold",
                        letterSpacing: "0.05em",
                        px: "6px",
                        py: "2px",
                        borderRadius: "12px",
                        bgcolor: cellStyle.badgeBg,
                        color: cellStyle.badgeText,
                      }}
                    >
                      {cellStyle.badgeLabel}
                    </Box>
                  )}
                </Box>

                <Box sx={{ mt: "14px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {record.status === "absent" || record.status === "future" ? (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(119, 113, 105, 0.4)",
                        fontStyle: "italic",
                        textAlign: "right",
                        fontSize: "11px",
                      }}
                    >
                      --:--
                    </Typography>
                  ) : (
                    <>
                      <Typography variant="caption" sx={{ color: "#777169", fontSize: "12px" }}>
                        Vào:{" "}
                        <Box
                          component="span"
                          sx={{ color: cellStyle.textColorClass, fontWeight: 600 }}
                        >
                          {record.checkIn}
                        </Box>
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#777169", fontSize: "12px" }}>
                        Ra:{" "}
                        <Box
                          component="span"
                          sx={{ color: cellStyle.textColorClass, fontWeight: 600 }}
                        >
                          {record.checkOut}
                        </Box>
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
