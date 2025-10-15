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
    useTheme,
    useMediaQuery,
    AlertColor,
} from '@mui/material';
import React, { useState } from 'react'
import PieChartOrder from '../../components/PieChartOrder'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Business as DepartmentIcon,
    Person2 as PersonIcon,
    RotateLeft as RotateLeftIcon,
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import api from '../../config/api.config';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';
import { AlertSnackbar } from '../../components/Alert';

export default function OrderAnalysic({ departments }: { departments: any[] }) {
    const [user] = useAtom(userAtom)
    const [department, setDepartment] = useState('');
    const [date, setDate] = useState<Dayjs | null>(dayjs());

    const orderStatus = [
        { key: "pending", name: "Chưa nhận lệnh", color: 'black' },
        { key: "in_progress", name: "Đã nhận lệnh", color: 'green' },
        { key: "warning", name: "Lỗi", color: 'orange' },
        { key: "completed", name: "Đã hoàn thành", color: 'red' },
        { key: "cancel", name: "Đã hủy", color: 'purple' },
    ];

    const [alert, setAlert] = useState<{ open: boolean; message: string; severity?: AlertColor }>({
        open: false,
        message: '',
        severity: 'success',
    });
    const { data: orderCount = {
        pending: { "ca1": 0, "ca2": 0, "ca3": 0, "day": 0, "month": 0 },
        in_progress: { "ca1": 0, "ca2": 0, "ca3": 0, "day": 0, "month": 0 },
        warning: { "ca1": 0, "ca2": 0, "ca3": 0, "day": 0, "month": 0 },
        completed: { "ca1": 0, "ca2": 0, "ca3": 0, "day": 0, "month": 0 },
        cancel: { "ca1": 0, "ca2": 0, "ca3": 0, "day": 0, "month": 0 }
    }, refetch: refetchOrderCount, isLoading: isLoadingOrderCount
    } = useQuery({
        queryKey: ['orderCount', department, date],
        queryFn: () => api.get('/orders/count_status', {
            params: {
                date: date ? date.toISOString() : '',
                department
            }
        }).then(res => res.data.data),
    });



    return (
        <Paper variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
            <AlertSnackbar alert={alert} setAlert={setAlert} />
            <Grid container spacing={2}>
                <Grid item xs={12} lg={7}>
                    <TableContainer sx={{ maxHeight: 300 }}>
                        <Table stickyHeader sx={{ p: 2, '& td, & th': { border: '1px solid #e0e0e0', padding: '6px', } }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ bgcolor: '#dcf1d8', fontWeight: 'bold', fontSize: 18, position: 'relative' }}>
                                        <IconButton
                                            sx={{
                                                position: 'absolute',
                                                left: 8,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                            }}
                                            onClick={async () => {
                                                try {
                                                    await refetchOrderCount(); // đợi xong refetch
                                                    setAlert({ open: true, message: 'Cập nhật thành công', severity: 'success' });
                                                } catch (e) {
                                                    setAlert({ open: true, message: 'Cập nhật thất bại', severity: 'error' });
                                                }
                                            }}
                                            disabled={isLoadingOrderCount}
                                        >
                                            {isLoadingOrderCount ? (
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
                                        LỆNH SẢN XUẤT
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 18, width: '20%' }}>Lệnh sản xuất</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 18, width: '10%' }}>Ca 1</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 18, width: '10%' }}>Ca 2</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 18, width: '10%' }}>Ca 3</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 18, width: '10%' }}>Ngày</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orderStatus.map((item, index) => (
                                    <TableRow key={item.key} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' } }}>
                                        <TableCell sx={{ color: item.color, fontWeight: 'bold' }}>{item.name}</TableCell>
                                        <TableCell align="center">{orderCount[item.key]?.ca1 ?? 0}</TableCell>
                                        <TableCell align="center">{orderCount[item.key]?.ca2 ?? 0}</TableCell>
                                        <TableCell align="center">{orderCount[item.key]?.ca3 ?? 0}</TableCell>
                                        <TableCell align="center">{orderCount[item.key]?.day ?? 0}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
                <Grid item xs={12} lg={5} sx={{ maxHeight: 300 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            mb: 2,
                            p: 2
                        }}
                    >
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {user?.role === "admin" && <Autocomplete
                                size="small"
                                options={departments}
                                getOptionLabel={(option: any) =>
                                    option.code || ''
                                }
                                value={departments.find((p: any) => p._id === department) || null}
                                onChange={(event, newValue) => {
                                    setDepartment(newValue?._id || '');
                                }}
                                sx={{ width: 200 }}
                                renderInput={(params) => <TextField {...params} label="Đơn vị" />}
                            />}
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    inputFormat="DD/MM/YYYY"
                                    label="Ngày"
                                    value={date}
                                    onChange={(newValue) => setDate(newValue)}
                                    renderInput={(params) => <TextField {...params} size="small" sx={{ width: 200 }} />}
                                />
                            </LocalizationProvider>
                        </Box>
                    </Box>
                    <PieChartOrder data={orderCount} />
                </Grid>
            </Grid>

        </Paper>
    )
}
