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
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { DeviceType } from '../../types';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên loại phương tiện'),
});

const DeviceTypes: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | null>(null);
    const queryClient = useQueryClient();
    const [user, setUser] = useAtom(userAtom)

    const { data: DeviceTypes = [], isLoading } = useQuery({
        queryKey: ['DeviceTypes'],
        queryFn: () => api.get(`/DeviceTypes`).then(res => res.data.data),
    });

    console.log(user)


    const createMutation = useMutation({
        mutationFn: (newDeviceType: Partial<DeviceType>) =>
            api.post('/DeviceTypes', newDeviceType).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['DeviceTypes'] });
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedDeviceType: Partial<DeviceType>) =>
            api.put(`/DeviceTypes/${updatedDeviceType._id}`, updatedDeviceType).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['DeviceTypes'] });
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/DeviceTypes/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['DeviceTypes'] });
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            name: '',
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            if (selectedDeviceType) {
                updateMutation.mutate({ ...values, _id: selectedDeviceType._id });
            } else {
                createMutation.mutate(values);
            }
        },
    });

    const handleOpen = (DeviceType?: DeviceType) => {
        if (DeviceType) {
            setSelectedDeviceType(DeviceType);
            formik.setValues(DeviceType);
        } else {
            setSelectedDeviceType(null);
            formik.resetForm();
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedDeviceType(null);
        formik.resetForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa loại phương tiện này?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý loại phương tiện</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    Thêm loại phương tiện
                </Button>
            </Box>
            <TableContainer component={Paper} sx={{ height: '80vh' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align='center' sx={{ border: '1px solid black' }}>Tên loại phương tiện</TableCell>
                            {user?.role !== 'dispatcher' && <TableCell align='center' sx={{ border: '1px solid black' }}>Thao tác</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!isLoading ? DeviceTypes.map((DeviceType: any) => (
                            <TableRow key={DeviceType._id}>
                                <TableCell sx={{ border: '1px solid black' }}>{DeviceType.name}</TableCell>
                                {user?.role !== 'dispatcher' && <TableCell sx={{ border: '1px solid black' }}>
                                    <IconButton color="primary" onClick={() => handleOpen(DeviceType)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(DeviceType._id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>}
                            </TableRow>
                        )) : <Typography>Loading...</Typography>}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{selectedDeviceType ? 'Sửa loại phương tiện' : 'Thêm loại phương tiện'}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                id="name"
                                name="name"
                                label="Tên loại phương tiện"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Hủy</Button>
                    <Button onClick={() => formik.submitForm()} variant="contained">
                        {selectedDeviceType ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DeviceTypes;
