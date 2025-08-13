// 👇 Bạn giữ nguyên các import (bỏ Drawer liên quan nếu không còn dùng)
import React, { useState } from 'react';
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
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    VpnKeyOutlined,
    Logout as LogoutIcon,
    Person as PersonIcon,
    ExpandMore,
} from '@mui/icons-material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { userAtom } from '../atoms/userAtoms';
import ChangePassword from './ChangePassword/ChangePassword';
import Profile from './Profile/Profile';
import { useQuery } from '@tanstack/react-query';
import api from '../config/api.config';
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
} from '@mui/icons-material';

interface MainLayoutProps {
    children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useAtom(userAtom);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [avatarAnchorEl, setAvatarAnchorEl] = useState<null | HTMLElement>(null);
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
        ["admin", "manager"].includes(user?.role) && {
            text: 'Cán bộ nhân viên', icon: <People color='primary' />, path: '/users'
        }
    ].filter(Boolean);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <AppBar position="fixed">
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box display="flex" alignItems="center" gap={5}>
                        {/* Logo và tiêu đề */}
                        <Box display="flex" alignItems="center" gap={2}>
                            <img src="/image/logo.png" style={{ width: 60, height: 60 }} />
                            <Typography variant="h6">PHẦN MỀM GIAO CA, NHẬN LỆNH SẢN XUẤT</Typography>
                        </Box>

                        {/* Menu chính ngang */}
                        <Box display="flex" gap={2}>
                            <Button color="inherit" sx={{ fontSize: 20, borderBottom: location.pathname === '/' ? '5px solid red' : '' }} onClick={() => navigate('/')}>Tổng quan</Button>
                            <Button color="inherit" sx={{ fontSize: 20, borderBottom: location.pathname === '/orders' ? '5px solid red' : '' }} onClick={() => navigate('/orders')}>Lệnh sản xuất</Button>
                            {["manager"].includes(user?.role) && (
                                <Button color="inherit" sx={{ fontSize: 20, borderBottom: location.pathname === '/orderByUsers' ? '5px solid red' : '' }} onClick={() => navigate('/orderByUsers')}>Công việc của tôi</Button>
                            )}
                            {/* Danh mục dropdown */}
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
                                            if (!item) return null; // nếu là false thì bỏ qua

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

                    </Box>

                    {/* Avatar, thông báo */}
                    <Box display="flex" alignItems="center" gap={2}>
                        <Tooltip title="Thông báo">
                            <IconButton color="inherit" onClick={() => navigate('/notifications')}>
                                <Badge badgeContent={notificationCount} color="error">
                                    <NotificationsIcon />
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
                                    <PersonIcon sx={{ marginRight: 1 }} color="primary" fontSize="small" />
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
                                    <LogoutIcon sx={{ marginRight: 1 }} color="primary" fontSize="small" />
                                    Đăng xuất
                                </MenuItem>
                            </Box>
                        </Popover>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Nội dung chính */}
            <Box sx={{ flex: 1, mt: 8, p: 3 }}>
                {children || <Outlet />}
            </Box>

            {/* Modal: Profile + Đổi mật khẩu */}
            <ChangePassword open={openChangePassword} setOpen={setOpenChangePassword} />
            <Profile open={openProfile} setOpen={setOpenProfile} />
        </Box >
    );
};

export default MainLayout;
