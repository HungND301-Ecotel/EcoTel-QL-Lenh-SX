import React from "react";
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  Avatar,
  Typography,
} from "@mui/material";
import { Search } from "lucide-react";
import { Employee } from "../types";

interface EmployeeSidebarProps {
  filteredEmployees: Employee[];
  selectedEmployee: Employee;
  setSelectedEmployee: (emp: Employee) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  getAvatarStyle: (code: string) => { bg: string; text: string };
  getInitials: (name: string) => string;
}

export default function EmployeeSidebar({
  filteredEmployees,
  selectedEmployee,
  setSelectedEmployee,
  searchQuery,
  setSearchQuery,
  getAvatarStyle,
  getInitials,
}: EmployeeSidebarProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "rgba(15, 23, 42, 0.06)",
        boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.02)",
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
          borderBottom: "1px solid rgba(38, 85, 194, 0.06)",
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "12px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#0f172a",
          }}
        >
          Nhân viên
        </Typography>
        <Box
          sx={{
            bgcolor: "rgba(15, 23, 42, 0.05)",
            color: "#475569",
            fontSize: "11px",
            fontWeight: 600,
            px: 1.25,
            py: 0.25,
            borderRadius: "20px",
          }}
        >
          {filteredEmployees.length}
        </Box>
      </Box>

      {/* Search Input */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Tìm kiếm nhân viên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color="#94a3b8" />
              </InputAdornment>
            ),
            sx: {
              bgcolor: "#f8fafc",
              borderRadius: "10px",
              fontSize: "13px",
              color: "#0f172a",
              transition: "all 0.2s ease-in-out",
              "& fieldset": {
                border: "1px solid rgba(15, 23, 42, 0.06)",
              },
              "&:hover fieldset": {
                borderColor: "rgba(15, 23, 42, 0.12) !important",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#0f172a !important",
                borderWidth: "1px !important",
              },
              "& input::placeholder": {
                color: "#94a3b8",
                opacity: 1,
              },
            },
          }}
        />
      </Box>

      {/* Scrollable list */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1.5, pb: 2 }}>
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
                py: "10px",
                border: "none",
                outline: "none",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                cursor: "pointer",
                textAlign: "left",
                borderRadius: "10px",
                mb: "6px",
                ...(isSelected
                  ? {
                      bgcolor: "rgba(15, 23, 42, 0.04)",
                      pl: "16px",
                      pr: "16px",
                      position: "relative",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: "20%",
                        bottom: "20%",
                        width: "3px",
                        bgcolor: "#0f172a",
                        borderRadius: "4px",
                      },
                    }
                  : {
                      bgcolor: "transparent",
                      pl: "16px",
                      pr: "16px",
                      "&:hover": {
                        bgcolor: "rgba(15, 23, 42, 0.02)",
                        transform: "translateX(2px)",
                      },
                    }),
              }}
            >
              <Avatar
                src={emp.avatarUrl || undefined}
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: "11px",
                  fontWeight: 600,
                  bgcolor: colors.bg,
                  color: colors.text,
                  border: isSelected
                    ? "1px solid rgba(15, 23, 42, 0.15)"
                    : "none",
                }}
              >
                {empInitials}
              </Avatar>
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? "#0f172a" : "#475569",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontSize: "13px",
                    transition: "color 0.2s",
                  }}
                >
                  {emp.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#94a3b8",
                    display: "block",
                    fontSize: "11px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {emp.team} • {emp.role}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
