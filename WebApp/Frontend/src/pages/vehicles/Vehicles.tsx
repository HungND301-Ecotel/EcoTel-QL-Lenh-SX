import React, { useEffect, useRef, useState } from 'react';
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
    Menu,
    Switch,
    ListItemText,
    Checkbox,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TablePagination,
    Breadcrumbs,
    InputAdornment,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Settings,
    ExpandMore,
    UploadFile,
    Download,
    Search,
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
    const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
    const [q, setQ] = useState("")
    const [status, setStatus] = useState("")
    const [department, setDepartment] = useState("")
    const [mapCoords, setMapCoords] = useState<{ lat: number, lng: number; } | null>(null);
    const [user, setUser] = useAtom(userAtom)
    const [expanded, setExpanded] = useState(false);
    const formScrollRef = useRef<HTMLDivElement>(null);
    const [formKey, setFormKey] = useState(0);

    const handleSelected = (deviceId: string) => {
        setSelectedDevices(prev =>
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    };
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    const defaultColumns = [
        { id: 'name', label: 'Tên xe' },
        { id: 'code', label: 'Biển số', width: 100 },
        { id: 'vehicleNumber', label: 'Số xe' },
        { id: 'category', label: 'Loại xe' },
        { id: 'material', label: 'Chủng loại' },
        { id: 'fuelType', label: 'Nhiên liệu' },
        { id: 'capacity', label: 'Trọng tải' },
        { id: 'coordinates', label: 'Vị trí' },
        { id: 'department', label: 'Đơn vị' },
        { id: 'status', label: 'Trạng thái' },
        { id: 'edit', label: 'Sửa', width: 50 },
    ]
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(i => i.id))

    const handleToggleColumn = (id: string) => {
        setVisibleColumns(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }
    const handleChange = (value: string) => {
        setStatus(prev => (prev === value ? '' : value)); // bỏ chọn nếu click lại
    };

    const queryClient = useQueryClient();

    const { data: vehicles = [], isLoading } = useQuery({
        queryKey: ['vehicles', q, department, status],
        queryFn: () => api.get(`/devices?q=${q}&department=${department}&status=${status}`).then(res => res.data.data?.filter((item: any) => item?.category?.name.toLowerCase() === "vận tải".toLowerCase())),
    });
    const { data: allVehicles = [] } = useQuery({
        queryKey: ['allVehicles', q, department],
        queryFn: () => api.get(`/devices?q=${q}&department=${department}`).then(res => res.data.data?.filter((item: any) => item?.category?.name.toLowerCase() === "vận tải".toLowerCase())),
    });
    const { data: DeviceTypes = [] } = useQuery({
        queryKey: ['DeviceTypes'],
        queryFn: () => api.get(`/DeviceTypes`).then(res => res.data.data),
    });


    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data.data),
    });


    const importFile = useMutation({
        mutationFn: (formData: FormData) =>
            api.post('/devices/importFile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            }).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            showSuccessAlert("Import thành công!");
        },
        onError: (error: any) => {
            showErrorAlert(error.response?.data?.message || 'Lỗi khi import');
        }
    });

    const exportExcel = useMutation({
        mutationFn: () => {
            return api.post('/devices/exportFile', { data: vehicles }, {
                responseType: 'blob',
            }).then(res => {
                const blob = new Blob([res.data], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `*.xlsx`);

                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
                window.URL.revokeObjectURL(url);
            });
        },
        onSuccess: () => { },
        onError: (error: any) => {
            showErrorAlert(error.response?.data?.message || error.message || 'Lỗi');
        }
    });

    const createMutation = useMutation({
        mutationFn: (newDevice: Partial<Device>) =>
            api.post('/devices', newDevice).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            showSuccessAlert('Thêm phương tiện thành công');
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
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            showSuccessAlert('Cập nhật phương tiện thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (ids: string[]) => api.delete(`/devices`, { data: { ids } }).then(res => res.data.message),
        onSuccess: (message) => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
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

    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);

    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, page: number) => {
        setPage(page);
    };

    const pageData = (vehicles: any[], page: number, pageSize: number) => {
        let data;
        if (!page && !pageSize) {
            data = vehicles
        } else {
            data = vehicles.slice(page * pageSize, (page + 1) * pageSize)
        }
        return data
    }
    const paginatedData = pageData(vehicles, page, pageSize);
    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb">
                <Typography>Danh mục</Typography>
                <Typography>Thông tin xe</Typography>
            </Breadcrumbs>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, mt: 3 }}>
                <Typography variant="h3" color={'blue'}>Thông tin xe</Typography>
            </Box>
            <Accordion expanded={expanded}>
                <AccordionSummary
                    expandIcon={
                        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                            <Settings sx={{ fontSize: 30 }} />
                        </IconButton>}
                    aria-controls="panel1-content"
                    id="panel1-header"
                    sx={{
                        backgroundColor: 'white', '&.Mui-focusVisible': {
                            backgroundColor: 'white',
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
                        {user?.role !== "dispatcher" && <Box display="flex" gap={2}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpen()}
                            >
                                Thêm
                            </Button>
                            <Button variant="contained" startIcon={<DeleteIcon />} color='error' onClick={handleDelete}>
                                Xóa
                            </Button>
                        </Box>}
                        <Box flex={1}>
                            <Box sx={{ display: 'flex', gap: 4 }}>
                                <TextField fullWidth size="small" value={q}
                                    placeholder='Tìm kiếm theo tên, biển số, số xe, chủng loại'
                                    onChange={(e) => setQ(e.target.value)}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Search sx={{ fontSize: 24 }} />
                                            </InputAdornment>
                                        )
                                    }}>
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
                        <Box display="flex" gap={2}>
                            <input
                                id="upload-excel"
                                type="file"
                                accept=".xlsx, .xls"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        importFile.mutate(formData);
                                    }
                                    e.target.value = "";
                                }}
                            />

                            <label htmlFor="upload-excel">
                                <Button
                                    component="span"
                                    variant="contained"
                                    startIcon={<UploadFile />}
                                >
                                    Tải lên excel
                                </Button>
                            </label>
                            <Button
                                component="span"
                                variant="contained"
                                startIcon={<Download />}
                                onClick={() => exportExcel.mutate()}
                            >
                                Tải xuống
                            </Button>
                        </Box>
                    </Box>
                </AccordionSummary>
                <AccordionDetails key={formKey}>
                    <Box ref={formScrollRef}>
                        <DialogTitle>
                            {selectedDevice ? 'Sửa Thông tin xe' : 'Thêm Thông tin xe'}
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
                                        label="Tên xe"
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
                                        options={DeviceTypes.filter((p: DeviceType) => p.group === "Xe")}
                                        getOptionLabel={(option: DeviceType) =>
                                            option.name || ''
                                        }
                                        value={DeviceTypes.find((p: DeviceType) => p._id === formik.values.category) || null}
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
                                        value={departments.find((p: any) => p._id === (user?.role === 'manager' ? user?.department?._id : formik.values.department)) || null}
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
                    </Box>
                    <DialogActions>
                        <Button onClick={handleClose}>Hủy</Button>
                        <Button onClick={() => formik.handleSubmit()} variant="contained">
                            {selectedDevice ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogActions>
                </AccordionDetails>
            </Accordion>
            <Box display="flex" gap={2} alignItems={'center'} justifyContent='flex-end'>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='info' name="status" checked={status === ''}
                        onChange={() => handleChange('')} />
                    <ListItemText primary={`Tất cả (${allVehicles.length})`} sx={{ color: 'blue' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='success' name="status" checked={status === 'available'}
                        onChange={() => handleChange('available')} />
                    <ListItemText primary={`Chờ điều động (${allVehicles.filter((o: Device) => o.status === "available").length})`} sx={{ color: 'green' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='error' name="status" checked={status === 'in_use'}
                        onChange={() => handleChange('in_use')} />
                    <ListItemText primary={`Đang hoạt động (${allVehicles.filter((o: Device) => o.status === "in_use").length})`} sx={{ color: 'red' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='warning' name="status" checked={status === 'maintenance'}
                        onChange={() => handleChange('maintenance')} />
                    <ListItemText primary={`Hỏng (${allVehicles.filter((o: Device) => o.status === "maintenance").length})`} sx={{ color: 'orange' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='default' name="status" checked={status === 'retired'}
                        onChange={() => handleChange('retired')} />
                    <ListItemText primary={`Niêm cất (${allVehicles.filter((o: Device) => o.status === "retired").length})`} sx={{ color: 'grey' }} />
                </Box>
            </Box>
            <Box display="flex" justifyContent='space-between' alignItems='center' sx={{ mb: 2, mt: 2 }}>
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
                                <TableCell align='center' sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: 18 }}>
                                    <Checkbox
                                        color="primary"
                                        checked={vehicles.length > 0 && selectedDevices.length === vehicles.length}
                                        indeterminate={selectedDevices.length > 0 && selectedDevices.length < vehicles.length}
                                        onChange={() => {
                                            if (selectedDevices.length === vehicles.length) {
                                                setSelectedDevices([]);
                                            } else {
                                                setSelectedDevices(vehicles.map((item: Device) => item._id));
                                            }
                                        }}
                                    />
                                </TableCell>
                                {visibleColumns.includes('code') && <TableCell align='center' sx={{
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 3,
                                    minWidth: 100,

                                    fontWeight: 'bold', fontSize: 18
                                }}>Biển số</TableCell>}
                                {visibleColumns.includes('name') && <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: 18 }}>Tên xe</TableCell>}
                                {visibleColumns.includes('vehicleNumber') && <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: 18 }}>Số xe</TableCell>}
                                {visibleColumns.includes('category') && <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: 18 }}>Loại xe</TableCell>}
                                {visibleColumns.includes('material') && <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: 18 }}>Chủng loại</TableCell>}
                                {visibleColumns.includes('fuelType') && <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: 18 }}>Nhiên liệu</TableCell>}
                                {visibleColumns.includes('capacity') && <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: 18 }}>Trọng tải</TableCell>}
                                {visibleColumns.includes('coordinates') && <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: 18 }}>Vị trí</TableCell>}
                                {visibleColumns.includes('department') && <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: 18 }}>Đơn vị</TableCell>}
                                {visibleColumns.includes('status') && <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: 18 }}>Trạng thái</TableCell>}
                                {visibleColumns.includes('edit') && (user?.role !== 'dispatcher' && <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: 18, width: 50 }}>Sửa</TableCell>)}
                            </TableRow>
                        </TableHead>
                        {!isLoading ? <TableBody>
                            {paginatedData.map((device: any, index: number) => {
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
                                    <TableRow key={device._id} sx={{
                                        // Dùng chỉ mục index để tạo màu xen kẽ
                                        backgroundColor: index % 2 === 0 ? 'white' : '#e3f2fd',
                                    }}>
                                        <TableCell align='center' sx={{ width: 50 }}><Checkbox onChange={() => handleSelected(device._id)} checked={selectedDevices.includes(device._id)} /></TableCell>
                                        {visibleColumns.includes('name') && <TableCell align='center' sx={{
                                            position: 'sticky',
                                            left: 0,
                                            backgroundColor: index % 2 === 0 ? 'white' : '#e3f2fd',
                                            zIndex: 1,
                                            minWidth: 100,
                                        }}>{device.code}</TableCell>}
                                        {visibleColumns.includes('name') && <TableCell sx={{ minWidth: 100, }}>{device.name}</TableCell>}
                                        {visibleColumns.includes('vehicleNumber') && <TableCell align='center' sx={{ minWidth: 50, }}>{device.vehicleNumber}</TableCell>}
                                        {visibleColumns.includes('category') && <TableCell align='center' sx={{ minWidth: 70, }}>{device.category?.name}</TableCell>}
                                        {visibleColumns.includes('material') && <TableCell align='center' sx={{ minWidth: 100, }}>{device.material}</TableCell>}
                                        {visibleColumns.includes('fuelType') && <TableCell align="center" sx={{ minWidth: 130, }}>{device.fuelType}</TableCell>}
                                        {visibleColumns.includes('capacity') && <TableCell align='center' sx={{ minWidth: 100, }}>{device.capacity}</TableCell>}
                                        {visibleColumns.includes('coordinates') && <TableCell sx={{ minWidth: 130, }}>{coordsDisplay}</TableCell>}
                                        {visibleColumns.includes('department') && <TableCell sx={{ minWidth: 130, }}>
                                            {typeof device.department === 'object' && device.department !== null
                                                ? device.department.name
                                                : device.department || 'Chưa có'}
                                        </TableCell>}
                                        {visibleColumns.includes('status') && <TableCell align='center' sx={{ minWidth: 130, }}>
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
                                        {visibleColumns.includes('edit') && (user?.role !== 'dispatcher' && <TableCell align='center' sx={{}}>
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
                <TablePagination
                    component="div"
                    count={vehicles.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={pageSize}
                    onRowsPerPageChange={(event) => {
                        setPageSize(parseInt(event.target.value, 10));
                        setPage(0);
                    }}
                />
            </Paper>

        </Box>
    );
};

export default Vehicles; 