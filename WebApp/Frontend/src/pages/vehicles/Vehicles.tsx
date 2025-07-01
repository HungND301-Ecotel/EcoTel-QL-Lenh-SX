import React, { useEffect, useState } from 'react';
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
    Autocomplete,
    styled,
    Popper,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Department, Device, DeviceType } from '../../types';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';

const containerStyle = {
    width: '100%',
    height: '300px',
};

const defaultCenter = {
    lat: 20.9926575,
    lng: 105.8437303,
};

const StyledPopper = styled(Popper)({
    '& .MuiAutocomplete-listbox': {
        maxHeight: '200px', // Đặt chiều cao tối đa mong muốn
        overflowY: 'auto', // Thêm thanh cuộn khi nội dung vượt quá chiều cao
    },
});

const validationSchema = yup.object({
    code: yup.string().required('Vui lòng nhập biển số'),
    name: yup.string(),
    category: yup.string().required('Vui lòng chọn loại phương tiện'),
    coordinates: yup.object({
        lng: yup.number().required('Vui lòng chọn vĩ độ'),
        lat: yup.number().required('Vui lòng chọn kinh độ'),
    }).required('Vui lòng chọn tọa độ'),
    department: yup.string().required('Vui lòng chọn đơn vị'),
    status: yup.string().oneOf(['available', 'in_use', 'maintenance', 'retired']).required('Vui lòng chọn trạng thái'),
});

