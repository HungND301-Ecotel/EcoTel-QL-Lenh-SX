import React, { useState, useMemo, useEffect } from "react";
import { Box, Breadcrumbs, Link, Typography, Grid, Alert } from "@mui/material";
import { Spin } from "antd";
import { Employee, DailyRecord } from "./types";
import EmployeeSidebar from "./components/EmployeeSidebar";
import ProfileAndStats from "./components/ProfileAndStats";
import TimekeepingCalendar from "./components/TimekeepingCalendar";
import { AttendanceDonutChart, YearlyBarChart } from "./components/AnalyticsCharts";
import { useQuery } from "@tanstack/react-query";
import UserService from "../../services/userService";

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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("4");
  const [selectedYear, setSelectedYear] = useState("2024");



  // Fetch users from backend API using useQuery
  const { data: usersData = [], isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: () => UserService.getAll(),
  });

  // Map backend users to UI Employee interface
  const employees = useMemo(() => {
    return usersData.map((u: any) => ({
      id: u._id,
      code: u.salaryCode || u.username || "NV000",
      name: u.fullName || "",
      team: typeof u.department === "object" && u.department !== null ? u.department.name : (u.department || "Khác"),
      role: typeof u.position === "object" && u.position !== null ? u.position.name : (u.position || "Nhân viên"),
      avatarUrl: u.avatar || null,
    }));
  }, [usersData]);

  // Handle selected employee initialization/changes
  useEffect(() => {
    if (employees.length > 0) {
      if (!selectedEmployee || !employees.some((e) => e.id === selectedEmployee.id)) {
        setSelectedEmployee(employees[0]);
      }
    } else {
      setSelectedEmployee(null);
    }
  }, [employees, selectedEmployee]);

  // Search logic
  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(query) ||
        emp.code.toLowerCase().includes(query) ||
        emp.team.toLowerCase().includes(query)
    );
  }, [searchQuery, employees]);

  // Generate dynamic calendar records
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

  // Calculate statistics from calendar
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

  // Initials for current selected employee
  const initials = useMemo(() => {
    return selectedEmployee ? getInitials(selectedEmployee.name) : "";
  }, [selectedEmployee]);

  // Pie chart data
  const pieChartData = useMemo(() => {
    return [
      { id: 0, value: stats.totalWorkingDays, label: "Đi làm", color: "#10b981" },
      { id: 1, value: stats.totalAbsentDays, label: "Nghỉ", color: "#f43f5e" },
      { id: 2, value: stats.totalShortHours, label: "Thiếu giờ", color: "#f59e0b" },
      { id: 3, value: stats.totalLateDays, label: "Đi muộn", color: "#6366f1" },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Bar chart data
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

  // ponytail: show loading spinner until employees list is fetched and the default employee is initialized/selected
  if (isLoading || (employees.length > 0 && !selectedEmployee)) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <Spin size="large" />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Lỗi tải danh sách nhân viên từ Backend.</Alert>
      </Box>
    );
  }

  if (employees.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Không tìm thấy dữ liệu nhân viên.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs
        aria-label="breadcrumb"
        sx={{
          mb: 3,
          "& .MuiBreadcrumbs-separator": {
            color: "#a3a3a3",
          },
        }}
      >
        <Link
          underline="hover"
          href="/"
          sx={{
            color: "#78716c",
            fontSize: "13px",
            fontWeight: 500,
            textDecoration: "none",
            transition: "color 0.2s",
            "&:hover": {
              color: "#0f172a",
            },
          }}
        >
          Trang chủ
        </Link>
        <Typography
          sx={{
            color: "#0f172a",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          Quản lý chấm công
        </Typography>
      </Breadcrumbs>

      {/* Main Layout Grid */}
      <Grid container spacing={3}>
        {/* Left Sidebar */}
        <Grid item xs={12} md={3.5} lg={3}>
          <EmployeeSidebar
            filteredEmployees={filteredEmployees}
            selectedEmployee={selectedEmployee}
            setSelectedEmployee={setSelectedEmployee}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            getAvatarStyle={getAvatarStyle}
            getInitials={getInitials}
          />
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
            <ProfileAndStats
              selectedEmployee={selectedEmployee}
              stats={stats}
              initials={initials}
              getAvatarStyle={getAvatarStyle}
            />

            {/* Section 2: Time Filter & Calendar Grid */}
            <TimekeepingCalendar
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              startOffset={startOffset}
              records={records}
            />

            {/* Section 3: Analytics Charts - Rendered side-by-side */}
            <Grid container spacing={3.5}>
              <Grid item xs={12} lg={6}>
                <AttendanceDonutChart
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  pieChartData={pieChartData}
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <YearlyBarChart
                  selectedYear={selectedYear}
                  barChartData={barChartData}
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
