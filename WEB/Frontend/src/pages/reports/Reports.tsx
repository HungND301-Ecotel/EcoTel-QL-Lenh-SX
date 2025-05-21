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
import { Report } from '../../types';

const validationSchema = yup.object({
    title: yup.string().required('Vui lòng nhập tiêu đề'),
    type: yup.string().required('Vui lòng chọn loại báo cáo'),
    content: yup.string().required('Vui lòng nhập nội dung'),
    department: yup.string().required('Vui lòng chọn phòng ban'),
    startDate: yup.string().required('Vui lòng chọn ngày bắt đầu'),
    endDate: yup.string().required('Vui lòng chọn ngày kết thúc'),
});

const reportTypes = [
    { value: 'daily', label: 'Báo cáo ngày' },
    { value: 'weekly', label: 'Báo cáo tuần' },
    { value: 'monthly', label: 'Báo cáo tháng' },
];

const Reports: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const queryClient = useQueryClient();

    const { data: reportsRaw } = useQuery({
        queryKey: ['reports'],
        queryFn: () => api.get('/reports').then(res => res.data),
    });
    const reports = React.useMemo(() => {
        if (!reportsRaw) return [];
        if (Array.isArray(reportsRaw)) return reportsRaw;
        if (reportsRaw.data && Array.isArray(reportsRaw.data.reports)) return reportsRaw.data.reports;
        if (reportsRaw.data && Array.isArray(reportsRaw.data)) return reportsRaw.data;
        return [];
    }, [reportsRaw]);

    const { data: departmentsRaw } = useQuery({
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
        mutationFn: (newReport: Partial<Report>) =>
            api.post('/reports', newReport).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            handleClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (updatedReport: Partial<Report>) =>
            api.put(`/reports/${updatedReport._id}`, updatedReport).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            handleClose();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/reports/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
        },
    });

    const formik = useFormik({
        initialValues: {
            title: '',
            type: '',
            content: '',
            department: '',
            startDate: '',
            endDate: '',
            ...selectedReport,
        } as Partial<Report>,
        validationSchema: validationSchema,
        onSubmit: (values) => {
            const submitValues = {
                ...values,
                period: JSON.stringify({
                    startDate: values.startDate,
                    endDate: values.endDate
                }),
                content: JSON.stringify({ summary: values.content || '' }),
            };
            if (selectedReport) {
                updateMutation.mutate({ ...submitValues, _id: selectedReport._id });
            } else {
                createMutation.mutate(submitValues);
            }
        },
    });

    const handleOpen = (report?: Report) => {
        if (report) {
            setSelectedReport(report);
            formik.setValues(report);
        } else {
            setSelectedReport(null);
            formik.resetForm();
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedReport(null);
        formik.resetForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý báo cáo</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Thêm báo cáo
                </Button>
            </Box>
            {!reports.length ? (
                <Typography>Loading...</Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Tiêu đề</TableCell>
                                <TableCell>Loại báo cáo</TableCell>
                                <TableCell>Phòng ban</TableCell>
                                <TableCell>Ngày tạo</TableCell>
                                <TableCell>Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reports.map((report: any) => (
                                <TableRow key={report._id}>
                                    <TableCell>{report.title}</TableCell>
                                    <TableCell>
                                        {reportTypes.find(type => type.value === report.type)?.label}
                                    </TableCell>
                                    <TableCell>
                                        {
                                            typeof report.department === 'object' && report.department !== null
                                                ? report.department.name
                                                : departments.find((dept: any) => dept._id === report.department)?.name || 'Chưa có'
                                        }
                                    </TableCell>
                                    <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleOpen(report)}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDelete(report._id)}
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
                    {selectedReport ? 'Sửa báo cáo' : 'Thêm báo cáo'}
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
                                label="Loại báo cáo"
                                value={formik.values.type}
                                onChange={formik.handleChange}
                                error={formik.touched.type && Boolean(formik.errors.type)}
                                helperText={formik.touched.type && formik.errors.type}
                            >
                                {reportTypes.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
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
                                {departments.map((dept: any) => (
                                    <MenuItem key={dept._id} value={dept._id}>
                                        {dept.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                fullWidth
                                id="startDate"
                                name="startDate"
                                label="Ngày bắt đầu"
                                type="date"
                                value={formik.values.startDate || ''}
                                onChange={formik.handleChange}
                                error={formik.touched.startDate && Boolean(formik.errors.startDate)}
                                helperText={formik.touched.startDate && formik.errors.startDate}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                fullWidth
                                id="endDate"
                                name="endDate"
                                label="Ngày kết thúc"
                                type="date"
                                value={formik.values.endDate || ''}
                                onChange={formik.handleChange}
                                error={formik.touched.endDate && Boolean(formik.errors.endDate)}
                                helperText={formik.touched.endDate && formik.errors.endDate}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                fullWidth
                                multiline
                                rows={6}
                                id="content"
                                name="content"
                                label="Nội dung"
                                value={formik.values.content}
                                onChange={formik.handleChange}
                                error={formik.touched.content && Boolean(formik.errors.content)}
                                helperText={formik.touched.content && formik.errors.content}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Hủy</Button>
                    <Button onClick={() => formik.handleSubmit()} variant="contained">
                        {selectedReport ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Reports; 