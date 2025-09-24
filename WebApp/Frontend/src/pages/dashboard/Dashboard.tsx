import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Grid,
    Typography,
    Box,
    Card,
    Paper,
} from '@mui/material';
import {
    Construction,
    Business as DepartmentIcon,
    DirectionsCar,
    Person2 as PersonIcon,
    RotateLeft as RotateLeftIcon,
} from '@mui/icons-material';
import api from '../../config/api.config';
import GoogleMap from './GoogleMap';
import OrderAnalysic from './OrderAnalysic';
import DeviceAnalysic from './DeviceAnalysis';
import ProductionAnalysic from './ProductionAnalysic';
import SummaryCard from './SummaryCard';
import SummaryCardDevice from './SummaryCardDevice';

const DashBoard: React.FC = () => {
    const [tabIndex, setTabIndex] = useState(0);

    const queryClient = useQueryClient();

    const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data.data),
    });

    const { data: userCount = 0, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['userCount'],
        queryFn: () => api.get('/users/count').then(res => res.data.data),
    });

    const { data: devices = [] } = useQuery({
        queryKey: ['devices'],
        queryFn: () => api.get('/devices').then(res => res.data.data),
    });



    return (
        <Box sx={{ p: 4, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                Tổng quan
            </Typography>
            <Grid container rowSpacing={8} spacing={2}>
                <Grid item xs={12} sm={6}>
                    <SummaryCardDevice
                        title="Thông tin máy"
                        value={devices.filter((d: any) => d.category?.group === "Máy").length}
                        icon={<Construction />}
                        color="#e4d52cff"
                        data={devices.filter((d: any) => d.category?.group === "Máy")}
                        type="Máy"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <SummaryCardDevice
                        title="Thông tin xe"
                        value={devices.filter((d: any) => d.category?.group === "Xe").length}
                        icon={<DirectionsCar />}
                        color="#f34f21ff"
                        data={devices.filter((d: any) => d.category?.group === "Xe")}
                        type="Xe"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <SummaryCard
                        title="Đơn vị"
                        value={departments.length}
                        icon={<DepartmentIcon />}
                        color="#4caf50"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <SummaryCard
                        title="Nhân viên"
                        value={userCount}
                        icon={<PersonIcon />}
                        color="#2196f3"
                    />
                </Grid>
            </Grid>
            <Box mt={10}>
                {tabIndex === 0 && (
                    <Box>
                        <Grid container spacing={4}>
                            <Grid item xs={12}>
                                <Paper sx={{ borderRadius: 3, p: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <OrderAnalysic departments={departments} />
                                </Paper>
                            </Grid>
                            <Grid item xs={12}>
                                <Paper sx={{ borderRadius: 3, p: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <ProductionAnalysic />
                                </Paper>
                            </Grid>
                            <Grid item xs={12}>
                                <Paper sx={{ borderRadius: 3, p: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <DeviceAnalysic />
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                )}
                {tabIndex === 1 && <GoogleMap />}
            </Box>
        </Box>
    );
};

export default DashBoard;