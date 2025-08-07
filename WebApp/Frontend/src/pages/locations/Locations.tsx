import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
    IconButton, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, TextField, MenuItem,
    Menu,
    Switch,
    ListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Settings, ExpandMore } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Location } from '../../types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import LocationSelector from '../../fixLeafletIcon';

const containerStyle = {
    width: '100%',
    height: '300px',
};

const defaultCenter = {
    lat: 20.9926575,
    lng: 105.8437303,
};

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên vị trí'),
    coordinates: yup.object({
        lat: yup.number().required('Vui lòng chọn vĩ độ'),
        lng: yup.number().required('Vui lòng chọn kinh độ'),
    }).required('Vui lòng chọn tọa độ'),
    distance: yup.number().min(0, 'Khoảng cách phải lớn hơn hoặc bằng 0').required('Vui lòng nhập khoảng cách'),
});

const Locations: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [value, setValue] = useState("")
    const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);

    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);

    const handleChangeAction = (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded);
    };
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    const defaultColumns = [
        { id: 'name', label: 'Tên' },
        { id: 'coordinates', label: 'Tọa độ' },
        { id: 'actions', label: 'Thao tác', width: 100 },
    ]
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(i => i.id))

    const handleToggleColumn = (id: string) => {
        setVisibleColumns(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }


    const { data: locations = [], isLoading } = useQuery({
        queryKey: ['locations', value],
        queryFn: () => api.get(`/locations?name=${value}`).then(res => res.data.data),
    });

    const createMutation = useMutation({
        mutationFn: (newLoc: Partial<Location>) => api.post('/locations', newLoc).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            alert('Thêm vị trí thành công');
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedLoc: Partial<Location>) =>
            api.put(`/locations/${updatedLoc._id}`, updatedLoc).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            alert('Cập nhật vị trí thành công');
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/locations/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            alert('Xóa vị trí thành công');
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            name: '',
            distance: 0,
            coordinates: { lat: 0, lng: 0 },
        },
        validationSchema,
        onSubmit: values => {
            const payload = {
                ...values,
                coordinates: values.coordinates,
            };
            if (selectedLocation) {
                updateMutation.mutate({ ...payload, _id: selectedLocation._id });
                setMapCoords(values.coordinates)
            } else {
                createMutation.mutate(payload);
            }
        },
    });

    // Đồng bộ coordinates khi mapCoords thay đổi
    useEffect(() => {
        if (mapCoords) {
            formik.setFieldValue('coordinates', mapCoords);
        }
    }, [mapCoords]);

    // Mở form, nếu có location thì set dữ liệu lên form và mapCoords
    const handleOpen = (loc?: any) => {
        if (loc) {
            setSelectedLocation(loc);
            const [lng, lat] = loc.coordinates.coordinates;
            formik.setValues({
                ...loc, coordinates: {
                    lng, lat
                },

            });
            setMapCoords({
                lat, lng
            });
        } else {
            setSelectedLocation(null);
            formik.resetForm();
            setMapCoords(null);
        }
        setExpanded(true);
        setOpen(true);
    };


    const handleClose = () => {
        setOpen(false);
        setSelectedLocation(null);
        setExpanded(false);
        formik.resetForm();
        setMapCoords(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa vị trí này?')) {
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
                <Typography variant="h4">Quản lý vị trí</Typography>

            </Box>
            <Box sx={{ flex: 1, flexDirection: 'column' }}>
                <Typography><h3>Tìm kiếm</h3></Typography>
                <TextField fullWidth size="small" value={value}
                    placeholder='Tìm kiếm theo tên vị trí'
                    onChange={(e) => setValue(e.target.value)}>
                </TextField>
            </Box>
            <Accordion expanded={expanded} onChange={handleChangeAction}>
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                        Thêm vị trí
                    </Button>
                </AccordionSummary>
                <AccordionDetails>
                    <DialogTitle>{selectedLocation ? 'Sửa vị trí' : 'Thêm vị trí'}</DialogTitle>
                    <DialogContent>
                        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    id="name"
                                    name="name"
                                    label="Tên điểm đổ"
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    error={formik.touched.name && Boolean(formik.errors.name)}
                                    helperText={formik.touched.name && formik.errors.name}
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
                                {/* {isLoaded && (
                                <GoogleMap
                                    mapContainerStyle={containerStyle}
                                    center={mapCoords || defaultCenter}
                                    zoom={15}
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
                            )} */}
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
                                <TextField
                                    fullWidth
                                    id="distance"
                                    name="distance"
                                    type="number"
                                    label="Phạm vi nhận diện (mét)"
                                    value={formik.values.distance}
                                    onChange={formik.handleChange}
                                    error={formik.touched.distance && Boolean(formik.errors.distance)}
                                    helperText={formik.touched.distance && formik.errors.distance}
                                ></TextField>
                            </Box>

                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Hủy</Button>
                        <Button onClick={() => formik.submitForm()} variant="contained">
                            {selectedLocation ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogActions>
                </AccordionDetails>
            </Accordion>
            <Box display="flex" justifyContent='space-between' alignItems='center' sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h3" sx={{ p: 2 }}>Bảng vị trí</Typography>
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
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {defaultColumns.map((col) =>
                                visibleColumns.includes(col.id) && (
                                    <TableCell key={col.id} align="center" sx={{
                                        backgroundColor: '#f5f5f5', border: '1px solid black', fontWeight: 'bold', fontSize: 18, width: col.width, minWidth: col.width
                                    }}>
                                        {col.label}
                                    </TableCell>
                                )
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {locations.map((loc: any) => {
                            let coordsDisplay = '';
                            if (
                                loc.coordinates &&
                                loc.coordinates.type === 'Point' &&
                                Array.isArray(loc.coordinates.coordinates)
                            ) {
                                const [lng, lat] = loc.coordinates.coordinates;
                                coordsDisplay = `${lat},${lng}`; // Lấy lat trước để hiển thị như người dùng quen
                            } else {
                                coordsDisplay = 'Không có tọa độ';
                            }
                            return (
                                <TableRow key={loc._id}>
                                    {visibleColumns.includes('name') && <TableCell sx={{ border: '1px solid black' }}>{loc.name}</TableCell>}
                                    {visibleColumns.includes('coordinates') && <TableCell sx={{ border: '1px solid black' }}>{coordsDisplay}</TableCell>}
                                    {visibleColumns.includes('actions') && <TableCell sx={{ border: '1px solid black' }}>
                                        <IconButton color="primary" onClick={() => handleOpen(loc)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton color="error" onClick={() => handleDelete(loc._id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

        </Box >
    );
};

export default Locations;
