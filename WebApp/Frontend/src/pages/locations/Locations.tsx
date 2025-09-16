import React, { useState, useEffect, useRef } from 'react';
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
    AccordionDetails,
    Checkbox,
    TablePagination,
    Breadcrumbs,
    InputAdornment,
    LinearProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Settings, ExpandMore, Search, UploadFile, Download } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Location } from '../../types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import LocationSelector from '../../fixLeafletIcon';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';
import { locationValidationSchema } from '../../utils/validation';

const containerStyle = {
    width: '100%',
    height: '300px',
};

const defaultCenter = {
    lat: 20.9926575,
    lng: 105.8437303,
};


const Locations: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [value, setValue] = useState("")
    const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [user] = useAtom(userAtom)
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);

    const handleSelected = (locationId: string) => {
        setSelectedLocations(prev =>
            prev.includes(locationId)
                ? prev.filter(id => id !== locationId)
                : [...prev, locationId]
        );
    };
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    const defaultColumns = [
        { id: 'name', label: 'Tên' },
        { id: 'coordinates', label: 'Tọa độ' },
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
            showSuccessAlert('Thêm điểm đổ tải thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedLoc: Partial<Location>) =>
            api.put(`/locations/${updatedLoc._id}`, updatedLoc).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            showSuccessAlert('Cập nhật điểm đổ tải thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (ids: string[]) => api.delete(`/locations`, { data: { ids } }).then(res => res.data.message),
        onSuccess: (message) => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            setSelectedLocations([]);
            showSuccessAlert(message || 'Xóa thành công');
            handleClose()
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });
    const [progress, setProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false);
    const importFile = useMutation({
        mutationFn: (formData: FormData) =>
            api.post('/locations/importFile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
                    );
                    setProgress(percent);
                }
            }).then(res => res.data.message),
        onMutate: () => {
            setIsUploading(true);
            setProgress(0); // Reset tiến trình khi bắt đầu
        },
        onSuccess: (message) => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            setIsUploading(false);
            showSuccessAlert(message || "Import thành công!");
            handleClose();
        },
        onError: (error: any) => {
            setIsUploading(false);
            showErrorAlert(error.response?.data?.message || 'Lỗi khi import');
        }
    });

    const exportExcel = useMutation({
        mutationFn: () => {
            return api.post('/locations/exportFile', {}, {
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
    const formik = useFormik({
        initialValues: {
            name: '',
            distance: 0,
            coordinates: { lat: 0, lng: 0 },
        },
        validationSchema: locationValidationSchema,
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
        setTimeout(() => {
            if (formRef.current) {
                formRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 500);
    };


    const handleClose = () => {
        setOpen(false);
        setSelectedLocation(null);
        setExpanded(false);
        formik.resetForm();
        setMapCoords(null);
    };

    const handleDelete = () => {
        if (selectedLocations.length === 0) {
            showErrorAlert('Không tìm thấy bản ghi cần xóa');
            return;
        }
        showConfirmAlert(`Bạn có muốn xóa ${selectedLocations.length} bản ghi?`).then((result) => {
            if (result.isConfirmed) {
                deleteMutation.mutate(selectedLocations);
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

    const pageData = (locations: any[], page: number, pageSize: number) => {
        let data;
        if (!page && !pageSize) {
            data = locations
        } else {
            data = locations.slice(page * pageSize, (page + 1) * pageSize)
        }
        return data
    }
    const paginatedData = pageData(locations, page, pageSize);

    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb">
                <Typography>Danh mục</Typography>
                <Typography>Điểm đổ tải</Typography>
            </Breadcrumbs>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, mt: 3 }}>
                <Typography variant="h3" color={'blue'}>Điểm đổ tải</Typography>
            </Box>
            <Accordion expanded={expanded} ref={formRef}>
                <AccordionSummary
                    expandIcon={<></>}
                    aria-controls="panel1-content"
                    id="panel1-header"
                    sx={{
                        backgroundColor: 'white', '&.Mui-focusVisible': {
                            backgroundColor: 'white',
                        },
                    }}
                >
                    <Box sx={{
                        display: 'flex', gap: 2, alignItems: 'center', width: '100%', flexDirection: {
                            xs: 'column',
                            md: 'row',
                        }
                    }}>
                        {user?.role === "admin" && <Box display={'flex'} gap={2} sx={{
                            flexDirection: {
                                xs: 'column',
                                md: 'row',
                            },
                            width: {
                                xs: '100%', // Group này chiếm 100% khi xếp dọc
                                md: 'auto',
                            },
                        }}>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                                Thêm
                            </Button>
                            <Button variant="contained" startIcon={<DeleteIcon />} color='error' onClick={handleDelete}>
                                Xóa
                            </Button>
                        </Box>}
                        <Box flex={2} sx={{
                            flexDirection: {
                                xs: 'column',
                                md: 'row',
                            },
                            width: {
                                xs: '100%', // Group này chiếm 100% khi xếp dọc
                                md: 'auto',
                            },
                        }}>
                            <TextField fullWidth size="small" value={value}
                                placeholder='Tìm kiếm theo tên điểm đổ tải'
                                onChange={(e) => setValue(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Search sx={{ fontSize: 24 }} />
                                        </InputAdornment>
                                    )
                                }}>
                            </TextField>
                        </Box>
                        {user?.role === "admin" && <Box display="flex" gap={2} sx={{
                            flexDirection: {
                                xs: 'column',
                                md: 'row',
                            },
                            width: {
                                xs: '100%', // Group này chiếm 100% khi xếp dọc
                                md: 'auto',
                            },
                        }}>
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
                                    fullWidth
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
                        </Box>}
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <DialogTitle>{selectedLocation ? 'Sửa điểm đổ tải' : 'Thêm điểm đổ tải'}</DialogTitle>
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
            {isUploading && (
                <Box sx={{ mt: 2 }}>
                    {progress < 100 ? (
                        <>
                            <Typography variant="body2" align="center">
                                Đang tải lên... {progress}%
                            </Typography>
                            <LinearProgress variant="determinate" value={progress} />
                        </>
                    ) : (
                        <>
                            <Typography variant="body2" align="center">
                                Đang xử lý dữ liệu trên server...
                            </Typography>
                            <LinearProgress />
                        </>
                    )}
                </Box>
            )}
            <Box display="flex" alignItems='center' sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h4">Bảng điểm đổ tải</Typography>
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
                <Table sx={{
                    "& td, & th": { padding: "4px 8px" },
                }}>
                    <TableHead>
                        <TableRow>
                            {user?.role === "admin" && <TableCell align='center' sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: 18 }}>
                                <Checkbox
                                    color="primary"
                                    checked={locations.length > 0 && selectedLocations.length === locations.length}
                                    indeterminate={selectedLocations.length > 0 && selectedLocations.length < locations.length}
                                    onChange={() => {
                                        if (selectedLocations.length === locations.length) {
                                            setSelectedLocations([]);
                                        } else {
                                            setSelectedLocations(locations.map((item: Location) => item._id));
                                        }
                                    }}
                                />
                            </TableCell>}
                            {defaultColumns.map((col) =>
                                visibleColumns.includes(col.id) && (
                                    <TableCell key={col.id} align="center" sx={{
                                        backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: 18
                                    }}>
                                        {col.label}
                                    </TableCell>
                                )
                            )}
                            {user?.role === "admin" && <TableCell align="center" sx={{
                                backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: 18, width: 50
                            }}>
                                Sửa
                            </TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData.map((loc: any, index: number) => {
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
                                <TableRow key={loc._id} sx={{
                                    // Dùng chỉ mục index để tạo màu xen kẽ
                                    backgroundColor: index % 2 === 0 ? 'white' : '#e3f2fd',
                                }}>
                                    {user?.role === "admin" && <TableCell align='center' sx={{ width: 50 }}><Checkbox onChange={() => handleSelected(loc._id)} checked={selectedLocations.includes(loc._id)} /></TableCell>}
                                    {visibleColumns.includes('name') && <TableCell sx={{}}>{loc.name}</TableCell>}
                                    {visibleColumns.includes('coordinates') && <TableCell sx={{}}>{coordsDisplay}</TableCell>}
                                    {user?.role === "admin" && <TableCell sx={{}}>
                                        <IconButton color="primary" onClick={async () => {
                                            if (open) {
                                                const result = await showConfirmAlert('Bạn đang cập nhật một mục. Nếu tiếp tục chỉnh sửa, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?');
                                                if (result.isConfirmed) {
                                                    handleOpen(loc);
                                                }
                                            } else {
                                                handleOpen(loc);
                                            }
                                        }}>
                                            <EditIcon />
                                        </IconButton>
                                    </TableCell>}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={locations.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={pageSize}
                    onRowsPerPageChange={(event) => {
                        setPageSize(parseInt(event.target.value, 10));
                        setPage(0);
                    }}
                />
            </TableContainer>

        </Box >
    );
};

export default Locations;
