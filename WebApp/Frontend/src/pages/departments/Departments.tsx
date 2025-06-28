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
    MenuItem,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api.config';

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên đơn vị'),
    code: yup.string().required('Vui lòng nhập mã đơn vị'),
    description: yup.string(),
});

const Departments = () => {
    const [open, setOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
    const [value, setValue] = useState("")
    const queryClient = useQueryClient();

    const { data: departments = [], isLoading } = useQuery({
        queryKey: ['departments', value],
        queryFn: () => api.get(`/departments?code=${value}`).then(res => res.data.data),
    });


    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/departments', data).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.put(`/departments/${selectedDepartment?._id}`, data).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/departments/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            name: '',
            code: '',
            description: '',
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
        if (window.confirm('Bạn có chắc chắn muốn xóa đơn vị này?')) {
            deleteMutation.mutate(id);
        }
    };


    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý đơn vị</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Thêm đơn vị
                </Button>
            </Box>
            <Box sx={{ flex: 1, flexDirection: 'column' }}>
                <Typography><h3>Tìm kiếm</h3></Typography>
                <TextField fullWidth size="small" value={value}
                    placeholder='Tìm kiếm theo mã đơn vị'
                    onChange={(e) => setValue(e.target.value)}>
                </TextField>
            </Box>
            <TableContainer component={Paper} sx={{ maxHeight: '80vh' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ border: '1px solid black' }}>Mã đơn vị</TableCell>
                            <TableCell sx={{ border: '1px solid black' }}>Tên đơn vị</TableCell>
                            <TableCell sx={{ border: '1px solid black' }}>Mô tả</TableCell>
                            <TableCell sx={{ border: '1px solid black' }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    {!isLoading ? <TableBody>
                        {departments.map((department: any) => (
                            <TableRow key={department._id}>
                                <TableCell sx={{ border: '1px solid black' }}>{department.code}</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>{department.name}</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>{department.description}</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>
                                    <IconButton onClick={() => handleOpen(department)} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(department._id)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody> : <Typography>Loading...</Typography>}
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedDepartment ? 'Sửa đơn vị' : 'Thêm đơn vị mới'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            margin="normal"
                            id="code"
                            name="code"
                            label="Mã đơn vị"
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
                            label="Tên đơn vị"
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