const Vehicles: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [q, setQ] = useState("")
    const [department, setDepartment] = useState("")
    const [mapCoords, setMapCoords] = useState<{ lat: number, lng: number; } | null>(null);

    const [user, setUser] = useAtom(userAtom)

    const queryClient = useQueryClient();
    const apiKey = process.env.REACT_APP_MAP_API_KEY;

    if (!apiKey) {
        throw new Error('REACT_APP_MAP_API_KEY is not defined');
    }
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: apiKey,
    });

    const { data: vehicles = [], isLoading } = useQuery({
        queryKey: ['vehicles', q, department],
        queryFn: () => api.get(`/devices?q=${q}&department=${department}`).then(res => res.data.data?.filter((item: any) => item?.category?.name === "Vận tải")),
    });
    const { data: DeviceTypes = [] } = useQuery({
        queryKey: ['DeviceTypes'],
        queryFn: () => api.get(`/DeviceTypes`).then(res => res.data.data),
    });


    const { data: departments = [] } = useQuery({
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
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedDevice: Partial<Device>) => {
            return api.put(`/devices/${updatedDevice._id}`, updatedDevice).then(res => res.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/devices/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            name: '',
            code: '',
            vehicleNumber: '',
            category: '',
            material: '',
            fuelType: '',
            capacity: undefined as number | undefined,
            department: user?.role === "manager" ? user?.department?._id : '',
            status: 'available' as 'available' | 'in_use' | 'maintenance' | 'retired',
            coordinates: { lat: 0, lng: 0 },
            ...selectedDevice,
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            const submitValues = {
                ...values,
                status: values.status as Device['status'],
                coordinates: values.coordinates,
            };
            if (selectedDevice) {
                updateMutation.mutate({ ...submitValues, _id: submitValues._id });
                setMapCoords(values.coordinates)
            } else {
                createMutation.mutate(submitValues);
            }
        },
    });

    // Đồng bộ coordinates khi mapCoords thay đổi
    useEffect(() => {
        if (mapCoords) {
            formik.setFieldValue('coordinates', mapCoords);
        }
    }, [mapCoords]);
    const handleOpen = (device?: any) => {
        if (device) {
            const [lng, lat] = device.coordinates.coordinates;
            setSelectedDevice(device);
            formik.setValues({
                ...device, coordinates: {
                    lat, lng
                },
                department: device.department !== null && typeof device.department === 'object'
                    ? device.department._id
                    : device.department || undefined,
                category: device.category !== null && typeof device.category === 'object'
                    ? device.category._id
                    : device.category || '',
            });
            setMapCoords({
                lat, lng
            });
        } else {
            setSelectedDevice(null);
            formik.resetForm();
            const defaultCategory = DeviceTypes.find((p: any) => p.name === 'Vận tải');
            if (defaultCategory) {
                formik.setFieldValue('category', defaultCategory._id);
            }
            setMapCoords(null);
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedDevice(null);
        formik.resetForm();
        setMapCoords(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa thông tin ô tô này?')) {
            deleteMutation.mutate(id);
        }
    };
    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            setMapCoords({
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
            });
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý thông tin ô tô</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Thêm thông tin ô tô
                </Button>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, gap: 2 }}>
                <Typography><b style={{ color: 'red' }}>Chờ điều động:</b> {vehicles.filter((o: Device) => o.status === "available").length}</Typography>
                <Typography><b style={{ color: 'blue' }}>Đang hoạt động:</b> {vehicles.filter((o: Device) => o.status === "in_use").length}</Typography>
                <Typography><b style={{ color: 'orange' }}>Hỏng:</b> {vehicles.filter((o: Device) => o.status === "maintenance").length}</Typography>
                <Typography><b style={{ color: 'green' }}>Niêm cất:</b> {vehicles.filter((o: Device) => o.status === "retired").length}</Typography>
            </Box>
            <Box sx={{ flex: 1, flexDirection: 'column', mb: 3 }}>
                <Typography><h3>Tìm kiếm</h3></Typography>
                <Box sx={{ display: 'flex', gap: 4 }}>
                    <TextField fullWidth size="small" value={q}
                        placeholder='Tìm kiếm theo tên, biển số, số xe, chủng loại'
                        onChange={(e) => setQ(e.target.value)}>
                    </TextField>
                    {user?.role !== 'manager' && <Autocomplete
                        fullWidth
                        size='small'
                        options={departments}
                        getOptionLabel={(option: Department) =>
                            option.code || ''
                        }
                        onChange={(event, newValue) => {
                            setDepartment(newValue?._id || '')
                        }}
                        PopperComponent={StyledPopper}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Tìm kiếm theo đơn vị"
                            />
                        )}
                    />}
                </Box>
            </Box>
            <Paper sx={{ width: '100%', overflowX: "initial" }}>
                <TableContainer sx={{ height: '80vh' }}>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{
                                    position: 'sticky',
                                    left: 0,
                                    backgroundColor: 'white',
                                    zIndex: 3,
                                    minWidth: 100,
                                    border: '1px solid black'
                                }}>Biển số</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>Tên ô tô</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>Số xe</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>Loại xe</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>Chủng loại</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>Nhiên liệu</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>Trọng tải</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>Vị trí</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>Đơn vị</TableCell>
                                <TableCell sx={{ border: '1px solid black' }}>Trạng thái</TableCell>
                                {user?.role !== 'dispatcher' && <TableCell sx={{ border: '1px solid black' }}>Thao tác</TableCell>}
                            </TableRow>
                        </TableHead>
                        {!isLoading ? <TableBody>
                            {vehicles.map((device: any) => {
                                let coordsDisplay = '';
                                if (
                                    device.coordinates &&
                                    device.coordinates.type === 'Point' &&
                                    Array.isArray(device.coordinates.coordinates)
                                ) {
                                    const [lng, lat] = device.coordinates.coordinates;
                                    coordsDisplay = `${lat},${lng}`; // Lấy lat trước để hiển thị như người dùng quen
                                } else {
                                    coordsDisplay = 'Không có tọa độ';
                                }
                                return (
                                    <TableRow key={device._id}>
                                        <TableCell sx={{
                                            position: 'sticky',
                                            left: 0,
                                            backgroundColor: 'white',
                                            zIndex: 1,
                                            minWidth: 100,
                                            border: '1px solid black'
                                        }}>{device.code}</TableCell>
                                        <TableCell sx={{ border: '1px solid black', minWidth: 150, }}>{device.name}</TableCell>
                                        <TableCell sx={{ border: '1px solid black', minWidth: 130, }}>{device.vehicleNumber}</TableCell>
                                        <TableCell sx={{ border: '1px solid black', minWidth: 130, }}>{device.category?.name}</TableCell>
                                        <TableCell sx={{ border: '1px solid black', minWidth: 130, }}>{device.material}</TableCell>
                                        <TableCell sx={{ border: '1px solid black', minWidth: 130, }}>{device.fuelType}</TableCell>
                                        <TableCell sx={{ border: '1px solid black', minWidth: 130, }}>{device.capacity}</TableCell>
                                        <TableCell sx={{ border: '1px solid black', minWidth: 130, }}>{coordsDisplay}</TableCell>
                                        <TableCell sx={{ border: '1px solid black', minWidth: 130, }}>
                                            {typeof device.department === 'object' && device.department !== null
                                                ? device.department.name
                                                : device.department || 'Chưa có'}
                                        </TableCell>
                                        <TableCell sx={{ border: '1px solid black', minWidth: 130, }}>
                                            <Chip
                                                label={device.status === 'in_use' ? 'Đang hoạt động' :
                                                    device.status === 'maintenance' ? 'Hỏng' :
                                                        device.status === 'retired' ? 'Niêm cất' :
                                                            device.status === 'available' ? 'Chờ điều động' : device.status}
                                                color={device.status === 'in_use' ? 'success' :
                                                    device.status === 'maintenance' ? 'warning' :
                                                        device.status === 'retired' ? 'primary' :
                                                            device.status === 'available' ? 'error' : 'default'}
                                            />
                                        </TableCell>
                                        {user?.role !== 'dispatcher' && <TableCell sx={{ border: '1px solid black', minWidth: 130, }}>
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
                                        </TableCell>}
                                    </TableRow>)
                            })}
                        </TableBody> : <Typography>Loading...</Typography>}
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedDevice ? 'Sửa thông tin ô tô' : 'Thêm thông tin ô tô'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                id="code"
                                name="code"
                                label="Biển số"
                                value={formik.values.code}
                                onChange={formik.handleChange}
                                error={formik.touched.code && Boolean(formik.errors.code)}
                                helperText={formik.touched.code && formik.errors.code}
                            />
                            <TextField
                                fullWidth
                                id="name"
                                name="name"
                                label="Tên ô tô"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                            />
                            <TextField
                                fullWidth
                                id="vehicleNumber"
                                name="vehicleNumber"
                                label="Số xe"
                                value={formik.values.vehicleNumber}
                                onChange={formik.handleChange}
                                error={formik.touched.vehicleNumber && Boolean(formik.errors.vehicleNumber)}
                                helperText={formik.touched.vehicleNumber && formik.errors.vehicleNumber}
                            />
                            <Autocomplete
                                fullWidth
                                options={DeviceTypes}
                                readOnly
                                getOptionLabel={(option: DeviceType) =>
                                    option.name || ''
                                }
                                value={DeviceTypes.find((p: any) => p.name === 'Vận tải') || null}
                                onChange={(event, newValue) => {
                                    formik.setFieldValue('category', newValue?._id || '');
                                }}
                                PopperComponent={StyledPopper}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Loại xe"
                                        error={formik.touched.category && Boolean(formik.errors.category)}
                                        helperText={formik.touched.category && typeof formik.errors.category === 'string' ? formik.errors.category : ''}
                                    />
                                )}
                            />
                            <TextField
                                fullWidth
                                id="material"
                                name="material"
                                label="Chủng loại"
                                value={formik.values.material}
                                onChange={formik.handleChange}
                                error={formik.touched.material && Boolean(formik.errors.material)}
                                helperText={formik.touched.material && formik.errors.material}
                            />
                            <TextField
                                fullWidth
                                id="fuelType"
                                name="fuelType"
                                label="Nhiên liệu"
                                value={formik.values.fuelType}
                                onChange={formik.handleChange}
                                error={formik.touched.fuelType && Boolean(formik.errors.fuelType)}
                                helperText={formik.touched.fuelType && formik.errors.fuelType}
                            />
                            <TextField
                                fullWidth
                                type="number"
                                id="capacity"
                                name="capacity"
                                label="Trọng tải"
                                value={formik.values.capacity}
                                onChange={formik.handleChange}
                                error={formik.touched.capacity && Boolean(formik.errors.capacity)}
                                helperText={formik.touched.capacity && formik.errors.capacity}
                            />
                            <TextField
                                fullWidth
                                select
                                id="status"
                                name="status"
                                label="Trạng thái"
                                value={formik.values.status || 'available'}
                                onChange={formik.handleChange}
                                error={formik.touched.status && Boolean(formik.errors.status)}
                                helperText={formik.touched.status && formik.errors.status}
                            >
                                <MenuItem value="available">Chờ điều động</MenuItem>
                                <MenuItem value="in_use">Đang hoạt động</MenuItem>
                                <MenuItem value="maintenance">Hỏng</MenuItem>
                                <MenuItem value="retired">Niêm cất</MenuItem>
                            </TextField>
                            <Autocomplete
                                fullWidth
                                options={departments}
                                getOptionLabel={(option: Department) =>
                                    option.name || ''
                                }
                                value={departments.find((p: any) => p._id === (user?.role === 'manager?' ? user?.department?._id : formik.values.department)) || null}
                                readOnly={user?.role === 'manager'}
                                // disabled
                                onChange={(event, newValue) => {
                                    formik.setFieldValue('department', newValue?._id || '');
                                }}
                                PopperComponent={StyledPopper}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Đơn vị"
                                        error={formik.touched.department && Boolean(formik.errors.department)}
                                        helperText={formik.touched.department && typeof formik.errors.department === 'string' ? formik.errors.department : ''}
                                    />
                                )}
                            />
                            <TextField
                                fullWidth
                                id="coordinates"
                                name="coordinates"
                                label="Tọa độ (lng, lat)"
                                value={`${formik.values.coordinates.lng}, ${formik.values.coordinates.lat}`}
                                onChange={(e) => {
                                    const [latStr, lngStr] = e.target.value.split(',');
                                    const lng = parseFloat(lngStr.trim());
                                    const lat = parseFloat(latStr.trim());
                                    if (!isNaN(lat) && !isNaN(lng)) {
                                        const coords = { lat, lng };
                                        formik.setFieldValue('coordinates', coords);
                                        setMapCoords(coords);
                                    }
                                }}
                                error={formik.touched.coordinates && Boolean(formik.errors.coordinates)}
                                helperText={
                                    (formik.touched.coordinates?.lat && formik.errors.coordinates?.lat) ||
                                    (formik.touched.coordinates?.lng && formik.errors.coordinates?.lng)
                                }
                            />
                            {isLoaded && (
                                <GoogleMap
                                    mapContainerStyle={containerStyle}
                                    center={mapCoords || defaultCenter}
                                    zoom={20}
                                    onClick={handleMapClick}
                                >
                                    {mapCoords && <Marker
                                        position={mapCoords}
                                        icon={{
                                            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                                            scaledSize: new window.google.maps.Size(40, 40),
                                        }}
                                    />}
                                </GoogleMap>
                            )}

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

export default Vehicles; 