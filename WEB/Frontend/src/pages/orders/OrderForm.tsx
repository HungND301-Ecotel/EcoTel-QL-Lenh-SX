import React from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
    Box,
    Button,
    Grid,
    MenuItem,
    TextField,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../config/api.config';
import { Order, Shift, Device, User } from '../../types';

const validationSchema = yup.object({
    salarycardId: yup.string().required('Vui lòng chọn thẻ lương'),
    jobId: yup.string().required('Vui lòng chọn công việc'),
    workDate: yup.string().required('Vui lòng chọn ngày'),
    workHour: yup.string().required('Vui lòng chọn giờ'),
    excavator: yup.string(),
    vehicle: yup.string(),
    dumpPoint: yup.string(),
    material: yup.string(),
    content: yup.string(),
});

interface OrderFormProps {
    initialValues: Partial<Order>;
    onSubmit: (values: Partial<Order>) => void;
    onCancel: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
}) => {
    const { data: shifts = [] } = useQuery({
        queryKey: ['shifts'],
        queryFn: () => api.get('/shifts').then(res => res.data.data?.shifts || []),
    });

    const { data: devices = [] } = useQuery({
        queryKey: ['devices'],
        queryFn: () => api.get('/devices').then(res => res.data.data?.devices || []),
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(res => res.data.data?.users || []),
    });

    const formik = useFormik({
        initialValues: {
            salarycardId: '',
            jobId: '',
            workDate: '',
            workHour: '',
            excavator: '',
            vehicle: '',
            dumpPoint: '',
            material: '',
            content: '',
            ...initialValues,
        },
        validationSchema,
        onSubmit,
    });

    return (
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        select
                        id="salarycardId"
                        name="salarycardId"
                        label="Thẻ lương"
                        value={formik.values.salarycardId}
                        onChange={formik.handleChange}
                        error={formik.touched.salarycardId && Boolean(formik.errors.salarycardId)}
                        helperText={formik.touched.salarycardId && formik.errors.salarycardId}
                    >
                        {users.map((user: User) => (
                            <MenuItem key={user._id} value={user._id}>
                                {user.fullName}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
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
                        {shifts.map((shift: Shift) => (
                            <MenuItem key={shift._id} value={shift._id}>
                                {shift.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        id="workDate"
                        name="workDate"
                        label="Ngày làm việc"
                        type="date"
                        value={formik.values.workDate}
                        onChange={formik.handleChange}
                        InputLabelProps={{ shrink: true }}
                        error={formik.touched.workDate && Boolean(formik.errors.workDate)}
                        helperText={formik.touched.workDate && formik.errors.workDate}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        id="workHour"
                        name="workHour"
                        label="Giờ làm việc"
                        type="time"
                        value={formik.values.workHour}
                        onChange={formik.handleChange}
                        InputLabelProps={{ shrink: true }}
                        error={formik.touched.workHour && Boolean(formik.errors.workHour)}
                        helperText={formik.touched.workHour && formik.errors.workHour}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        select
                        id="excavator"
                        name="excavator"
                        label="Máy xúc"
                        value={formik.values.excavator}
                        onChange={formik.handleChange}
                    >
                        {devices.map((device: Device) => (
                            <MenuItem key={device._id} value={device._id}>
                                {device.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        select
                        id="vehicle"
                        name="vehicle"
                        label="Phương tiện"
                        value={formik.values.vehicle}
                        onChange={formik.handleChange}
                    >
                        {devices.map((device: Device) => (
                            <MenuItem key={device._id} value={device._id}>
                                {device.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        select
                        id="dumpPoint"
                        name="dumpPoint"
                        label="Điểm đổ"
                        value={formik.values.dumpPoint}
                        onChange={formik.handleChange}
                    >
                        {devices.map((device: Device) => (
                            <MenuItem key={device._id} value={device._id}>
                                {device.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        select
                        id="material"
                        name="material"
                        label="Loại hàng"
                        value={formik.values.material}
                        onChange={formik.handleChange}
                    >
                        {devices.map((device: Device) => (
                            <MenuItem key={device._id} value={device._id}>
                                {device.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        id="content"
                        name="content"
                        label="Nội dung công việc"
                        value={formik.values.content}
                        onChange={formik.handleChange}
                    />
                </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" onClick={onCancel}>
                    Hủy
                </Button>
                <Button type="submit" variant="contained">
                    {initialValues._id ? 'Cập nhật' : 'Thêm mới'}
                </Button>
            </Box>
        </Box>
    );
};

export default OrderForm;
