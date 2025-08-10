import React, { Dispatch, SetStateAction, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    Tabs,
    Tab,
    Divider,
} from '@mui/material';
import { format } from 'date-fns';
import api from '../../config/api.config';

const OrderHistories: React.FC<{ open: boolean, setOpen: Dispatch<SetStateAction<boolean>>, selectedOrders: string[], setSelectedOrders: Dispatch<SetStateAction<string[]>> }> = ({ open, setOpen, selectedOrders, setSelectedOrders }) => {
    const [tabIndexes, setTabIndexes] = useState<Record<string, number>>({});

    const handleTabChange = (orderId: string, newValue: number) => {
        setTabIndexes(prev => ({ ...prev, [orderId]: newValue }));
    };

    const { data: histories = [] } = useQuery({
        queryKey: ['histories', selectedOrders],
        queryFn: () => api.post(`/histories/bulk`, { ids: selectedOrders }).then(res => res.data.data),
        enabled: !!selectedOrders.length,
    });

    const { data: checkIns = [] } = useQuery({
        queryKey: ['checkIns', selectedOrders],
        queryFn: () => api.post(`/checkIns/bulk`, { ids: selectedOrders }).then(res => res.data.data),
        enabled: !!selectedOrders.length,
    });

    const handleClose = () => {
        setOpen(false);
        setSelectedOrders([])
    };

    const historiesByOrder = histories.reduce((acc: Record<string, any[]>, item: any) => {
        const id = item.entity || item.orderId;
        if (!acc[id]) acc[id] = [];
        acc[id].push(item);
        return acc;
    }, {});

    const checkInsByOrder = checkIns.reduce((acc: Record<string, any[]>, item: any) => {
        const id = item.orderId;
        if (!acc[id]) acc[id] = [];
        acc[id].push(item);
        return acc;
    }, {});

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Lịch sử</DialogTitle>
            <DialogContent>
                {selectedOrders.map(orderId => {
                    const tabIndex = tabIndexes[orderId] ?? 0;
                    const orderHistories = historiesByOrder[orderId] || [];
                    const orderCheckIns = checkInsByOrder[orderId] || [];

                    return (
                        <Box key={orderId} sx={{ mb: 4 }}>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Mã lệnh: {orderId}
                            </Typography>
                            <Tabs
                                value={tabIndex}
                                onChange={(e, val) => handleTabChange(orderId, val)}
                            >
                                <Tab label="Chi tiết" />
                                <Tab label="Ảnh" />
                            </Tabs>
                            <Divider sx={{ mb: 2 }} />

                            {tabIndex === 0 &&
                                orderHistories.map((item: any, index: number) => (
                                    <Typography key={index} sx={{ mb: 2 }}>
                                        {`${index + 1}.
                                            Ngày làm việc: ${item?.snapshot?.workingDate
                                                ? format(new Date(item?.snapshot?.workingDate), 'dd/MM/yyyy')
                                                : '---'},
                                            Ca: ${item?.snapshot?.shift?.name || '---'},
                                            Bởi: ${item?.changedBy?.fullName || '---'},
                                            Phương tiện: ${(item?.snapshot?.device || [])
                                                .map((d: any) => d?.code)
                                                .join(', ') || (item?.snapshot?.devicesToProduce || []).map((dev: any) => `${dev?.deviceType?.name}-SL:${dev?.quantity}`).join('\n')},
                                            Máy xúc: ${(item?.snapshot?.excavator || [])
                                                .map((d: any) => d?.code)
                                                .join(', ')},
                                            Người tạo lệnh: ${item?.snapshot?.createdBy?.fullName || '---'},
                                            Bắt đầu: ${item?.snapshot?.startTime
                                                ? format(new Date(item.snapshot.startTime), 'HH:mm:ss')
                                                : '---'},
                                            Kết thúc: ${item?.snapshot?.endTime
                                                ? format(new Date(item.snapshot.endTime), 'HH:mm:ss')
                                                : '---'},
                                            Trạng thái lệnh: ${item?.snapshot?.status === 'warning'
                                                ? 'Lỗi'
                                                : item?.snapshot?.status === 'cancel'
                                                    ? 'Đã hủy'
                                                    : 'Đã hoàn thành'
                                            }`}
                                    </Typography>
                                ))}

                            {tabIndex === 1 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    {orderCheckIns.map((checkin: any, idx: number) => (
                                        <Box key={checkin._id} sx={{ width: 180 }}>
                                            <img
                                                src={checkin.imageUrl}
                                                alt={`Checkin ${idx + 1}`}
                                                style={{ width: '100px', height: 'auto', borderRadius: 4 }}
                                            />
                                            <Typography
                                                variant="caption"
                                                display="block"
                                                textAlign="center"
                                            >
                                                {format(
                                                    new Date(checkin.createdAt),
                                                    'HH:mm dd/MM/yyyy'
                                                )}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};

export default OrderHistories;
