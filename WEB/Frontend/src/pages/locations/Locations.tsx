import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
    IconButton, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, TextField, MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Location } from '../../types';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '300px',
};

const defaultCenter = {
    lat: 21.0278,
    lng: 105.8342,
};

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên vị trí'),
    type: yup.string()
        .oneOf(['dumping', 'screening', 'station', 'warehouse', 'crushing', 'drilling', 'road', 'other'])
        .required('Vui lòng chọn loại'),
    coordinates: yup.object({
        lat: yup.number().required('Vui lòng chọn vĩ độ'),
        lng: yup.number().required('Vui lòng chọn kinh độ'),
    }).required('Vui lòng chọn tọa độ'),
});

const Locations: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);

    const queryClient = useQueryClient();

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: 'AIzaSyCH1SeR2UE42XBo-Xqv-UB_TrfRIfM6YyI',
    });

    const { data: locations=[], isLoading } = useQuery({
        queryKey: ['locations'],
        queryFn: () => api.get('/locations').then(res => res.data.data),
    });

    const createMutation = useMutation({
        mutationFn: (newLoc: Partial<Location>) => api.post('/locations', newLoc).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            handleClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (updatedLoc: Partial<Location>) =>
            api.put(`/locations/${updatedLoc._id}`, updatedLoc).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            handleClose();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/locations/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
        },
    });

    const formik = useFormik({
        initialValues: {
            name: '',
            type: '',
            coordinates: { lat: 0, lng: 0 },
        },
        validationSchema,
        onSubmit: values => {
            const payload = {
                ...values,
                type: values.type as Location['type'],
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
    const handleOpen = (loc?: Location) => {
        if (loc) {
            setSelectedLocation(loc);
            formik.setValues({
                name: loc.name,
                type: loc.type,
                coordinates: {
                    lat: Number(loc.coordinates.lat),
                    lng: Number(loc.coordinates.lng),
                },
            });
            setMapCoords({
                lat: Number(loc.coordinates.lat),
                lng: Number(loc.coordinates.lng),
            });
        } else {
            setSelectedLocation(null);
            formik.resetForm();
            setMapCoords(null);
        }
        setOpen(true);
    };


    const handleClose = () => {
        setOpen(false);
        setSelectedLocation(null);
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
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    Thêm vị trí
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tên</TableCell>
                            <TableCell>Loại</TableCell>
                            <TableCell>Tọa độ</TableCell>
                            <TableCell>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {locations.map((loc: Location) => {
                            let coordsDisplay = '';
                            if (Array.isArray(loc.coordinates)) {
                                coordsDisplay = loc.coordinates.join(', ');
                            } else if (typeof loc.coordinates === 'object' && 'lat' in loc.coordinates && 'lng' in loc.coordinates) {
                                coordsDisplay = `${loc.coordinates.lat}, ${loc.coordinates.lng}`;
                            } else {
                                coordsDisplay = String(loc.coordinates);
                            }
                            return (
                                <TableRow key={loc._id}>
                                    <TableCell>{loc.name}</TableCell>
                                    <TableCell>{loc.type}</TableCell>
                                    <TableCell>{coordsDisplay}</TableCell>
                                    <TableCell>
                                        <IconButton color="primary" onClick={() => handleOpen(loc)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton color="error" onClick={() => handleDelete(loc._id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{selectedLocation ? 'Sửa vị trí' : 'Thêm vị trí'}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                id="name"
                                name="name"
                                label="Tên vị trí"
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
                                label="Loại"
                                value={formik.values.type}
                                onChange={formik.handleChange}
                                error={formik.touched.type && Boolean(formik.errors.type)}
                                helperText={formik.touched.type && formik.errors.type}
                            >
                                <MenuItem value="dumping">Bãi thải</MenuItem>
                                <MenuItem value="screening">Sàng</MenuItem>
                                <MenuItem value="station">Trạm</MenuItem>
                                <MenuItem value="warehouse">Kho</MenuItem>
                                <MenuItem value="crushing">Ghiền đá</MenuItem>
                                <MenuItem value="drilling">Khoan</MenuItem>
                                <MenuItem value="road">Đường</MenuItem>
                                <MenuItem value="other">Khác</MenuItem>
                            </TextField>
                            <TextField
                                fullWidth
                                id="coordinates"
                                name="coordinates"
                                label="Tọa độ (lat, lng)"
                                value={`${formik.values.coordinates.lat}, ${formik.values.coordinates.lng}`}
                                onChange={(e) => {
                                    const [latStr, lngStr] = e.target.value.split(',');
                                    const lat = parseFloat(latStr.trim());
                                    const lng = parseFloat(lngStr.trim());
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
                                    key={mapCoords ? `${mapCoords.lat}-${mapCoords.lng}` : 'default'}
                                    mapContainerStyle={containerStyle}
                                    center={mapCoords || defaultCenter}
                                    zoom={15}
                                    onClick={handleMapClick}
                                >
                                    {mapCoords && <Marker position={mapCoords} />}
                                </GoogleMap>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Hủy</Button>
                    <Button onClick={() => formik.submitForm()} variant="contained">
                        {selectedLocation ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Locations;
