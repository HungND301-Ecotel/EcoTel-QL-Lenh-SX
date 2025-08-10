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
    Autocomplete,
    styled,
    Popper,
    Menu,
    MenuItem,
    Switch,
    ListItemText,
    Checkbox,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Settings,
    ExpandMore,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Department, Device, DeviceType } from '../../types';
// import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import LocationSelector from '../../fixLeafletIcon';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';

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
    coordinates: yup.object({
        lng: yup.number().required('Vui lòng chọn vĩ độ'),
        lat: yup.number().required('Vui lòng chọn kinh độ'),
    }).required('Vui lòng chọn tọa độ'),
    department: yup.string().required('Vui lòng chọn đơn vị'),
    category: yup.string().required('Vui lòng chọn loại máy'),
    status: yup.string().oneOf(['available', 'in_use', 'maintenance', 'retired']).required('Vui lòng chọn trạng thái'),
});

const Machines: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
    const [q, setQ] = useState("")
    const [status, setStatus] = useState("")
    const [department, setDepartment] = useState("")
    const [mapCoords, setMapCoords] = useState<{ lat: number, lng: number; } | null>(null);

    const [user, setUser] = useAtom(userAtom)
    const [expanded, setExpanded] = useState(false);

    const handleSelected = (deviceId: string) => {
        setSelectedDevices(prev =>
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    };
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    const defaultColumns = [
        { id: 'name', label: 'Tên máy' },
        { id: 'code', label: 'Biển số', width: 100 },
        { id: 'vehicleNumber', label: 'Số máy' },
        { id: 'category', label: 'Loại máy' },
        { id: 'material', label: 'Chủng loại' },
        { id: 'fuelType', label: 'Nhiên liệu' },
        { id: 'power', label: 'Công suất' },
        { id: 'coordinates', label: 'Vị trí' },
        { id: 'department', label: 'Đơn vị' },
        { id: 'status', label: 'Trạng thái' },
        { id: 'edit', label: 'Sửa', width: 100 },
    ]
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(i => i.id))

    const handleToggleColumn = (id: string) => {
        setVisibleColumns(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }
    const handleChange = (value: string) => {
        setStatus(prev => (prev === value ? '' : value)); // bỏ chọn nếu click lại
    };

    const queryClient = useQueryClient();

    const { data: machines = [], isLoading } = useQuery({
        queryKey: ['machines', q, department, status],
        queryFn: () => api.get(`/devices?q=${q}&department=${department}&status=${status}`).then(res => res.data.data?.filter((item: any) => item?.category?.name.toLowerCase() !== "vận tải".toLowerCase())),
    });
    const { data: allMachines = [] } = useQuery({
        queryKey: ['allMachines', q, department],
        queryFn: () => api.get(`/devices?q=${q}&department=${department}`).then(res => res.data.data?.filter((item: any) => item?.category?.name.toLowerCase() !== "vận tải".toLowerCase())),
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
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            showSuccessAlert('Thêm thông tin máy thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedDevice: Partial<Device>) => {
            return api.put(`/devices/${updatedDevice._id}`, updatedDevice).then(res => res.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            showSuccessAlert('Cập nhật thông tin máy thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (ids: string[]) => api.delete(`/devices`, { data: { ids } }).then(res => res.data.message),
        onSuccess: (message) => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            setSelectedDevices([]);
            showSuccessAlert(message || 'Xóa thành công');
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
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
            power: undefined as number | undefined,
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
            setMapCoords(null);
        }
        setExpanded(true);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedDevice(null);
        setExpanded(false);
        formik.resetForm();
        setMapCoords(null);
    };

    const handleDelete = () => {
        if (selectedDevices.length === 0) {
            showErrorAlert('Không tìm thấy bản ghi cần xóa');
            return;
        }
        showConfirmAlert(`Bạn có muốn xóa ${selectedDevices.length} bản ghi?`).then((result) => {
            if (result.isConfirmed) {
                deleteMutation.mutate(selectedDevices);
            }
        });
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
                <Typography variant="h4">Quản lý thông tin máy</Typography>


            </Box>
            {/* <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, gap: 2 }}>
                <Typography><b style={{ color: 'green' }}>Chờ điều động:</b> {machines.filter((o: Device) => o.status === "available").length}</Typography>
                <Typography><b style={{ color: 'red' }}>Đang hoạt động:</b> {machines.filter((o: Device) => o.status === "in_use").length}</Typography>
                <Typography><b style={{ color: 'orange' }}>Hỏng:</b> {machines.filter((o: Device) => o.status === "maintenance").length}</Typography>
                <Typography><b style={{ color: 'grey' }}>Niêm cất:</b> {machines.filter((o: Device) => o.status === "retired").length}</Typography>
            </Box> */}
            <Box sx={{ flex: 1, flexDirection: 'column', mb: 3 }}>
                <Typography><h3>Tìm kiếm</h3></Typography>
                <Box sx={{ display: 'flex', gap: 4 }}>
                    <TextField fullWidth size="small" value={q}
                        placeholder='Tìm kiếm theo tên, biển số, số máy, chủng loại'
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
            {user?.role !== "dispatcher" && <Accordion expanded={expanded}>
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpen()}
                        >
                            Thêm thông tin máy
                        </Button>
                        <Button variant="contained" startIcon={<DeleteIcon />} color='error' onClick={handleDelete}>
                            Xóa
                        </Button>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <DialogTitle>
                        {selectedDevice ? 'Sửa thông tin máy' : 'Thêm thông tin máy'}
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
                                    label="Tên máy"
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    error={formik.touched.name && Boolean(formik.errors.name)}
                                    helperText={formik.touched.name && formik.errors.name}
                                />
                                <TextField
                                    fullWidth
                                    id="vehicleNumber"
                                    name="vehicleNumber"
                                    label="Số máy"
                                    value={formik.values.vehicleNumber}
                                    onChange={formik.handleChange}
                                    error={formik.touched.vehicleNumber && Boolean(formik.errors.vehicleNumber)}
                                    helperText={formik.touched.vehicleNumber && formik.errors.vehicleNumber}
                                />
                                <Autocomplete
                                    fullWidth
                                    options={DeviceTypes.filter((item: DeviceType) => item.name !== "Vận tải")}
                                    getOptionLabel={(option: DeviceType) =>
                                        option.name || ''
                                    }
                                    value={DeviceTypes.find((p: any) => p._id === formik.values.category) || null}
                                    onChange={(event, newValue) => {
                                        formik.setFieldValue('category', newValue?._id || '');
                                    }}
                                    PopperComponent={StyledPopper}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Loại máy"
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
                                    id="power"
                                    name="power"
                                    label="Công suất"
                                    value={formik.values.power}
                                    onChange={formik.handleChange}
                                    error={formik.touched.power && Boolean(formik.errors.power)}
                                    helperText={formik.touched.power && formik.errors.power}
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
                                    value={`${formik.values.coordinates.lat}, ${formik.values.coordinates.lng}`}
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

                                <MapContainer
                                    center={[defaultCenter.lat, defaultCenter.lng]}
                                    zoom={18}
                                    style={containerStyle}
                                >
                                    {/* Giao diện bản đồ giống Google Maps (CartoDB) */}
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; OpenStreetMap contributors'
                                    />
                                    <LocationSelector onSelect={(coords) => setMapCoords(coords)} />
                                    {mapCoords && <Marker
                                        position={mapCoords}
                                    />}
                                </MapContainer>

                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Hủy</Button>
                        <Button onClick={() => formik.handleSubmit()} variant="contained">
                            {selectedDevice ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogActions>
                </AccordionDetails>
            </Accordion>}
            <Box display="flex" gap={2} alignItems={'center'} justifyContent='flex-end'>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='info' name="status" checked={status === ''}
                        onChange={() => handleChange('')} />
                    <ListItemText primary={`Tất cả (${allMachines.length})`} sx={{ color: 'blue' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='success' name="status" checked={status === 'available'}
                        onChange={() => handleChange('available')} />
                    <ListItemText primary={`Chờ điều động (${allMachines.filter((o: Device) => o.status === "available").length})`} sx={{ color: 'green' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='error' name="status" checked={status === 'in_use'}
                        onChange={() => handleChange('in_use')} />
                    <ListItemText primary={`Đang hoạt động (${allMachines.filter((o: Device) => o.status === "in_use").length})`} sx={{ color: 'red' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='warning' name="status" checked={status === 'maintenance'}
                        onChange={() => handleChange('maintenance')} />
                    <ListItemText primary={`Hỏng (${allMachines.filter((o: Device) => o.status === "maintenance").length})`} sx={{ color: 'orange' }} />
                </Box>
            </Box>
            <Box display="flex" justifyContent='space-between' alignItems='center' sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h3" sx={{ p: 2 }}>Bảng thông tin máy</Typography>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                    <Settings sx={{ fontSize: 30 }} />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    sx={{ maxHeight: 400 }}
                >
                    {defaultColumns.map((col) => (
                        <MenuItem key={col.id} onClick={() => handleToggleColumn(col.id)}>
                            <Switch checked={visibleColumns.includes(col.id)} />
                            <ListItemText primary={col.label} />
                        </MenuItem>
                    ))}
                </Menu>
            </Box>
            <Paper sx={{ width: '100%', overflowX: "initial" }}>
                <TableContainer>
                    <Table stickyHeader aria-label="sticky table" sx={{
                        "& td, & th": { padding: "4px 8px" },
                    }}>
                        <TableHead>
                            <TableRow>
                                <TableCell align='center' sx={{ backgroundColor: '#f5f5f5', border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}></TableCell>
                                {visibleColumns.includes('code') && <TableCell align='center' sx={{
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 3,
                                    minWidth: 80,
                                    border: '1px solid black',
                                    fontWeight: 'bold', fontSize: 18
                                }}>Biển số</TableCell>}
                                {visibleColumns.includes('name') && <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18, minWidth: 80, }}>Tên máy</TableCell>}
                                {visibleColumns.includes('vehicleNumber') && <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Số máy</TableCell>}
                                {visibleColumns.includes('category') && <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Loại máy</TableCell>}
                                {visibleColumns.includes('material') && <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Chủng loại</TableCell>}
                                {visibleColumns.includes('fuelType') && <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Nhiên liệu</TableCell>}
                                {visibleColumns.includes('power') && <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Công suất</TableCell>}
                                {visibleColumns.includes('coordinates') && <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Vị trí</TableCell>}
                                {visibleColumns.includes('department') && <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Đơn vị</TableCell>}
                                {visibleColumns.includes('status') && <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Trạng thái</TableCell>}
                                {visibleColumns.includes('edit') && (user?.role !== 'dispatcher' && <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Sửa</TableCell>)}
                            </TableRow>
                        </TableHead>
                        {!isLoading ? <TableBody>
                            {machines.map((device: any) => {
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
                                        <TableCell align='center' sx={{ border: '1px solid black', width: 50 }}><Checkbox onChange={() => handleSelected(device._id)} checked={selectedDevices.includes(device._id)} /></TableCell>
                                        {visibleColumns.includes('name') && <TableCell align='center' sx={{
                                            position: 'sticky',
                                            left: 0,
                                            backgroundColor: 'white',
                                            zIndex: 1,
                                            minWidth: 80,
                                            border: '1px solid black'
                                        }}>{device.code}</TableCell>}
                                        {visibleColumns.includes('name') && <TableCell sx={{ border: '1px solid black', minWidth: 100, }}>{device.name}</TableCell>}
                                        {visibleColumns.includes('vehicleNumber') && <TableCell align='center' sx={{ border: '1px solid black', minWidth: 70, }}>{device.vehicleNumber}</TableCell>}
                                        {visibleColumns.includes('category') && <TableCell align="center" sx={{ border: '1px solid black', minWidth: 100, }}>{device.category?.name}</TableCell>}
                                        {visibleColumns.includes('material') && <TableCell align="center" sx={{ border: '1px solid black', minWidth: 100, }}>{device.material}</TableCell>}
                                        {visibleColumns.includes('fuelType') && <TableCell align="center" sx={{ border: '1px solid black', minWidth: 100, }}>{device.fuelType}</TableCell>}
                                        {visibleColumns.includes('power') && <TableCell align="center" sx={{ border: '1px solid black', minWidth: 100, }}>{device.power}</TableCell>}
                                        {visibleColumns.includes('coordinates') && <TableCell sx={{ border: '1px solid black', minWidth: 130, }}>{coordsDisplay}</TableCell>}
                                        {visibleColumns.includes('department') && <TableCell sx={{ border: '1px solid black', minWidth: 140, }}>
                                            {typeof device.department === 'object' && device.department !== null
                                                ? device.department.name
                                                : device.department || 'Chưa có'}
                                        </TableCell>}
                                        {visibleColumns.includes('status') && <TableCell align='center' sx={{ border: '1px solid black', minWidth: 130, }}>
                                            <Chip
                                                sx={{ width: '120px' }}
                                                label={device.status === 'in_use' ? 'Đang hoạt động' :
                                                    device.status === 'maintenance' ? 'Hỏng' :
                                                        device.status === 'retired' ? 'Niêm cất' :
                                                            device.status === 'available' ? 'Chờ điều động' : device.status}
                                                color={device.status === 'in_use' ? 'error' :
                                                    device.status === 'maintenance' ? 'warning' :
                                                        device.status === 'retired' ? 'secondary' :
                                                            device.status === 'available' ? 'success' : 'default'}
                                            />
                                        </TableCell>}
                                        {visibleColumns.includes('edit') && (user?.role !== 'dispatcher' && <TableCell align='center' sx={{ border: '1px solid black', minWidth: 50, }}>
                                            <IconButton
                                                color="primary"
                                                onClick={async () => {
                                                    if (open) {
                                                        const result = await showConfirmAlert('Bạn đang cập nhật một mục. Nếu tiếp tục chỉnh sửa, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?');
                                                        if (result.isConfirmed) {
                                                            handleOpen(device);
                                                        }
                                                    } else {
                                                        handleOpen(device);
                                                    }
                                                }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </TableCell>)}
                                    </TableRow>)
                            })}
                        </TableBody> : <Typography>Loading...</Typography>}
                    </Table>
                </TableContainer>
            </Paper>

        </Box>
    );
};

export default Machines; 