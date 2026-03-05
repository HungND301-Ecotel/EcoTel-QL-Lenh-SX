import React, { useState } from "react";
import api from "../config/api.config";
import { useAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Button,
  Popover,
  Divider,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItemText,
  ListItem,
  MenuList,
  ListItemIcon,
} from "@mui/material";
import {
  Work,
  People,
  MenuOpen,
  ExpandMore,
  VpnKeyOutlined,
  Person,
  Notifications,
  Logout,
  KeyboardArrowRight,
  Security,
  Construction,
  Route,
  DirectionsCar,
  Terrain,
  LocationOn,
  Business,
  AccessTime,
  Badge as BadgeIcon,
  SettingsSystemDaydream,
  Assessment,
  Category,
  WorkOutline,
  Assignment,
  Dashboard,
} from "@mui/icons-material";
import { ChartNoAxesCombined, ClipboardPaste, MonitorCog } from "lucide-react";

import { userAtom } from "../atoms/userAtoms";
import { useLocation, useNavigate } from "react-router-dom";
import ChangePassword from "../components/Modal/ChangePassword";
import Profile from "../components/Modal/Profile";
import { RoleEnum } from "../enums";

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useAtom(userAtom);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [avatarAnchorEl, setAvatarAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);

  const [submenuAnchorEl, setSubmenuAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [submenuItems, setSubmenuItems] = useState<any[]>([]);

  const location = useLocation();

  const { data: notificationCount = 0 } = useQuery({
    queryKey: ["notificationCount"],
    queryFn: () =>
      api.get("/notifications/unread/count").then((res) => res.data.data),
  });

  const { data: url } = useQuery({
    queryKey: ["url", user?.avatar],
    queryFn: () =>
      api.get(`/uploads/get?key=${user?.avatar}`).then((res) => res.data.data),
    enabled: !!user?.avatar,
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };
  const menuItems = [
    [RoleEnum.ADMIN, RoleEnum.MANAGER].includes(user?.role) && {
      text: "Biện pháp an toàn",
      icon: <Security fontSize="small" />,
      path: "/safetyMeasures",
    },
    [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DISPATCHER].includes(
      user?.role,
    ) && {
      text: "Thiết bị",
      icon: <Construction fontSize="small" />,
      path: "#",
      submenu: [
        { text: "Phân loại thiết bị", path: "/deviceTypes" },
        { text: "Chủng loại thiết bị", path: "/deviceModels" },
        { text: "Thông tin xe", path: "/vehicles" },
        { text: "Thông tin máy", path: "/machines" },
      ],
    },
    [RoleEnum.ADMIN, RoleEnum.MANAGER].includes(user?.role) && {
      text: "Cung độ",
      icon: <Route fontSize="small" />,
      path: "/travelLog",
    },
    [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DISPATCHER].includes(
      user?.role,
    ) && {
      text: "Mô hình xe",
      icon: <DirectionsCar fontSize="small" />,
      path: "/models",
    },
    [RoleEnum.ADMIN, RoleEnum.MANAGER].includes(user?.role) && {
      text: "Vật liệu",
      icon: <Terrain fontSize="small" />,
      path: "/materials",
    },
    [RoleEnum.ADMIN, RoleEnum.MANAGER].includes(user?.role) && {
      text: "Điểm đổ tải",
      icon: <LocationOn fontSize="small" />,
      path: "/locations",
    },
    [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DISPATCHER].includes(
      user?.role,
    ) && {
      text: "Cán bộ nhân viên",
      icon: <People fontSize="small" />,
      path: "/users",
    },
    [RoleEnum.ADMIN, RoleEnum.MANAGER].includes(user?.role) && {
      text: "Công việc",
      icon: <Work fontSize="small" />,
      path: "/jobs",
    },
    [RoleEnum.ADMIN, RoleEnum.MANAGER].includes(user?.role) && {
      text: "Chức danh nghề nghiệp",
      icon: <BadgeIcon fontSize="small" />,
      path: "/positions",
    },
    [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DISPATCHER].includes(
      user?.role,
    ) && {
      text: "Đơn vị",
      icon: <Business fontSize="small" />,
      path: "/departments",
    },
    [RoleEnum.ADMIN, RoleEnum.MANAGER].includes(user?.role) && {
      text: "Ca làm việc",
      icon: <AccessTime fontSize="small" />,
      path: "/shifts",
    },
  ].filter(Boolean);

  return (
    <>
      <Box
        sx={{
          background:
            "linear-gradient(to right, #0b109aff, #709727ff, #644921ff, #0b109aff)",
          color: "white",
          py: 2,
          px: 3,
        }}
      >
        <Box
          display="flex"
          justifyContent="center"
          alignItems={"center"}
          gap={2}
        >
          <img
            src="/image/logo.png"
            style={{ width: 100, height: 100 }}
            alt="logo"
          />
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                fontSize: {
                  md: 30,
                  xs: 18,
                },
              }}
              textAlign={"center"}
            >
              HỆ THỐNG QUẢN LÝ ĐIỀU PHỐI VÀ SỬ DỤNG MÁY MÓC THIẾT BỊ
            </Typography>
            <Typography
              variant="h5"
              textAlign={"center"}
              sx={{
                fontWeight: "bold",
                mt: 1,
                fontSize: { xs: 14, md: 22 },
              }}
            >
              CÔNG TY CP THAN CAO SƠN - KTV
            </Typography>
            <Box
              display="flex"
              alignItems="center"
              justifyContent={"center"}
              sx={{ mt: 1.5, gap: 4 }}
            >
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography variant="body1">
                  Điện thoại: 024.35180141
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography variant="body1">Fax: 024.38510724</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <AppBar position="sticky">
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {isMobile ? (
            <>
              <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
                <MenuOpen sx={{ fontSize: 40 }} />
              </IconButton>
              <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
              >
                <List sx={{ width: 280 }}>
                  <ListItem
                    button
                    onClick={() => {
                      navigate("/");
                      setDrawerOpen(false);
                    }}
                  >
                    <ListItemIcon sx={{ color: "primary.main" }}>
                      <Dashboard />
                    </ListItemIcon>
                    <ListItemText primary="Tổng quan" />
                  </ListItem>
                  <ListItem
                    button
                    onClick={() => {
                      navigate("/orders");
                      setDrawerOpen(false);
                    }}
                  >
                    <ListItemIcon sx={{ color: "primary.main" }}>
                      <ClipboardPaste />
                    </ListItemIcon>
                    <ListItemText primary="Lệnh sản xuất" />
                  </ListItem>
                  {[RoleEnum.MANAGER].includes(user?.role) && (
                    <ListItem
                      button
                      onClick={() => {
                        navigate("/orderByUsers");
                        setDrawerOpen(false);
                      }}
                    >
                      <ListItemIcon sx={{ color: "primary.main" }}>
                        <WorkOutline />
                      </ListItemIcon>
                      <ListItemText primary="Công việc của tôi" />
                    </ListItem>
                  )}
                  {menuItems.map((item: any) => {
                    if (!item) return null;
                    if (item.submenu) {
                      return (
                        <ListItem
                          key={item.text}
                          secondaryAction={<KeyboardArrowRight />}
                          button
                          onClick={(e) => {
                            setSubmenuAnchorEl(e.currentTarget);
                            setSubmenuItems(item.submenu!);
                          }}
                        >
                          <ListItemIcon sx={{ color: "primary.main" }}>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText primary={item.text} />
                        </ListItem>
                      );
                    }
                    return (
                      <ListItem
                        key={item.text}
                        button
                        onClick={() => {
                          navigate(item.path!);
                          setDrawerOpen(false);
                        }}
                      >
                        <ListItemIcon sx={{ color: "primary.main" }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text} />
                      </ListItem>
                    );
                  })}
                  {[
                    RoleEnum.ADMIN,
                    RoleEnum.MANAGER,
                    RoleEnum.DISPATCHER,
                  ].includes(user?.role) && (
                    <ListItem
                      button
                      onClick={() => {
                        navigate("/reports");
                        setDrawerOpen(false);
                      }}
                    >
                      <ListItemIcon sx={{ color: "primary.main" }}>
                        <ChartNoAxesCombined color="currentColor" />
                      </ListItemIcon>
                      <ListItemText primary="Báo cáo" />
                    </ListItem>
                  )}
                  {[RoleEnum.ADMIN].includes(user?.role) && (
                    <ListItem
                      button
                      onClick={() => {
                        navigate("/system");
                        setDrawerOpen(false);
                      }}
                    >
                      <ListItemIcon sx={{ color: "primary.main" }}>
                        <MonitorCog color="currentColor" />
                      </ListItemIcon>
                      <ListItemText primary="Hệ thống" />
                    </ListItem>
                  )}
                </List>
              </Drawer>
            </>
          ) : (
            <Box display="flex" gap={2} maxWidth="xl" justifyContent="center">
              <Button
                color="inherit"
                startIcon={<Dashboard />}
                sx={{
                  fontSize: 20,
                  borderBottom:
                    location.pathname === "/" ? "5px solid red" : "",
                }}
                onClick={() => navigate("/")}
              >
                Tổng quan
              </Button>
              <Button
                color="inherit"
                startIcon={<ClipboardPaste style={{ color: "inherit" }} />}
                sx={{
                  fontSize: 20,
                  borderBottom:
                    location.pathname === "/orders" ? "5px solid red" : "",
                }}
                onClick={() => navigate("/orders")}
              >
                Lệnh sản xuất
              </Button>
              {[RoleEnum.MANAGER].includes(user?.role) && (
                <Button
                  color="inherit"
                  startIcon={<WorkOutline />}
                  sx={{
                    fontSize: 20,
                    borderBottom:
                      location.pathname === "/orderByUsers"
                        ? "5px solid red"
                        : "",
                  }}
                  onClick={() => navigate("/orderByUsers")}
                >
                  Công việc của tôi
                </Button>
              )}
              {menuItems.length > 0 && (
                <>
                  <Button
                    color="inherit"
                    sx={{ fontSize: 20 }}
                    onClick={(e) => setMenuAnchorEl(e.currentTarget)}
                    startIcon={<Category />}
                    endIcon={<ExpandMore />}
                  >
                    Danh mục
                  </Button>
                  <Menu
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={() => setMenuAnchorEl(null)}
                  >
                    {menuItems.map((item: any) => {
                      if (!item) return null;
                      if (item.submenu) {
                        return (
                          <MenuItem
                            key={item.text}
                            onClick={(e) => {
                              setSubmenuAnchorEl(e.currentTarget);
                              setSubmenuItems(item.submenu!);
                            }}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              minWidth: 200,
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Box display="flex" color="primary.main">
                                {item.icon}
                              </Box>
                              {item.text}
                            </Box>
                            <KeyboardArrowRight fontSize="small" />
                          </MenuItem>
                        );
                      }
                      return (
                        <MenuItem
                          key={item!.text}
                          sx={{
                            borderLeft:
                              location.pathname === item.path
                                ? "4px solid red"
                                : "4px solid transparent",
                            display: "flex",
                            gap: 1.5,
                            minWidth: 200,
                          }}
                          onClick={() => {
                            navigate(item!.path!);
                            setMenuAnchorEl(null);
                          }}
                        >
                          <Box display="flex" color="primary.main">
                            {item.icon}
                          </Box>
                          {item!.text}
                        </MenuItem>
                      );
                    })}
                  </Menu>
                </>
              )}
              {[RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DISPATCHER].includes(
                user?.role,
              ) && (
                <Button
                  color="inherit"
                  startIcon={
                    <ChartNoAxesCombined style={{ color: "inherit" }} />
                  }
                  sx={{
                    fontSize: 20,
                    borderBottom:
                      location.pathname === "/reports" ? "5px solid red" : "",
                  }}
                  onClick={() => navigate("/reports")}
                >
                  Báo cáo
                </Button>
              )}
              {[RoleEnum.ADMIN].includes(user?.role) && (
                <Button
                  color="inherit"
                  startIcon={<MonitorCog style={{ color: "inherit" }} />}
                  sx={{
                    fontSize: 20,
                    borderBottom:
                      location.pathname === "/system" ? "5px solid red" : "",
                  }}
                  onClick={() => navigate("/system")}
                >
                  Hệ thống
                </Button>
              )}
            </Box>
          )}

          {/* Avatar, thông báo giữ nguyên */}
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Thông báo">
              <IconButton
                color="inherit"
                onClick={() => navigate("/notifications")}
              >
                <Badge badgeContent={notificationCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Tài khoản">
              <IconButton onClick={(e) => setAvatarAnchorEl(e.currentTarget)}>
                <Avatar src={url} sx={{ bgcolor: "white" }} />
              </IconButton>
            </Tooltip>
            <Popover
              open={Boolean(avatarAnchorEl)}
              anchorEl={avatarAnchorEl}
              onClose={() => setAvatarAnchorEl(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <Box padding={2} display="flex" flexDirection="column" gap={1}>
                <Typography variant="h6" align="center">
                  {user?.fullName}
                </Typography>
                <Divider />
                <MenuItem
                  onClick={() => {
                    setOpenProfile(true);
                    setAvatarAnchorEl(null);
                  }}
                >
                  <Person
                    sx={{ marginRight: 1 }}
                    color="primary"
                    fontSize="small"
                  />
                  Thông tin cá nhân
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setOpenChangePassword(true);
                    setAvatarAnchorEl(null);
                  }}
                >
                  <VpnKeyOutlined
                    sx={{ marginRight: 1 }}
                    color="primary"
                    fontSize="small"
                  />
                  Đổi mật khẩu
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Logout
                    sx={{ marginRight: 1 }}
                    color="primary"
                    fontSize="small"
                  />
                  Đăng xuất
                </MenuItem>
              </Box>
            </Popover>
            <Popover
              open={Boolean(submenuAnchorEl)}
              anchorEl={submenuAnchorEl}
              onClose={() => setSubmenuAnchorEl(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "center", horizontal: "left" }}
            >
              <MenuList>
                {submenuItems.map((sub) => (
                  <MenuItem
                    key={sub.text}
                    onClick={() => {
                      navigate(sub?.path);
                      setSubmenuAnchorEl(null);
                      setDrawerOpen(false);
                      setMenuAnchorEl(null);
                    }}
                  >
                    {sub.text}
                  </MenuItem>
                ))}
              </MenuList>
            </Popover>
          </Box>
        </Toolbar>
        <ChangePassword
          open={openChangePassword}
          setOpen={setOpenChangePassword}
        />
        <Profile open={openProfile} setOpen={setOpenProfile} />
      </AppBar>
    </>
  );
}
