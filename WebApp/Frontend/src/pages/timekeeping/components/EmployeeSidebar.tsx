import React from "react";
import { Box, Paper, TextField, InputAdornment, Avatar, Typography } from "@mui/material";
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
  );
}
