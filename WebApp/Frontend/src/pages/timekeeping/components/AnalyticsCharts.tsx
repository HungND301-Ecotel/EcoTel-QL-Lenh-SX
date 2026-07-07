import React from "react";
import { Box, Paper } from "@mui/material";
import { PieChart, BarChart } from "@mui/x-charts";

interface AttendanceDonutChartProps {
  selectedMonth: string;
  selectedYear: string;
  pieChartData: any[];
}

export function AttendanceDonutChart({
  selectedMonth,
  selectedYear,
  pieChartData,
}: AttendanceDonutChartProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          bgcolor: "#ffffff",
          color: "#0f172a",
          px: 3,
          py: 2,
          borderTopLeftRadius: "16px",
          borderTopRightRadius: "16px",
          border: "1px solid rgba(15, 23, 42, 0.06)",
          borderBottom: "none",
          fontWeight: 700,
          fontSize: "12px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Tình trạng công • Tháng {selectedMonth}/{selectedYear}
      </Box>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid rgba(15, 23, 42, 0.06)",
          borderTop: "none",
          borderBottomLeftRadius: "16px",
          borderBottomRightRadius: "16px",
          p: 3,
          minHeight: 280,
          bgcolor: "#ffffff",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: 240,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <PieChart
            series={[
              {
                data: pieChartData,
                innerRadius: 50,
                outerRadius: 80,
                paddingAngle: 3,
                cornerRadius: 6,
                cx: "50%",
                cy: "42%",
              },
            ]}
            height={230}
            margin={{ top: 0, bottom: 40, left: 0, right: 0 }}
            slotProps={{
              legend: {
                direction: "row",
                position: { vertical: "bottom", horizontal: "middle" },
                padding: 0,
                labelStyle: {
                  fontSize: 11,
                  fontWeight: 600,
                  fill: "#475569",
                },
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}

interface YearlyBarChartProps {
  selectedYear: string;
  barChartData: any[];
}

export function YearlyBarChart({
  selectedYear,
  barChartData,
}: YearlyBarChartProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          bgcolor: "#ffffff",
          color: "#0f172a",
          px: 3,
          py: 2,
          borderTopLeftRadius: "16px",
          borderTopRightRadius: "16px",
          border: "1px solid rgba(15, 23, 42, 0.06)",
          borderBottom: "none",
          fontWeight: 700,
          fontSize: "12px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Thống kê chấm công năm {selectedYear}
      </Box>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid rgba(15, 23, 42, 0.06)",
          borderTop: "none",
          borderBottomLeftRadius: "16px",
          borderBottomRightRadius: "16px",
          p: 3,
          minHeight: 280,
          bgcolor: "#ffffff",
        }}
      >
        <Box sx={{ width: "100%", height: 240 }}>
          <BarChart
            dataset={barChartData}
            xAxis={[{ scaleType: "band", dataKey: "month" }]}
            series={[
              { dataKey: "working", label: "Đi làm", color: "#10b981" },
              { dataKey: "absent", label: "Nghỉ", color: "#f43f5e" },
              { dataKey: "short", label: "Thiếu giờ", color: "#f59e0b" },
            ]}
            height={230}
            slotProps={{
              legend: {
                direction: "row",
                position: { vertical: "bottom", horizontal: "middle" },
                padding: 0,
                labelStyle: {
                  fontSize: 11,
                  fontWeight: 600,
                  fill: "#475569",
                },
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
