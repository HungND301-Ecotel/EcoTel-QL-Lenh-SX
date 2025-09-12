import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Grid,
    Typography,
    Box,
    Card,
    CardContent,
    Tooltip,
    Tabs,
    Tab,
    Paper,
    TableContainer,
    Table,
    TableRow,
    TableHead,
    TableCell,
    TableBody,
    Popover,
    Button,
    Snackbar,
    Alert,
    TextField,
    Autocomplete,

} from '@mui/material';
import {
    Assignment as OrderIcon,
    Devices as DeviceIcon,
    AccessTime as ShiftIcon,
    Business as DepartmentIcon,
    Person2,
    ViewList,
    MapOutlined,
    Autorenew,
} from '@mui/icons-material';
import api from '../../config/api.config';
import { Order, Device, Department, Location } from '../../types';
import { showErrorAlert } from '../../components/Alert';
import GoogleMap from './GoogleMap';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { StyledPopper } from '../../ui/poppers';
import dayjs, { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';



const ManagerDashboard: React.FC = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const [department, setDepartment] = useState("");
    const [startTime, setStartTime] = useState<Dayjs | null>(null);
    const [endTime, setEndTime] = useState<Dayjs | null>(null);

    const productions = [
        { key: "SLD", name: "Sản lượng đất thực hiện (m3)" },
        { key: "SLT", name: "Sản lượng than nguyên khai (m3)" },
        { key: "MKS", name: "Mét khoan sâu (m3)" },
        { key: "KLD", name: "Khối lượng vận chuyển đất (Tkm)" },
        { key: "KLT", name: "Khối lượng vận chuyển than" },
        { key: "TTK", name: "Thể tích khối thực hiện" },
        { key: "CD", name: "Cung độ thực hiện" },
    ]

    const queryClient = useQueryClient();

    const { data: orderCount = { all: 0, pending: 0, in_progress: 0, warning: 0, completed: 0, cancel: 0 } } = useQuery({
        queryKey: ['orderCount'],
        queryFn: () => api.get('/orders/count_status').then(res => res.data.statusCounts),
    });

    const { data: devices = [] } = useQuery({
        queryKey: ['devices'],
        queryFn: () => api.get('/devices').then(res => res.data.data),
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data.data),
    });
    const { data: userCount = 0 } = useQuery({
        queryKey: ['userCount'],
        queryFn: () => api.get('/users/count').then(res => res.data.data),
    });
    const { data: deviceCount = [] } = useQuery({
        queryKey: ['deviceCount'],
        queryFn: () => api.get('/devices/count/status').then(res => res.data.data),
    });
    const [alert, setAlert] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
    const showAlert = (message: string) => {
        setAlert({ open: true, message });
    };
    const handleUpdateDevices = useMutation({
        mutationFn: () => api.post('/devices/update_status').then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
            queryClient.invalidateQueries({ queryKey: ['count'] });
            showAlert('Cập nhật thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    const [anchorElSummary, setAnchorElSummary] = useState<HTMLElement | null>(null);
    const [selectedSummaryDevices, setSelectedSummaryDevices] = useState<any[]>([]);

    // Popover chi tiết (bảng dưới)
    const [anchorElDetail, setAnchorElDetail] = useState<HTMLElement | null>(null);
    const [selectedDetailDevices, setSelectedDetailDevices] = useState<any[]>([]);


    const getDevicesByStatusGrouped = (status: string) => {
        const map = new Map<string, number>();

        deviceCount.forEach((group: any) => {
            group.deviceTypes.forEach((device: any) => {
                const current = map.get(device.typeName) || 0;
                map.set(device.typeName, current + (device.statusCounts?.[status] ?? 0));
            });
        });

        return Array.from(map, ([typeName, total]) => ({ typeName, total }));
    };

    const handleSummaryClick = (event: React.MouseEvent<HTMLElement>, status: string) => {
        setAnchorElSummary(event.currentTarget);
        const grouped = getDevicesByStatusGrouped(status);
        setSelectedSummaryDevices(grouped);
    };
    const handleSummaryClose = () => {
        setAnchorElSummary(null);
        setSelectedSummaryDevices([]);
    };

    // Mở/đóng popover chi tiết
    const handleDetailClick = (
        event: React.MouseEvent<HTMLElement>,
        status: string,
        departmentCode: string,
        typeName: string
    ) => {
        setAnchorElDetail(event.currentTarget);
        setSelectedDetailDevices(devices.filter((d: any) =>
            d.status === status && d.department?.code === departmentCode && d.category?.name === typeName
        ));
    };
    const handleDetailClose = () => {
        setAnchorElDetail(null);
        setSelectedDetailDevices([]);
    };


    return (
        <Box>
            <Snackbar
                open={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                autoHideDuration={4000}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert severity="success" variant="filled" onClose={() => setAlert({ ...alert, open: false })}>
                    {alert.message}
                </Alert>
            </Snackbar>
            <Typography variant="h4" gutterBottom>
                Tổng quan
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6} sx={{ height: '100%' }}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                                        variant="h4"
                                        gutterBottom
                                        sx={{ fontWeight: 'bold', }}
                                    >
                                        Lệnh sản xuất
                                    </Typography>
                                    <Typography
                                        variant="h4"
                                        gutterBottom
                                        sx={{ fontWeight: 'bold', }}
                                    >
                                        {orderCount.all}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        color: "#1976d2",
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <OrderIcon color='primary' fontSize='large' />
                                </Box>
                            </Box>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <OrderIcon color='disabled' fontSize='medium' />
                                        <Typography variant='h6' sx={{ fontWeight: 'bold', }}>Chưa nhận lệnh</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{orderCount.pending}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <OrderIcon sx={{ color: 'green' }} fontSize='medium' />
                                        <Typography variant='h6' sx={{ fontWeight: 'bold', }}>Đã nhận lệnh</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{orderCount.in_progress}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <OrderIcon color='warning' fontSize='medium' />
                                        <Typography variant='h6' sx={{ fontWeight: 'bold', }}>Lỗi</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{orderCount.warning}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <OrderIcon color='error' fontSize='medium' />
                                        <Typography variant='h6' sx={{ fontWeight: 'bold', }}>Đã hoàn thành</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{orderCount.completed}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <OrderIcon color='secondary' fontSize='medium' />
                                        <Typography variant='h6' sx={{ fontWeight: 'bold', }}>Đã hủy</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{orderCount.cancel}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Box>
                                    <Box display="flex" justifyContent="space-between" gap={5} alignItems="center">
                                        <Typography
                                            variant="h4"
                                            gutterBottom
                                            sx={{ fontWeight: 'bold', }}
                                        >
                                            Phương tiện
                                        </Typography>

                                    </Box>
                                    <Typography
                                        variant="h4"
                                        gutterBottom
                                        sx={{ fontWeight: 'bold', }}
                                    >
                                        {devices.length}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        color: "#1976d2",
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <DeviceIcon color='primary' fontSize='large' />
                                </Box>
                            </Box>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <DeviceIcon sx={{ color: 'green' }} fontSize='medium' />
                                        <Typography variant='h6' onClick={(e) => handleSummaryClick(e, "available")} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>Chờ điều động</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{devices.filter((o: Device) => o.status === "available").length}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <DeviceIcon color='error' fontSize='medium' />
                                        <Typography variant='h6' onClick={(e) => handleSummaryClick(e, "in_use")} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>Đang hoạt động</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{devices.filter((o: Device) => o.status === "in_use").length}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <DeviceIcon color='warning' fontSize='medium' />
                                        <Typography variant='h6' onClick={(e) => handleSummaryClick(e, "maintenance")} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>SC; BD</Typography>

                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{devices.filter((o: Device) => o.status === "maintenance").length}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <DeviceIcon color='disabled' fontSize='medium' />
                                        <Typography variant='h6' onClick={(e) => handleSummaryClick(e, "retired")} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>Niêm cất</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{devices.filter((o: Device) => o.status === "retired").length}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                    <Popover
                        open={Boolean(anchorElSummary)}
                        anchorEl={anchorElSummary}
                        onClose={handleSummaryClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    >
                        <Box sx={{ p: 2, maxHeight: 300, overflowY: 'auto' }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', }}>Danh sách phương tiện</Typography>

                            {selectedSummaryDevices.length > 0 ? (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', }}>Loại xe</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', }}>Số lượng</TableCell>

                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedSummaryDevices.map((d) => (
                                            <TableRow>
                                                <TableCell>{d.typeName}</TableCell>
                                                <TableCell>{d.total}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <Typography>Không có phương tiện nào</Typography>
                            )}
                        </Box>
                    </Popover>
                </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                        variant="outlined"
                        startIcon={<Autorenew sx={{ color: "#1976d2" }} />} // Đặt màu xanh cho icon
                        sx={{
                            height: 50,
                            px: 4,
                            fontSize: "1.1rem",
                            fontWeight: "bold",
                            borderRadius: "12px",
                            textTransform: "none",
                            border: "2px solid #1976d2", // Viền xanh dương
                            color: "#333333", // Màu chữ đen
                            backgroundColor: "#f9f9f9", // Nền rất nhạt
                            "&:hover": {
                                backgroundColor: "#e3f2fd", // Hiệu ứng hover cho nền
                                borderColor: "#1565c0", // Hiệu ứng hover cho viền
                            },
                        }}
                        onClick={() => handleUpdateDevices.mutate()}
                    >
                        Cập nhật
                    </Button>
                    <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
                        <Tab label="Phương tiện" icon={<ViewList />} />
                        <Tab label="Bản đồ" icon={<MapOutlined />} />
                    </Tabs>
                </Box>
                {tabIndex === 0 && <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            flexGrow: 1, // Chiếm hết phần còn lại của không gian
                            gap: 2,
                            alignItems: 'center',
                            flexDirection: {
                                xs: 'column',
                                md: 'row',
                            },
                            width: {
                                xs: '100%', // Group này chiếm 100% khi xếp dọc
                                md: 'auto',
                            },
                        }}
                    >
                        <Autocomplete
                            fullWidth
                            readOnly
                            options={departments}
                            getOptionLabel={(option: any) =>
                                option.code || ''
                            }
                            value={departments.find((p: any) => p._id === department) || null}
                            onChange={(event, newValue) => {
                                setDepartment(newValue?._id || '');
                            }}
                            PopperComponent={StyledPopper}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    fullWidth
                                    size='small'
                                    label="Đơn vị"
                                />
                            )}
                        />
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                readOnly
                                label="Từ ngày"
                                inputFormat="DD/MM/YYYY"
                                value={startTime ? dayjs(startTime) : null}
                                onChange={(value) => setStartTime(value)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        size="small"
                                    />
                                )}
                            />
                        </LocalizationProvider>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                readOnly
                                label="Đến ngày"
                                inputFormat="DD/MM/YYYY"
                                value={endTime ? dayjs(endTime) : null}
                                onChange={(value) => setEndTime(value)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        size="small"
                                    />
                                )}
                            />
                        </LocalizationProvider>
                    </Box>
                    <Paper sx={{ width: '100%', overflowX: "initial", mt: 5 }}>
                        <TableContainer sx={{ maxHeight: '80vh' }}>
                            <Table stickyHeader aria-label="sticky table" sx={{
                                "& td, & th": { padding: "4px 8px", top: 0 },
                            }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell colSpan={7} align='center' sx={{ fontSize: 18, border: '1px solid black', backgroundColor: '#FFCC99', fontWeight: 600 }}>SẢN LƯỢNG</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell align='center' sx={{ width: '2%', border: '1px solid black', fontWeight: 600, fontSize: 18, }}></TableCell>
                                        <TableCell align='center' sx={{ width: '20%', border: '1px solid black', fontWeight: 600, fontSize: 18, }}>Đơn vị</TableCell>
                                        <TableCell align='center' sx={{ width: '10%', border: '1px solid black', fontWeight: 600, fontSize: 18, }}>Ca 1</TableCell>
                                        <TableCell align='center' sx={{ width: '10%', border: '1px solid black', fontWeight: 600, fontSize: 18, }}>Ca 2</TableCell>
                                        <TableCell align='center' sx={{ width: '10%', border: '1px solid black', fontWeight: 600, fontSize: 18, }}>Ca 3</TableCell>
                                        <TableCell align='center' sx={{ width: '10%', border: '1px solid black', fontWeight: 600, fontSize: 18, }}>Ngày</TableCell>
                                        <TableCell align='center' sx={{ width: '10%', border: '1px solid black', fontWeight: 600, fontSize: 18, }}>Tháng</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {productions.map((item, index) => (<TableRow>
                                        <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 600, fontSize: 18, }}>{index + 1}</TableCell>
                                        <TableCell sx={{ border: '1px solid black', fontWeight: 600, fontSize: 18, }}>{item.name}</TableCell>
                                        <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 600, fontSize: 18, }}></TableCell>
                                        <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 600, fontSize: 18, }}></TableCell>
                                        <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 600, fontSize: 18, }}></TableCell>
                                        <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 600, fontSize: 18, }}></TableCell>
                                        <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 600, fontSize: 18, }}></TableCell>
                                    </TableRow>))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                    <Paper sx={{ width: '100%', overflowX: "initial" }}>
                        <TableContainer sx={{ maxHeight: '80vh' }}>
                            <Table stickyHeader aria-label="sticky table" sx={{
                                "& td, & th": { padding: "4px 8px", top: 0 },
                            }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell colSpan={7} align='center' sx={{ fontSize: 18, border: '1px solid black', backgroundColor: '#c6e4faff', fontWeight: 600 }}>PHƯƠNG TIỆN</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell align='center' sx={{ width: '2%', border: '1px solid black', fontWeight: 600, fontSize: 18, }}></TableCell>
                                        <TableCell align='center' sx={{ width: '20%', border: '1px solid black', fontWeight: 600, fontSize: 18, }}>Đơn vị</TableCell>
                                        <TableCell align='center' sx={{ width: '10%', border: '1px solid black', fontWeight: 600, fontSize: 18, }}>Phương tiện</TableCell>
                                        <TableCell align='center' sx={{ width: '10%', border: '1px solid black', fontWeight: 600, fontSize: 18, color: 'green' }}>Chờ điều động</TableCell>
                                        <TableCell align='center' sx={{ width: '10%', border: '1px solid black', fontWeight: 600, fontSize: 18, color: 'red' }}>Đang hoạt động</TableCell>
                                        <TableCell align='center' sx={{ width: '10%', border: '1px solid black', fontWeight: 600, fontSize: 18, color: 'orange' }}>SC; BD</TableCell>
                                        <TableCell align='center' sx={{ width: '10%', border: '1px solid black', fontWeight: 600, fontSize: 18, }}>Niêm cất</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {deviceCount.map((group: any, groupIndex: number) => {
                                        const reps = (group.deviceTypes && group.deviceTypes.length)
                                            ? group.deviceTypes
                                            : [{ typeName: '', statusCounts: { available: 0, in_use: 0, maintenance: 0, retired: 0 } }];
                                        const span = reps.length;
                                        return reps.map((item: any, index: number) => (
                                            <TableRow key={`${groupIndex}-${index}`}>
                                                {/* STT chỉ in 1 lần, ghép nhiều dòng */}
                                                {index === 0 && (
                                                    <TableCell
                                                        align="center"
                                                        rowSpan={span}
                                                        sx={{ width: 50, border: '1px solid black', fontWeight: 600, fontSize: 18 }}
                                                    >
                                                        {groupIndex + 1}
                                                    </TableCell>
                                                )}

                                                {index === 0 && (
                                                    <TableCell
                                                        align="center"
                                                        rowSpan={span}
                                                        sx={{ border: '1px solid black', fontWeight: 600, fontSize: 18 }}
                                                    >
                                                        {group.departmentName}
                                                    </TableCell>
                                                )}

                                                <TableCell align="center" sx={{ border: '1px solid black', fontWeight: 600, fontSize: 18 }}>
                                                    {item.typeName}
                                                </TableCell>
                                                <TableCell align="center" sx={{ border: '1px solid black', fontWeight: 600, fontSize: 18 }} onClick={(e) => handleDetailClick(e, "available", group.departmentName, item.typeName)}>
                                                    {item.statusCounts?.available}
                                                </TableCell>
                                                <TableCell align="center" sx={{ border: '1px solid black', fontWeight: 600, fontSize: 18 }} onClick={(e) => handleDetailClick(e, "in_use", group.departmentName, item.typeName)}>
                                                    {item.statusCounts?.in_use}
                                                </TableCell>
                                                <TableCell align="center" sx={{ border: '1px solid black', fontWeight: 600, fontSize: 18 }} onClick={(e) => handleDetailClick(e, "maintenance", group.departmentName, item.typeName)}>
                                                    {item.statusCounts?.maintenance}
                                                </TableCell>
                                                <TableCell align="center" sx={{ border: '1px solid black', fontWeight: 600, fontSize: 18 }} onClick={(e) => handleDetailClick(e, "retired", group.departmentName, item.typeName)}>
                                                    {item.statusCounts?.retired}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    })}
                                </TableBody>

                            </Table>
                        </TableContainer>
                    </Paper>
                    <Popover
                        open={Boolean(anchorElDetail)}
                        anchorEl={anchorElDetail}
                        onClose={handleDetailClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    >
                        <Box sx={{ p: 2, maxHeight: 300, overflowY: 'auto' }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', }}>Danh sách phương tiện chi tiết</Typography>

                            {selectedDetailDevices.length > 0 ? (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', }}>Phương tiện</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', }}>Sản lượng</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', }}>Người vận hành</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', }}>Ghi chú</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedDetailDevices.map((d) => (
                                            <TableRow key={d._id}>
                                                <TableCell>{d.code}</TableCell>
                                                <TableCell>0</TableCell>
                                                <TableCell>{d.assignedTo || ''}</TableCell>
                                                <TableCell>{d.note || ''}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <Typography>Không có phương tiện nào</Typography>
                            )}
                        </Box>
                    </Popover>
                </Box>}
                {tabIndex === 1 && <GoogleMap />}
            </Box>
        </Box >
    );
};

export default ManagerDashboard; 