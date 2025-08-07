import React, { useMemo, useState } from 'react';
import { FieldArray, FormikProvider, useFormik } from 'formik';
import * as yup from 'yup';
import {
    Autocomplete,
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    MenuItem,
    Popper,
    styled,
    TextField,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../config/api.config';
import { Order, Device, Job, Location, Material, SafetyMeasure, Shift } from '../../types';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);


const StyledPopper = styled(Popper)({
    '& .MuiAutocomplete-listbox': {
        maxHeight: '200px', // Đặt chiều cao tối đa mong muốn
        overflowY: 'auto', // Thêm thanh cuộn khi nội dung vượt quá chiều cao
    },
});

const validationSchema = yup.object({
    assignedTo: yup.string().required('Vui lòng chọn thẻ lương'),
    device: yup.array(),
    job: yup.string().required('Vui lòng chọn loại công việc'),
    workingDate: yup.string().required('Vui lòng chọn ngày làm việc'),
    shift: yup.string().required('Vui lòng chọn ca làm việc'),
    workContent: yup.string().required('Vui lòng nhập nội dung'),
});

interface OrderFormProps {
    initialValues: any;
    onSubmit: (values: Partial<Order>) => void;
    onCancel: () => void;
}

const OrderFormEdit: React.FC<OrderFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
}) => {

    const { data: locations = [] } = useQuery({
        queryKey: ['locations'],
        queryFn: () => api.get('/locations').then(res => res.data.data),
    });
    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(res => res.data.data),
    });
    const { data: shifts = [] } = useQuery({
        queryKey: ['shifts'],
        queryFn: () => api.get('/shifts').then(res => res.data.data),
    });
    const { data: devices = [] } = useQuery({
        queryKey: ['devices'],
        queryFn: () => api.get('/devices').then(res => res.data.data),
    });
    const { data: excavators = [] } = useQuery({
        queryKey: ['excavators'],
        queryFn: () => api.get('/devices/excavators/all').then(res => res.data.data),
    });
    const { data: materials = [] } = useQuery({
        queryKey: ['materials'],
        queryFn: () => api.get('/materials').then(res => res.data.data),
    });

    const { data: safetyMeasures = [] } = useQuery({
        queryKey: ['safetyMeasures'],
        queryFn: () => api.get('/safetyMeasures').then(res => res.data.data),
    });
    const { data: jobs = [] } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => api.get('/jobs').then(res => res.data.data),
    });

    const formik = useFormik({
        initialValues: {
            assignedTo: typeof initialValues.assignedTo === 'object'
                ? initialValues.assignedTo._id
                : initialValues.assignedTo || '',
            device: Array.isArray(initialValues.device)
                ? initialValues.device.map((d: any) => typeof d === 'object' ? d._id : d)
                : initialValues.device
                    ? [typeof initialValues.device === 'object' ? initialValues.device._id : initialValues.device]
                    : [],
            job: initialValues.job !== null && typeof initialValues.job === 'object'
                ? initialValues.job._id
                : initialValues.job || '',
            workingDate: initialValues.workingDate
                ? dayjs(initialValues.workingDate).startOf('day').toDate()
                : '',
            shift: initialValues.shift !== null && typeof initialValues.shift === 'object'
                ? initialValues.shift._id
                : initialValues.shift || '',
            safetyMeasure: initialValues.safetyMeasure !== null && typeof initialValues.safetyMeasure === 'object'
                ? initialValues.safetyMeasure._id
                : initialValues.safetyMeasure || undefined,
            excavator: Array.isArray(initialValues.excavator)
                ? initialValues.excavator.map((d: any) => typeof d === 'object' ? d._id : d)
                : initialValues.excavator
                    ? [typeof initialValues.excavator === 'object' ? initialValues.excavator._id : initialValues.excavator]
                    : [],
            distance: initialValues.distance,
            liftHeight: initialValues.liftHeight,
            location: initialValues.location !== null && typeof initialValues.location === 'object'
                ? initialValues.location._id
                : initialValues.location || undefined,
            material: initialValues.material !== null && typeof initialValues.material === 'object'
                ? initialValues.material._id
                : initialValues.material || undefined,
            workContent: initialValues.workContent || '',
            status: initialValues.status,
            note: initialValues.note || ''
        },
        validationSchema,
        onSubmit: (values) => {
            const order: Partial<Order> = {
                assignedTo: values.assignedTo,
                device: values.device,
                job: values.job,
                workingDate: dayjs.utc(dayjs(values.workingDate).format('YYYY-MM-DD')).toDate(),
                shift: values.shift,
                excavator: values.excavator,
                distance: values.distance,
                liftHeight: values.liftHeight,
                location: values.location,
                material: values.material,
                workContent: values.workContent,
                safetyMeasure: values.safetyMeasure,
                status: "pending",
                temporaryError: '',
                note: values.note
            };
            onSubmit(order);
        },
    });

    const initialDeviceIds = useMemo(() => {
        return Array.isArray(initialValues.device)
            ? initialValues.device.map((d: any) => typeof d === 'object' ? d._id : d)
            : [];
    }, [initialValues.device]);

    const initialExcavatorIds = useMemo(() => {
        return Array.isArray(initialValues.excavator)
            ? initialValues.excavator.map((d: any) => typeof d === 'object' ? d._id : d)
            : [];
    }, [initialValues.excavator]);


    return (

                <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Autocomplete
                                fullWidth
                                options={users}
                                getOptionLabel={(option: any) =>
                                    `${option.fullName || ''} - ${option.salaryCode || ''}`
                                }
                                value={users.find((p: any) => p._id === formik.values.assignedTo) || null}
                                onChange={(event, newValue) => {
                                    formik.setFieldValue(`assignedTo`, newValue?._id || '');
                                }}
                                PopperComponent={StyledPopper}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Thẻ lương"
                                        error={formik.touched.assignedTo && Boolean(formik.errors.assignedTo)}
                                        helperText={formik.touched.assignedTo && typeof formik.errors.assignedTo === 'string' ? formik.errors.assignedTo : ''}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <Autocomplete
                                fullWidth
                                multiple
                                options={devices}
                                getOptionLabel={(option: any) =>
                                    option.code || ''
                                }
                                value={devices.filter((d: any) =>
                                    formik.values.device.includes(d._id)
                                )}
                                onChange={(event, newValue) => {
                                    const selectedIds = newValue.map((item: any) => item._id);
                                    const hasDeletedInitial = initialDeviceIds.some((id: String) => !selectedIds.includes(id));
                                    if (hasDeletedInitial) {
                                        return;
                                    }
                                    if (formik.values.excavator?.length > 1 && selectedIds.length > 1) {
                                        alert('Chỉ nên bổ sung phương tiện khi chỉ có một máy xúc.');
                                        return;
                                    }
                                    formik.setFieldValue('device', selectedIds);
                                }}
                                PopperComponent={StyledPopper}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Phương tiện"
                                        error={formik.touched.device && Boolean(formik.errors.device)}
                                        helperText={formik.touched.device && typeof formik.errors.device === 'string' ? formik.errors.device : ''}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                fullWidth
                                options={jobs}
                                getOptionLabel={(option: Job) =>
                                    option.name || ''
                                }
                                value={jobs.find((p: any) => p._id === formik.values.job) || null}
                                onChange={(event, newValue) => {
                                    formik.setFieldValue('job', newValue?._id || '');
                                }}
                                PopperComponent={StyledPopper}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Công việc"
                                        error={formik.touched.job && Boolean(formik.errors.job)}
                                        helperText={formik.touched.job && typeof formik.errors.job === 'string' ? formik.errors.job : ''}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Ngày làm việc"
                                    inputFormat="DD/MM/YYYY" // v5 vẫn hỗ trợ
                                    value={formik.values.workingDate ? dayjs(formik.values.workingDate) : null}
                                    onChange={(value) => {
                                        formik.setFieldValue('workingDate', value ? value : '');
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            error={formik.touched.workingDate && Boolean(formik.errors.workingDate)}
                                            helperText={
                                                formik.touched.workingDate && typeof formik.errors.workingDate === 'string'
                                                    ? formik.errors.workingDate
                                                    : ''
                                            }
                                        />
                                    )}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                id="shift"
                                name="shift"
                                label="Ca làm việc"
                                value={formik.values.shift}
                                onChange={formik.handleChange}
                                error={formik.touched.shift && Boolean(formik.errors.shift)}
                                helperText={formik.touched.shift && typeof formik.errors.shift === 'string'
                                    ? formik.errors.shift
                                    : ''}
                            >
                                {shifts.map((shift: Shift) => (
                                    <MenuItem key={shift._id} value={shift._id}>Ca {shift.name} ({shift.startTime})</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                fullWidth
                                multiple // 👈 Cho phép chọn nhiều
                                options={excavators}
                                getOptionLabel={(option: Device) => option.code || ''}
                                value={excavators.filter((p: any) => formik.values.excavator?.includes(p._id))}
                                onChange={(event, newValue) => {
                                    const selectedIds = newValue.map((item: any) => item._id);
                                    const hasDeletedInitial = initialExcavatorIds.some((id: String) => !selectedIds.includes(id));
                                    if (hasDeletedInitial) {
                                        return;
                                    }
                                    if (formik.values.device.length > 1 && selectedIds.length > 1) {
                                        alert('Chỉ nên bổ sung máy xúc khi chỉ có một phương tiện.');
                                        return;
                                    }
                                    formik.setFieldValue('excavator', selectedIds);
                                }}
                                PopperComponent={StyledPopper}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Máy xúc"
                                        error={formik.touched.excavator && Boolean(formik.errors.excavator)}
                                        helperText={
                                            formik.touched.excavator && typeof formik.errors.excavator === 'string'
                                                ? formik.errors.excavator
                                                : ''
                                        }
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="distance"
                                name="distance"
                                label="Cung độ"
                                type="number"
                                value={formik.values.distance}
                                onChange={formik.handleChange}
                                error={formik.touched.distance && Boolean(formik.errors.distance)}
                                helperText={formik.touched.distance && typeof formik.errors.distance === 'number'
                                    ? formik.errors.distance
                                    : ''}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="liftHeight"
                                name="liftHeight"
                                type="number"
                                label="Chiều cao nâng tải"
                                value={formik.values.liftHeight}
                                onChange={formik.handleChange}
                                error={formik.touched.liftHeight && Boolean(formik.errors.liftHeight)}
                                helperText={formik.touched.liftHeight && typeof formik.errors.liftHeight === 'number'
                                    ? formik.errors.liftHeight
                                    : ''}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                fullWidth
                                options={locations}
                                getOptionLabel={(option: Location) =>
                                    option.name || ''
                                }
                                value={locations.find((p: any) => p._id === formik.values.location) || null}
                                onChange={(event, newValue) => {
                                    formik.setFieldValue('location', newValue?._id || '');
                                }}
                                PopperComponent={StyledPopper}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Điểm đổ"
                                        error={formik.touched.location && Boolean(formik.errors.location)}
                                        helperText={formik.touched.location && typeof formik.errors.location === 'string' ? formik.errors.location : ''}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                fullWidth
                                options={materials}
                                getOptionLabel={(option: Material) =>
                                    option.name || ''
                                }
                                value={materials.find((p: any) => p._id === formik.values.material) || null}
                                onChange={(event, newValue) => {
                                    formik.setFieldValue('material', newValue?._id || '');
                                }}
                                PopperComponent={StyledPopper}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Loại vật liệu"
                                        error={formik.touched.material && Boolean(formik.errors.material)}
                                        helperText={formik.touched.material && typeof formik.errors.material === 'string' ? formik.errors.material : ''}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={5}
                                id="workContent"
                                name="workContent"
                                label="Nội dung công việc"
                                value={formik.values.workContent}
                                onChange={formik.handleChange}
                                error={formik.touched.workContent && Boolean(formik.errors.workContent)}
                                helperText={formik.touched.workContent && typeof formik.errors.workContent === 'string'
                                    ? formik.errors.workContent
                                    : ''}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={5}
                                id="note"
                                name="note"
                                label="Nội dung bàn giao ca trước"
                                value={formik.values.note}
                                onChange={formik.handleChange}
                                error={formik.touched.note && Boolean(formik.errors.note)}
                                helperText={formik.touched.note && typeof formik.errors.note === 'string'
                                    ? formik.errors.note
                                    : ''}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Autocomplete
                                fullWidth
                                options={safetyMeasures}
                                getOptionLabel={(option: SafetyMeasure) =>
                                    option.content || ''
                                }
                                value={safetyMeasures.find((p: any) => p._id === formik.values.safetyMeasure) || null}
                                onChange={(event, newValue) => {
                                    formik.setFieldValue('safetyMeasure', newValue?._id || '');
                                }}
                                PopperComponent={StyledPopper}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Biện pháp an toàn"
                                        error={formik.touched.safetyMeasure && Boolean(formik.errors.safetyMeasure)}
                                        helperText={formik.touched.safetyMeasure && typeof formik.errors.safetyMeasure === 'string' ? formik.errors.safetyMeasure : ''}
                                    />
                                )}
                            />

                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button variant="outlined" onClick={onCancel}>
                            Hủy
                        </Button>
                        <Button type="submit" variant="contained">
                            Cập nhật
                        </Button>
                    </Box>
                </Box >

    );
};

export default OrderFormEdit;
