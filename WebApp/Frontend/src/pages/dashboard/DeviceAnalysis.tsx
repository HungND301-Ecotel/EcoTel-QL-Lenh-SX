import {
    Typography,
    Box,
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
import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Business as DepartmentIcon,
    Person2 as PersonIcon,
    RotateLeft as RotateLeftIcon,
} from '@mui/icons-material';
import api from '../../config/api.config';
import RealTimeClock from '../../components/RealTimeClock';
import { showErrorAlert } from '../../components/Alert';
import BlinkButton from '../../components/BlinkButton';

export default function DeviceAnalysic() {
    const queryClient = useQueryClient();
    const { data: deviceCount = [], isLoading: isLoadingDeviceCount } = useQuery({
        queryKey: ['deviceCount'],
        queryFn: () => api.get('/devices/count/status').then(res => res.data.data),
    });
    const { data: devices = [] } = useQuery({
        queryKey: ['devices'],
        queryFn: () => api.get('/devices').then(res => res.data.data),
    });

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

    const [alert, setAlert] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

    const showAlert = (message: string) => {
        setAlert({ open: true, message });
    };


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
        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
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
                            <TableCell align="center" sx={{ fontWeight: 'bold', width: '20%' }}>Đơn vị</TableCell>
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
                                        {/* {index === 0 && (
                                            <TableCell rowSpan={span} align="center" sx={{ border: '1px solid #e0e0e0' }}>{groupIndex + 1}</TableCell>
                                        )} */}
                                        {index === 0 && (
                                            <TableCell rowSpan={span} align="center" sx={{ border: '1px solid #e0e0e0' }}>{group.departmentName}</TableCell>
                                        )}
                                        <TableCell align="center" sx={{ border: '1px solid #e0e0e0' }}>{item.typeName}</TableCell>
                                        <TableCell align="center" sx={{ border: '1px solid #e0e0e0', cursor: 'pointer' }} onClick={(e) => handleDetailClick(e, "available", group.departmentName, item.typeName)}>
                                            {item.statusCounts?.available}
                                            {item.statusCounts?.available > 0 && <BlinkButton color="green" />}
                                        </TableCell>
                                        <TableCell align="center" sx={{ border: '1px solid #e0e0e0', cursor: 'pointer' }} onClick={(e) => handleDetailClick(e, "in_use", group.departmentName, item.typeName)}>
                                            {item.statusCounts?.in_use}
                                            {item.statusCounts?.in_use > 0 && <BlinkButton color="red" />}
                                        </TableCell>
                                        <TableCell align="center" sx={{ border: '1px solid #e0e0e0', cursor: 'pointer' }} onClick={(e) => handleDetailClick(e, "maintenance", group.departmentName, item.typeName)}>
                                            {item.statusCounts?.maintenance}
                                            {item.statusCounts?.maintenance > 0 && <BlinkButton color="orange" />}
                                        </TableCell>
                                        <TableCell align="center" sx={{ border: '1px solid #e0e0e0', cursor: 'pointer' }} onClick={(e) => handleDetailClick(e, "retired", group.departmentName, item.typeName)}>
                                            {item.statusCounts?.retired}
                                            {item.statusCounts?.retired > 0 && <BlinkButton color="black" />}
                                        </TableCell>
                                    </TableRow>
                                ));
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
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
        </Paper>
    )
}
