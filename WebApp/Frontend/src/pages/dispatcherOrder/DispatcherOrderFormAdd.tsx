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
import { Order, Device, Job, Location, Material, DeviceType, Department, Shift } from '../../types';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const StyledPopper = styled(Popper)({
    '& .MuiAutocomplete-listbox': {
        maxHeight: '200px', // Đặt chiều cao tối đa mong muốn
        overflowY: 'auto', // Thêm thanh cuộn khi nội dung vượt quá chiều cao
    },
});

const validationSchema = yup.object({
    assignedTo: yup.string().required('Vui lòng chọn thẻ lương'),
    devicesToProduce: yup.array().of(
        yup.object().shape({
            deviceType: yup.string().required('Vui lòng chọn loại thiết bị')
                .typeError('Số lượng phải là số')
                .min(1, 'Số lượng phải lớn hơn 0'),
            quantity: yup.number().required('Vui lòng nhập số lượng'),
        })
    ),
    job: yup.string().required('Vui lòng chọn loại công việc'),
    workingDate: yup.string().required('Vui lòng chọn ngày làm việc'),
    shift: yup.string().required('Vui lòng chọn ca làm việc'),
    workContent: yup.string().required('Vui lòng nhập nội dung'),
});

interface OrderFormProps {
    onSubmit: (values: Partial<Order>) => void;
    onCancel: () => void;
}

const DispatcherOrderFormAdd: React.FC<OrderFormProps> = ({
    onSubmit,
    onCancel,
}) => {

    const [department, setDepartment] = useState("")

    const { data: deviceTypes = [] } = useQuery({
        queryKey: ['deviceTypes'],
        queryFn: () => api.get('/deviceTypes').then(res => res.data.data),
    });
    const { data: users = [] } = useQuery({
        queryKey: ['users', department],
        queryFn: () => api.get(`/users?department=${department}`).then(res => res.data.data),
        enabled: !!department,
    });
    const { data: shifts = [] } = useQuery({
        queryKey: ['shifts'],
        queryFn: () => api.get('/shifts').then(res => res.data.data),
    });
    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data.data),
    });

    const { data: jobs = [] } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => api.get('/jobs').then(res => res.data.data),
    });


    const formik = useFormik({
        initialValues: {
            assignedTo: "",
            devicesToProduce: [
                {
                    deviceType: "",
                    quantity: 0,
                },
            ],
            job: '',
            workingDate: '',
            shift: '',
            workContent: '',
            note: '',
        },
        validationSchema,
        onSubmit: async (values) => {
            const order: any = {
                assignedTo: values.assignedTo,
                devicesToProduce: values.devicesToProduce,
                job: values.job,
                workingDate: dayjs.utc(dayjs(values.workingDate).format('YYYY-MM-DD')).toDate(),
                shift: values.shift,
                workContent: values.workContent,
                department: department
            };
            const duplicates = await
                api.post(`/orders/checkExist`, {
                    workingDate: order.workingDate,
                    shift: order.shift,
                    assignedTo: order.assignedTo
                }
                ).then(res =>
                    res.data.data,
                )

            if (duplicates) {
                const name = duplicates.assignedTo?.fullName

                const confirm = window.confirm(`${name} đã có lệnh sản xuất trong ca này. Bạn có muốn tiếp tục?`);
                if (!confirm) return;
            }
            onSubmit(order);
        },
    });


    return (
        <FormikProvider value={formik}>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12}>
                        <Autocomplete
                            fullWidth
                            options={departments}
                            getOptionLabel={(option: Department) =>
                                option.name || ''
                            }
                            value={departments.find((p: any) => p._id === department || null)}
                            onChange={(event, newValue) => {
                                setDepartment(newValue?._id || '');
                            }}
                            PopperComponent={StyledPopper}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Đơn vị"
                                />
                            )}
                        /></Grid>
                    <Grid item xs={12} sm={6}>
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
                </Grid>
                <FieldArray name="devicesToProduce">
                    {({ push, remove }) => (
                        <>
                            {formik.values.devicesToProduce.map((item, index) => (
                                <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2 }}>
                                    <Grid item xs={10} sm={5}>
                                        <Autocomplete
                                            fullWidth
                                            options={deviceTypes}
                                            getOptionLabel={(option: DeviceType) =>
                                                option.name || ''
                                            }
                                            value={deviceTypes.find((p: DeviceType) => p._id === item.deviceType) || null}
                                            onChange={(event, newValue) => {
                                                formik.setFieldValue(`devicesToProduce[${index}].deviceType`, newValue?._id || '');
                                            }}
                                            PopperComponent={StyledPopper}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Loại phương tiện"
                                                    error={Boolean(
                                                        typeof formik.errors.devicesToProduce?.[index] === 'object' &&
                                                        (formik.errors.devicesToProduce?.[index] as any)?.deviceType
                                                    )}
                                                    helperText={
                                                        typeof formik.errors.devicesToProduce?.[index] === 'object'
                                                            ? (formik.errors.devicesToProduce?.[index] as any)?.deviceType
                                                            : ''
                                                    }
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={10} sm={5}>
                                        <TextField
                                            fullWidth
                                            label="Số lượng"
                                            type="number"
                                            inputProps={{ min: 1 }}
                                            value={formik.values.devicesToProduce[index].quantity}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const value = e.target.value;
                                                const parsed = value === '' ? '' : parseInt(value, 10);

                                                formik.setFieldValue(`devicesToProduce[${index}].quantity`, parsed);
                                            }}
                                            error={Boolean(
                                                typeof formik.errors.devicesToProduce?.[index] === 'object' &&
                                                (formik.errors.devicesToProduce?.[index] as any)?.quantity
                                            )}
                                            helperText={
                                                typeof formik.errors.devicesToProduce?.[index] === 'object'
                                                    ? (formik.errors.devicesToProduce?.[index] as any)?.quantity
                                                    : ''
                                            }
                                        />
                                    </Grid>

                                    {index > 0 && <Grid item xs={2}>
                                        <Button color="error" onClick={() => remove(index)}>Xóa</Button>
                                    </Grid>}
                                </Grid>
                            ))}
                            <Button variant="outlined" sx={{ mb: 2 }} onClick={() => push({ deviceType: '', quantity: 0 })}>
                                + Thêm
                            </Button>
                        </>
                    )}
                </FieldArray>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        {/* <TextField
                                    fullWidth
                                    id="workingDate"
                                    name="workingDate"
                                    label="Ngày làm việc"
                                    type="date"
                                    value={formik.values.workingDate}
                                    onChange={formik.handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    error={formik.touched.workingDate && Boolean(formik.errors.workingDate)}
                                    helperText={formik.touched.workingDate && formik.errors.workingDate}
                                /> */}
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
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button variant="outlined" onClick={() => {
                        onCancel()
                        formik.resetForm();
                    }}>
                        Hủy
                    </Button>
                    <Button type="submit" variant="contained">
                        Thêm mới
                    </Button>
                </Box>
            </Box>
        </FormikProvider>
    );
};

export default DispatcherOrderFormAdd;
