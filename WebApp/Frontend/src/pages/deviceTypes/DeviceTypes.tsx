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
    Menu,
    Switch,
    ListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Settings,
    ExpandMore,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { DeviceType } from '../../types';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên loại phương tiện'),
});

const DeviceTypes: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | null>(null);
    const queryClient = useQueryClient();
    const [user, setUser] = useAtom(userAtom)
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const [expanded, setExpanded] = useState(false);

    const handleChangeAction = (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded);
        if (isExpanded) {
            setOpen(true);
        } else {
            setOpen(false);
            setSelectedDeviceType(null);
            setExpanded(false);
        }
    };
    const defaultColumns = [
        { id: 'name', label: 'Tên loại phương tiện' },
        { id: 'actions', label: 'Thao tác', width: 100 },
    ]
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(i => i.id))

    const handleToggleColumn = (id: string) => {
        setVisibleColumns(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const { data: DeviceTypes = [], isLoading } = useQuery({
        queryKey: ['DeviceTypes'],
        queryFn: () => api.get(`/DeviceTypes`).then(res => res.data.data),
    });


    const createMutation = useMutation({
        mutationFn: (newDeviceType: Partial<DeviceType>) =>
            api.post('/DeviceTypes', newDeviceType).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['DeviceTypes'] });
            alert('Thêm loại phương tiện thành công');
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedDeviceType: Partial<DeviceType>) =>
            api.put(`/DeviceTypes/${updatedDeviceType._id}`, updatedDeviceType).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['DeviceTypes'] });
            alert('Cập nhật loại phương tiện thành công');
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/DeviceTypes/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['DeviceTypes'] });
            alert('Xóa loại phương tiện thành công');
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            name: '',
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            if (selectedDeviceType) {
                updateMutation.mutate({ ...values, _id: selectedDeviceType._id });
            } else {
                createMutation.mutate(values);
            }
        },
    });

    const handleOpen = (DeviceType?: DeviceType) => {
        if (DeviceType) {
            setSelectedDeviceType(DeviceType);
            formik.setValues(DeviceType);
        } else {
            setSelectedDeviceType(null);
            formik.resetForm();
        }
        setExpanded(true);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedDeviceType(null);
        setExpanded(false);
        formik.resetForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa loại phương tiện này?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý loại phương tiện</Typography>

            </Box>
            <Accordion expanded={expanded} onChange={handleChangeAction}>
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                        Thêm loại phương tiện
                    </Button>
                </AccordionSummary>
                <AccordionDetails>
                    <DialogTitle>{selectedDeviceType ? 'Sửa loại phương tiện' : 'Thêm loại phương tiện'}</DialogTitle>
                    <DialogContent>
                        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    id="name"
                                    name="name"
                                    label="Tên loại phương tiện"
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    error={formik.touched.name && Boolean(formik.errors.name)}
                                    helperText={formik.touched.name && formik.errors.name}
                                />
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Hủy</Button>
                        <Button onClick={() => formik.submitForm()} variant="contained">
                            {selectedDeviceType ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogActions>
                </AccordionDetails>
            </Accordion>
            <Box display="flex" justifyContent='space-between' alignItems='center' sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h3" sx={{ p: 2 }}>Bảng loại phương tiện</Typography>
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
                <Table>
                    <TableHead>
                        <TableRow>
                            {visibleColumns.includes('name') && <TableCell align='center' sx={{ backgroundColor: '#f5f5f5', border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Tên loại phương tiện</TableCell>}
                            {visibleColumns.includes('actions') && (user?.role !== 'dispatcher' && <TableCell align='center' sx={{ backgroundColor: '#f5f5f5', border: '1px solid black', fontWeight: 'bold', fontSize: 18, width: 100, minWidth: 100 }}>Thao tác</TableCell>)}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!isLoading ? DeviceTypes.map((DeviceType: any) => (
                            <TableRow key={DeviceType._id}>
                                {visibleColumns.includes('name') && <TableCell sx={{ border: '1px solid black' }}>{DeviceType.name}</TableCell>}
                                {visibleColumns.includes('actions') && (user?.role !== 'dispatcher' && <TableCell align='center' sx={{ border: '1px solid black' }}>
                                    <IconButton color="primary" onClick={() => {
                                        if (open) {
                                            const confirmed = window.confirm('Bạn đang cập nhật một mục. Nếu tiếp tục chỉnh sửa, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?');
                                            if (confirmed) {
                                                handleOpen(DeviceType);
                                            }
                                        } else {
                                            handleOpen(DeviceType);
                                        }
                                    }}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(DeviceType._id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>)}
                            </TableRow>
                        )) : <Typography>Loading...</Typography>}
                    </TableBody>
                </Table>
            </TableContainer>

        </Box>
    );
};

export default DeviceTypes;
