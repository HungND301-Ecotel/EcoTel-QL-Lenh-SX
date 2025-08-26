import React, { useEffect, useRef, useState } from 'react';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api.config';
import { Order, Device, Job, Location, Material, SafetyMeasure, Shift } from '../../types';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import utc from 'dayjs/plugin/utc';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';
import { DesktopTimePicker } from '@mui/x-date-pickers';
import { ContentCopy } from '@mui/icons-material';

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
    shiftHour: yup.string().required('Vui lòng nhập giờ làm việc'),
    workContent: yup.string().required('Vui lòng nhập nội dung'),
});

interface OrderFormProps {
    initialValues: any;
    onCancel: () => void;
}

const OrderFormTransfer: React.FC<OrderFormProps> = ({
    initialValues,
    onCancel,
}) => {
    const queryClient = useQueryClient();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null)
    console.log(initialValues)
    useEffect(() => {
        setSelectedJob(initialValues?.job || null)
    }, [initialValues])
    const safetyTextFieldRef = useRef<HTMLInputElement>(null);

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };
    const handleSelectSample = (content: string) => {
        formik.setFieldValue('safetyMeasure', content);
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
            assignedTo: typeof initialValues?.assignedTo === 'object'
                ? initialValues?.assignedTo?._id
                : initialValues?.assignedTo || '',
            device: Array.isArray(initialValues?.device) && initialValues.device.length > 0
                ? [typeof initialValues.device.at(-1) === 'object'
                    ? initialValues.device.at(-1)?._id
                    : initialValues.device.at(-1)]
                : [],
            job: initialValues?.job !== null && typeof initialValues?.job === 'object'
                ? initialValues?.job._id
                : initialValues?.job || '',
            workingDate: initialValues.workingDate
                ? dayjs(initialValues.workingDate).startOf('day').toDate()
                : '',
            shift: initialValues.shift !== null && typeof initialValues.shift === 'object'
                ? initialValues.shift._id
                : initialValues.shift || '',
            shiftHour: initialValues.shiftHour || '',
            safetyMeasure: initialValues.safetyMeasure !== null && typeof initialValues.safetyMeasure === 'object'
                ? initialValues.safetyMeasure._id
                : initialValues.safetyMeasure || undefined,
            excavator: Array.isArray(initialValues?.excavator) && initialValues.excavator.length > 0
                ? [typeof initialValues.excavator.at(-1) === 'object'
                    ? initialValues.excavator.at(-1)?._id
                    : initialValues.excavator.at(-1)]
                : [],
            distance: initialValues?.distance,
            liftHeight: initialValues?.liftHeight,
            location: Array.isArray(initialValues?.location) && initialValues.location.length > 0
                ? [typeof initialValues.location.at(-1) === 'object'
                    ? initialValues.location.at(-1)?._id
                    : initialValues.location.at(-1)]
                : [],
            material: Array.isArray(initialValues?.material) && initialValues.material.length > 0
                ? [typeof initialValues.material.at(-1) === 'object'
                    ? initialValues.material.at(-1)?._id
                    : initialValues.material.at(-1)]
                : [],
            workContent: initialValues?.workContent || '',
            status: initialValues?.status,
            note: initialValues?.shiftReport?.vehicleSummaries
                ?.filter((item: any) => item.note?.trim()) // bỏ null, undefined, chuỗi rỗng
                .map((item: any) => `${item.vehicle?.code} : ${item.note}`)
                .join('\n') || '',
            previous_order_id: initialValues?._id
        },
        enableReinitialize: true, // Để cập nhật lại giá trị khi initialValues thay đổi
        validationSchema,
        onSubmit: async (values) => {
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
                status: "pending",
                note: values.note,
                previous_order_id: values.previous_order_id
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
                            formik.setFieldValue('safetyMeasure', safetyMeasures.find((i: any) => i?.job?._id === newValue?._id)?.master_content || '')
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
                    <Autocomplete
                        fullWidth
                        options={excavators}
                        getOptionLabel={(option: Device) =>
                            option?.code || ''
                        }
                        value={excavators.find((d: any) => d._id === formik.values.excavator[0]) || null}
                        onChange={(event, newValue) => {
                            formik.setFieldValue('excavator', newValue ? [newValue._id] : []);
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
                </Grid>}
                <Grid item xs={6}>
                    <Autocomplete
                        fullWidth
                        options={users}
                        getOptionLabel={(option: any) =>
                            `${option.salaryCode} - ${option.fullName || ''}`
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

                {["Vận hành xe", "Vận hành xúc", "Vận hành gạt", "Vận hành khoan", "Vận hành xe", "Vận hành xe phục vụ"].includes(selectedJob?.type ?? "") && <Grid item xs={6}>
                    <Autocomplete
                        fullWidth
                        options={devices}
                        getOptionLabel={(option: any) =>
                            option?.code || ''
                        }
                        value={devices.find((d: any) => d._id === formik.values.device[0]) || null}
                        onChange={(event, newValue) => {
                            formik.setFieldValue('device', newValue ? [newValue._id] : []);
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
                {selectedJob?.type === "Vận hành xe" && <Grid item xs={12} sm={6}>
                    <Autocomplete
                        fullWidth
                        options={locations}
                        getOptionLabel={(option: Location) =>
                            option.name || ''
                        }
                        value={locations.find((p: any) => p._id === formik.values.location[0]) || null}
                        onChange={(event, newValue) => {
                            formik.setFieldValue('location', newValue ? [newValue._id] : []);
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
                </Grid>}

                {selectedJob?.type === "Vận hành xe" && <Grid item xs={12} sm={6}>
                    <Autocomplete
                        fullWidth
                        options={materials}
                        getOptionLabel={(option: Material) =>
                            option.name || ''
                        }
                        value={materials.find((p: any) => p._id === formik.values.material[0]) || null}
                        onChange={(event, newValue) => {
                            formik.setFieldValue('material', newValue ? [newValue._id] : []);
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
                </Grid>}
                {/* <Grid item xs={12} sm={6}>
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
                </Grid> */}
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
                                    {item.content}
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
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

export default OrderFormTransfer;
