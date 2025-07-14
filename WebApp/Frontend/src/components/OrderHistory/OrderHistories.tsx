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

const OrderHistories: React.FC<{ open: boolean, setOpen: Dispatch<SetStateAction<boolean>>, initialValues: any }> = ({ open, setOpen, initialValues }) => {
    const [tabIndex, setTabIndex] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    const { data: histories = [] } = useQuery({
        queryKey: ['histories', initialValues],
        queryFn: () => api.get(`/histories/${initialValues?._id}`).then(res => res.data.data),
        enabled: !!initialValues?._id,
    });

    const { data: checkIns = [] } = useQuery({
        queryKey: ['checkIns', initialValues],
        queryFn: () => api.get(`/checkIns/${initialValues?._id}`).then(res => res.data.data),
        enabled: !!initialValues?._id,
    });

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Lịch sử</DialogTitle>
            <Tabs value={tabIndex} onChange={handleTabChange}>
                <Tab label="Chi tiết" />
                <Tab label="Ảnh" />
            </Tabs>
            <Divider />
            <DialogContent>
                {tabIndex === 0 && histories.map((item: any, index: number) => (
                    <Typography key={index} sx={{ mb: 2 }}>
                        {`${index + 1}.
                            Ngày làm việc: ${item?.snapshot?.workingDate ? format(new Date(item?.snapshot?.workingDate), 'dd/MM/yyyy') : '---'},
                            Ca: ${item?.snapshot?.shift?.name},
                            Bởi: ${item?.changedBy?.fullName},
                            Phương tiện: ${item?.snapshot?.device?.map((d: any) => d?.code).join(', ')},
                            Máy xúc: ${item?.snapshot?.excavator?.map((d: any) => d?.code).join(', ')},
                            Người ra lệnh: ${item?.snapshot?.createdBy?.fullName},
                            Bắt đầu: ${item?.snapshot?.startTime ? format(new Date(item.snapshot.startTime), 'HH:mm:ss') : '---'},
                            Kết thúc: ${item?.snapshot?.endTime ? format(new Date(item.snapshot.endTime), 'HH:mm:ss') : '---'},
                            Trạng thái lệnh: ${item?.snapshot?.status === 'warning' ? 'Lỗi' : item?.snapshot?.status === 'cancel' ? 'Đã hủy' : 'Đã hoàn thành'}`}
                    </Typography>
                ))}

                {tabIndex === 1 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {checkIns?.map((checkin: any, idx: number) => (
                            <Box key={checkin._id} sx={{ width: 180 }}>
                                <img
                                    src={checkin.imageUrl}
                                    alt={`Checkin ${idx + 1}`}
                                    style={{ width: '100px', height: 'auto', borderRadius: 4 }}
                                />
                                <Typography variant="caption" display="block" textAlign="center">
                                    {format(new Date(checkin.createdAt), 'HH:mm dd/MM/yyyy')}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};

export default OrderHistories;
