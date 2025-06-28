import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    TextField,
    MenuItem,
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { SafetyMeasure } from '../../types';

const validationSchema = yup.object({

    content: yup.string(),
});

const SafetyMeasures: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedSafetyMeasure, setSelectedSafetyMeasure] = useState<SafetyMeasure | null>(null);
    const [value, setValue] = useState("")
    const queryClient = useQueryClient();

    const { data: safetyMeasures = [], isLoading } = useQuery({
        queryKey: ['safetyMeasures', value],
        queryFn: () => api.get(`/safetyMeasures`).then(res => res.data.data),
    });


    const createMutation = useMutation({
        mutationFn: (newsafetyMeasure: Partial<SafetyMeasure>) =>
            api.post('/safetyMeasures', newsafetyMeasure).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['safetyMeasures'] });
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedsafetyMeasure: Partial<SafetyMeasure>) =>
            api.put(`/safetyMeasures/${updatedsafetyMeasure._id}`, updatedsafetyMeasure).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['safetyMeasures'] });
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/safetyMeasures/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['safetyMeasures'] });
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            content: ''
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            if (selectedSafetyMeasure) {
                updateMutation.mutate({ ...values, _id: selectedSafetyMeasure._id });
            } else {
                createMutation.mutate(values);
            }
        },
    });

    const handleOpen = (safetyMeasure?: SafetyMeasure) => {
        if (safetyMeasure) {
            setSelectedSafetyMeasure(safetyMeasure);
            formik.setValues(safetyMeasure);
        } else {
            setSelectedSafetyMeasure(null);
            formik.resetForm();
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedSafetyMeasure(null);
        formik.resetForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa biên pháp an toàn này này?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý biện pháp an toàn</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    Thêm biện pháp an toàn
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: '80vh' }}>
                <Table  sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ border: '1px solid black',width:50 }}>STT</TableCell>
                            <TableCell sx={{ border: '1px solid black',width:'80%' }}>Nội dung</TableCell>
                            <TableCell sx={{ border: '1px solid black',width:'15%' }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!isLoading ? safetyMeasures.map((safetyMeasure: SafetyMeasure,index:number) => (
                            <TableRow key={safetyMeasure._id}>
                                <TableCell sx={{border: '1px solid black',}}>{index+1}</TableCell>
                                <TableCell sx={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    border: '1px solid black',
                                }}>{safetyMeasure.content}</TableCell>
                                <TableCell sx={{ border: '1px solid black',}}>
                                    <IconButton color="primary" onClick={() => handleOpen(safetyMeasure)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(safetyMeasure._id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        )) : <Typography>Loading...</Typography>}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{selectedSafetyMeasure ? 'Sửa biện pháp an toàn' : 'Thêm biện pháp an toàn'}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={5}
                                id="content"
                                name="content"
                                label="Nội dung"
                                value={formik.values.content}
                                onChange={formik.handleChange}
                                error={formik.touched.content && Boolean(formik.errors.content)}
                                helperText={formik.touched.content && formik.errors.content}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Hủy</Button>
                    <Button onClick={() => formik.submitForm()} variant="contained">
                        {selectedSafetyMeasure ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SafetyMeasures;
