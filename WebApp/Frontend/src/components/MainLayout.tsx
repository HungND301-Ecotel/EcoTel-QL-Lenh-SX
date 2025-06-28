import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Box,
    CssBaseline,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Divider,
    Badge,
    Tooltip,
    Avatar,
    Menu,
    MenuItem,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Business as BusinessIcon,
    Assignment as AssignmentIcon,
    Notifications as NotificationsIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    Devices as DevicesIcon,
    AccessTime as AccessTimeIcon,
    Description as DescriptionIcon,
    Category,
    LocationCity,
    Work,
    CreditCard,
    RotateRightRounded,
    RotateRight,
    AssignmentInd,
    LocalShipping,
    VpnKeyOutlined,
    SafetyCheck,
    Timelapse,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../config/api.config';
import socketService from '../services/socketService';
import { useSocket } from '../hooks/useSocket';
import { useAtom } from 'jotai';
import { userAtom } from '../atoms/userAtoms';
import ChangePassword from './ChangePassword/ChangePassword';

const drawerWidth = 240;
const miniDrawerWidth = 64;


interface MainLayoutProps {
    children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const queryClient = useQueryClient();
    const [user, setUser] = useAtom(userAtom)

    const socket = useSocket()

    const { data: notificationCount = 0 } = useQuery({
        queryKey: ['notificationCount'],
        queryFn: () => api.get('/notifications/unread/count').then(res => res.data.data),
    });



    useEffect(() => {
        if (!socket) return;

        socket.on('notification', () => {
            queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
        });

    }, [queryClient, socket]);

