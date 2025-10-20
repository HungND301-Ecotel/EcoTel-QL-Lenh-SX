import { Box } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { customIcon } from '../../fixLeafletIcon'
import { useQuery } from '@tanstack/react-query';
import api from '../../config/api.config';

const containerStyle = {
    width: '100%',
    height: '500px',
};
const defaultCenter = {
    lat: 20.9926575,
    lng: 105.8437303,
};

export default function GoogleMap() {
    const { data: devices = [] } = useQuery({
        queryKey: ['devices'],
        queryFn: () => api.get('/devices').then(res => res.data.data),
    });
    const { data: locations = [] } = useQuery({
        queryKey: ['locations'],
        queryFn: () => api.get('/locations').then(res => res.data.data),
    });
    return (
        <Box>
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
                    return (
                        <Marker key={location._id} position={[lat, lng]}>
                            <Popup>{location.name}</Popup>
                        </Marker>)
                })}
                {devices.map((device: any) => {
                    if (!device.coordinates?.coordinates) return null;
                    const [lng, lat] = device.coordinates.coordinates;
                    return (
                        <Marker key={device._id} position={[lat, lng]} icon={customIcon}>
                            <Popup>{device.code}</Popup>
                        </Marker>)
                })}
            </MapContainer>
        </Box>
    )
}
