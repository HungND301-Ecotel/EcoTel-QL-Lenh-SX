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
    Chip,
    Checkbox,
    TextField,
    MenuItem,
    Tooltip,
    Autocomplete,
    styled,
    Popper,
    Typography,
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
import OrderFormAdd from './DispatcherOrderFormAdd';
import OrderFormEdit from './DispatcherOrderFormEdit';
import OrderHistories from '../../components/OrderHistory/OrderHistories';
import DispatcherOrderFormTransfer from './DispatcherOrderFormTransfer';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useSocket } from '../../hooks/useSocket';
const StyledPopper = styled(Popper)({
    '& .MuiAutocomplete-listbox': {
        maxHeight: '200px', // Đặt chiều cao tối đa mong muốn
        overflowY: 'auto', // Thêm thanh cuộn khi nội dung vượt quá chiều cao
    },
});
const DispatcherOrders: React.FC = () => {
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
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

    }, [queryClient, socket]);

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(res => res.data.data),
    });

    const { data: orders = [], isLoading, refetch } = useQuery({
        queryKey: ['orders'],
        queryFn: () => api.get(`/orders?employee=${employee}&startTime=${startTime ? startTime.toISOString() : ''}&endTime=${endTime ? endTime.toISOString() : ''}`).then(res => res.data.data),
    });

    const createMutation = useMutation({
        mutationFn: (newOrder: Partial<Order>) =>
            api.post('/orders', newOrder).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const reportExcel = useMutation({
        mutationFn: () =>
            api.get(`/exports/order/${selectedOrder?._id}`, {
                responseType: 'blob',
            }).then(res => {
                const blob = new Blob([res.data], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });

                // Tạo một URL tạm từ Blob
                const url = window.URL.createObjectURL(blob);
                // Tạo thẻ <a> động và kích hoạt tải file
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `*.xlsx`);

                document.body.appendChild(link);
                link.click();

                // Dọn dẹp URL Blob và xóa thẻ <a>
                link.parentNode?.removeChild(link);
                window.URL.revokeObjectURL(url);
            }),
        onSuccess: () => {
            setSelectedOrder(null)
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedOrder: Partial<Order>) =>
            api.put(`/orders/${updatedOrder._id}`, updatedOrder).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/orders/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const handleOpen = (order?: any) => {
        if (order) {
            setSelectedOrder(order);
        } else {
            setSelectedOrder(null);
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedOrder(null);
    };

    const handleSubmit = (values: Partial<Order>) => {
        if (selectedOrder) {
            updateMutation.mutate({ ...values, _id: selectedOrder._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa lệnh sản xuất này?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return <Typography>Loading...</Typography>;
    }


    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý lệnh sản xuất</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Thêm lệnh sản xuất
                </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, flexDirection: 'column' }}>
                    <Typography>Công nhân:</Typography>
                    <Autocomplete
                        fullWidth
                        options={users}
                        getOptionLabel={(option: any) =>
                            `${option?.fullName || ""}-${option?.salaryCode || ''}`
                        }
                        value={users.find((p: any) => p._id === employee) || null}
                        onChange={(event, newValue) => {
                            setEmployee(newValue?._id || "");
                        }}
                        PopperComponent={StyledPopper}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                size='small'
                                label="Công nhân"
                            />
                        )}
                    />
                </Box>

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
                                <TableCell sx={{
                                    position: 'sticky',
                                    left: 0,
                                    backgroundColor: 'white',
                                    zIndex: 3,
                                    minWidth: 150,
                                    border: '1px solid black'
                                }}>Tên nhân viên</TableCell>
                                <TableCell sx={{ minWidth: 130, border: '1px solid black' }}>Số thẻ lương</TableCell>
                                <TableCell sx={{ minWidth: 150, border: '1px solid black' }}>Giờ tạo lệnh</TableCell>
                                <TableCell sx={{ minWidth: 120, border: '1px solid black' }}>Ngày</TableCell>
                                <TableCell sx={{ minWidth: 50, border: '1px solid black' }}>Ca</TableCell>
                                <TableCell sx={{ minWidth: 150, border: '1px solid black' }}>Công việc</TableCell>
                                <TableCell sx={{ minWidth: 200, border: '1px solid black' }}>Nội dung</TableCell>
                                <TableCell sx={{ minWidth: 150, border: '1px solid black' }}>Phương tiện</TableCell>
                                <TableCell sx={{ minWidth: 150, border: '1px solid black' }}>Người ra lệnh</TableCell>
                                <TableCell sx={{ minWidth: 120, border: '1px solid black' }}>Bắt đầu</TableCell>
                                <TableCell sx={{ minWidth: 120, border: '1px solid black' }}>Kết thúc</TableCell>
                                <TableCell sx={{ minWidth: 150, border: '1px solid black' }}>Ghi chú</TableCell>
                                <TableCell sx={{ minWidth: 150, border: '1px solid black' }}>Trạng thái</TableCell>
                                <TableCell sx={{ minWidth: 150, border: '1px solid black' }}>Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order: any) => (
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
                                        {order?.temporaryError || ''}
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
                                    <TableCell sx={{ border: '1px solid black' }}>
                                        {['pending', 'warning'].includes(order?.status) && <IconButton
                                            color="primary"
                                            onClick={() => handleOpen(order)}
                                        >
                                            <Tooltip title="Sửa" placement='top'>
                                                <EditIcon />
                                            </Tooltip>
                                        </IconButton>}
                                        {['completed'].includes(order?.status) && <IconButton
                                            color="success"
                                            onClick={() => {
                                                setSelectedOrder(order)
                                                reportExcel.mutate();
                                            }}
                                        >
                                            <Tooltip title="Xuất file" placement='top'>
                                                <FileDownload />
                                            </Tooltip>
                                        </IconButton>}
                                        {['pending', 'warning'].includes(order?.status) && <IconButton
                                            color="error"
                                            onClick={() => handleDelete(order._id)}
                                        >
                                            <Tooltip title="Xóa" placement='top'>
                                                <DeleteIcon />
                                            </Tooltip>
                                        </IconButton>}
                                        <IconButton
                                            color="info"
                                            onClick={() => {
                                                setSelectedOrder(order)
                                                setHistory(true)
                                            }}
                                        >
                                            <Tooltip title="Lịch sử" placement='top'>
                                                <InfoOutlined />
                                            </Tooltip>
                                        </IconButton>
                                        {order.status === "completed" && <IconButton
                                            color="info"
                                            onClick={() => {
                                                setSelectedOrder(order)
                                                setTransfer(true)
                                            }}
                                        >
                                            <Tooltip title="Chuyển giao ca" placement='top'>
                                                <SyncAlt />
                                            </Tooltip>
                                        </IconButton>}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <OrderHistories open={history} setOpen={setHistory} initialValues={selectedOrder} />
            {selectedOrder ? <OrderFormEdit
                open={open}
                initialValues={selectedOrder}
                onSubmit={handleSubmit}
                onCancel={handleClose}
            /> : <OrderFormAdd
                open={open}
                onSubmit={handleSubmit}
                onCancel={handleClose}
            />}
            {selectedOrder && <DispatcherOrderFormTransfer
                open={transfer}
                initialValues={selectedOrder}
                onCancel={handleClose}
            />}
        </Box>
    );
};

export default DispatcherOrders; 