import React, { useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Typography,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api.config';

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên phòng ban'),
    code: yup.string().required('Vui lòng nhập mã phòng ban'),
    description: yup.string(),
    manager: yup.string(),
});

const Departments = () => {
    const [open, setOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data: departmentsRaw, isLoading } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data),
    });
    const departments = React.useMemo(() => {
        if (!departmentsRaw) return [];
        if (Array.isArray(departmentsRaw)) return departmentsRaw;
        if (departmentsRaw.data && Array.isArray(departmentsRaw.data.departments)) return departmentsRaw.data.departments;
        if (departmentsRaw.data && Array.isArray(departmentsRaw.data)) return departmentsRaw.data;
        return [];
    }, [departmentsRaw]);

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/departments', data).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            handleClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.put(`/departments/${selectedDepartment?._id}`, data).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            handleClose();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/departments/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
    });

    const formik = useFormik({
        initialValues: {
            name: '',
            code: '',
            description: '',
            manager: '',
        },
        validationSchema,
        onSubmit: (values) => {
            if (selectedDepartment) {
                updateMutation.mutate(values);
            } else {
                createMutation.mutate(values);
            }
        },
    });

    const handleOpen = (department?: any) => {
        if (department) {
            setSelectedDepartment(department);
            formik.setValues({
                name: department.name,
                code: department.code,
                description: department.description || '',
                manager: department.manager || '',
            });
        } else {
            setSelectedDepartment(null);
            formik.resetForm();
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedDepartment(null);
        formik.resetForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return <Typography>Đang tải...</Typography>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Quản lý phòng ban</Typography>
                <Button variant="contained" onClick={() => handleOpen()}>
                    Thêm phòng ban
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Mã phòng ban</TableCell>
                            <TableCell>Tên phòng ban</TableCell>
                            <TableCell>Mô tả</TableCell>
                            <TableCell>Quản lý</TableCell>
                            <TableCell>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {departments.map((department: any) => (
                            <TableRow key={department._id}>
                                <TableCell>{department.code}</TableCell>
                                <TableCell>{department.name}</TableCell>
                                <TableCell>{department.description}</TableCell>
                                <TableCell>
                                    {typeof department.manager === 'object' && department.manager !== null
                                        ? department.manager.fullName
                                        : department.manager || 'Chưa có'}
                                </TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleOpen(department)} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(department._id)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedDepartment ? 'Sửa phòng ban' : 'Thêm phòng ban mới'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            margin="normal"
                            id="code"
                            name="code"
                            label="Mã phòng ban"
                            value={formik.values.code}
                            onChange={formik.handleChange}
                            error={formik.touched.code && Boolean(formik.errors.code)}
                            helperText={formik.touched.code && formik.errors.code}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            id="name"
                            name="name"
                            label="Tên phòng ban"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            error={formik.touched.name && Boolean(formik.errors.name)}
                            helperText={formik.touched.name && formik.errors.name}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            id="description"
                            name="description"
                            label="Mô tả"
                            multiline
                            rows={3}
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            error={formik.touched.description && Boolean(formik.errors.description)}
                            helperText={formik.touched.description && formik.errors.description}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            id="manager"
                            name="manager"
                            label="Quản lý"
                            value={formik.values.manager}
                            onChange={formik.handleChange}
                            error={formik.touched.manager && Boolean(formik.errors.manager)}
                            helperText={formik.touched.manager && formik.errors.manager}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Hủy</Button>
                    <Button
                        onClick={() => formik.handleSubmit()}
                        variant="contained"
                        disabled={createMutation.isPending || updateMutation.isPending}
                    >
                        {createMutation.isPending || updateMutation.isPending
                            ? 'Đang lưu...'
                            : selectedDepartment
                                ? 'Cập nhật'
                                : 'Thêm mới'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Departments; 