    const menuItems = [
        {
            text: 'Dashboard', icon:
                <Tooltip title="Dashboard" placement='right'>
                    <DashboardIcon color='primary' />
                </Tooltip>, path: '/'
        },
        {
            text: 'Lệnh sản xuất', icon:
                <Tooltip title="Lệnh sản xuất" placement='right'>
                    <AssignmentIcon color='primary' />
                </Tooltip>
            , path: '/orders'
        },
        ["admin", "manager"].includes(user?.role) ? {
            text: 'Ca làm việc', icon:
                <Tooltip title="Ca làm việc" placement='right'>
                    <Timelapse color='primary' />
                </Tooltip>
            , path: '/shifts'
        } : null,
        ["admin", "manager"].includes(user?.role) ? {
            text: 'Biện pháp an toàn', icon:
                <Tooltip title="Biện pháp an toàn" placement='right'>
                    <SafetyCheck color='primary' />
                </Tooltip>
            , path: '/safetyMeasures'
        } : null,
        ["admin", "manager"].includes(user?.role) ? {
            text: 'Loại phương tiện', icon:
                <Tooltip title="Loại phương tiện" placement='right'>
                    <LocalShipping color='primary' />
                </Tooltip>
            , path: '/deviceTypes'
        } : null,
        ["admin", "manager", "dispatcher"].includes(user?.role) ? {
            text: 'Thông tin ô tô', icon:
                <Tooltip title="Thông tin ô tô" placement='right'>
                    <DevicesIcon color='primary' />
                </Tooltip>
            , path: '/vehicles'
        } : null,
        ["admin", "manager", "dispatcher"].includes(user?.role) ? {
            text: 'Thông tin máy', icon:
                <Tooltip title="Thông tin máy" placement='right'>
                    <DevicesIcon color='primary' />
                </Tooltip>
            , path: '/machines'
        } : null,
        ["admin", "manager"].includes(user?.role) ? {
            text: 'Loại vật liệu', icon:
                <Tooltip title="Loại vật liệu" placement='right'>
                    <Category color='primary' />
                </Tooltip>
            , path: '/materials'
        } : null,
        ["admin", "manager"].includes(user?.role) ? {
            text: 'Công việc', icon:
                <Tooltip title="Công việc" placement='right'>
                    <Work color='primary' />
                </Tooltip>
            , path: '/jobs'
        } : null,
        ["admin", "manager"].includes(user?.role) ? {
            text: 'Chức danh nghề nghiệp', icon:
                <Tooltip title="Chức danh nghề nghiệp" placement='right'>
                    <AssignmentInd color='primary' />
                </Tooltip>
            , path: '/positions'
        } : null,
        ["admin", "manager"].includes(user?.role) ? {
            text: 'Vị trí', icon:
                <Tooltip title="Vị trí" placement='right'>
                    <LocationCity color='primary' />
                </Tooltip>
            , path: '/locations'
        } : null,
        ["admin", "manager"].includes(user?.role) ? {
            text: 'Đơn vị', icon:
                <Tooltip title="Đơn vị" placement='right'>
                    <BusinessIcon color='primary' />
                </Tooltip>
            , path: '/departments'
        } : null,
        ["admin", "manager"].includes(user?.role) ? {
            text: 'Báo cáo', icon:
                <Tooltip title="Báo cáo" placement='right'>
                    <DescriptionIcon color='primary' />
                </Tooltip>
            , path: '/reports'
        } : null,
        // {
        //     text: 'Thông báo', icon:
        //         <Tooltip title="Thông báo" placement='right'>
        //             <Badge badgeContent={notificationCount || 0} color="error">
        //                 <NotificationsIcon color="primary" />
        //             </Badge>
        //         </Tooltip>
        //     , path: '/notifications'
        // },
        ["admin", "manager"].includes(user?.role) ? {
            text: 'Cán bộ nhân viên', icon:
                <Tooltip title="Cán bộ nhân viên" placement='right'>
                    <PeopleIcon color='primary' />
                </Tooltip>
            , path: '/users'
        } : null,
    ].filter(Boolean)


    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);
    const [isOpenChangePassword, setIsOpenChangePassword] = useState(false)

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null)
        navigate('/login');
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{
                justifyContent: mobileOpen ? 'initial' : 'center',
                alignItems: 'center',
                gap: 2
            }}>
                <Avatar src='/image/logo.png' />
                {mobileOpen && <Typography variant="h6" noWrap component="div">
                    ESOFT
                </Typography>}
            </Toolbar>
            <Divider />
            <List sx={{ flex: 1, overflowY: 'auto' }}>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item?.text}
                        onClick={() => navigate(item?.path!)}
                        sx={{
                            justifyContent: mobileOpen ? 'initial' : 'center',
                            px: 2.5,
                            mb: mobileOpen ? 0 : 1
                        }}
                    >
                        <ListItemIcon sx={{
                            minWidth: 0,
                            mr: mobileOpen ? 2 : 'auto',
                            justifyContent: 'center',
                        }}>{item?.icon}</ListItemIcon>
                        {mobileOpen && <ListItemText primary={item?.text} />}
                    </ListItem>
                ))}
            </List>
            <Divider />
            <List sx={{ mt: 'auto' }}>
                <ListItem button onClick={handleClick}>
                    <Tooltip title="Cài đặt" placement='right'>
                        <ListItemIcon sx={{
                            minWidth: 0,
                            mr: mobileOpen ? 2 : 'auto',
                            justifyContent: 'center',
                        }}>
                            <SettingsIcon color='primary' />
                        </ListItemIcon>
                    </Tooltip>
                    {mobileOpen && <ListItemText primary="Cài đặt" />}
                </ListItem>
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                    <MenuItem onClick={() => setIsOpenChangePassword(true)}>
                        <ListItemIcon>
                            <VpnKeyOutlined color='primary' fontSize="small" />
                        </ListItemIcon>
                        Đổi mật khẩu
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                            <LogoutIcon color='primary' fontSize="small" />
                        </ListItemIcon>
                        Đăng xuất
                    </MenuItem>
                </Menu>
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    ml: mobileOpen ? `${drawerWidth}px` : `${miniDrawerWidth}px`,
                    width: mobileOpen
                        ? `calc(100% - ${drawerWidth}px)`
                        : `calc(100% - ${miniDrawerWidth}px)`,
                    transition: 'width 0.3s, margin 0.3s',
                }}
            >
                <Toolbar sx={{ display: 'flex', justifyContent: "space-between", alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div">
                            Phần mềm giao ca, nhận lệnh sản xuất
                        </Typography>
                    </Box>
                    <Tooltip title="Thông báo" placement='right'>
                        <IconButton color="inherit" href='/notifications'>
                            <Badge badgeContent={notificationCount || 0} color="error">
                                <NotificationsIcon color="inherit" />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                </Toolbar>

            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: mobileOpen ? drawerWidth : miniDrawerWidth }, flexShrink: { sm: miniDrawerWidth } }}
            >
                <Drawer
                    variant="permanent"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        width: mobileOpen ? drawerWidth : miniDrawerWidth,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: mobileOpen ? drawerWidth : miniDrawerWidth,
                            overflowX: 'hidden',
                            boxSizing: 'border-box',
                            transition: 'width 0.3s',
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                {/* <Drawer
                    variant="permanent"
                    open={mobileOpen}
                    sx={{
                        display: { xs: 'none', sm: mobileOpen ? 'block' : 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
                    }}
                >
                    {drawer}
                </Drawer> */}
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: `calc(100% - ${mobileOpen ? drawerWidth : miniDrawerWidth}px)`,
                    height: '100vh',
                    overflow: 'auto',
                }}
            >
                <Toolbar />
                {children || <Outlet />}
            </Box>
            <ChangePassword open={isOpenChangePassword} setOpen={setIsOpenChangePassword} />
        </Box >
    );
};

export default MainLayout; 