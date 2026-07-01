import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Breadcrumbs,
  Link,
  Avatar,
  TextField,
  InputAdornment,
  Grid,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import { Search, Award, Calendar, AlertTriangle } from "lucide-react";
import { PieChart, BarChart } from "@mui/x-charts";

// 1. Interfaces local definitions
interface Employee {
  id: string;
  code: string;
  name: string;
  team: string;
  role: string;
  avatarUrl: string | null;
}

interface DailyRecord {
  date: string;
  dayNum: number;
  dayOfWeek: "CN" | "T2" | "T3" | "T4" | "T5" | "T6" | "T7";
  status: "working" | "absent" | "late" | "short" | "future";
  checkIn: string;
  checkOut: string;
}

// 2. Mock Data
const mockEmployees: Employee[] = [
  { id: "emp_001", code: "NV001", name: "Nguyễn Văn A", team: "Đội Khai Thác", role: "Công Nhân", avatarUrl: null },
  { id: "emp_002", code: "NV002", name: "Trần Thị B", team: "Phòng Hành Chính", role: "Chuyên Viên", avatarUrl: null },
  { id: "emp_003", code: "NV003", name: "Phạm Văn C", team: "Đội Vận Chuyển", role: "Tài Xế", avatarUrl: null },
  { id: "emp_004", code: "NV004", name: "Lê Hoàng D", team: "Đội Khai Thác", role: "Kỹ Thuật Viên", avatarUrl: null },
  { id: "emp_005", code: "NV005", name: "Vũ Thị E", team: "Phòng Kế Toán", role: "Kế Toán Viên", avatarUrl: null },
  { id: "emp_006", code: "NV006", name: "Nguyễn Tiến F", team: "Đội Vận Chuyển", role: "Tài Xế", avatarUrl: null },
  { id: "emp_007", code: "NV007", name: "Trần Văn G", team: "Đội Khai Thác", role: "Đội Trưởng", avatarUrl: null },
  { id: "emp_008", code: "NV008", name: "Lê Thị H", team: "Phòng Nhân Sự", role: "Chuyên Viên", avatarUrl: null },
  { id: "emp_009", code: "NV009", name: "Hoàng Văn I", team: "Đội Vận Chuyển", role: "Tài Xế", avatarUrl: null },
  { id: "emp_010", code: "NV010", name: "Đỗ Minh J", team: "Đội Cơ Điện", role: "Thợ Điện", avatarUrl: null },
];

