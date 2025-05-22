import React, { useState } from 'react';
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
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Order } from '../../types';
import OrderForm from './OrderForm';

const validationSchema = yup.object({
    orderNumber: yup.string().required('Vui lòng nhập số lệnh'),
    shift: yup.string().required('Vui lòng chọn ca làm việc'),
    employee: yup.string().required('Vui lòng chọn nhân viên'),
    device: yup.string().required('Vui lòng chọn thiết bị'),
    location: yup.string().required('Vui lòng nhập vị trí'),
    workContent: yup.string().required('Vui lòng nhập nội dung công việc'),
});

const Orders: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const queryClient = useQueryClient();

    const { data: orders=[], isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: () => api.get('/orders').then(res => res.data.data),
    });


    const createMutation = useMutation({
        mutationFn: (newOrder: Partial<Order>) =>
            api.post('/orders', newOrder).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            handleClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (updatedOrder: Partial<Order>) =>
            api.put(`/orders/${updatedOrder._id}`, updatedOrder).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            handleClose();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/orders/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });

    const handleOpen = (order?: Order) => {
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

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Số lệnh</TableCell>
                            <TableCell>Ca làm việc</TableCell>
                            <TableCell>Nhân viên</TableCell>
                            <TableCell>Thiết bị</TableCell>
                            <TableCell>Vị trí</TableCell>
                            <TableCell>Trạng thái</TableCell>
                            <TableCell>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map((order: any) => (
                            <TableRow key={order._id}>
                                <TableCell>{order.orderNumber}</TableCell>
                                <TableCell>
                                    {typeof order.shift === 'object' && order.shift !== null
                                        ? order.shift.name
                                        : order.shift || 'Chưa có'}
                                </TableCell>
                                <TableCell>
                                    {typeof order.employee === 'object' && order.employee !== null
                                        ? order.employee.fullName
                                        : order.employee || 'Chưa có'}
                                </TableCell>
                                <TableCell>
                                    {typeof order.device === 'object' && order.device !== null
                                        ? order.device.name
                                        : order.device || 'Chưa có'}
                                </TableCell>
                                <TableCell>{order.location}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={order.status === 'pending' ? 'Chờ xử lý' : 
                                               order.status === 'in_progress' ? 'Đang xử lý' : 
                                               order.status === 'completed' ? 'Hoàn thành' : 
                                               order.status === 'cancelled' ? 'Đã hủy' : order.status}
                                        color={order.status === 'completed' ? 'success' : 
                                               order.status === 'cancelled' ? 'error' : 
                                               order.status === 'in_progress' ? 'warning' : 'default'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleOpen(order)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        onClick={() => handleDelete(order._id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedOrder ? 'Sửa lệnh sản xuất' : 'Thêm lệnh sản xuất'}
                </DialogTitle>
                <DialogContent>
                    <OrderForm
                        initialValues={selectedOrder || {}}
                        onSubmit={handleSubmit}
                        onCancel={handleClose}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default Orders; 