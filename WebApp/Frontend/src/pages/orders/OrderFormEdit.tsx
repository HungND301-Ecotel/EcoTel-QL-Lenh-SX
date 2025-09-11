import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    IconButton,
    Menu,
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
import { showErrorAlert } from '../../components/Alert';
import { ContentCopy } from '@mui/icons-material';
import { DesktopTimePicker } from '@mui/x-date-pickers';
import { MultiSelectField } from '../../components/MultiSelectField';
// import { StyledPopper } from '../../ui/poppers';
dayjs.extend(utc);

const StyledPopper = styled(Popper)({
    '& .MuiAutocomplete-listbox': {
        maxHeight: '200px',
        overflowY: 'auto',
    },
});

const validationSchema = yup.object({
    assignedTo: yup.string().required('Vui lòng chọn thẻ lương'),
    device: yup.array(),
    job: yup.string().required('Vui lòng chọn loại công việc'),
    workingDate: yup.string().required('Vui lòng chọn ngày làm việc'),
    shift: yup.string().required('Vui lòng chọn ca làm việc'),
    shiftHour: yup.string().required('Vui lòng nhập giờ làm việc'),
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

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null)

    useEffect(() => {
        setSelectedJob(initialValues?.job || null)
    }, [initialValues])

    const safetyTextFieldRef = useRef<HTMLInputElement>(null);

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };
    const handleSelectSample = (content: string) => {
        const currentValue = formik.values.safetyMeasure || "";

        // Nếu có sẵn nội dung thì thêm xuống dòng, còn nếu trống thì chỉ gán content
        const newValue = currentValue
            ? `${currentValue}\n${content}`
            : content;

        formik.setFieldValue('safetyMeasure', newValue);
        setAnchorEl(null);
    };
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
            shiftHour: initialValues.shiftHour || '',
            safetyMeasure: initialValues.safetyMeasure || '',
            safetyMeasureSpecific: initialValues.safetyMeasureSpecific || '',
            excavator: Array.isArray(initialValues.excavator)
                ? initialValues.excavator.map((d: any) => typeof d === 'object' ? d._id : d)
                : initialValues.excavator
                    ? [typeof initialValues.excavator === 'object' ? initialValues.excavator._id : initialValues.excavator]
                    : [],
            distance: initialValues.distance,
            liftHeight: initialValues.liftHeight,
            location: Array.isArray(initialValues.location)
                ? initialValues.location.map((d: any) => typeof d === 'object' ? d._id : d)
                : initialValues.location
                    ? [typeof initialValues.location === 'object' ? initialValues.location._id : initialValues.location]
                    : [],
            material: Array.isArray(initialValues.material)
                ? initialValues.material.map((d: any) => typeof d === 'object' ? d._id : d)
                : initialValues.material
                    ? [typeof initialValues.material === 'object' ? initialValues.material._id : initialValues.material]
                    : [],
            workContent: initialValues.workContent || '',
            status: initialValues.status,
            note: initialValues.note || ''
        },
        validationSchema,
        enableReinitialize: true, // Để cập nhật lại giá trị khi initialValues thay đổi
        onSubmit: (values) => {
            const order: Partial<Order> = {
                assignedTo: values.assignedTo,
                device: values.device,
                job: values.job,
                workingDate: dayjs.utc(dayjs(values.workingDate).format('YYYY-MM-DD')).toDate(),
                shift: values.shift,
                shiftHour: values.shiftHour,
                excavator: values.excavator,
                distance: values.distance,
                liftHeight: values.liftHeight,
                location: values.location,
                material: values.material,
                workContent: values.workContent,
                safetyMeasure: values.safetyMeasure,
                safetyMeasureSpecific: values.safetyMeasureSpecific,
                status: "pending",
                temporaryError: '',
                note: values.note
            };
            onSubmit(order);
        },
    });


    return (

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Autocomplete
                        fullWidth
                        options={jobs}
                        getOptionLabel={(option: Job) =>
                            option.name || ''
                        }
                        value={jobs.find((p: any) => p._id === formik.values.job) || null}
                        onChange={(event, newValue) => {
                            formik.setFieldValue('job', newValue?._id || '');
                            setSelectedJob(newValue)
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
                {selectedJob?.type === "Vận hành xe" && <Grid item xs={12}>
                    <MultiSelectField title="Máy xúc" fieldName="excavator" options={excavators} formik={formik} initData={initialValues} labelKey="code" />
                </Grid>}
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

                {["Vận hành xe", "Vận hành xúc", "Vận hành gạt", "Vận hành khoan", "Vận hành sàng", "Vận hành xe phục vụ", "Sửa chữa, bảo dưỡng", "Vận hành bơm"].includes(selectedJob?.type ?? "") && <Grid item xs={6}>
                    <MultiSelectField title="Phương tiện" fieldName="device" options={devices} formik={formik} initData={initialValues} labelKey="code" />
                </Grid>}

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
                {['Vận hành sàng', "Vận hành xe"].includes(selectedJob?.type ?? '') && <Grid item xs={12} sm={6}>
                    <MultiSelectField title="Điểm đổ tải" fieldName="location" options={locations} formik={formik} initData={initialValues} labelKey="name" />
                </Grid>}

                {selectedJob?.type === "Vận hành xe" && <Grid item xs={12} sm={6}>
                    <MultiSelectField title="Loại vật liệu" fieldName="material" options={materials} formik={formik} initData={initialValues} labelKey="name" />
                </Grid>}

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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={5}
                            id="safetyMeasure"
                            name="safetyMeasure"
                            label="Biện pháp an toàn"
                            value={formik.values.safetyMeasure}
                            onChange={formik.handleChange}
                            error={formik.touched.safetyMeasure && Boolean(formik.errors.safetyMeasure)}
                            helperText={formik.touched.safetyMeasure && typeof formik.errors.safetyMeasure === 'string' ? formik.errors.safetyMeasure : ''}
                            inputRef={safetyTextFieldRef}
                            InputProps={{
                                endAdornment: (
                                    <IconButton
                                        onClick={(e) => {
                                            setAnchorEl(safetyTextFieldRef.current);
                                        }}
                                        title="Chọn mẫu"
                                    >
                                        <ContentCopy />
                                    </IconButton>
                                ),

                            }}
                        />
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleCloseMenu}
                            PaperProps={{
                                sx: {
                                    width: safetyTextFieldRef.current ? safetyTextFieldRef.current.offsetWidth : 400,
                                    maxWidth: '100%',
                                    maxHeight: 300,
                                }
                            }}
                        >
                            {safetyMeasures.map((item: SafetyMeasure) => (
                                <MenuItem
                                    key={item._id}
                                    onClick={() => handleSelectSample(item.content)}
                                    sx={{
                                        whiteSpace: 'pre-line',
                                        minHeight: 48,
                                    }}
                                >
                                    {item.name}
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={5}
                        id="safetyMeasureSpecific"
                        name="safetyMeasureSpecific"
                        label="Biện pháp an toàn cụ thể"
                        value={formik.values.safetyMeasureSpecific}
                        onChange={formik.handleChange}
                        error={formik.touched.safetyMeasureSpecific && Boolean(formik.errors.safetyMeasureSpecific)}
                        helperText={formik.touched.safetyMeasureSpecific && typeof formik.errors.safetyMeasureSpecific === 'string'
                            ? formik.errors.safetyMeasureSpecific
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

    );
};

export default OrderFormEdit;
