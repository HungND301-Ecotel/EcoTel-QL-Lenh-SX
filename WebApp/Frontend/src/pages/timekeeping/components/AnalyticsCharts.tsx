import React from "react";
import { Grid, Box, Paper } from "@mui/material";
import { PieChart, BarChart } from "@mui/x-charts";

interface AnalyticsChartsProps {
  selectedMonth: string;
  selectedYear: string;
  pieChartData: any[];
  barChartData: any[];
}

export default function AnalyticsCharts({
  selectedMonth,
  selectedYear,
  pieChartData,
  barChartData,
}: AnalyticsChartsProps) {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Donut Chart */}
      <Grid item xs={12} xl={6}>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Box
            sx={{
              bgcolor: "#1e3a8a",
              color: "#ffffff",
              px: 2.5,
              py: 2,
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              fontWeight: "bold",
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            TÌNH TRẠNG CÔNG - THÁNG {selectedMonth}/{selectedYear}
          </Box>
          <Paper
            elevation={1}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderTop: "none",
              borderBottomLeftRadius: "16px",
              borderBottomRightRadius: "16px",
              p: 2.5,
              minHeight: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
                    innerRadius: 40,
                    outerRadius: 80,
                    paddingAngle: 2,
                    cornerRadius: 4,
                    cx: "50%",
                    cy: "45%",
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
                      fontSize: 12,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Box>
      </Grid>

      {/* Bar Chart */}
      <Grid item xs={12} xl={6}>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Box
            sx={{
              bgcolor: "#1e3a8a",
              color: "#ffffff",
              px: 2.5,
              py: 2,
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              fontWeight: "bold",
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            THỐNG KÊ CHẤM CÔNG NĂM {selectedYear}
          </Box>
          <Paper
            elevation={1}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderTop: "none",
              borderBottomLeftRadius: "16px",
              borderBottomRightRadius: "16px",
              p: 2.5,
              minHeight: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#ffffff",
            }}
          >
            <Box sx={{ width: "100%", height: 240 }}>
              <BarChart
                dataset={barChartData}
                xAxis={[{ scaleType: "band", dataKey: "month" }]}
                series={[
                  { dataKey: "working", label: "Đi làm", color: "#10b981" },
                  { dataKey: "absent", label: "Nghỉ", color: "#ef4444" },
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
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Box>
      </Grid>
    </Grid>
  );
}
