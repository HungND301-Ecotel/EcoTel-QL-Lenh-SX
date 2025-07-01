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
import { Shift } from '../../types';
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const validationSchema = yup.object({
    name: yup.number().required('Vui lòng nhập ca làm việc'),
    startTime: yup.string().required('Vui lòng nhập thời gian bắt đầu'),
    endTime: yup.string().required('Vui lòng nhập thời gian kết thúc'),

});

const Shifts: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [value, setValue] = useState("")
    const queryClient = useQueryClient();

    const { data: shifts = [], isLoading } = useQuery({
        queryKey: ['shifts', value],
        queryFn: () => api.get(`/shifts?name=${value}`).then(res => res.data.data),
    });


    const createMutation = useMutation({
        mutationFn: (newShift: Partial<Shift>) =>
            api.post('/shifts', newShift).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedShift: Partial<Shift>) =>
            api.put(`/shifts/${updatedShift._id}`, updatedShift).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/shifts/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            name: undefined as number | undefined,
            startTime: '',
            endTime: '',
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
            formik.setValues(shift);
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

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý ca làm việc</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    Thêm ca làm việc
                </Button>
            </Box>
            <TableContainer component={Paper} sx={{ height: '80vh' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ border: '1px solid black' }}>Ca</TableCell>
                            <TableCell sx={{ border: '1px solid black' }}>Thời gian bắt đầu</TableCell>
                            <TableCell sx={{ border: '1px solid black' }}>Thời gian kết thúc</TableCell>
                            <TableCell sx={{ border: '1px solid black' }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!isLoading ? shifts.map((shift: Shift) => (
                            <TableRow key={shift._id}>
                                <TableCell sx={{ border: '1px solid black' }}>{shift.name}</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>{shift.startTime}</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>{shift.endTime}</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>
                                    <IconButton color="primary" onClick={() => handleOpen(shift)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(shift._id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        )) : <Typography>Loading...</Typography>}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{selectedShift ? 'Sửa ca làm việc' : 'Thêm ca làm việc'}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                type="number"
                                id="name"
                                name="name"
                                label="Ca làm việc"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                            />
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <TimePicker
                                    label="Bắt đầu"
                                    ampm={false}
                                    value={formik.values.startTime ? dayjs(formik.values.startTime, 'HH:mm') : null}
                                    onChange={(value) => {
                                        formik.setFieldValue('startTime', value?.format('HH:mm') || '');
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            size="small"
                                            error={formik.touched.startTime && Boolean(formik.errors.startTime)}
                                            helperText={formik.touched.startTime && formik.errors.startTime}
                                        />
                                    )}
                                />

                                <TimePicker
                                    label="Kết thúc"
                                    ampm={false}
                                    value={formik.values.endTime ? dayjs(formik.values.endTime, 'HH:mm') : null}
                                    onChange={(value) => {
                                        formik.setFieldValue('endTime', value?.format('HH:mm') || '');
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            size="small"
                                            error={formik.touched.endTime && Boolean(formik.errors.endTime)}
                                            helperText={formik.touched.endTime && formik.errors.endTime}
                                        />
                                    )}
                                />
                            </LocalizationProvider>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Hủy</Button>
                    <Button onClick={() => formik.submitForm()} variant="contained">
                        {selectedShift ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Shifts;
