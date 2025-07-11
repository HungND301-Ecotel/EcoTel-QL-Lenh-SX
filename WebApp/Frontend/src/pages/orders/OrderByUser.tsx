import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    Checkbox,
    TextField,
    MenuItem,
    Tooltip,
} from '@mui/material';
import { format } from 'date-fns';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search,
    MoreVert,
    MoreHoriz,
    FileDownload,
    InfoOutlined,
    SyncAlt,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Order } from '../../types';
import OrderFormAdd from './OrderFormAdd';
import OrderFormEdit from './OrderFormEdit';
import OrderHistories from '../../components/OrderHistory/OrderHistories';
import OrderFormTransfer from './OrderFormTransfer';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useSocket } from '../../hooks/useSocket';

const OrderByUsers: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [history, setHistory] = useState(false);
    const [transfer, setTransfer] = useState(false);
    const [employee, setEmployee] = useState("");
    const [startTime, setStartTime] = useState<Dayjs | null>(null);
    const [endTime, setEndTime] = useState<Dayjs | null>(null);
    const [department, setDepartment] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const queryClient = useQueryClient();
    const socket = useSocket()

    useEffect(() => {
        if (!socket) return;

        socket.on('notification', () => {
            queryClient.invalidateQueries({ queryKey: ['orderByUser'] });
        });

    }, [queryClient, socket]);

    const { data: orderByUser = [], isLoading, refetch } = useQuery({
        queryKey: ['orderByUser'],
        queryFn: () => api.get(`/orders/user?startTime=${startTime ? startTime.toISOString() : ''}&endTime=${endTime ? endTime.toISOString() : ''}`).then(res => res.data.data),
    });

    if (isLoading) {
        return <Typography>Loading...</Typography>;
    }


    return (
        <Box>
            <Typography variant="h4">Công việc của tôi</Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, flexDirection: 'column' }}>
                    <Typography>Từ ngày:</Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Từ ngày"
                            inputFormat="DD/MM/YYYY" // v5 vẫn hỗ trợ
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
                </Box>

                <Box sx={{ flex: 1, flexDirection: 'column' }}>
                    <Typography>Đến ngày:</Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Đến ngày"
                            inputFormat="DD/MM/YYYY" // v5 vẫn hỗ trợ
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


                <Box>
                    <Button
                        variant="contained"
                        startIcon={<Search />}
                        onClick={() => refetch()}
                    >
                        Tìm
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ width: '100%', overflowX: "initial" }}>
                <TableContainer sx={{ height: '80vh' }}>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead>
                            <TableRow>
                                <TableCell align='center' sx={{
                                    position: 'sticky',
                                    left: 0,
                                    backgroundColor: 'white',
                                    zIndex: 3,
                                    minWidth: 150,
                                    border: '1px solid black'
                                }}>Tên nhân viên</TableCell>
                                <TableCell align='center' sx={{ minWidth: 130, border: '1px solid black' }}>Số thẻ lương</TableCell>
                                <TableCell align='center' sx={{ minWidth: 150, border: '1px solid black' }}>Giờ tạo lệnh</TableCell>
                                <TableCell align='center' sx={{ minWidth: 120, border: '1px solid black' }}>Ngày</TableCell>
                                <TableCell align='center' sx={{ minWidth: 50, border: '1px solid black' }}>Ca</TableCell>
                                <TableCell align='center' sx={{ minWidth: 150, border: '1px solid black' }}>Công việc</TableCell>
                                <TableCell align='center' sx={{ minWidth: 200, border: '1px solid black' }}>Nội dung</TableCell>
                                <TableCell align='center' sx={{ minWidth: 150, border: '1px solid black' }}>Phương tiện</TableCell>
                                <TableCell align='center' sx={{ minWidth: 150, border: '1px solid black' }}>Người ra lệnh</TableCell>
                                <TableCell align='center' sx={{ minWidth: 120, border: '1px solid black' }}>Bắt đầu</TableCell>
                                <TableCell align='center' sx={{ minWidth: 120, border: '1px solid black' }}>Kết thúc</TableCell>
                                <TableCell align='center' sx={{ minWidth: 150, border: '1px solid black' }}>Ghi chú</TableCell>
                                <TableCell align='center' sx={{ minWidth: 150, border: '1px solid black' }}>Trạng thái</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orderByUser.map((order: any) => (
                                <TableRow key={order._id}>
                                    <TableCell sx={{
                                        position: 'sticky',
                                        left: 0,
                                        backgroundColor: 'white',
                                        zIndex: 1,
                                        minWidth: 150,
                                        border: '1px solid black'
                                    }}>{order.assignedTo?.fullName}</TableCell>
                                    <TableCell sx={{ border: '1px solid black' }}>
                                        {order.assignedTo?.salaryCode}
                                    </TableCell>
                                    <TableCell sx={{ border: '1px solid black' }}>
                                        {order.createdAt ? format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm') : ''}
                                    </TableCell>
                                    <TableCell sx={{ border: '1px solid black' }}>
                                        {order.workingDate ? format(new Date(order.workingDate), 'yyyy-MM-dd') : ''}
                                    </TableCell>
                                    <TableCell sx={{ border: '1px solid black' }}>
                                        {order.shift?.name}
                                    </TableCell>
                                    <TableCell sx={{ border: '1px solid black' }}>
                                        {order.job.name || ''}
                                    </TableCell>
                                    <TableCell sx={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: 200,
                                        border: '1px solid black'
                                    }}>
                                        {order.workContent || ''}
                                    </TableCell>
                                    <TableCell sx={{ border: '1px solid black' }}>
                                        <Typography whiteSpace="pre-line" fontSize={14}>
                                            {order.devicesToProduce?.map((dev: any) => `${dev?.deviceType?.name}-SL:${dev?.quantity}`).join('\n')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ border: '1px solid black' }}>
                                        {order.createdBy.username || ''}
                                    </TableCell>
                                    <TableCell sx={{ border: '1px solid black' }}>
                                        {order.startTime ? format(new Date(order.startTime), 'HH:mm:ss') : ''}
                                    </TableCell>
                                    <TableCell sx={{ border: '1px solid black' }}>
                                        {order.endTime ? format(new Date(order.endTime), 'HH:mm:ss') : ''}
                                    </TableCell>
                                    <TableCell sx={{ border: '1px solid black' }}>
                                        {order.temporaryError || ''}
                                    </TableCell>
                                    <TableCell sx={{ border: '1px solid black' }}>
                                        <Chip
                                            label={order.status === 'pending' ? 'Chưa nhận lệnh' :
                                                order.status === 'in_progress' ? 'Đã nhận lệnh' :
                                                    order.status === 'completed' ? 'Đã hoàn thành' :
                                                        order.status === 'warning' ? 'Lỗi' : order.status
                                            }
                                            color={
                                                order.status === 'pending' ? 'default' :
                                                    order.status === 'completed' ? 'error' :
                                                        order.status === 'in_progress' ? 'success' :
                                                            order.status === 'warning' ? 'warning' : 'default'}
                                        />
                                    </TableCell>

                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box >
    );
};

export default OrderByUsers; 