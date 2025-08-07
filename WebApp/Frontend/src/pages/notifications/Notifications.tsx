import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    TextField,
    MenuItem,
    Chip,
    Badge,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Notification } from '../../types';
import socketService from '../../services/socketService';
import { useSocket } from '../../hooks/useSocket';

const validationSchema = yup.object({
    title: yup.string().required('Vui lòng nhập tiêu đề'),
    message: yup.string().required('Vui lòng nhập nội dung'),
    type: yup.string().required('Vui lòng chọn loại thông báo'),
    recipient: yup.string().required('Vui lòng chọn người nhận'),
});

const notificationTypes = [
    { value: 'info', label: 'Thông tin', color: 'info' },
    { value: 'warning', label: 'Cảnh báo', color: 'warning' },
    { value: 'error', label: 'Lỗi', color: 'error' },
    { value: 'success', label: 'Thành công', color: 'success' },
];

const Notifications: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [type, setType] = useState("")
    const [newNotification, setNewNotification] = useState(null)
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => api.get('/notifications').then(res => res.data.data),
    });

    useEffect(() => {
        if (newNotification) {
            queryClient.setQueryData(['notifications'], (old: any[] = []) => [
                newNotification,
                ...old,
            ]);
        }
    }, [newNotification, queryClient]);

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/notifications/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const formik = useFormik({
        initialValues: {
            title: '',
            message: '',
            type: '',
            recipient: '',
            isRead: false,
            ...selectedNotification,
        } as Partial<Notification>,
        validationSchema: validationSchema,
        onSubmit: (values) => {
        },
    });

    const handleOpen = (notification?: Notification) => {
        if (notification) {
            setSelectedNotification(notification);
            formik.setValues(notification);
        } else {
            setSelectedNotification(null);
            formik.resetForm();
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedNotification(null);
        formik.resetForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý thông báo</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Badge badgeContent={3} color='error'>
                    <Button variant='contained'>Đã đọc</Button>
                </Badge>
                <Badge badgeContent={3} color='error'>
                    <Button variant='contained'>Chưa đọc</Button>
                </Badge>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align='center' sx={{ border: '1px solid black' }}>Tiêu đề</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black' }}>Loại thông báo</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black' }}>Người gửi</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black' }}>Trạng thái</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black' }}>Ngày tạo</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black' }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    {!isLoading ? <TableBody>
                        {notifications.map((notification: any) => (
                            <TableRow key={notification._id}>
                                <TableCell sx={{ border: '1px solid black' }}>{notification.title}</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>
                                    <Chip
                                        label={notificationTypes.find(type => type.value === notification.type)?.label}
                                        color={notificationTypes.find(type => type.value === notification.type)?.color as any}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>{notification.recipient?.fullName}</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>
                                    <Chip
                                        label={notification.isRead ? 'Đã đọc' : 'Chưa đọc'}
                                        color={notification.isRead ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>{new Date(notification.createdAt).toLocaleString('vi-VN')}</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleOpen(notification)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        onClick={() => handleDelete(notification._id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody> : <Typography>Loading...</Typography>}
                </Table>
            </TableContainer>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    Nội dung thông báo
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                id="title"
                                name="title"
                                label="Tiêu đề"
                                value={formik.values.title}
                                onChange={formik.handleChange}
                                error={formik.touched.title && Boolean(formik.errors.title)}
                                helperText={formik.touched.title && formik.errors.title}
                            />
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                id="message"
                                name="message"
                                label="Nội dung"
                                value={formik.values.message}
                                onChange={formik.handleChange}
                                error={formik.touched.message && Boolean(formik.errors.message)}
                                helperText={formik.touched.message && formik.errors.message}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Hủy</Button>
                    <Button onClick={() => formik.handleSubmit()} variant="contained">
                        Đánh dấu đã đọc
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Notifications; 