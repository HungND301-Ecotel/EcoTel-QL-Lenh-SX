import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    Tooltip,
} from '@mui/material';
import {
    Assignment as OrderIcon,
    Devices as DeviceIcon,
    AccessTime as ShiftIcon,
    Business as DepartmentIcon,
    Person2,
} from '@mui/icons-material';
import api from '../../config/api.config';
import { Order, Device, Department, Location } from '../../types';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';


const containerStyle = {
    width: '100%',
    height: '500px',
};
const defaultCenter = {
    lat: 20.9926575,
    lng: 105.8437303,
};


const AdminDashboard: React.FC = () => {
    const [mapCoords, setMapCoords] = useState<{ lat: number, lng: number; } | null>(null);
    const apiKey = process.env.REACT_APP_MAP_API_KEY;

    if (!apiKey) {
        throw new Error('REACT_APP_MAP_API_KEY is not defined');
    }
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: apiKey,
    });
    const { data: orders = [] } = useQuery({
        queryKey: ['orders'],
        queryFn: () => api.get('/orders').then(res => res.data.data),
    });

    const { data: devices = [] } = useQuery({
        queryKey: ['devices'],
        queryFn: () => api.get('/devices').then(res => res.data.data),
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['locations'],
        queryFn: () => api.get('/locations').then(res => res.data.data),
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data.data),
    });
    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(res => res.data.data),
    });


    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6} sx={{ height: '100%' }}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Box>
                                    <Typography
                                        variant="h6"
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        Lệnh sản xuất
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        {orders.length}
                                    </Typography>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2
                                    }}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title={`Chưa nhận lệnh: ${orders.filter((o: Order) => o.status === "pending").length}`} placement='top'>
                                                <OrderIcon color='disabled' fontSize='medium' />
                                            </Tooltip>
                                            <Typography>{orders.filter((o: Order) => o.status === "pending").length}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title={`Đã nhận lệnh: ${orders.filter((o: Order) => o.status === "in_progress").length}`} placement='top'>
                                                <OrderIcon sx={{ color: 'green' }} fontSize='medium' />
                                            </Tooltip>
                                            <Typography>{orders.filter((o: Order) => o.status === "in_progress").length}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title={`Lỗi: ${orders.filter((o: Order) => o.status === "warning").length}`} placement='top'>
                                                <OrderIcon color='warning' fontSize='medium' />
                                            </Tooltip>
                                            <Typography>{orders.filter((o: Order) => o.status === "warning").length}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title={`Đã kết thúc: ${orders.filter((o: Order) => o.status === "completed").length}`} placement='top'>
                                                <OrderIcon color='error' fontSize='medium' />
                                            </Tooltip>
                                            <Typography>{orders.filter((o: Order) => o.status === "completed").length}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box
                                    sx={{
                                        color: "#1976d2",
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <OrderIcon color='primary' fontSize='large' />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Box>
                                    <Typography
                                        variant="h6"
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        Phương tiện
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        {devices.length}
                                    </Typography>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2
                                    }}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title={` Chờ điều động: ${devices.filter((o: Device) => o.status === "available").length}`} placement='top'>
                                                <DeviceIcon sx={{ color: 'green' }} fontSize='medium' />
                                            </Tooltip>
                                            <Typography>{devices.filter((o: Device) => o.status === "available").length}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title={`Đang hoạt động: ${devices.filter((o: Device) => o.status === "in_use").length}`} placement='top'>
                                                <DeviceIcon color='error' fontSize='medium' />
                                            </Tooltip>
                                            <Typography>{devices.filter((o: Device) => o.status === "in_use").length}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title={`Hỏng: ${devices.filter((o: Device) => o.status === "maintenance").length}`} placement='top'>
                                                <DeviceIcon color='warning' fontSize='medium' />
                                            </Tooltip>
                                            <Typography>{devices.filter((o: Device) => o.status === "maintenance").length}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title={`Niêm cất: ${devices.filter((o: Device) => o.status === "retired").length}`} placement='top'>
                                                <DeviceIcon color='disabled' fontSize='medium' />
                                            </Tooltip>
                                            <Typography>{devices.filter((o: Device) => o.status === "retired").length}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box
                                    sx={{
                                        color: "#1976d2",
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <DeviceIcon color='primary' fontSize='large' />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Box>
                                    <Typography
                                        variant="h6"
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        Đơn vị
                                    </Typography>
                                    <Typography variant="h4">
                                        {departments.length}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        color: "#1976d2",
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <DepartmentIcon color='primary' fontSize='large' />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6} >
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Box>
                                    <Typography
                                        variant="h6"
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        Nhân viên
                                    </Typography>
                                    <Typography variant="h4">
                                        {users.length}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        color: "#1976d2",
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Person2 color='primary' fontSize='large' />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
                {isLoaded && (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={mapCoords || defaultCenter}
                        zoom={20}
                    >
                        {devices.map((device: any) => {
                            if (!device.coordinates?.coordinates) return null;
                            const [lng, lat] = device.coordinates.coordinates;
                            return (
                                <Marker
                                    key={device._id}
                                    position={{ lat, lng }}
                                    label={{
                                        text: device.code,
                                        fontSize: '12px',
                                        color: 'white',
                                        fontWeight: 'bold',
                                    }}
                                    icon={{
                                        url: 'https://soft-oew7.onrender.com/image/device.png',
                                        scaledSize: new window.google.maps.Size(40, 40),
                                    }}
                                />
                            );
                        })}
                        {locations.map((location: any) => {
                            if (!location.coordinates?.coordinates) return null;
                            const [lng, lat] = location.coordinates.coordinates;
                            return (
                                <Marker
                                    key={locations._id}
                                    position={{ lat, lng }}
                                    label={{
                                        text: location.name,
                                        fontSize: '12px',
                                        color: 'white',
                                        fontWeight: 'bold',
                                    }}
                                    icon={{
                                        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                                        scaledSize: new window.google.maps.Size(40, 40),
                                    }}
                                />
                            );
                        })}
                    </GoogleMap>
                )}
            </Box>
        </Box >
    );
};

export default AdminDashboard; 