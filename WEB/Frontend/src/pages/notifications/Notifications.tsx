import React, { useState } from 'react';
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
    const queryClient = useQueryClient();

    const { data: notifications=[] } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => api.get('/notifications').then(res => res.data.data),
    });

    const createMutation = useMutation({
        mutationFn: (newNotification: Partial<Notification>) =>
            api.post('/notifications', newNotification).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            handleClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (updatedNotification: Partial<Notification>) =>
            api.put(`/notifications/${updatedNotification._id}`, updatedNotification).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            handleClose();
        },
    });

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
            if (selectedNotification) {
                updateMutation.mutate({ ...values, _id: selectedNotification._id });
            } else {
                createMutation.mutate(values);
            }
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
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Thêm thông báo
                </Button>
            </Box>
            {!notifications.length ? (
                <Typography>Loading...</Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Tiêu đề</TableCell>
                                <TableCell>Loại thông báo</TableCell>
                                <TableCell>Người nhận</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell>Ngày tạo</TableCell>
                                <TableCell>Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {notifications.map((notification: any) => (
                                <TableRow key={notification._id}>
                                    <TableCell>{notification.title}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={notificationTypes.find(type => type.value === notification.type)?.label}
                                            color={notificationTypes.find(type => type.value === notification.type)?.color as any}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{notification.recipient}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={notification.isRead ? 'Đã đọc' : 'Chưa đọc'}
                                            color={notification.isRead ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{new Date(notification.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
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
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedNotification ? 'Sửa thông báo' : 'Thêm thông báo'}
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
                                select
                                id="type"
                                name="type"
                                label="Loại thông báo"
                                value={formik.values.type}
                                onChange={formik.handleChange}
                                error={formik.touched.type && Boolean(formik.errors.type)}
                                helperText={formik.touched.type && formik.errors.type}
                            >
                                {notificationTypes.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                fullWidth
                                id="recipient"
                                name="recipient"
                                label="Người nhận"
                                value={formik.values.recipient}
                                onChange={formik.handleChange}
                                error={formik.touched.recipient && Boolean(formik.errors.recipient)}
                                helperText={formik.touched.recipient && formik.errors.recipient}
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
                        {selectedNotification ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Notifications; 