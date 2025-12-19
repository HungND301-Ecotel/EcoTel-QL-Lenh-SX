import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Grid,
    Box,
    Paper,
} from '@mui/material';
import {
    Construction,
    Business as DepartmentIcon,
    DirectionsCar,
    Person2 as PersonIcon,
} from '@mui/icons-material';
import api from '../../config/api.config';
import GoogleMap from './GoogleMap';
import OrderAnalysic from './OrderAnalysic';
import DeviceAnalysic from './DeviceAnalysis';
import ProductionAnalysic from './ProductionAnalysic';
import SummaryCard from './SummaryCard';
import SummaryCardDevice from './SummaryCardDevice';
import { DeviceTypeEnum } from '../../enums';

const DashBoard: React.FC = () => {
    const [tabIndex, setTabIndex] = useState(0);

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

    const oldestDepartments = useMemo(() => {
        const map = new Map<string, any>();

        devices.forEach((d: any) => {
            if (d.department?._id && !map.has(d.department?._id)) {
                map.set(d.department?._id, d?.department);
            }
        });

        return Array.from(map.values())
            .sort(
                (a: any, b: any) =>
                    new Date(a?.createdAt).getTime() - new Date(b?.createdAt).getTime()
            )
            .slice(0, 15);
    }, [devices]);

    const oldestDepartmentIds = useMemo(
        () => new Set(oldestDepartments.map((d: any) => d._id)),
        [oldestDepartments]
    );

    const filteredDevices = useMemo(
        () => devices.filter((d: any) => oldestDepartmentIds.has(d.department?._id)),
        [devices, oldestDepartmentIds]
    );

    return (
        <Box sx={{ p: 4, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <SummaryCardDevice
                        title="Thông tin máy"
                        value={filteredDevices.filter((d: any) => d.category?.group === DeviceTypeEnum.MACHINE).length}
                        icon={<Construction />}
                        color="#e4d52cff"
                        data={filteredDevices.filter((d: any) => d.category?.group === DeviceTypeEnum.MACHINE)}
                        type={DeviceTypeEnum.MACHINE}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <SummaryCardDevice
                        title="Thông tin xe"
                        value={filteredDevices.filter((d: any) => d.category?.group === DeviceTypeEnum.VEHICLE).length}
                        icon={<DirectionsCar />}
                        color="#f34f21ff"
                        data={filteredDevices.filter((d: any) => d.category?.group === DeviceTypeEnum.VEHICLE)}
                        type={DeviceTypeEnum.VEHICLE}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <SummaryCard
                        title="Đơn vị"
                        value={departments.length}
                        icon={<DepartmentIcon />}
                        color="#4caf50"
                        type="department"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <SummaryCard
                        title="Nhân viên"
                        value={userCount}
                        icon={<PersonIcon />}
                        color="#2196f3"
                        type="user"
                    />
                </Grid>
            </Grid>
            <Box mt={6}>
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
                                    <ProductionAnalysic departments={departments} />
                                </Paper>
                            </Grid>
                            <Grid item xs={12}>
                                <Paper sx={{ borderRadius: 3, p: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <DeviceAnalysic departments={departments} />
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