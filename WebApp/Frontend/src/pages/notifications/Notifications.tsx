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
    Check,
    Close,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Notification } from '../../types';
import socketService from '../../services/socketService';
import { useSocket } from '../../hooks/useSocket';
import { showConfirmAlert, showErrorAlert } from '../../components/Alert';

const validationSchema = yup.object({
    title: yup.string().required('Vui lòng nhập tiêu đề'),
    message: yup.string().required('Vui lòng nhập nội dung'),
    type: yup.string().required('Vui lòng chọn loại thông báo'),
    recipient: yup.string().required('Vui lòng chọn người nhận'),
});


const Notifications: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [type, setType] = useState<string | boolean>('')
    const [newNotification, setNewNotification] = useState(null)
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications', type],
        queryFn: () => api.get(`/notifications?read=${type}`).then(res => res.data.data),
    });

    const { data: notificationUnreadCount = 0 } = useQuery({
        queryKey: ['notificationUnreadCount'],
        queryFn: () => api.get('/notifications/unread/count').then(res => res.data.data),
    });
    const { data: notificationReadCount = 0 } = useQuery({
        queryKey: ['notificationReadCount'],
        queryFn: () => api.get('/notifications/read/count').then(res => res.data.data),
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

    const updateMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/notifications/${id}/read`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const handleDelete = (id: string) => {
        if (!id) {
            showErrorAlert('Không tìm thấy bản ghi');
            return;
        }
        showConfirmAlert('Bạn có muốn xóa bản ghi này?').then((result) => {
            if (result.isConfirmed) {
                deleteMutation.mutate(id);
            }
        });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý thông báo</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Badge badgeContent={notificationReadCount} color='error' showZero>
                    <Button variant='contained' onClick={() => setType(true)}>Đã đọc</Button>
                </Badge>
                <Badge badgeContent={notificationUnreadCount} color='error' showZero>
                    <Button variant='contained' onClick={() => setType(false)}>Chưa đọc</Button>
                </Badge>
            </Box>
            <TableContainer component={Paper}>
                <Table sx={{
                    "& td, & th": { padding: "4px 8px" },
                }}>
                    <TableHead>
                        <TableRow>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Tiêu đề</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Nội dung</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Người gửi</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Trạng thái</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Ngày tạo</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18, width: 50 }}>Đánh dấu</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18, width: 50 }}>Xóa</TableCell>
                        </TableRow>
                    </TableHead>
                    {!isLoading ? <TableBody>
                        {notifications.map((notification: any) => (
                            <TableRow key={notification._id}>
                                <TableCell sx={{ border: '1px solid black' }}>{notification.title}</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>
                                    {notification.message}
                                </TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>{notification.recipient?.fullName}</TableCell>
                                <TableCell align='center' sx={{ border: '1px solid black' }}>
                                    <Chip
                                        label={notification.read ? 'Đã đọc' : 'Chưa đọc'}
                                        color={notification.read ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>{new Date(notification.createdAt).toLocaleString('vi-VN')}</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>
                                    <IconButton
                                        color="primary"
                                        onClick={() => updateMutation.mutate(notification._id)}
                                    >
                                        {notification.read ? <Check /> : <Close />}
                                    </IconButton>
                                </TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>
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
        </Box>
    );
};

export default Notifications; 