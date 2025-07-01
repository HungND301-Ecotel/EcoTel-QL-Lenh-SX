import React, { useState } from 'react';
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
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

const StyledPopper = styled(Popper)({
    '& .MuiAutocomplete-listbox': {
        maxHeight: '300px', // Đặt chiều cao tối đa mong muốn
        overflowY: 'auto', // Thêm thanh cuộn khi nội dung vượt quá chiều cao
    },
});

const validationSchema = yup.object({
    usersAndDevices: yup.array().of(
        yup.object().shape({
            assignedTo: yup.string().required('Vui lòng chọn thẻ lương'),
            device: yup.array(),
        })
    ),
    job: yup.string().required('Vui lòng chọn loại công việc'),
    workingDate: yup.string().required('Vui lòng chọn ngày làm việc'),
    shift: yup.string().required('Vui lòng chọn ca làm việc'),
    workContent: yup.string().required('Vui lòng nhập nội dung'),
});

interface OrderFormProps {
    open: boolean;
    onSubmit: (values: Partial<Order>) => void;
    onCancel: () => void;
}

const OrderFormAdd: React.FC<OrderFormProps> = ({
    open,
    onSubmit,
    onCancel,
}) => {

    const { data: safetyMeasures = [] } = useQuery({
        queryKey: ['safetyMeasures'],
        queryFn: () => api.get('/safetyMeasures').then(res => res.data.data),
    });
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

    const { data: jobs = [] } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => api.get('/jobs').then(res => res.data.data),
    });


    const formik = useFormik({
        initialValues: {
            usersAndDevices: [
                {
                    assignedTo: "",
                    device: [],
                },
            ],
            job: '',
            workingDate: '',
            shift: '',
            excavator: [],
            location: undefined,
            material: undefined,
            distance: undefined,
            liftHeight: undefined,
            workContent: '',
            note: '',
            safetyMeasure: ''
        },
        validationSchema,
        onSubmit: (values) => {
            const orders: Partial<Order>[] = values.usersAndDevices.map(item => ({
                assignedTo: item.assignedTo,
                device: item.device,
                job: values.job,
                workingDate: dayjs.utc(dayjs(values.workingDate).format('YYYY-MM-DD')).toDate(),
                excavator: values.excavator,
                shift: values.shift,
                location: values.location,
                material: values.material,
                distance: values.distance,
                liftHeight: values.liftHeight,
                workContent: values.workContent,
                safetyMeasure: values.safetyMeasure,
                note: values.note,
            }));
            orders.forEach(order => onSubmit(order));
        },
    });


    return (
        <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
            <DialogTitle>
                Thêm lệnh sản xuất
            </DialogTitle>
            <DialogContent>
                <FormikProvider value={formik}>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <FieldArray name="usersAndDevices">
                            {({ push, remove }) => (
                                <>
                                    {formik.values.usersAndDevices.map((item, index) => (
                                        <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2 }}>
                                            <Grid item xs={5}>
                                                <Autocomplete
                                                    fullWidth
                                                    options={users}
                                                    getOptionLabel={(option: any) =>
                                                        `${option.salaryCode} - ${option.fullName || ''}`
                                                    }
                                                    value={users.find((p: any) => p._id === item.assignedTo) || null}
                                                    onChange={(event, newValue) => {
                                                        formik.setFieldValue(`usersAndDevices[${index}].assignedTo`, newValue?._id || '');
                                                    }}
                                                    PopperComponent={StyledPopper}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label="Thẻ lương"
                                                            error={Boolean(
                                                                typeof formik.errors.usersAndDevices?.[index] === 'object' &&
                                                                (formik.errors.usersAndDevices?.[index] as any)?.assignedTo
                                                            )}
                                                            helperText={
                                                                typeof formik.errors.usersAndDevices?.[index] === 'object'
                                                                    ? (formik.errors.usersAndDevices?.[index] as any)?.assignedTo
                                                                    : ''
                                                            }
                                                        />
                                                    )}
                                                />
                                            </Grid>

                                            <Grid item xs={5}>
                                                <Autocomplete
                                                    fullWidth
                                                    options={devices}
                                                    getOptionLabel={(option: Device) => option.code || ''}
                                                    value={devices.find((d: Device) => d._id === item.device[0]) || []}
                                                    onChange={(event, newValue) => {
                                                        formik.setFieldValue(`usersAndDevices[${index}].device`, newValue?._id ? [newValue?._id] : []);
                                                    }}
                                                    PopperComponent={StyledPopper}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label="Phương tiện"
                                                            error={Boolean(
                                                                typeof formik.errors.usersAndDevices?.[index] === 'object' &&
                                                                (formik.errors.usersAndDevices?.[index] as any)?.device
                                                            )}
                                                            helperText={
                                                                typeof formik.errors.usersAndDevices?.[index] === 'object'
                                                                    ? (formik.errors.usersAndDevices?.[index] as any)?.device
                                                                    : ''
                                                            }
                                                        />
                                                    )}
                                                />
                                            </Grid>

                                            {index > 0 && <Grid item xs={2}>
                                                <Button color="error" onClick={() => remove(index)}>Xóa</Button>
                                            </Grid>}
                                        </Grid>
                                    ))}
                                    <Button variant="outlined" sx={{ mb: 2 }} onClick={() => push({ assignedTo: '', device: [] })}>
                                        + Thêm
                                    </Button>
                                </>
                            )}
                        </FieldArray>
                        <Grid container spacing={2}>
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
                                    options={excavators}
                                    getOptionLabel={(option: Device) =>
                                        option.code || ''
                                    }
                                    value={excavators.find((p: any) => p._id === formik.values.excavator[0]) || null}
                                    onChange={(event, newValue) => {
                                        formik.setFieldValue('excavator', newValue?._id ? [newValue?._id] : []);
                                    }}
                                    PopperComponent={StyledPopper}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Máy xúc"
                                            error={formik.touched.excavator && Boolean(formik.errors.excavator)}
                                            helperText={formik.touched.excavator && typeof formik.errors.excavator === 'string' ? formik.errors.excavator : ''}
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
                                    label="Chiều cao nâng tải"
                                    type="number"
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
                                Thêm mới
                            </Button>
                        </Box>
                    </Box>
                </FormikProvider>
            </DialogContent>
        </Dialog >
    );
};

export default OrderFormAdd;
