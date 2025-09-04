import React, { useEffect, useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import api from '../../config/api.config';
import { Order, Device, Job, Location, Material, DeviceType, Shift } from '../../types';
import { DatePicker, DesktopTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';


const StyledPopper = styled(Popper)({
    '& .MuiAutocomplete-listbox': {
        maxHeight: '200px', // Đặt chiều cao tối đa mong muốn
        overflowY: 'auto', // Thêm thanh cuộn khi nội dung vượt quá chiều cao
    },
});

const validationSchema = yup.object({
    usersAndDepartment: yup.array().of(
        yup.object().shape({
            assignedTo: yup.string().required('Vui lòng chọn thẻ lương'),
            department: yup.string(),
        })
    ),
    workingDate: yup.string().required('Vui lòng chọn ngày làm việc'),
    workContent: yup.string().required('Vui lòng nhập nội dung'),
});
interface OrderFormProps {
    initialValues: any;
    onSubmit: (values: Partial<Order>) => void;
    onCancel: () => void;
}

const DispatcherOrderFormEdit: React.FC<OrderFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
}) => {

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users?type=order').then(res => res.data.data),
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
            usersAndDepartments: [
                {
                    assignedTo: "",
                    department: "",
                },
            ],
            workingDate: initialValues.workingDate
                ? dayjs(initialValues.workingDate).startOf('day').toDate()
                : '',
            workContent: initialValues.workContent || '',
            status: initialValues.status,
        },
        validationSchema,
        enableReinitialize: true, // Để cập nhật lại giá trị khi initialValues thay đổi
        onSubmit: (values) => {

            const order: Partial<Order> = {
                assignedTo: values.assignedTo,
                devicesToProduce: values.devicesToProduce.filter((i: any) => i.deviceType),
                workingDate: dayjs.utc(dayjs(values.workingDate).format('YYYY-MM-DD')).toDate(),
                workContent: values.workContent,
                status: "pending",
                temporaryError: '',
            };
            onSubmit(order);
        },
    });


    return (
        <FormikProvider value={formik}>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                <FieldArray name="usersAndDepartments">
                    {({ push, remove }) => (
                        <>
                            {formik.values.usersAndDepartments.map((item, index) => (
                                <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2, mt: 2 }}>
                                    <Grid item xs={5}>
                                        <Autocomplete
                                            fullWidth
                                            options={users}
                                            getOptionLabel={(option: any) =>
                                                `${option.fullName || ''} - ${option.salaryCode || ''}`
                                            }
                                            value={users.find((p: any) => p._id === item.assignedTo) || null}
                                            onChange={(event, newValue) => {
                                                formik.setFieldValue(`usersAndDepartments[${index}].assignedTo`, newValue?._id || '');
                                                formik.setFieldValue(`usersAndDepartments[${index}].department`, newValue?.department?.code || '');
                                            }}
                                            PopperComponent={StyledPopper}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Thẻ lương"
                                                    error={Boolean(
                                                        typeof formik.errors.usersAndDepartments?.[index] === 'object' &&
                                                        (formik.errors.usersAndDepartments?.[index] as any)?.assignedTo
                                                    )}
                                                    helperText={
                                                        typeof formik.errors.usersAndDepartments?.[index] === 'object'
                                                            ? (formik.errors.usersAndDepartments?.[index] as any)?.assignedTo
                                                            : ''
                                                    }
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={5}>
                                        <TextField fullWidth label="Đơn vị" value={item.department ?? ''} disabled />
                                    </Grid>


                                    {index > 0 && <Grid item xs={2}>
                                        <Button color="error" onClick={() => remove(index)}>Xóa</Button>
                                    </Grid>}
                                </Grid>
                            ))}
                            <Button variant="outlined" sx={{ mb: 2 }} onClick={() => push({ assignedTo: '', department: "" })}>
                                + Thêm
                            </Button>
                        </>
                    )}
                </FieldArray>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
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
                        Thêm mới
                    </Button>
                </Box>
            </Box>
        </FormikProvider >
    );
};

export default DispatcherOrderFormEdit;
