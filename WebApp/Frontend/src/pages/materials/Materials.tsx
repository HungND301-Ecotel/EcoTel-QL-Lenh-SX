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
    Menu,
    Switch,
    ListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Checkbox,
    TablePagination,
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
import { Material } from '../../types';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên vật liệu'),
});

const Materials: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [value, setValue] = useState("")
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);

    const handleSelected = (materialId: string) => {
        setSelectedMaterials(prev =>
            prev.includes(materialId)
                ? prev.filter(id => id !== materialId)
                : [...prev, materialId]
        );
    };
    const defaultColumns = [
        { id: 'name', label: 'Tên vật liệu' },
        { id: 'density', label: 'Tỉ trọng' },
        { id: 'mass', label: 'Khối lượng' },
        { id: 'edit', label: 'Sửa', width: 50 },
    ]

    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(i => i.id))
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)

    const handleToggleColumn = (id: string) => {
        setVisibleColumns(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const { data: materials = [], isLoading } = useQuery({
        queryKey: ['materials', value],
        queryFn: () => api.get(`/materials?name=${value}`).then(res => res.data.data),
    });


    const createMutation = useMutation({
        mutationFn: (newMaterial: Partial<Material>) =>
            api.post('/materials', newMaterial).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
            showSuccessAlert('Thêm vật liệu thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedMaterial: Partial<Material>) => {
            return api.put(`/materials/${updatedMaterial._id}`, updatedMaterial).then(res => res.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
            showSuccessAlert('Cập nhật vật liệu thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (ids: string[]) => api.delete(`/materials`, { data: { ids } }).then(res => res.data.message),
        onSuccess: (message) => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
            setSelectedMaterials([]);
            showSuccessAlert(message || 'Xóa thành công');
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }

    });

    const formik = useFormik({
        initialValues: {
            name: '',
            density: undefined as number | undefined,
            mass: undefined as number | undefined
        },
        enableReinitialize: true,
        validationSchema: validationSchema,
        onSubmit: (values) => {
            if (selectedMaterial) {
                updateMutation.mutate({ ...values, _id: selectedMaterial._id });
            } else {
                createMutation.mutate({ ...values });
            }
        },
    });

    const handleOpen = (material?: Material) => {
        if (material) {
            setSelectedMaterial(material);
            formik.setValues({
                name: material.name,
                density: material.density,
                mass: material.mass,
            });
        } else {
            setSelectedMaterial(null);
            formik.resetForm();
        }
        setExpanded(true)
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedMaterial(null);
        setExpanded(false)
        formik.resetForm();
    };

    const handleDelete = () => {
        if (selectedMaterials.length === 0) {
            showErrorAlert('Không tìm thấy bản ghi cần xóa');
            return;
        }
        showConfirmAlert(`Bạn có muốn xóa ${selectedMaterials.length} bản ghi?`).then((result) => {
            if (result.isConfirmed) {
                deleteMutation.mutate(selectedMaterials);
            }
        });
    };
    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);

    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, page: number) => {
        setPage(page);
    };

    const pageData = (materials: Material[], page: number, pageSize: number) => {
        let data;
        if (!page && !pageSize) {
            data = materials
        } else {
            data = materials.slice(page * pageSize, (page + 1) * pageSize)
        }
        return data
    }
    const paginatedData = pageData(materials, page, pageSize);
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý vật liệu</Typography>

            </Box>
            <Box sx={{ flex: 1, flexDirection: 'column' }}>
                <Typography><h3>Tìm kiếm</h3></Typography>
                <TextField fullWidth size="small" value={value}
                    placeholder='Tìm kiếm theo tên loại vật liệu'
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
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                            Thêm vật liệu
                        </Button>
                        <Button variant="contained" startIcon={<DeleteIcon />} color='error' onClick={handleDelete}>
                            Xóa
                        </Button>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <DialogTitle>{selectedMaterial ? 'Sửa vật liệu' : 'Thêm vật liệu'}</DialogTitle>
                    <DialogContent>
                        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    id="name"
                                    name="name"
                                    label="Tên vật liệu"
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    error={formik.touched.name && Boolean(formik.errors.name)}
                                    helperText={formik.touched.name && formik.errors.name}
                                />
                                <TextField
                                    type="number"
                                    fullWidth
                                    id="density"
                                    name="density"
                                    label="Tỉ trọng"
                                    value={formik.values.density?.toString() ?? ''}
                                    onChange={formik.handleChange}
                                    error={formik.touched.density && Boolean(formik.errors.density)}
                                    helperText={formik.touched.density && formik.errors.density}
                                    inputProps={{ shrink: true }}
                                />
                                <TextField
                                    type="number"
                                    fullWidth
                                    id="mass"
                                    name="mass"
                                    label="Khối lượng"
                                    value={formik.values.mass?.toString() ?? ''}
                                    onChange={formik.handleChange}
                                    error={formik.touched.mass && Boolean(formik.errors.mass)}
                                    helperText={formik.touched.mass && formik.errors.mass}
                                />
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Hủy</Button>
                        <Button onClick={() => formik.submitForm()} variant="contained">
                            {selectedMaterial ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogActions>
                </AccordionDetails>
            </Accordion>
            <Box display="flex" justifyContent='space-between' alignItems='center' sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h3" sx={{ p: 2 }}>Bảng loại vật liệu</Typography>
                <IconButton onClick={(e) => setMenuAnchorEl(e.currentTarget)}>
                    <Settings sx={{ fontSize: 30 }} />
                </IconButton>
                <Menu
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={() => setMenuAnchorEl(null)}
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
                            <TableCell align='center' sx={{ backgroundColor: '#f5f5f5', border: '1px solid black', width: 50 }}>
                                <Checkbox
                                    color="primary"
                                    checked={materials.length > 0 && selectedMaterials.length === materials.length}
                                    indeterminate={selectedMaterials.length > 0 && selectedMaterials.length < materials.length}
                                    onChange={() => {
                                        if (selectedMaterials.length === materials.length) {
                                            setSelectedMaterials([]);
                                        } else {
                                            setSelectedMaterials(materials.map((item: Material) => item._id));
                                        }
                                    }}
                                />
                            </TableCell>
                            {defaultColumns.map((col) =>
                                visibleColumns.includes(col.id) &&
                                <TableCell align='center' sx={{ backgroundColor: '#f5f5f5', border: '1px solid black', fontWeight: 'bold', fontSize: 18, width: col?.width, minWidth: col?.width }}>{col.label}</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!isLoading ? paginatedData.map((material: Material) => (
                            <TableRow key={material._id}>
                                <TableCell align='center' sx={{ border: '1px solid black', width: 50 }}><Checkbox onChange={() => handleSelected(material._id)} checked={selectedMaterials.includes(material._id)} /></TableCell>
                                {visibleColumns.includes('name') && <TableCell sx={{ border: '1px solid black' }}>{material.name}</TableCell>}
                                {visibleColumns.includes('density') && <TableCell sx={{ border: '1px solid black' }}>{material.density}</TableCell>}
                                {visibleColumns.includes("mass") && <TableCell sx={{ border: '1px solid black' }}>{material.mass}</TableCell>}
                                {visibleColumns.includes("edit") && <TableCell align='center' sx={{ border: '1px solid black' }}>
                                    <IconButton color="primary" onClick={async () => {
                                        if (open) {
                                            const result = await showConfirmAlert('Bạn đang cập nhật một mục. Nếu tiếp tục chỉnh sửa, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?');
                                            if (result.isConfirmed) {
                                                handleOpen(material);
                                            }
                                        } else {
                                            handleOpen(material);
                                        }
                                    }}>
                                        <EditIcon />
                                    </IconButton>
                                </TableCell>}
                            </TableRow>
                        )) : <Typography>Loading...</Typography>}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={materials.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={pageSize}
                    onRowsPerPageChange={(event) => {
                        setPageSize(parseInt(event.target.value, 10));
                        setPage(0);
                    }}
                />
            </TableContainer>

        </Box>
    );
};

export default Materials;
