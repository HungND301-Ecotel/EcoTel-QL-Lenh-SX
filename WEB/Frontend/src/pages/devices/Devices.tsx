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
    Chip,
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
import { Device } from '../../types';

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên thiết bị'),
    type: yup.string().oneOf(['truck', 'excavator', 'bulldozer', 'crane', 'other']).required('Vui lòng chọn loại thiết bị'),
    model: yup.string(),
    serialNumber: yup.string(),
    location: yup.string(),
    department: yup.string(),
    status: yup.string().oneOf(['available', 'in_use', 'maintenance', 'retired']).required('Vui lòng chọn trạng thái'),
});

const Devices: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const queryClient = useQueryClient();

    const { data: devices=[], isLoading } = useQuery({
        queryKey: ['devices'],
        queryFn: () => api.get('/devices').then(res => res.data.data),
    });

    const { data: departments=[] } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data.data),
    });


    const createMutation = useMutation({
        mutationFn: (newDevice: Partial<Device>) =>
            api.post('/devices', newDevice).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
            handleClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (updatedDevice: Partial<Device>) => {
            return api.put(`/devices/${updatedDevice._id}`, updatedDevice).then(res => res.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
            handleClose();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/devices/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
        },
    });
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: '',
            type: '',
            model: '',
            serialNumber: '',
            location: '',
            department: '',
            status: 'available' as 'available' | 'in_use' | 'maintenance' | 'retired',
            ...selectedDevice,
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            const submitValues = {
                ...values,
                type: values.type as Device['type'],
                status: values.status as Device['status'],
            };
            if (selectedDevice) {
                updateMutation.mutate({ ...submitValues, _id: submitValues._id });
            } else {
                createMutation.mutate(submitValues);
            }
        },
    });

    const handleOpen = (device?: Device) => {
        if (device) {
            setSelectedDevice(device);
            formik.setValues(device);
        } else {
            setSelectedDevice(null);
            formik.resetForm();
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedDevice(null);
        formik.resetForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý thiết bị</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Thêm thiết bị
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tên thiết bị</TableCell>
                            <TableCell>Loại thiết bị</TableCell>
                            <TableCell>Vị trí</TableCell>
                            <TableCell>Phòng ban</TableCell>
                            <TableCell>Trạng thái</TableCell>
                            <TableCell>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {devices.map((device: any) => (
                            <TableRow key={device._id}>
                                <TableCell>{device.name}</TableCell>
                                <TableCell>{device.type}</TableCell>
                                <TableCell>{device.location}</TableCell>
                                <TableCell>
                                    {typeof device.department === 'object' && device.department !== null
                                        ? device.department.name
                                        : device.department || 'Chưa có'}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={device.status === 'active' ? 'Hoạt động' :
                                            device.status === 'maintenance' ? 'Bảo trì' :
                                                device.status === 'inactive' ? 'Không hoạt động' : device.status}
                                        color={device.status === 'active' ? 'success' :
                                            device.status === 'maintenance' ? 'warning' :
                                                device.status === 'inactive' ? 'error' : 'default'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleOpen(device)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        onClick={() => handleDelete(device._id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedDevice ? 'Sửa thiết bị' : 'Thêm thiết bị'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                id="name"
                                name="name"
                                label="Tên thiết bị"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                            />
                            <TextField
                                fullWidth
                                select
                                id="type"
                                name="type"
                                label="Loại thiết bị"
                                value={formik.values.type}
                                onChange={formik.handleChange}
                                error={formik.touched.type && Boolean(formik.errors.type)}
                                helperText={formik.touched.type && formik.errors.type}
                            >
                                <MenuItem value="truck">Xe tải</MenuItem>
                                <MenuItem value="excavator">Máy xúc</MenuItem>
                                <MenuItem value="bulldozer">Máy ủi</MenuItem>
                                <MenuItem value="crane">Cẩu</MenuItem>
                                <MenuItem value="other">Khác</MenuItem>
                            </TextField>
                            <TextField
                                fullWidth
                                id="model"
                                name="model"
                                label="Model"
                                value={formik.values.model}
                                onChange={formik.handleChange}
                                error={formik.touched.model && Boolean(formik.errors.model)}
                                helperText={formik.touched.model && formik.errors.model}
                            />
                            <TextField
                                fullWidth
                                id="serialNumber"
                                name="serialNumber"
                                label="Serial Number"
                                value={formik.values.serialNumber}
                                onChange={formik.handleChange}
                                error={formik.touched.serialNumber && Boolean(formik.errors.serialNumber)}
                                helperText={formik.touched.serialNumber && formik.errors.serialNumber}
                            />
                            <TextField
                                fullWidth
                                id="location"
                                name="location"
                                label="Vị trí"
                                value={formik.values.location}
                                onChange={formik.handleChange}
                                error={formik.touched.location && Boolean(formik.errors.location)}
                                helperText={formik.touched.location && formik.errors.location}
                            />
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
                                select
                                id="status"
                                name="status"
                                label="Trạng thái"
                                value={formik.values.status}
                                onChange={formik.handleChange}
                                error={formik.touched.status && Boolean(formik.errors.status)}
                                helperText={formik.touched.status && formik.errors.status}
                            >
                                <MenuItem value="available">Sẵn sàng</MenuItem>
                                <MenuItem value="in_use">Đang sử dụng</MenuItem>
                                <MenuItem value="maintenance">Bảo trì</MenuItem>
                                <MenuItem value="retired">Ngừng sử dụng</MenuItem>
                            </TextField>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Hủy</Button>
                    <Button onClick={() => formik.handleSubmit()} variant="contained">
                        {selectedDevice ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Devices; 