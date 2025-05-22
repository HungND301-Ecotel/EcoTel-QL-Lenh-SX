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
import { PayRoll } from '../../types';

const validationSchema = yup.object({
    code: yup.string().required('Vui lòng nhập mã phiếu lương'),
    userId: yup.string().required('Vui lòng chọn nhân viên'),
    jobId: yup.string().required('Vui lòng chọn công việc'),
    baseSalary: yup.number().required('Vui lòng nhập lương cơ bản'),
    bonus: yup.number().optional(),
    allowance: yup.number().optional(),
    note: yup.string().optional(),
});

const Payroll: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<PayRoll | null>(null);
    const queryClient = useQueryClient();

    const { data: payrolls = [], isLoading } = useQuery({
        queryKey: ['payrolls'],
        queryFn: () => api.get('/payrolls').then(res => res.data.data),
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(res => res.data.data),
    });
    const { data: jobs = [] } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => api.get('/jobs').then(res => res.data.data),
    });

    const createMutation = useMutation({
        mutationFn: (newPayroll: Partial<PayRoll>) =>
            api.post('/payrolls', newPayroll).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payrolls'] });
            handleClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (updatedPayroll: Partial<PayRoll>) =>
            api.put(`/payrolls/${updatedPayroll._id}`, updatedPayroll).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payrolls'] });
            handleClose();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/payrolls/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payrolls'] });
        },
    });

    const formik = useFormik({
        initialValues: {
            code: '',
            userId: '',
            jobId: '',
            baseSalary: 0,
            bonus: 0,
            allowance: 0,
            note: '',
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            if (selectedPayroll) {
                updateMutation.mutate({ ...values, _id: selectedPayroll._id });
            } else {
                createMutation.mutate(values);
            }
        },
    });

    const handleOpen = (payroll?: PayRoll) => {
        if (payroll) {
            setSelectedPayroll(payroll);
            formik.setValues({
                code: payroll.code || '',
                userId: payroll.userId || '',
                jobId: payroll.jobId || '',
                baseSalary: Number(payroll.baseSalary || 0),
                bonus: Number(payroll.bonus || 0),
                allowance: Number(payroll.allowance || 0),
                note: payroll.note || '',
            });
        } else {
            setSelectedPayroll(null);
            formik.resetForm();
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedPayroll(null);
        formik.resetForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa thẻ lương này?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return <Typography>Đang tải...</Typography>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý thẻ lương</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    Thêm thẻ lương
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Mã</TableCell>
                            <TableCell>Nhân viên</TableCell>
                            <TableCell>Công việc</TableCell>
                            <TableCell>Lương cơ bản</TableCell>
                            <TableCell>Thưởng</TableCell>
                            <TableCell>Phụ cấp</TableCell>
                            <TableCell>Ghi chú</TableCell>
                            <TableCell>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payrolls.map((item: any) => (
                            <TableRow key={item._id}>
                                <TableCell>{item.code}</TableCell>
                                <TableCell>{item.userId?.fullName}</TableCell>
                                <TableCell>{item.jobId?.name}</TableCell>
                                <TableCell>{item.baseSalary.toLocaleString()}</TableCell>
                                <TableCell>{item.bonus.toLocaleString()}</TableCell>
                                <TableCell>{item.allowance.toLocaleString()}</TableCell>
                                <TableCell>{item.note}</TableCell>
                                <TableCell>
                                    <IconButton color="primary" onClick={() => handleOpen(item)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(item._id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{selectedPayroll ? 'Sửa thẻ lương' : 'Thêm thẻ lương'}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            id="code"
                            name="code"
                            label="Mã thẻ lương"
                            value={formik.values.code}
                            onChange={formik.handleChange}
                            error={formik.touched.code && Boolean(formik.errors.code)}
                            helperText={formik.touched.code && formik.errors.code}
                        />
                        <TextField
                            fullWidth
                            select
                            id="userId"
                            name="userId"
                            label="Nhân viên"
                            value={formik.values.userId}
                            onChange={formik.handleChange}
                            error={formik.touched.userId && Boolean(formik.errors.userId)}
                            helperText={formik.touched.userId && formik.errors.userId}
                        >
                            {users.map((user: any) => (
                                <MenuItem key={user._id} value={user._id}>
                                    {user.fullName}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth
                            select
                            id="jobId"
                            name="jobId"
                            label="Công việc"
                            value={formik.values.jobId}
                            onChange={formik.handleChange}
                            error={formik.touched.jobId && Boolean(formik.errors.jobId)}
                            helperText={formik.touched.jobId && formik.errors.jobId}
                        >
                            {jobs.map((job: any) => (
                                <MenuItem key={job._id} value={job._id}>
                                    {job.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth
                            id="baseSalary"
                            name="baseSalary"
                            label="Lương cơ bản"
                            type="number"
                            value={formik.values.baseSalary}
                            onChange={formik.handleChange}
                            error={formik.touched.baseSalary && Boolean(formik.errors.baseSalary)}
                            helperText={formik.touched.baseSalary && formik.errors.baseSalary}
                        />
                        <TextField
                            fullWidth
                            id="bonus"
                            name="bonus"
                            label="Thưởng"
                            type="number"
                            value={formik.values.bonus}
                            onChange={formik.handleChange}
                        />
                        <TextField
                            fullWidth
                            id="allowance"
                            name="allowance"
                            label="Phụ cấp"
                            type="number"
                            value={formik.values.allowance}
                            onChange={formik.handleChange}
                        />
                        <TextField
                            fullWidth
                            id="note"
                            name="note"
                            label="Ghi chú"
                            value={formik.values.note}
                            onChange={formik.handleChange}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Hủy</Button>
                    <Button onClick={() => formik.submitForm()} variant="contained">
                        {selectedPayroll ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Payroll;
