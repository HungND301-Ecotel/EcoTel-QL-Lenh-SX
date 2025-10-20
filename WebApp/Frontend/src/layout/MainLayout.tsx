// 👇 Bạn giữ nguyên các import (bỏ Drawer liên quan nếu không còn dùng)
import React, { useState } from 'react';
import {
    Box,
} from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';


interface MainLayoutProps {
    children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column'}}>
            <Header />
            {/* Nội dung chính */}
            <Box sx={{ flex: 1, p: 3 }}>
                {children || <Outlet />}
            </Box>
        </Box >
    );
};

export default MainLayout;
