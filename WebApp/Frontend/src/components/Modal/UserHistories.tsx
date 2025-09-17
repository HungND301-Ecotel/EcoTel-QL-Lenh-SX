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

const UserHistories: React.FC<{ open: boolean, setOpen: Dispatch<SetStateAction<boolean>>, initialValues: any }> = ({ open, setOpen, initialValues }) => {

    const { data: histories = [] } = useQuery({
        queryKey: ['histories', initialValues],
        queryFn: () => api.get(`/histories/${initialValues?._id}`).then(res => res.data.data),
        enabled: !!initialValues?._id,
    });


    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Lịch sử chỉnh sửa</DialogTitle>
            <DialogContent>
                {histories.map((item: any, index: number) => (
                    <Typography key={index} sx={{ mb: 2 }}>
                        {`${index + 1}.
                            Ngày sửa đổi: ${item?.updatedAt ? format(new Date(item?.updatedAt), 'dd/MM/yyyy HH:mm') : '---'},
                            Đơn vị cũ: ${item?.snapshot?.department?.name},
                            Đơn vị mới: ${initialValues?.department?.name},
                            Người sửa đổi: ${item?.changedBy?.fullName}`},
                    </Typography>
                ))}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserHistories;
