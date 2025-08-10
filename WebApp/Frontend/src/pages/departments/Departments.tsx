import React, { useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Typography,
    MenuItem,
    ListItemText,
    Switch,
    Menu,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Checkbox,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Settings, ExpandMore, } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api.config';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên đơn vị'),
    code: yup.string().required('Vui lòng nhập mã đơn vị'),
    description: yup.string(),
});

const Departments = () => {
    const [open, setOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [value, setValue] = useState("")
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);

    const handleSelected = (departmentId: string) => {
        setSelectedDepartments(prev =>
            prev.includes(departmentId)
                ? prev.filter(id => id !== departmentId)
                : [...prev, departmentId]
        );
    };
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    const defaultColumns = [
        { id: 'code', label: 'Mã đơn vị' },
        { id: 'name', label: 'Tên đơn vị' },
        { id: 'description', label: 'Chức năng' },
        { id: 'edit', label: 'Sửa', width: 50 },
    ]
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(i => i.id))

    const handleToggleColumn = (id: string) => {
        setVisibleColumns(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const { data: departments = [], isLoading } = useQuery({
        queryKey: ['departments', value],
        queryFn: () => api.get(`/departments?code=${value}`).then(res => res.data.data),
    });


    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/departments', data).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            showSuccessAlert('Thêm đơn vị thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.put(`/departments/${selectedDepartment?._id}`, data).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            showSuccessAlert('Cập nhật đơn vị thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (ids: string[]) => api.delete(`/departments`, { data: { ids } }).then(res => res.data.message),
        onSuccess: (message) => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            setSelectedDepartments([]);
            showSuccessAlert(message || 'Xóa thành công');
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            name: '',
            code: '',
            description: '',
        },
        validationSchema,
        onSubmit: (values) => {
            if (selectedDepartment) {
                updateMutation.mutate(values);
            } else {
                createMutation.mutate(values);
            }
        },
    });

    const handleOpen = (department?: any) => {
        if (department) {
            setSelectedDepartment(department);
            formik.setValues({
                name: department.name,
                code: department.code,
                description: department.description || '',
            });
        } else {
            setSelectedDepartment(null);
            formik.resetForm();
        }
        setExpanded(true);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedDepartment(null);
        setExpanded(false);
        formik.resetForm();
    };

    const handleDelete = () => {
        if (selectedDepartments.length === 0) {
            showErrorAlert('Không tìm thấy bản ghi cần xóa');
            return;
        }
        showConfirmAlert(`Bạn có muốn xóa ${selectedDepartments.length} bản ghi?`).then((result) => {
            if (result.isConfirmed) {
                deleteMutation.mutate(selectedDepartments);
            }
        });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý đơn vị</Typography>


            </Box>
            <Box sx={{ flex: 1, flexDirection: 'column' }}>
                <Typography><h3>Tìm kiếm</h3></Typography>
                <TextField fullWidth size="small" value={value}
                    placeholder='Tìm kiếm theo mã đơn vị'
                    onChange={(e) => setValue(e.target.value)}>
                </TextField>
            </Box>
            <Accordion expanded={expanded}>
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpen()}
                        >
                            Thêm đơn vị
                        </Button>
                        <Button variant="contained" startIcon={<DeleteIcon />} color='error' onClick={handleDelete}>
                            Xóa
                        </Button>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <DialogTitle>
                        {selectedDepartment ? 'Sửa đơn vị' : 'Thêm đơn vị mới'}
                    </DialogTitle>
                    <DialogContent>
                        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                margin="normal"
                                id="code"
                                name="code"
                                label="Mã đơn vị"
                                value={formik.values.code}
                                onChange={formik.handleChange}
                                error={formik.touched.code && Boolean(formik.errors.code)}
                                helperText={formik.touched.code && formik.errors.code}
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                id="name"
                                name="name"
                                label="Tên đơn vị"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                id="description"
                                name="description"
                                label="Chức năng"
                                multiline
                                rows={3}
                                value={formik.values.description}
                                onChange={formik.handleChange}
                                error={formik.touched.description && Boolean(formik.errors.description)}
                                helperText={formik.touched.description && formik.errors.description}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Hủy</Button>
                        <Button
                            onClick={() => formik.handleSubmit()}
                            variant="contained"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {createMutation.isPending || updateMutation.isPending
                                ? 'Đang lưu...'
                                : selectedDepartment
                                    ? 'Cập nhật'
                                    : 'Thêm mới'}
                        </Button>
                    </DialogActions>
                </AccordionDetails>
            </Accordion>
            <Box display="flex" justifyContent='space-between' alignItems='center' sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h3" sx={{ p: 2 }}>Bảng đơn vị</Typography>
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
                <Table sx={{
                    "& td, & th": { padding: "4px 8px" },
                }}>
                    <TableHead>
                        <TableRow>
                            <TableCell align='center' sx={{ backgroundColor: '#f5f5f5', border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}></TableCell>
                            {defaultColumns.map((col) =>
                                visibleColumns.includes(col.id) && (
                                    <TableCell key={col.id} align="center" sx={{
                                        backgroundColor: '#f5f5f5', border: '1px solid black', fontWeight: 'bold', fontSize: 18, width: col.width, minWidth: col.width
                                    }}>
                                        {col.label}
                                    </TableCell>
                                )
                            )}
                        </TableRow>
                    </TableHead>
                    {!isLoading ? <TableBody>
                        {departments.map((department: any) => (
                            <TableRow key={department._id}>
                                <TableCell align='center' sx={{ border: '1px solid black', width: 50 }}><Checkbox onChange={() => handleSelected(department._id)} checked={selectedDepartments.includes(department._id)} /></TableCell>
                                {visibleColumns.includes('code') && <TableCell sx={{ border: '1px solid black' }}>{department.code}</TableCell>}
                                {visibleColumns.includes('name') && <TableCell sx={{ border: '1px solid black' }}>{department.name}</TableCell>}
                                {visibleColumns.includes('description') && <TableCell sx={{ border: '1px solid black' }}>{department.description}</TableCell>}
                                {visibleColumns.includes('edit') && <TableCell sx={{ border: '1px solid black' }}>
                                    <IconButton onClick={async () => {
                                        if (open) {
                                            const result = await showConfirmAlert('Bạn đang cập nhật một mục. Nếu tiếp tục chỉnh sửa, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?');
                                            if (result.isConfirmed) {
                                                handleOpen(department);
                                            }
                                        } else {
                                            handleOpen(department);
                                        }
                                    }} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                </TableCell>}
                            </TableRow>
                        ))}
                    </TableBody> : <Typography>Loading...</Typography>}
                </Table>
            </TableContainer>

        </Box>
    );
};

export default Departments; 