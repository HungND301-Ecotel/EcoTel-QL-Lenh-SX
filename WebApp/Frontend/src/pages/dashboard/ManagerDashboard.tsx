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
    const [department, setDepartment] = useState('');
    const [date, setDate] = useState<Dayjs | null>(dayjs());

    const productions = [
        { key: "SLD", name: "Sản lượng đất thực hiện (m3)" },
        { key: "SLT", name: "Sản lượng than nguyên khai (m3)" },
        { key: "MKS", name: "Mét khoan sâu (m3)" },
        { key: "KLD", name: "Khối lượng vận chuyển đất (Tkm)" },
        { key: "KLT", name: "Khối lượng vận chuyển than" },
        { key: "TTK", name: "Thể tích khối thực hiện" },
        { key: "CD", name: "Cung độ thực hiện" },
    ];

    const orderStatus = [
        { key: "pending", name: "Chưa nhận lệnh", color: 'black' },
        { key: "in_progress", name: "Đã nhận lệnh", color: 'green' },
        { key: "warning", name: "Lỗi", color: 'orange' },
        { key: "completed", name: "Đã hoàn thành", color: 'red' },
        { key: "cancel", name: "Đã hủy", color: 'purple' },
    ];

    const queryClient = useQueryClient();

    const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data.data),
    });
    const { data: devices = [] } = useQuery({
        queryKey: ['devices'],
        queryFn: () => api.get('/devices').then(res => res.data.data),
    });

    const { data: userCount = 0, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['userCount'],
        queryFn: () => api.get('/users/count').then(res => res.data.data),
    });

    const { data: deviceCount = [], isLoading: isLoadingDeviceCount } = useQuery({
        queryKey: ['deviceCount'],
        queryFn: () => api.get('/devices/count/status').then(res => res.data.data),
    });
    const { data: orderCount = {
        pending: { "ca1": 0, "ca2": 0, "ca3": 0, "day": 0, "month": 0 },
        in_progress: { "ca1": 0, "ca2": 0, "ca3": 0, "day": 0, "month": 0 },
        warning: { "ca1": 0, "ca2": 0, "ca3": 0, "day": 0, "month": 0 },
        completed: { "ca1": 0, "ca2": 0, "ca3": 0, "day": 0, "month": 0 },
        cancel: { "ca1": 0, "ca2": 0, "ca3": 0, "day": 0, "month": 0 }
    }
    } = useQuery({
        queryKey: ['orderCount', department, date],
        queryFn: () => api.get('/orders/count_status', {
            params: {
                date: date ? date.toISOString() : '',
                department
            }
        }).then(res => res.data.data),
    });

    const [alert, setAlert] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

    const showAlert = (message: string) => {
        setAlert({ open: true, message });
    };

    const handleUpdateDevices = useMutation({
        mutationFn: () => api.post('/devices/update_status').then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
            queryClient.invalidateQueries({ queryKey: ['deviceCount'] });
            showAlert('Cập nhật thành công');
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi');
        }
    });

    // const [anchorElSummary, setAnchorElSummary] = useState<HTMLElement | null>(null);
    // const [selectedSummaryDevices, setSelectedSummaryDevices] = useState<any[]>([]);

    // Popover chi tiết (bảng dưới)
    const [anchorElDetail, setAnchorElDetail] = useState<HTMLElement | null>(null);
    const [selectedDetailDevices, setSelectedDetailDevices] = useState<any[]>([]);


    // const getDevicesByStatusGrouped = (status: string) => {
    //     const map = new Map<string, number>();

    //     deviceCount.forEach((group: any) => {
    //         group.deviceTypes.forEach((device: any) => {
    //             const current = map.get(device.typeName) || 0;
    //             map.set(device.typeName, current + (device.statusCounts?.[status] ?? 0));
    //         });
    //     });

    //     return Array.from(map, ([typeName, total]) => ({ typeName, total }));
    // };

    // const handleSummaryClick = (event: React.MouseEvent<HTMLElement>, status: string) => {
    //     setAnchorElSummary(event.currentTarget);
    //     const grouped = getDevicesByStatusGrouped(status);
    //     setSelectedSummaryDevices(grouped);
    // };
    // const handleSummaryClose = () => {
    //     setAnchorElSummary(null);
    //     setSelectedSummaryDevices([]);
    // };

    // Mở/đóng popover chi tiết
    const [departmentPopup, setDepartmentPopup] = useState('')
    const handleDetailClick = (
        event: React.MouseEvent<HTMLElement>,
        status: string,
        departmentCode: string,
        typeName: string
    ) => {
        setAnchorElDetail(event.currentTarget);
        setDepartmentPopup(departmentCode)
        setSelectedDetailDevices(devices.filter((d: any) =>
            d.status === status && d.department?.code === departmentCode && d.category?.name === typeName
        ));
    };
    const handleDetailClose = () => {
        setAnchorElDetail(null);
        setSelectedDetailDevices([]);
    };

    const statusColors: { [key: string]: string } = {
        available: 'success',
        in_use: 'error',
        maintenance: 'warning',
        retired: 'default',
    };

    const statusLabels: { [key: string]: string } = {
        available: 'Chờ điều động',
        in_use: 'Đang hoạt động',
        maintenance: 'SC; BD',
        retired: 'Niêm cất',
    };

    return (
        <Box sx={{ p: 4, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Snackbar
                open={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                autoHideDuration={4000}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert severity="success" variant="filled" onClose={() => setAlert({ ...alert, open: false })}>
                    {alert.message}
                </Alert>
            </Snackbar>
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
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 2,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DatePicker
                                                    label="Ngày"
                                                    value={date}
                                                    onChange={(newValue) => setDate(newValue)}
                                                    renderInput={(params) => <TextField {...params} size="small" sx={{ width: 200 }} />}
                                                />
                                            </LocalizationProvider>
                                        </Box>
                                    </Box>
                                    <Paper variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
                                        <TableContainer sx={{ maxHeight: 600 }}>
                                            <Table stickyHeader sx={{ '& td, & th': { border: '1px solid #e0e0e0' } }}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell colSpan={7} align="center" sx={{ bgcolor: '#dcf1d8', fontWeight: 'bold', fontSize: 18 }}>LỆNH SẢN XUẤT</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell align="center" colSpan={2} sx={{ fontWeight: 'bold', fontSize: 20, width: '20%' }}>Lệnh sản xuất</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ca 1</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ca 2</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ca 3</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ngày</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Lũy kế tháng</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {orderStatus.map((item, index) => (
                                                        <TableRow key={item.key} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' } }}>
                                                            <TableCell align="center" sx={{ width: '2%' }}>{index + 1}</TableCell>
                                                            <TableCell sx={{ color: item.color, fontWeight: 'bold' }}>{item.name}</TableCell>
                                                            <TableCell align="center">{orderCount[item.key]?.ca1 ?? 0}</TableCell>
                                                            <TableCell align="center">{orderCount[item.key]?.ca2 ?? 0}</TableCell>
                                                            <TableCell align="center">{orderCount[item.key]?.ca3 ?? 0}</TableCell>
                                                            <TableCell align="center">{orderCount[item.key]?.day ?? 0}</TableCell>
                                                            <TableCell align="center">{orderCount[item.key]?.month ?? 0}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>
                                    <Paper variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
                                        <TableContainer sx={{ maxHeight: 600 }}>
                                            <Table stickyHeader sx={{ '& td, & th': { border: '1px solid #e0e0e0' } }}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell colSpan={7} align="center" sx={{ bgcolor: '#ffe8d6', fontWeight: 'bold', fontSize: 18 }}>SẢN LƯỢNG</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell align="center" colSpan={2} sx={{ fontWeight: 'bold', fontSize: 20, width: '20%' }}>Sản lượng</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ca 1</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ca 2</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ca 3</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ngày</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Lũy kế tháng</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {productions.map((item, index) => (
                                                        <TableRow key={item.key} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' } }}>
                                                            <TableCell align="center" sx={{ width: '2%' }}>{index + 1}</TableCell>
                                                            <TableCell>{item.name}</TableCell>
                                                            <TableCell align="center">0</TableCell>
                                                            <TableCell align="center">0</TableCell>
                                                            <TableCell align="center">0</TableCell>
                                                            <TableCell align="center">0</TableCell>
                                                            <TableCell align="center">0</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>
                                    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                                            <IconButton onClick={() => handleUpdateDevices.mutate()} disabled={handleUpdateDevices.isPending}>
                                                {handleUpdateDevices.isPending ? (
                                                    <CircularProgress size={24} />
                                                ) : (
                                                    <RotateLeftIcon
                                                        sx={{
                                                            transition: "transform 0.3s ease",
                                                            "&:hover": { transform: "rotate(-180deg)" }, // xoay khi hover
                                                            color: "primary.main",
                                                        }}
                                                    />
                                                )}
                                            </IconButton>
                                            <RealTimeClock />
                                        </Box>
                                        <TableContainer sx={{ maxHeight: 600 }}>
                                            <Table stickyHeader sx={{ '& td, & th': { border: '1px solid #e0e0e0' } }}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell colSpan={7} align="center" sx={{ bgcolor: '#d6e9f9', fontWeight: 'bold', fontSize: 18 }}>THIẾT BỊ</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', width: '2%' }}></TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', width: '18%' }}>Đơn vị</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', width: '10%' }}>Thiết bị</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', width: '10%', color: 'green' }}>Chờ điều động</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', width: '10%', color: 'red' }}>Đang hoạt động</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', width: '10%', color: 'orange' }}>SC; BD</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', width: '10%' }}>Niêm cất</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {isLoadingDeviceCount ? (
                                                        <TableRow>
                                                            <TableCell colSpan={7} align="center">
                                                                <CircularProgress />
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        deviceCount.map((group: any, groupIndex: number) => {
                                                            const reps = group.deviceTypes.length > 0 ? group.deviceTypes : [{ typeName: '', statusCounts: { available: 0, in_use: 0, maintenance: 0, retired: 0 } }];
                                                            const span = reps.length;
                                                            return reps.map((item: any, index: number) => (
                                                                <TableRow key={`${groupIndex}-${index}`} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' } }}>
                                                                    {index === 0 && (
                                                                        <TableCell rowSpan={span} align="center" sx={{ border: '1px solid #e0e0e0' }}>{groupIndex + 1}</TableCell>
                                                                    )}
                                                                    {index === 0 && (
                                                                        <TableCell rowSpan={span} align="center" sx={{ border: '1px solid #e0e0e0' }}>{group.departmentName}</TableCell>
                                                                    )}
                                                                    <TableCell align="center" sx={{ border: '1px solid #e0e0e0' }}>{item.typeName}</TableCell>
                                                                    <TableCell align="center" sx={{ border: '1px solid #e0e0e0', cursor: 'pointer' }} onClick={(e) => handleDetailClick(e, "available", group.departmentName, item.typeName)}>
                                                                        {item.statusCounts?.available}
                                                                    </TableCell>
                                                                    <TableCell align="center" sx={{ border: '1px solid #e0e0e0', cursor: 'pointer' }} onClick={(e) => handleDetailClick(e, "in_use", group.departmentName, item.typeName)}>
                                                                        {item.statusCounts?.in_use}
                                                                    </TableCell>
                                                                    <TableCell align="center" sx={{ border: '1px solid #e0e0e0', cursor: 'pointer' }} onClick={(e) => handleDetailClick(e, "maintenance", group.departmentName, item.typeName)}>
                                                                        {item.statusCounts?.maintenance}
                                                                    </TableCell>
                                                                    <TableCell align="center" sx={{ border: '1px solid #e0e0e0', cursor: 'pointer' }} onClick={(e) => handleDetailClick(e, "retired", group.departmentName, item.typeName)}>
                                                                        {item.statusCounts?.retired}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ));
                                                        })
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>
                                </Paper>
                            </Grid>
                        </Grid>
                        <Popover
                            open={Boolean(anchorElDetail)}
                            anchorEl={anchorElDetail}
                            onClose={handleDetailClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                            PaperProps={{
                                sx: {
                                    borderRadius: 2,
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    maxWidth: 600,
                                    minWidth: 400,
                                    maxHeight: 400
                                }
                            }}
                        >
                            <Box sx={{ p: 3 }}>
                                <Box display={'flex'} gap={3}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                        Danh sách phương tiện
                                    </Typography>
                                    <Typography><strong>Đơn vị:</strong>{departmentPopup}</Typography>
                                    <Typography><strong>Số lượng:</strong>{selectedDetailDevices.length || 0}</Typography>
                                </Box>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Phương tiện</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Sản lượng</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Người vận hành</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Ghi chú</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedDetailDevices.length > 0 ? (
                                            selectedDetailDevices.map((d) => (
                                                <TableRow key={d._id}>
                                                    <TableCell>{d.code}</TableCell>
                                                    <TableCell>0</TableCell>
                                                    <TableCell>{d.assignedTo || ''}</TableCell>
                                                    <TableCell>{d.note || ''}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center">
                                                    Không có phương tiện nào
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Popover>
                    </Box>
                )}
                {tabIndex === 1 && <GoogleMap />}
            </Box>
        </Box>
    );
};

export default ManagerDashboard;