const months = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Tháng ${i + 1}`,
}));

const years = [
  { value: "2023", label: "Năm 2023" },
  { value: "2024", label: "Năm 2024" },
  { value: "2025", label: "Năm 2025" },
];

// Helper to generate avatar color based on employee code
const getAvatarStyle = (code: string) => {
  const num = parseInt(code.replace(/\D/g, ""), 10) || 0;
  const colors = [
    { bg: "#e8f5e9", text: "#2e7d32" }, // Green
    { bg: "#e8eaf6", text: "#3f51b5" }, // Indigo
    { bg: "#fce8e6", text: "#c5221f" }, // Red
    { bg: "#fff3e0", text: "#ef6c00" }, // Orange
    { bg: "#f3e5f5", text: "#8e24aa" }, // Purple
    { bg: "#e0f7fa", text: "#00838f" }, // Cyan
  ];
  return colors[num % colors.length];
};

// Helper to extract initials
const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const prev = parts[parts.length - 2];
    return ((prev[0] || "") + (last[0] || "")).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function TimekeepingPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee>(mockEmployees[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("4");
  const [selectedYear, setSelectedYear] = useState("2024");

  // 3. Search logic
  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return mockEmployees;
    return mockEmployees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(query) ||
        emp.code.toLowerCase().includes(query) ||
        emp.team.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // 4. Generate dynamic calendar records
  const { startOffset, records } = useMemo(() => {
    const year = parseInt(selectedYear, 10);
    const month = parseInt(selectedMonth, 10);
    const totalDays = new Date(year, month, 0).getDate();
    const offset = new Date(year, month - 1, 1).getDay(); // 0: CN, 1: T2 ...
    const dayOfWeekNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;

    const hash = selectedEmployee ? selectedEmployee.id.charCodeAt(selectedEmployee.id.length - 1) : 0;
    const generated: DailyRecord[] = [];

    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeekIndex = dateObj.getDay();
      const dayOfWeek = dayOfWeekNames[dayOfWeekIndex];

      const isFuture = day > 28;

      let status: DailyRecord["status"] = "working";
      let checkIn = "08:00";
      let checkOut = "17:00";

      if (isFuture) {
        status = "future";
        checkIn = "";
        checkOut = "";
      } else if (dayOfWeek === "CN") {
        status = "absent";
        checkIn = "";
        checkOut = "";
      } else if (dayOfWeek === "T7") {
        status = "short";
        checkIn = "08:00";
        checkOut = "12:00";
      } else {
        const seed = (day + hash) % 12;
        if (seed === 2) {
          status = "late";
          checkIn = "08:35";
          checkOut = "17:00";
        } else if (seed === 5) {
          status = "absent";
          checkIn = "";
          checkOut = "";
        } else if (seed === 8) {
          status = "short";
          checkIn = "08:00";
          checkOut = "15:30";
        } else {
          status = "working";
          const offsetVal = day % 5;
          checkIn = `07:4${offsetVal}`;
          checkOut = `16:5${offsetVal}`;
        }
      }

      generated.push({
        date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        dayNum: day,
        dayOfWeek,
        status,
        checkIn,
        checkOut,
      });
    }

    return { startOffset: offset, records: generated };
  }, [selectedEmployee, selectedMonth, selectedYear]);

  // 5. Calculate statistics from calendar
  const stats = useMemo(() => {
    let working = 0;
    let absent = 0;
    let late = 0;
    let short = 0;

    records.forEach((r) => {
      if (r.status === "working") working++;
      else if (r.status === "absent") absent++;
      else if (r.status === "late") late++;
      else if (r.status === "short") short++;
    });

    return {
      totalWorkingDays: working,
      totalAbsentDays: absent,
      totalLateDays: late,
      totalShortHours: short,
    };
  }, [records]);

  // 6. Initials for current selected employee
  const initials = useMemo(() => {
    return getInitials(selectedEmployee.name);
  }, [selectedEmployee]);

  // 7. Pie chart data
  const pieChartData = useMemo(() => {
    return [
      { id: 0, value: stats.totalWorkingDays, label: "Đi làm", color: "#10b981" },
      { id: 1, value: stats.totalAbsentDays, label: "Nghỉ", color: "#ef4444" },
      { id: 2, value: stats.totalShortHours, label: "Thiếu giờ", color: "#f59e0b" },
      { id: 3, value: stats.totalLateDays, label: "Đi muộn", color: "#1a73e8" },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // 8. Bar chart data
  const barChartData = useMemo(() => {
    const hash = selectedEmployee ? selectedEmployee.id.charCodeAt(selectedEmployee.id.length - 1) : 0;
    return Array.from({ length: 12 }, (_, i) => {
      const monthIndex = i + 1;
      const absent = 1 + ((monthIndex + hash) % 3);
      const short = 1 + ((monthIndex + hash) % 4);
      const working = 14 + ((monthIndex + hash) % 4) * 2;
      return {
        month: `T${monthIndex}`,
        working,
        absent,
        short,
      };
    });
  }, [selectedEmployee]);

  // Helper to determine styling of cells based on status
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

  const selectedAvatarColors = getAvatarStyle(selectedEmployee.code);

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#fdfcfc", p: 1 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/">
          Trang chủ
        </Link>
        <Typography color="text.primary">Quản lý chấm công</Typography>
      </Breadcrumbs>

      {/* Main Layout Grid */}
      <Grid container spacing={3}>
        {/* Left Sidebar */}
        <Grid item xs={12} md={3.5} lg={3}>
          <Paper
            elevation={1}
            sx={{
              borderRadius: "16px",
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              height: "calc(100vh - 120px)",
              bgcolor: "#ffffff",
              position: { md: "sticky" },
              top: { md: "100px" },
            }}
          >
            {/* Sidebar Title */}
            <Box
              sx={{
                bgcolor: "#1e3a8a",
                color: "#ffffff",
                px: 2.5,
                py: 2,
                fontWeight: "bold",
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Danh sách nhân viên
            </Box>

            {/* Search Input */}
            <Box sx={{ px: 2, py: 1.5 }}>
              <TextField
                fullWidth
                variant="standard"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} color="#777169" />
                    </InputAdornment>
                  ),
                  disableUnderline: false,
                  sx: {
                    py: 1,
                    fontSize: "14px",
                    borderBottom: "1px solid #000000",
                    "&:before, &:after": {
                      display: "none",
                    },
                  },
                }}
              />
            </Box>

            {/* Scrollable list */}
            <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1, pb: 2 }}>
              {filteredEmployees.map((emp) => {
                const isSelected = selectedEmployee.id === emp.id;
                const colors = getAvatarStyle(emp.code);
                const empInitials = getInitials(emp.name);

                return (
                  <Box
                    key={emp.id}
                    component="button"
                    onClick={() => setSelectedEmployee(emp)}
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      py: "12px",
                      border: "none",
                      outline: "none",
                      transition: "all 0.2s",
                      cursor: "pointer",
                      textAlign: "left",
                      borderRadius: "8px",
                      mb: "4px",
                      ...(isSelected
                        ? {
                          bgcolor: "#f5f3f1",
                          borderLeft: "4px solid #1e3a8a",
                          pl: "12px",
                          pr: "16px",
                        }
                        : {
                          bgcolor: "transparent",
                          borderLeft: "4px solid transparent",
                          pl: "16px",
                          pr: "16px",
                          "&:hover": {
                            bgcolor: "#fdfcfc",
                          },
                        }),
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: "11px",
                        fontWeight: 600,
                        bgcolor: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {empInitials}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          color: "#000000",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {emp.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#777169", display: "block" }}>
                        {emp.team}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Right Content Area */}
        <Grid item xs={12} md={8.5} lg={9}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              pr: 1,
            }}
          >
            {/* Section 1: Profile & Stats Display */}
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

            {/* Section 2: Time Filter & Calendar Grid */}
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

            {/* Section 3: Analytics Charts */}
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
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
