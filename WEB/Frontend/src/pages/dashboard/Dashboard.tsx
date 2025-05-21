import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
} from '@mui/material';
import {
    Assignment as OrderIcon,
    Devices as DeviceIcon,
    AccessTime as ShiftIcon,
    Business as DepartmentIcon,
} from '@mui/icons-material';
import api from '../../config/api.config';
import { Order, Device, Shift, Department } from '../../types';

const Dashboard: React.FC = () => {
    const { data: ordersRaw } = useQuery({
        queryKey: ['orders'],
        queryFn: () => api.get('/orders').then(res => res.data),
    });

    const { data: devicesRaw } = useQuery({
        queryKey: ['devices'],
        queryFn: () => api.get('/devices').then(res => res.data),
    });

    const { data: shiftsRaw } = useQuery({
        queryKey: ['shifts'],
        queryFn: () => api.get('/shifts').then(res => res.data),
    });

    const { data: departmentsRaw } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data),
    });

    const orders = React.useMemo(() => {
        if (!ordersRaw) return [];
        if (Array.isArray(ordersRaw)) return ordersRaw;
        if (ordersRaw.data && Array.isArray(ordersRaw.data.orders)) return ordersRaw.data.orders;
        if (ordersRaw.data && Array.isArray(ordersRaw.data)) return ordersRaw.data;
        return [];
    }, [ordersRaw]);

    const devices = React.useMemo(() => {
        if (!devicesRaw) return [];
        if (Array.isArray(devicesRaw)) return devicesRaw;
        if (devicesRaw.data && Array.isArray(devicesRaw.data.devices)) return devicesRaw.data.devices;
        if (devicesRaw.data && Array.isArray(devicesRaw.data)) return devicesRaw.data;
        return [];
    }, [devicesRaw]);

    const shifts = React.useMemo(() => {
        if (!shiftsRaw) return [];
        if (Array.isArray(shiftsRaw)) return shiftsRaw;
        if (shiftsRaw.data && Array.isArray(shiftsRaw.data.shifts)) return shiftsRaw.data.shifts;
        if (shiftsRaw.data && Array.isArray(shiftsRaw.data)) return shiftsRaw.data;
        return [];
    }, [shiftsRaw]);

    const departments = React.useMemo(() => {
        if (!departmentsRaw) return [];
        if (Array.isArray(departmentsRaw)) return departmentsRaw;
        if (departmentsRaw.data && Array.isArray(departmentsRaw.data.departments)) return departmentsRaw.data.departments;
        if (departmentsRaw.data && Array.isArray(departmentsRaw.data)) return departmentsRaw.data;
        return [];
    }, [departmentsRaw]);

    const stats = [
        {
            title: 'Lệnh Sản Xuất',
            value: orders.length,
            icon: <OrderIcon sx={{ fontSize: 40 }} />,
            color: '#1976d2',
        },
        {
            title: 'Thiết Bị',
            value: devices.length,
            icon: <DeviceIcon sx={{ fontSize: 40 }} />,
            color: '#2e7d32',
        },
        {
            title: 'Ca Làm Việc',
            value: shifts.length,
            icon: <ShiftIcon sx={{ fontSize: 40 }} />,
            color: '#ed6c02',
        },
        {
            title: 'Phòng Ban',
            value: departments.length,
            icon: <DepartmentIcon sx={{ fontSize: 40 }} />,
            color: '#9c27b0',
        },
    ];

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>
            <Grid container spacing={3}>
                {stats.map((stat) => (
                    <Grid item xs={12} sm={6} md={3} key={stat.title}>
                        <Card>
                            <CardContent>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            variant="h6"
                                            color="text.secondary"
                                            gutterBottom
                                        >
                                            {stat.title}
                                        </Typography>
                                        <Typography variant="h4">
                                            {stat.value}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            color: stat.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {stat.icon}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default Dashboard; 