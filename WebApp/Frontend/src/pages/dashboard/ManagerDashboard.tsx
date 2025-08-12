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
    Tabs,
    Tab,
    Table,
    TableContainer,
    TableHead,
    TableCell,
    TableRow,
    TableBody,
} from '@mui/material';
import {
    Assignment as OrderIcon,
    Devices as DeviceIcon,
    AccessTime as ShiftIcon,
    Business as DepartmentIcon,
    Person2,
    TableBar,
    MapOutlined,
    Grid3x3,
    Grid3x3Sharp,
    ViewList,
} from '@mui/icons-material';
import api from '../../config/api.config';
import { Order, Device, Department, Location } from '../../types';
// import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { customIcon } from '../../fixLeafletIcon'

const containerStyle = {
    width: '100%',
    height: '70vh',
};
const defaultCenter = {
    lat: 20.9926575,
    lng: 105.8437303,
};

const ManagerDashboard: React.FC = () => {
    const [mapCoords, setMapCoords] = useState<{ lat: number, lng: number; } | null>(null);
    const [tabIndex, setTabIndex] = useState(0);
    const apiKey = process.env.REACT_APP_MAP_API_KEY;


    // if (!apiKey) {
    //     throw new Error('REACT_APP_MAP_API_KEY is not defined');
    // }
    // const { isLoaded } = useJsApiLoader({
    //     googleMapsApiKey: apiKey,
    // });


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

    const { data: count = [] } = useQuery({
        queryKey: ['count'],
        queryFn: () => api.get('/devices/count/status').then(res => res.data.data),
    });
    const departments: string[] = Array.from(
        new Set(
            count.flatMap((c: any) =>
                c.organizations.map((o: any) => o.departmentName)
            )
        )
    );


    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Tổng quan
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
                                        gutterBottom
                                        sx={{ fontWeight: 'bold', }}
                                    >
                                        Lệnh sản xuất
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        gutterBottom
                                        sx={{ fontWeight: 'bold', }}
                                    >
                                        {orders.length}
                                    </Typography>
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
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <OrderIcon color='disabled' fontSize='medium' />
                                        <Typography variant='h6' sx={{ fontWeight: 'bold', }}>Chưa nhận lệnh</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{orders.filter((o: Order) => o.status === "pending").length}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <OrderIcon sx={{ color: 'green' }} fontSize='medium' />
                                        <Typography variant='h6' sx={{ fontWeight: 'bold', }}>Đã nhận lệnh</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{orders.filter((o: Order) => o.status === "in_progress").length}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <OrderIcon color='warning' fontSize='medium' />
                                        <Typography variant='h6' sx={{ fontWeight: 'bold', }}>Lỗi</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{orders.filter((o: Order) => o.status === "warning").length}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <OrderIcon color='error' fontSize='medium' />
                                        <Typography variant='h6' sx={{ fontWeight: 'bold', }}>Đã hoàn thành</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{orders.filter((o: Order) => o.status === "completed").length}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <OrderIcon color='secondary' fontSize='medium' />
                                        <Typography variant='h6' sx={{ fontWeight: 'bold', }}>Đã hủy</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{orders.filter((o: Order) => o.status === "cancel").length}</Typography>
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
                                        gutterBottom
                                        sx={{ fontWeight: 'bold', }}
                                    >
                                        Phương tiện
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        gutterBottom
                                        sx={{ fontWeight: 'bold', }}
                                    >
                                        {devices.length}
                                    </Typography>
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
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <DeviceIcon sx={{ color: 'green' }} fontSize='medium' />
                                        <Typography variant='h6' sx={{ fontWeight: 'bold', }}>Chờ điều động</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{devices.filter((o: Device) => o.status === "available").length}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <DeviceIcon color='error' fontSize='medium' />
                                        <Typography variant='h6' sx={{ fontWeight: 'bold', }}>Đang hoạt động</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{devices.filter((o: Device) => o.status === "in_use").length}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <DeviceIcon color='warning' fontSize='medium' />
                                        <Typography variant='h6' sx={{ fontWeight: 'bold', }}>Hỏng</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{devices.filter((o: Device) => o.status === "maintenance").length}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" gap={2} alignItems={'center'}>
                                        <DeviceIcon color='disabled' fontSize='medium' />
                                        <Typography variant='h6' sx={{ fontWeight: 'bold', }}>Niêm cất</Typography>
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{devices.filter((o: Device) => o.status === "retired").length}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
                        <Tab label="Phương tiện" icon={<ViewList />} />
                        <Tab label="Bản đồ" icon={<MapOutlined />} />
                    </Tabs>
                </Box>
                {tabIndex === 0 && <Box>
                    <Paper sx={{ width: '100%', overflowX: "initial" }}>
                        <TableContainer sx={{ height: '80vh' }}>
                            <Table stickyHeader aria-label="sticky table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align='center' rowSpan={2} sx={{
                                            border: '1px solid black',
                                            minWidth: 150,
                                            position: 'sticky',
                                            left: 0,
                                            top: 0,
                                            fontWeight: 'bold',
                                            fontSize: 18,
                                            zIndex: 3,
                                        }}>Đơn vị</TableCell>
                                        {count.map((item: any, index: number) => (
                                            <TableCell align='center' colSpan={4} key={index} sx={{
                                                border: '1px solid black',
                                                position: 'sticky',
                                                top: 0,
                                                fontWeight: 'bold',
                                                fontSize: 18,
                                                zIndex: 2,
                                            }}>{item.typeName}</TableCell>
                                        ))}
                                    </TableRow>
                                    <TableRow>
                                        {count.map((item: any) => (
                                            <>
                                                <TableCell align='center' sx={{
                                                    border: '1px solid black', minWidth: 150, position: 'sticky',
                                                    top: 56,
                                                    fontWeight: 'bold',
                                                    fontSize: 18,
                                                    zIndex: 1,
                                                    color: 'green',
                                                }}>Chờ điều động</TableCell>
                                                <TableCell align='center' sx={{
                                                    border: '1px solid black', minWidth: 150, position: 'sticky',
                                                    top: 56,
                                                    fontWeight: 'bold',
                                                    fontSize: 18,
                                                    zIndex: 1,
                                                    color: 'red',
                                                }}>Đang hoạt động</TableCell>
                                                <TableCell align='center' sx={{
                                                    border: '1px solid black', minWidth: 50, position: 'sticky',
                                                    top: 56,
                                                    fontWeight: 'bold',
                                                    fontSize: 18,
                                                    zIndex: 1,
                                                    color: 'orange',
                                                }}>Hỏng</TableCell>
                                                <TableCell align='center' sx={{
                                                    border: '1px solid black', minWidth: 100, position: 'sticky',
                                                    top: 56,
                                                    fontWeight: 'bold',
                                                    fontSize: 18,
                                                    zIndex: 1,
                                                }}>Niêm cất</TableCell>
                                            </>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {departments.map((item: string, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell align='center' sx={{
                                                border: '1px solid black',
                                                position: 'sticky',
                                                left: 0,
                                                fontWeight: 'bold',
                                                fontSize: 18,
                                                zIndex: 1,
                                                minWidth: 150
                                            }}>{item}</TableCell>
                                            {count.map((type: any, typeIndex: number) => {
                                                const org = type.organizations.find((o: any) => o.departmentName === item);
                                                const s = org?.statusCounts ?? {};

                                                return (
                                                    <React.Fragment key={typeIndex}>
                                                        <TableCell align='center' sx={{ border: '1px solid black' }}>{s.available || 0}</TableCell>
                                                        <TableCell align='center' sx={{ border: '1px solid black' }}>{s.in_use || 0}</TableCell>
                                                        <TableCell align='center' sx={{ border: '1px solid black' }}>{s.maintenance || 0}</TableCell>
                                                        <TableCell align='center' sx={{ border: '1px solid black' }}>{s.retired || 0}</TableCell>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>}
                {tabIndex === 1 && <Box>
                    {/*{isLoaded && (
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
                                if (!locations.coordinate?.coordinates) return null;
                                const [lng, lat] = location.coordinates.coordinates;
                                return (
                                    <Marker
                                        key={location._id}
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
                        {locations.map((location: any) => {
                            if (!location.coordinates?.coordinates) return null;
                            const [lng, lat] = location.coordinates.coordinates;
                            console.log([lat, lng])
                            return (
                                <Marker key={location._id} position={[lat, lng]}>
                                    <Popup>{location.name}</Popup>
                                </Marker>)
                        })}
                        {devices.map((device: any) => {
                            if (!device.coordinates?.coordinates) return null;
                            const [lng, lat] = device.coordinates.coordinates;
                            console.log([lat, lng])
                            return (
                                <Marker key={device._id} position={[lat, lng]} icon={customIcon}>
                                    <Popup>{device.code}</Popup>
                                </Marker>)
                        })}
                    </MapContainer>
                </Box>}
            </Box>
        </Box >
    );
};

export default ManagerDashboard; 