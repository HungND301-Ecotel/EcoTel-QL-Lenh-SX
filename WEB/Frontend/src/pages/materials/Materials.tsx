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
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Material } from '../../types';

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên hạng mục'),
    type: yup
        .string()
        .oneOf(['material', 'waste', 'drilling', 'roadwork', 'repair', 'other'])
        .required('Vui lòng chọn loại hạng mục'),
});

const Materials: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const queryClient = useQueryClient();

    const { data: materialRow, isLoading } = useQuery({
        queryKey: ['materials'],
        queryFn: () => api.get('/materials').then(res => res.data),
    });

    const materials = React.useMemo(() => {
        if (!materialRow) return [];
        if (Array.isArray(materialRow)) return materialRow;
        if (materialRow.data && Array.isArray(materialRow.data.materials)) return materialRow.data.materials;
        if (materialRow.data && Array.isArray(materialRow.data)) return materialRow.data;
        return [];
    }, [materialRow]);

    const createMutation = useMutation({
        mutationFn: (newMaterial: Partial<Material>) =>
            api.post('/materials', newMaterial).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
            handleClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (updatedMaterial: Partial<Material>) => {
            return api.put(`/materials/${updatedMaterial._id}`, updatedMaterial).then(res => res.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
            handleClose();
        },
        onError: (error) => {
            console.error('Lỗi khi cập nhật:', error);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/materials/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });

    const formik = useFormik({
        initialValues: {
            name: '',
            type: '',
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            if (selectedMaterial) {
                updateMutation.mutate({ ...values, _id: selectedMaterial._id, type: values.type as Material['type'], });
            } else {
                createMutation.mutate({ ...values, type: values.type as Material['type'], });
            }
        },
    });

    const handleOpen = (material?: Material) => {
        if (material) {
            setSelectedMaterial(material);
            formik.setValues(material);
        } else {
            setSelectedMaterial(null);
            formik.resetForm();
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedMaterial(null);
        formik.resetForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa hạng mục này?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý hạng mục</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    Thêm hạng mục
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tên hạng mục</TableCell>
                            <TableCell>Loại hạng mục</TableCell>
                            <TableCell>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {materials.map((material: any) => (
                            <TableRow key={material._id}>
                                <TableCell>{material.name}</TableCell>
                                <TableCell>{material.type}</TableCell>
                                <TableCell>
                                    <IconButton color="primary" onClick={() => handleOpen(material)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(material._id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{selectedMaterial ? 'Sửa hạng mục' : 'Thêm hạng mục'}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                id="name"
                                name="name"
                                label="Tên hạng mục"
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
                                label="Loại hạng mục"
                                value={formik.values.type}
                                onChange={formik.handleChange}
                                error={formik.touched.type && Boolean(formik.errors.type)}
                                helperText={formik.touched.type && formik.errors.type}
                            >
                                <MenuItem value="material">Vật liệu</MenuItem>
                                <MenuItem value="waste">Bãi thải</MenuItem>
                                <MenuItem value="drilling">Khoan bãi</MenuItem>
                                <MenuItem value="roadwork">Làm đường</MenuItem>
                                <MenuItem value="repair">Sửa chữa</MenuItem>
                                <MenuItem value="other">Khác</MenuItem>
                            </TextField>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Hủy</Button>
                    <Button onClick={() => formik.submitForm()} variant="contained">
                        {selectedMaterial ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Materials;
