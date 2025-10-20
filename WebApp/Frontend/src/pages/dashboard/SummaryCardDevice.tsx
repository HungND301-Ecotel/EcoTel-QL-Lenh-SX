import { Box, Card, Popover, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import React, { useState } from 'react'
import {
    Devices as DeviceIcon,
} from '@mui/icons-material';
import { Device } from '../../types';
import { useQuery } from '@tanstack/react-query';
import api from '../../config/api.config';
import { useNavigate } from 'react-router-dom';
import { DeviceTypeEnum, StatusDeviceEnum } from '../../enums';
export default function SummaryCardDevice(
    {
        title,
        value,
        icon,
        color,
        data = [],
        type
    }: {
        title: string;
        value: number;
        icon: React.ReactNode;
        color: string;
        data: Device[],
        type: string
    }
) {
    const navigate = useNavigate();
    const [anchorElSummary, setAnchorElSummary] = useState<HTMLElement | null>(null);
    const [selectedSummaryDevices, setSelectedSummaryDevices] = useState<any[]>([]);

    const { data: deviceCount = [] } = useQuery({
        queryKey: ['deviceCount', type],
        queryFn: () => api.get(`/devices/count/status?group=${type}`).then(res => res.data.data),
    });
    const getDevicesByStatusGrouped = (status: string) => {
        const map = new Map<string, number>();

        deviceCount.forEach((group: any) => {
            group.deviceTypes.forEach((device: any) => {
                const current = map.get(device.typeName) || 0;
                map.set(device.typeName, current + (device.statusCounts?.[status] ?? 0));
            });
        });

        return Array.from(map, ([typeName, total]) => ({ typeName, total }));
    };

    const handleSummaryClick = (event: React.MouseEvent<HTMLElement>, status: string) => {
        setAnchorElSummary(event.currentTarget);
        const grouped = getDevicesByStatusGrouped(status);
        setSelectedSummaryDevices(grouped);
    };
    const handleSummaryClose = () => {
        setAnchorElSummary(null);
        setSelectedSummaryDevices([]);
    };
    return (
        <Card
            sx={{
                height: '100%',
                p: 3,
                padding: '4px 16px',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                },
            }}
        >
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
            }}>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', cursor: 'pointer' }} gutterBottom
                        onClick={() => { navigate(`${type === DeviceTypeEnum.MACHINE ? '/machines' : '/vehicles'}`) }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {value}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        width: 60,
                        height: 60,
                        bgcolor: color,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                    }}
                >
                    {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 32 } })}
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
                        <Typography variant='h6' onClick={(e) => handleSummaryClick(e, StatusDeviceEnum.AVAILABLE)} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>Chờ điều động</Typography>
                    </Box>
                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{data.filter((o: Device) => o.status === StatusDeviceEnum.AVAILABLE).length}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box display="flex" gap={2} alignItems={'center'}>
                        <DeviceIcon color='error' fontSize='medium' />
                        <Typography variant='h6' onClick={(e) => handleSummaryClick(e, StatusDeviceEnum.IN_USE)} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>Đang hoạt động</Typography>
                    </Box>
                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{data.filter((o: Device) => o.status === StatusDeviceEnum.IN_USE).length}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box display="flex" gap={2} alignItems={'center'}>
                        <DeviceIcon color='warning' fontSize='medium' />
                        <Typography variant='h6' onClick={(e) => handleSummaryClick(e, StatusDeviceEnum.MAINTENANCE)} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>SC; BD</Typography>

                    </Box>
                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{data.filter((o: Device) => o.status === StatusDeviceEnum.MAINTENANCE).length}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box display="flex" gap={2} alignItems={'center'}>
                        <DeviceIcon color='disabled' fontSize='medium' />
                        <Typography variant='h6' onClick={(e) => handleSummaryClick(e, StatusDeviceEnum.RETIRED)} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>Niêm cất</Typography>
                    </Box>
                    <Typography variant='h6' sx={{ fontWeight: 'bold', }}>{data.filter((o: Device) => o.status === StatusDeviceEnum.RETIRED).length}</Typography>
                </Box>
            </Box>
            <Popover
                open={Boolean(anchorElSummary)}
                anchorEl={anchorElSummary}
                onClose={handleSummaryClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Box sx={{ p: 2, maxHeight: 300, overflowY: 'auto' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', }}>Danh sách thiết bị</Typography>

                    {selectedSummaryDevices.length > 0 ? (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', }}>Loại xe</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', }}>Số lượng</TableCell>

                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {selectedSummaryDevices.map((d) => (
                                    <TableRow>
                                        <TableCell>{d.typeName}</TableCell>
                                        <TableCell>{d.total}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <Typography>Không có thiết bị nào</Typography>
                    )}
                </Box>
            </Popover>
        </Card>
    )
}