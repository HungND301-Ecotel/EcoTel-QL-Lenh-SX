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
import { Job, Position } from '../../types';

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên chức danh'),
    description: yup.string(),
});

const Positions: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
    const [value, setValue] = useState("")
    const queryClient = useQueryClient();

    const { data: jobs = [], isLoading } = useQuery({
        queryKey: ['positions', value],
        queryFn: () => api.get(`/positions?name=${value}`).then(res => res.data.data),
    });


    const createMutation = useMutation({
        mutationFn: (newJob: Partial<Position>) =>
            api.post('/positions', newJob).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedPosition: Partial<Position>) =>
            api.put(`/positions/${updatedPosition._id}`, updatedPosition).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/positions/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            name: '',
            description: ''
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            if (selectedPosition) {
                updateMutation.mutate({ ...values, _id: selectedPosition._id });
            } else {
                createMutation.mutate({ ...values, });
            }
        },
    });

    const handleOpen = (position?: Position) => {
        if (position) {
            setSelectedPosition(position);
            formik.setValues({
                ...position,
                description: position.description ?? ''
            });
        } else {
            setSelectedPosition(null);
            formik.resetForm();
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedPosition(null);
        formik.resetForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
            deleteMutation.mutate(id);
        }
    };


    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý chức danh, nghề nghiệp</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    Thêm chức danh
                </Button>
            </Box>
            <Box sx={{ flex: 1, flexDirection: 'column' }}>
                <Typography><h3>Tìm kiếm</h3></Typography>
                <TextField fullWidth size="small" value={value}
                    placeholder='Tìm kiếm theo tên chức danh'
                    onChange={(e) => setValue(e.target.value)}>
                </TextField>
            </Box>
            <TableContainer component={Paper} sx={{ maxHeight: '80vh' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ border: '1px solid black' }}>Tên chức danh, nghề nghiệp</TableCell>
                            <TableCell sx={{ border: '1px solid black' }}>Mô tả</TableCell>
                            <TableCell sx={{ border: '1px solid black' }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    {!isLoading ? <TableBody>
                        {jobs.map((job: any) => (
                            <TableRow key={job._id}>
                                <TableCell sx={{ border: '1px solid black' }}>{job.name}</TableCell>
                                <TableCell sx={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: 400,
                                    border: '1px solid black'
                                }}>{job.content}</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>
                                    <IconButton color="primary" onClick={() => handleOpen(job)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(job._id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody> : <Typography>Loading...</Typography>}
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{selectedPosition ? 'Sửa công việc' : 'Thêm công việc'}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                id="name"
                                name="name"
                                label="Tên chức danh"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                            />
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                id="description"
                                name="description"
                                label="Mô tả"
                                value={formik.values.description}
                                onChange={formik.handleChange}
                                error={formik.touched.description && Boolean(formik.errors.description)}
                                helperText={formik.touched.description && formik.errors.description}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Hủy</Button>
                    <Button onClick={() => formik.submitForm()} variant="contained">
                        {selectedPosition ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Positions;
