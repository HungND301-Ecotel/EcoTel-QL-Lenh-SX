import React, { useRef, useState } from 'react';
import { FieldArray, FormikProvider, getIn, useFormik } from 'formik';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api.config';
import { Order, Device, Job, Location, Material, DeviceType, Shift } from '../../types';
import { DatePicker, DesktopTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';


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
    shiftHour: yup.string().required('Vui lòng nhập giờ làm việc'),
    workContent: yup.string().required('Vui lòng nhập nội dung'),
});

interface OrderFormProps {
    initialValues: any;
    onCancel: () => void;
}

const DispatcherOrderFormTransfer: React.FC<OrderFormProps> = ({
    initialValues,
    onCancel,
}) => {
    const queryClient = useQueryClient();

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(res => res.data.data),
    });
    const { data: shifts = [] } = useQuery({
        queryKey: ['shifts'],
        queryFn: () => api.get('/shifts').then(res => res.data.data),
    });
    const { data: deviceTypes = [] } = useQuery({
        queryKey: ['deviceTypes'],
        queryFn: () => api.get('/deviceTypes').then(res => res.data.data),
    });

    const { data: jobs = [] } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => api.get('/jobs').then(res => res.data.data),
    });

    const createMutation = useMutation({
        mutationFn: (newOrder: Partial<Order>) =>
            api.post('/orders', newOrder).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            showSuccessAlert('Cập nhật lệnh sản xuất thành công');
            onCancel();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            assignedTo: typeof initialValues.assignedTo === 'object'
                ? initialValues.assignedTo._id
                : initialValues.assignedTo || '',
            devicesToProduce: Array.isArray(initialValues.devicesToProduce)
                ? initialValues.devicesToProduce.map((d: any) => ({
                    deviceType: d?.deviceType?._id || '',
                    quantity: d?.quantity || 0
                }))
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
            shiftHour: initialValues.shiftHour || '',
            workContent: initialValues.workContent || '',
            status: initialValues.status,
            note: initialValues?.shiftReport?.handoverNotes || ''
        },
        enableReinitialize: true, // Để cập nhật lại giá trị khi initialValues thay đổi
        validationSchema,
        onSubmit: async (values) => {

            const order: Partial<Order> = {
                assignedTo: values.assignedTo,
                devicesToProduce: values.devicesToProduce,
                job: values.job,
                workingDate: dayjs.utc(dayjs(values.workingDate).format('YYYY-MM-DD')).toDate(),
                shift: values.shift,
                shiftHour: values.shiftHour,
                workContent: values.workContent,
                status: "pending",
                note: values.note
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

                const result = await showConfirmAlert(`${name} đã có lệnh sản xuất trong ca này. Bạn có muốn tiếp tục?`);
                if (!result.isConfirmed) return;
            }
            createMutation.mutate(order);
        },
    });


    return (
        <FormikProvider value={formik}>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
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
                            {formik.values.devicesToProduce.map((item: any, index: number) => (
                                <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2 }}>
                                    <Grid item xs={5}>
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
                                                        getIn(formik.errors, `devicesToProduce[${index}].deviceType`) &&
                                                        getIn(formik.touched, `devicesToProduce[${index}].deviceType`)
                                                    )}
                                                    helperText={
                                                        getIn(formik.touched, `devicesToProduce[${index}].deviceType`)
                                                            && getIn(formik.errors, `devicesToProduce[${index}].deviceType`) === "string"
                                                            ? getIn(formik.errors, `devicesToProduce[${index}].deviceType`)
                                                            : ''
                                                    }
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={5}>
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
                                                getIn(formik.errors, `devicesToProduce[${index}].quantity`) &&
                                                getIn(formik.touched, `devicesToProduce[${index}].quantity`)
                                            )}
                                            helperText={
                                                getIn(formik.touched, `devicesToProduce[${index}].quantity`)
                                                    && getIn(formik.errors, `devicesToProduce[${index}].quantity`) === "string"
                                                    ? getIn(formik.errors, `devicesToProduce[${index}].quantity`)
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
                    <Grid item xs={6} sm={3}>
                        <TextField
                            fullWidth
                            select
                            id="shift"
                            name="shift"
                            label="Ca làm việc"
                            value={formik.values.shift}
                            onChange={(e) => {
                                formik.handleChange(e);
                                // Tìm ca vừa chọn
                                const selectedShift = shifts.find((shift: Shift) => shift._id === e.target.value);
                                // Nếu có ca, set giờ ca theo startTime
                                if (selectedShift && selectedShift.startTime) {
                                    // startTime có thể là chuỗi "HH:mm"
                                    formik.setFieldValue('shiftHour', dayjs(selectedShift.startTime, 'HH:mm').format('HH:mm'));
                                } else {
                                    formik.setFieldValue('shiftHour', '');
                                }
                            }}
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
                    <Grid item xs={6} sm={3}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DesktopTimePicker
                                label="Giờ ca"
                                ampm={false}
                                inputFormat="HH:mm" // v5 vẫn hỗ trợ
                                value={formik.values.shiftHour ? dayjs(formik.values.shiftHour, 'HH:mm') : null}
                                onChange={(value) => {
                                    formik.setFieldValue('shiftHour', value ? value?.format('HH:mm') : '');
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        error={formik.touched.shiftHour && Boolean(formik.errors.shiftHour)}
                                        helperText={
                                            formik.touched.shiftHour && typeof formik.errors.shiftHour === 'string'
                                                ? formik.errors.shiftHour
                                                : ''
                                        }
                                    />
                                )}
                            />
                        </LocalizationProvider>
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
                    <Button variant="outlined" onClick={onCancel}>
                        Hủy
                    </Button>
                    <Button type="submit" variant="contained">
                        Cập nhật
                    </Button>
                </Box>
            </Box >
        </FormikProvider>
    );
};

export default DispatcherOrderFormTransfer;
