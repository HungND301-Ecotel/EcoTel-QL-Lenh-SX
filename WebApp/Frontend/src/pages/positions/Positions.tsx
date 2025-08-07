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
import { Job, Position } from '../../types';

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên chức danh'),
    note: yup.string(),
});

const Positions: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
    const [value, setValue] = useState("")
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);

    const handleChangeAction = (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded);
    };
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    const defaultColumns = [
        { id: 'name', label: 'Tên chức danh, nghề nghiệp' },
        { id: 'note', label: 'Mô tả' },
        { id: 'actions', label: 'Thao tác', width: 100 },
    ]
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(i => i.id))

    const handleToggleColumn = (id: string) => {
        setVisibleColumns(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const { data: positions = [], isLoading } = useQuery({
        queryKey: ['positions', value],
        queryFn: () => api.get(`/positions?name=${value}`).then(res => res.data.data),
    });


    const createMutation = useMutation({
        mutationFn: (newJob: Partial<Position>) =>
            api.post('/positions', newJob).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            alert('Thêm chức danh thành công');
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedPosition: Partial<Position>) =>
            api.put(`/positions/${updatedPosition._id}`, updatedPosition).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            alert('Cập nhật chức danh thành công');
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/positions/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            alert('Xóa chức danh thành công');
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            name: '',
            note: ''
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            if (selectedPosition) {
                updateMutation.mutate({ ...values, _id: selectedPosition._id });
            } else {
                createMutation.mutate({ ...values, });
            }
        },
    });

    const handleOpen = (position?: Position) => {
        if (position) {
            setSelectedPosition(position);
            formik.setValues({
                ...position,
                note: position.note ?? ''
            });
        } else {
            setSelectedPosition(null);
            formik.resetForm();
        }
        setExpanded(true)
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setExpanded(false)
        setSelectedPosition(null);
        formik.resetForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa chức danh này?')) {
            deleteMutation.mutate(id);
        }
    };


    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý chức danh, nghề nghiệp</Typography>

            </Box>
            <Box sx={{ flex: 1, flexDirection: 'column' }}>
                <Typography><h3>Tìm kiếm</h3></Typography>
                <TextField fullWidth size="small" value={value}
                    placeholder='Tìm kiếm theo tên chức danh'
                    onChange={(e) => setValue(e.target.value)}>
                </TextField>
            </Box>
            <Accordion expanded={expanded} onChange={handleChangeAction}>
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                        Thêm chức danh
                    </Button>
                </AccordionSummary>
                <AccordionDetails>
                    <DialogContent>
                        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    id="name"
                                    name="name"
                                    label="Tên chức danh"
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    error={formik.touched.name && Boolean(formik.errors.name)}
                                    helperText={formik.touched.name && formik.errors.name}
                                />
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    id="note"
                                    name="note"
                                    label="Mô tả"
                                    value={formik.values.note}
                                    onChange={formik.handleChange}
                                    error={formik.touched.note && Boolean(formik.errors.note)}
                                    helperText={formik.touched.note && formik.errors.note}
                                />
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Hủy</Button>
                        <Button onClick={() => formik.submitForm()} variant="contained">
                            {selectedPosition ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogActions>
                </AccordionDetails>
            </Accordion>
            <Box display="flex" justifyContent='space-between' alignItems='center' sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h3" sx={{ p: 2 }}>Bảng chức danh, nghề nghiệp</Typography>
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
                        {positions.map((position: Position) => (
                            <TableRow key={position._id}>
                                {visibleColumns.includes('name') && <TableCell sx={{ border: '1px solid black' }}>{position.name}</TableCell>}
                                {visibleColumns.includes('note') && <TableCell sx={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: 400,
                                    border: '1px solid black'
                                }}>{position.note}</TableCell>}
                                {visibleColumns.includes('actions') && <TableCell sx={{ border: '1px solid black' }}>
                                    <IconButton color="primary" onClick={() => handleOpen(position)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(position._id)}>
                                        <DeleteIcon />
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

export default Positions;
