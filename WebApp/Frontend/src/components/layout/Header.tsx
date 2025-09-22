import React, { useState } from 'react'
import api from '../../config/api.config';
import { useAtom } from 'jotai';
import { useQuery } from '@tanstack/react-query';
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
} from '@mui/material';
import {
    Category,
    LocationCity,
    Work,
    LocalOffer,
    PrecisionManufacturing,
    SafetyCheck,
    Timelapse,
    Business,
    People,
    LocalShipping,
    AssignmentInd,
    MenuOpen,
    ExpandMore,
    VpnKeyOutlined,
    Person,
    Notifications,
    Logout,
} from '@mui/icons-material';
import { userAtom } from '../../atoms/userAtoms';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import ChangePassword from '../Modal/ChangePassword';
import Profile from '../Modal/Profile';

export default function Header() {
    const navigate = useNavigate();
    const [user, setUser] = useAtom(userAtom);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [avatarAnchorEl, setAvatarAnchorEl] = useState<null | HTMLElement>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const [openChangePassword, setOpenChangePassword] = useState(false);

    const location = useLocation()

    const { data: notificationCount = 0 } = useQuery({
        queryKey: ['notificationCount'],
        queryFn: () => api.get('/notifications/unread/count').then(res => res.data.data),
    });

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    const menuItems = [
        ["admin", "manager"].includes(user?.role) && {
            text: 'Cung độ', icon: <Timelapse color='primary' />, path: '/travelLog'
        },
        ["admin", "manager"].includes(user?.role) && {
            text: 'Ca làm việc', icon: <Timelapse color='primary' />, path: '/shifts'
        },
        ["admin", "manager"].includes(user?.role) && {
            text: 'Biện pháp an toàn', icon: <SafetyCheck color='primary' />, path: '/safetyMeasures'
        },
        ["admin", "manager"].includes(user?.role) && {
            text: 'Loại vật liệu', icon: <Category color='primary' />, path: '/materials'
        },
        ["admin", "manager"].includes(user?.role) && {
            text: 'Loại phương tiện', icon: <LocalOffer color='primary' />, path: '/deviceTypes'
        },
        ["admin", "manager", "dispatcher"].includes(user?.role) && {
            text: 'Thông tin xe', icon: <LocalShipping color='primary' />, path: '/vehicles'
        },
        ["admin", "manager", "dispatcher"].includes(user?.role) && {
            text: 'Thông tin máy', icon: <PrecisionManufacturing color='primary' />, path: '/machines'
        },
        ["admin", "manager"].includes(user?.role) && {
            text: 'Điểm đổ tải', icon: <LocationCity color='primary' />, path: '/locations'
        },
        ["admin", "manager"].includes(user?.role) && {
            text: 'Công việc', icon: <Work color='primary' />, path: '/jobs'
        },
        ["admin", "manager"].includes(user?.role) && {
            text: 'Chức danh nghề nghiệp', icon: <AssignmentInd color='primary' />, path: '/positions'
        },
        ["admin", "manager"].includes(user?.role) && {
            text: 'Đơn vị', icon: <Business color='primary' />, path: '/departments'
        },
        ["admin", "manager", "dispatcher"].includes(user?.role) && {
            text: 'Cán bộ nhân viên', icon: <People color='primary' />, path: '/users'
        }
    ].filter(Boolean);
    return (
        <>
            <AppBar position="fixed">
                <Box
                    sx={{
                        background: "linear-gradient(to right, #0b109aff, #709727ff, #644921ff, #0b109aff)", // màu xanh giống ảnh
                        color: "white",
                        py: 2,
                        px: 3,
                    }}
                >
                    <Box display="flex" justifyContent='center' alignItems={'center'} gap={2}>
                        <img src="/image/logo.png" style={{ width: 100, height: 100 }} />
                        <Typography variant="h6" sx={{
                            fontSize: {
                                md: 30,
                                xs: 18
                            },
                        }} textAlign={'center'}>HỆ THỐNG QUẢN LÝ ĐIỀU PHỐI VÀ SỬ DỤNG MÁY MÓC THIẾT BỊ</Typography>
                    </Box>
                </Box>
                <Toolbar sx={{ justifyContent: 'space-between', }}>
                    {/* Menu chính ngang / Drawer cho mobile */}
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
                                <List sx={{ width: 250 }}>
                                    <ListItem button onClick={() => { navigate('/'); setDrawerOpen(false); }}>
                                        <ListItemText primary="Tổng quan" />
                                    </ListItem>
                                    <ListItem button onClick={() => { navigate('/orders'); setDrawerOpen(false); }}>
                                        <ListItemText primary="Lệnh sản xuất" />
                                    </ListItem>
                                    {["manager"].includes(user?.role) && (
                                        <ListItem button onClick={() => { navigate('/orderByUsers'); setDrawerOpen(false); }}>
                                            <ListItemText primary="Công việc của tôi" />
                                        </ListItem>
                                    )}
                                    {menuItems.map((item) => {
                                        if (!item) return null;
                                        return (
                                            <ListItem key={item!.text} button onClick={() => { navigate(item!.path!); setDrawerOpen(false); }}>
                                                <ListItemText primary={item!.text} />
                                            </ListItem>

                                        )
                                    }

                                    )}
                                    {["admin", "manager", "dispatcher"].includes(user?.role) && (
                                        <ListItem button onClick={() => { navigate('/reports'); setDrawerOpen(false); }}>
                                            <ListItemText primary="Báo cáo" />
                                        </ListItem>
                                    )}
                                </List>
                            </Drawer>
                        </>
                    ) : (
                        <Box display="flex" gap={2} maxWidth='xl' justifyContent='center'>
                            <Button color="inherit" sx={{ fontSize: 20, borderBottom: location.pathname === '/' ? '5px solid red' : '' }} onClick={() => navigate('/')}>Tổng quan</Button>
                            <Button color="inherit" sx={{ fontSize: 20, borderBottom: location.pathname === '/orders' ? '5px solid red' : '' }} onClick={() => navigate('/orders')}>Lệnh sản xuất</Button>
                            {["manager"].includes(user?.role) && (
                                <Button color="inherit" sx={{ fontSize: 20, borderBottom: location.pathname === '/orderByUsers' ? '5px solid red' : '' }} onClick={() => navigate('/orderByUsers')}>Công việc của tôi</Button>
                            )}
                            {menuItems.length > 0 && (
                                <>
                                    <Button
                                        color="inherit"
                                        sx={{ fontSize: 20 }}
                                        onClick={(e) => setMenuAnchorEl(e.currentTarget)}
                                        endIcon={<ExpandMore />}
                                    >
                                        Danh mục
                                    </Button>
                                    <Menu
                                        anchorEl={menuAnchorEl}
                                        open={Boolean(menuAnchorEl)}
                                        onClose={() => setMenuAnchorEl(null)}
                                    >
                                        {menuItems.map((item) => {
                                            if (!item) return null;
                                            return (
                                                <MenuItem key={item!.text} sx={{ borderBottom: location.pathname === item.path ? '5px solid red' : '' }} onClick={() => {
                                                    navigate(item!.path!);
                                                    setMenuAnchorEl(null);
                                                }}>
                                                    {item!.text}
                                                </MenuItem>
                                            )
                                        })}

                                    </Menu>
                                </>
                            )}
                            {["admin", "manager", "dispatcher"].includes(user?.role) && (
                                <Button color="inherit" sx={{ fontSize: 20, borderBottom: location.pathname === '/reports' ? '5px solid red' : '' }} onClick={() => navigate('/reports')}>Báo cáo</Button>
                            )}
                        </Box>
                    )}


                    {/* Avatar, thông báo */}
                    <Box display="flex" alignItems="center" gap={2}>
                        <Tooltip title="Thông báo">
                            <IconButton color="inherit" onClick={() => navigate('/notifications')}>
                                <Badge badgeContent={notificationCount} color="error">
                                    <Notifications />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Tài khoản">
                            <IconButton onClick={(e) => setAvatarAnchorEl(e.currentTarget)}>
                                <Avatar src={user?.avatar} sx={{ bgcolor: 'white' }} />
                            </IconButton>
                        </Tooltip>
                        <Popover
                            open={Boolean(avatarAnchorEl)}
                            anchorEl={avatarAnchorEl}
                            onClose={() => setAvatarAnchorEl(null)}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                            <Box padding={2} display="flex" flexDirection="column" gap={1}>
                                <Typography variant="h6" align="center">{user?.fullName}</Typography>
                                <Divider />
                                <MenuItem onClick={() => {
                                    setOpenProfile(true);
                                    setAvatarAnchorEl(null);
                                }}>
                                    <Person sx={{ marginRight: 1 }} color="primary" fontSize="small" />
                                    Thông tin cá nhân
                                </MenuItem>
                                <MenuItem onClick={() => {
                                    setOpenChangePassword(true);
                                    setAvatarAnchorEl(null);
                                }}>
                                    <VpnKeyOutlined sx={{ marginRight: 1 }} color="primary" fontSize="small" />
                                    Đổi mật khẩu
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <Logout sx={{ marginRight: 1 }} color="primary" fontSize="small" />
                                    Đăng xuất
                                </MenuItem>
                            </Box>
                        </Popover>
                    </Box>
                </Toolbar>
                {/* Modal: Profile + Đổi mật khẩu */}
                <ChangePassword open={openChangePassword} setOpen={setOpenChangePassword} />
                <Profile open={openProfile} setOpen={setOpenProfile} />
            </AppBar>
        </>
    )
}
