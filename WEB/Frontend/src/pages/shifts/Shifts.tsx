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
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Shift } from '../../types';

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên ca'),
    date: yup.string().required('Vui lòng chọn ngày').matches(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ'),
    startTime: yup.string().required('Vui lòng nhập giờ bắt đầu'),
    endTime: yup.string().required('Vui lòng nhập giờ kết thúc'),
    department: yup.string().required('Vui lòng chọn phòng ban'),
});

const Shifts: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const queryClient = useQueryClient();

    const { data: shifts=[], isLoading } = useQuery({
        queryKey: ['shifts'],
        queryFn: () => api.get('/shifts').then(res => res.data.data),
    });

    const { data: departments=[] } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data.data),
    });


    const createMutation = useMutation({
        mutationFn: (newShift: Partial<Shift>) =>
            api.post('/shifts', newShift).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            handleClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (updatedShift: Partial<Shift>) =>
            api.put(`/shifts/${updatedShift._id}`, updatedShift).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            handleClose();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/shifts/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
        },
    });

    const formik = useFormik({
        initialValues: {
            name: '',
            date: '',
            startTime: '',
            endTime: '',
            department: '',
            ...selectedShift,
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            if (selectedShift) {
                updateMutation.mutate({ ...values, _id: selectedShift._id });
            } else {
                createMutation.mutate(values);
            }
        },
    });

    const handleOpen = (shift?: Shift) => {
        if (shift) {
            setSelectedShift(shift);
            formik.setValues({
                name: shift.name || '',
                date: (shift as any).date || '',
                startTime: shift.startTime || '',
                endTime: shift.endTime || '',
                department: shift.department || '',
                _id: shift._id,
                createdAt: shift.createdAt,
                updatedAt: shift.updatedAt,
            });
        } else {
            setSelectedShift(null);
            formik.resetForm();
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedShift(null);
        formik.resetForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa ca làm việc này?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý ca làm việc</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Thêm ca làm việc
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tên ca</TableCell>
                            <TableCell>Giờ bắt đầu</TableCell>
                            <TableCell>Giờ kết thúc</TableCell>
                            <TableCell>Phòng ban</TableCell>
                            <TableCell>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {shifts.map((shift: any) => (
                            <TableRow key={shift._id}>
                                <TableCell>{shift.name}</TableCell>
                                <TableCell>{shift.startTime}</TableCell>
                                <TableCell>{shift.endTime}</TableCell>
                                <TableCell>
                                    {typeof shift.department === 'object' && shift.department !== null
                                        ? shift.department.name
                                        : departments?.find((dept: any) => dept._id === shift.department)?.name || 'Chưa có'}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleOpen(shift)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        onClick={() => handleDelete(shift._id)}
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
                    {selectedShift ? 'Sửa ca làm việc' : 'Thêm ca làm việc'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                id="name"
                                name="name"
                                label="Tên ca"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                            />
                            <TextField
                                fullWidth
                                id="date"
                                name="date"
                                label="Ngày"
                                type="date"
                                value={formik.values.date}
                                onChange={formik.handleChange}
                                error={formik.touched.date && Boolean(formik.errors.date)}
                                helperText={formik.touched.date && formik.errors.date}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                            <TextField
                                fullWidth
                                id="startTime"
                                name="startTime"
                                label="Giờ bắt đầu"
                                type="time"
                                value={formik.values.startTime}
                                onChange={formik.handleChange}
                                error={formik.touched.startTime && Boolean(formik.errors.startTime)}
                                helperText={formik.touched.startTime && formik.errors.startTime}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                            <TextField
                                fullWidth
                                id="endTime"
                                name="endTime"
                                label="Giờ kết thúc"
                                type="time"
                                value={formik.values.endTime}
                                onChange={formik.handleChange}
                                error={formik.touched.endTime && Boolean(formik.errors.endTime)}
                                helperText={formik.touched.endTime && formik.errors.endTime}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                            <TextField
                                fullWidth
                                select
                                id="department"
                                name="department"
                                label="Phòng ban"
                                value={formik.values.department}
                                onChange={formik.handleChange}
                                error={formik.touched.department && Boolean(formik.errors.department)}
                                helperText={formik.touched.department && formik.errors.department}
                            >
                                <MenuItem value="">
                                    <em>Không có</em>
                                </MenuItem>
                                {departments?.map((dept: any) => (
                                    <MenuItem key={dept._id} value={dept._id}>
                                        {dept.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Hủy</Button>
                    <Button onClick={() => formik.handleSubmit()} variant="contained">
                        {selectedShift ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Shifts; 