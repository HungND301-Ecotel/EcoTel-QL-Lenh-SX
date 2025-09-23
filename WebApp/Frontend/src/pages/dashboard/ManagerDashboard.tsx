import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Grid,
    Typography,
    Box,
    Card,
    CardContent,
    Paper,
    TableContainer,
    Table,
    TableRow,
    TableHead,
    TableCell,
    TableBody,
    Popover,
    Snackbar,
    Alert,
    TextField,
    Autocomplete,
    IconButton,
    CircularProgress,
    Chip,
} from '@mui/material';
import {
    Business as DepartmentIcon,
    Person2 as PersonIcon,
    RotateLeft as RotateLeftIcon,
} from '@mui/icons-material';
import api from '../../config/api.config';
import { Order, Device, Department, Location } from '../../types';
import { showErrorAlert } from '../../components/Alert';
import GoogleMap from './GoogleMap';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import RealTimeClock from '../../components/RealTimeClock';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';
import PieChartOrder from '../../components/PieChartOrder';
import DeviceAnalysic from './DeviceAnalysis';
import ProductionAnalysic from './ProductionAnalysic';
import OrderAnalysic from './OrderAnalysic';

// Custom component for a more visually appealing summary card
const SummaryCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}> = ({ title, value, icon, color }) => (
    <Card
        sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            p: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            },
        }}
    >
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }} gutterBottom>
                {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {value}
            </Typography>
        </Box>
        <Box
            sx={{
                width: 60,
                height: 60,
                bgcolor: color,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
            }}
        >
            {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 32 } })}
        </Box>
    </Card>
);

const ManagerDashboard: React.FC = () => {
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


    return (
        <Box sx={{ p: 4, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                Tổng quan
            </Typography>
            <Grid container spacing={4}>
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
                                    <ProductionAnalysic />
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

export default ManagerDashboard;