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
import { Job } from '../../types';

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên công việc'),
    type: yup
        .string()
        .oneOf(['vehicle', 'drilling', 'service', 'grading', 'excavation', 'other'])
        .required('Vui lòng chọn loại công việc'),
});

const Jobs: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const queryClient = useQueryClient();

    const { data: jobs=[], isLoading } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => api.get('/jobs').then(res => res.data.data),
    });


    const createMutation = useMutation({
        mutationFn: (newJob: Partial<Job>) =>
            api.post('/jobs', newJob).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            handleClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (updatedJob: Partial<Job>) =>
            api.put(`/jobs/${updatedJob._id}`, updatedJob).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            handleClose();
        },
        onError: (error) => {
            console.error('Lỗi khi cập nhật:', error);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/jobs/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
    });

    const formik = useFormik({
        initialValues: {
            name: '',
            type: '',
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            if (selectedJob) {
                updateMutation.mutate({ ...values, _id: selectedJob._id, type: values.type as Job['type'] });
            } else {
                createMutation.mutate({ ...values, type: values.type as Job['type'] });
            }
        },
    });

    const handleOpen = (job?: Job) => {
        if (job) {
            setSelectedJob(job);
            formik.setValues(job);
        } else {
            setSelectedJob(null);
            formik.resetForm();
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedJob(null);
        formik.resetForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý công việc</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    Thêm công việc
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tên công việc</TableCell>
                            <TableCell>Loại công việc</TableCell>
                            <TableCell>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {jobs.map((job: any) => (
                            <TableRow key={job._id}>
                                <TableCell>{job.name}</TableCell>
                                <TableCell>{job.type}</TableCell>
                                <TableCell>
                                    <IconButton color="primary" onClick={() => handleOpen(job)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(job._id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{selectedJob ? 'Sửa công việc' : 'Thêm công việc'}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                id="name"
                                name="name"
                                label="Tên công việc"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                            />
                            <TextField
                                fullWidth
                                select
                                id="type"
                                name="type"
                                label="Loại công việc"
                                value={formik.values.type}
                                onChange={formik.handleChange}
                                error={formik.touched.type && Boolean(formik.errors.type)}
                                helperText={formik.touched.type && formik.errors.type}
                            >
                                <MenuItem value="vehicle">Vận hành xe</MenuItem>
                                <MenuItem value="drilling">Vận hành khoan</MenuItem>
                                <MenuItem value="service">Vận hành xe phục vụ</MenuItem>
                                <MenuItem value="grading">Vận hành gạt</MenuItem>
                                <MenuItem value="excavation">Vận hành xúc</MenuItem>
                                <MenuItem value="other">Khác</MenuItem>
                            </TextField>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Hủy</Button>
                    <Button onClick={() => formik.submitForm()} variant="contained">
                        {selectedJob ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Jobs;
