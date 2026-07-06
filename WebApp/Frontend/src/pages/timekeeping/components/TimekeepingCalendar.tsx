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
        backgroundColor: "rgba(16, 185, 129, 0.045)",
        color: "#0f172a",
        badgeBg: "rgba(16, 185, 129, 0.08)",
        badgeText: "#047857",
        badgeLabel: "ĐỦ GIỜ",
        themeColor: "#10b981",
      };
    case "late":
      return {
        backgroundColor: "rgba(99, 102, 241, 0.045)",
        color: "#0f172a",
        badgeBg: "rgba(99, 102, 241, 0.08)",
        badgeText: "#4338ca",
        badgeLabel: "ĐI MUỘN",
        themeColor: "#6366f1",
      };
    case "short":
      return {
        backgroundColor: "rgba(245, 158, 11, 0.045)",
        color: "#0f172a",
        badgeBg: "rgba(245, 158, 11, 0.08)",
        badgeText: "#b45309",
        badgeLabel: "THIẾU GIỜ",
        themeColor: "#f59e0b",
      };
    case "absent":
      return {
        backgroundColor: "rgba(244, 63, 94, 0.045)",
        color: "#94a3b8",
        badgeBg: "rgba(244, 63, 94, 0.08)",
        badgeText: "#be123c",
        badgeLabel: "NGHỈ LÀM",
        themeColor: "#f43f5e",
      };
    case "future":
    default:
      return {
        backgroundColor: "rgba(248, 250, 252, 0.4)",
        color: "#94a3b8",
        badgeBg: "transparent",
        badgeText: "#94a3b8",
        badgeLabel: "",
        themeColor: "#cbd5e1",
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
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mb: 2 }}>
        <FormControl size="small" sx={{ width: 130 }}>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            sx={{
              borderRadius: "10px",
              bgcolor: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              color: "#0f172a",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(15, 23, 42, 0.06)",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(15, 23, 42, 0.12)",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#0f172a",
                borderWidth: "1px",
              },
            }}
          >
            {months.map((m) => (
              <MenuItem key={m.value} value={m.value} sx={{ fontSize: "13px" }}>
                {m.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ width: 130 }}>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            sx={{
              borderRadius: "10px",
              bgcolor: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              color: "#0f172a",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(15, 23, 42, 0.06)",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(15, 23, 42, 0.12)",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#0f172a",
                borderWidth: "1px",
              },
            }}
          >
            {years.map((y) => (
              <MenuItem key={y.value} value={y.value} sx={{ fontSize: "13px" }}>
                {y.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Elegant White Header with Legend */}
      <Box
        sx={{
          bgcolor: "#ffffff",
          color: "#0f172a",
          px: 3,
          py: 2.5,
          borderTopLeftRadius: "16px",
          borderTopRightRadius: "16px",
          border: "1px solid rgba(15, 23, 42, 0.06)",
          borderBottom: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: "18px",
            color: "#0f172a",
          }}
        >
          Bảng chấm công • Tháng {selectedMonth}/{selectedYear}
        </Typography>
        <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap", fontSize: "11px", fontWeight: 600 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10b981" }} />
            <Typography variant="caption" sx={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>Đi làm</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#f43f5e" }} />
            <Typography variant="caption" sx={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>Nghỉ</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#f59e0b" }} />
            <Typography variant="caption" sx={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>Thiếu giờ</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#6366f1" }} />
            <Typography variant="caption" sx={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>Đi muộn</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "#e2e8f0",
                border: "1px solid rgba(15,23,42,0.1)",
              }}
            />
            <Typography variant="caption" sx={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>Chưa đến</Typography>
          </Box>
        </Box>
      </Box>

      {/* Grid Body */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid rgba(15, 23, 42, 0.06)",
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
            bgcolor: "#faf9f6",
            borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
            textAlign: "center",
          }}
        >
          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day, idx) => (
            <Box
              key={day}
              sx={{
                py: 1.5,
                fontSize: "12px",
                fontWeight: 700,
                color: idx === 0 ? "#be123c" : "#475569",
                letterSpacing: "0.05em",
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
            gap: 1.25,
            bgcolor: "transparent",
            p: 1.25,
          }}
        >
          {/* Empty Offset cells */}
          {Array.from({ length: startOffset }).map((_, idx) => (
            <Box
              key={`empty-${idx}`}
              sx={{
                minHeight: "105px",
                bgcolor: "rgba(248, 250, 252, 0.35)",
                borderRadius: "10px",
                border: "1px dashed rgba(15, 23, 42, 0.04)",
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
                  minHeight: "105px",
                  p: 2,
                  borderRadius: "10px",
                  border: "1px solid rgba(15, 23, 42, 0.05)",
                  bgcolor: cellStyle.backgroundColor,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 16px -4px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.02)",
                    borderColor: "rgba(15, 23, 42, 0.12)",
                    zIndex: 1,
                  },
                }}
              >
                {/* Cell Top Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      color: cellStyle.color,
                      fontSize: "15px",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {record.dayNum}
                  </Typography>
                  {cellStyle.badgeLabel && (
                    <Box
                      sx={{
                        fontSize: "9.5px",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        px: "8px",
                        py: "3px",
                        borderRadius: "4px",
                        bgcolor: cellStyle.badgeBg,
                        color: cellStyle.badgeText,
                      }}
                    >
                      {cellStyle.badgeLabel}
                    </Box>
                  )}
                </Box>

                {/* Cell Contents */}
                {record.status === "absent" || record.status === "future" ? (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#52525b",
                      fontStyle: "italic",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      mt: 1.5,
                      display: "block",
                      textAlign: "left",
                    }}
                  >
                    {record.status === "future" ? "Chưa đến" : "Nghỉ phép"}
                  </Typography>
                ) : (
                  /* Design Anchor: Micro-Timeline Graphic */
                  <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", mt: 1.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        height: 28,
                        width: 6,
                        position: "relative",
                      }}
                    >
                      <Box
                        sx={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          bgcolor: cellStyle.themeColor,
                          zIndex: 1,
                        }}
                      />
                      <Box
                        sx={{
                          flexGrow: 1,
                          width: "1.5px",
                          bgcolor: `${cellStyle.themeColor}33`,
                        }}
                      />
                      <Box
                        sx={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          bgcolor: cellStyle.themeColor,
                          zIndex: 1,
                        }}
                      />
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontSize: "12px",
                          display: "flex",
                          gap: 0.5,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        Vào:{" "}
                        <Box component="span" sx={{ color: "#0f172a", fontWeight: 700, fontSize: "12.5px" }}>
                          {record.checkIn}
                        </Box>
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontSize: "12px",
                          display: "flex",
                          gap: 0.5,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        Ra:{" "}
                        <Box component="span" sx={{ color: "#0f172a", fontWeight: 700, fontSize: "12.5px" }}>
                          {record.checkOut}
                        </Box>
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
