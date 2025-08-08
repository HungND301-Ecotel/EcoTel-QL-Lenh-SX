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
    ListItemText,
    Switch,
    AccordionDetails,
    AccordionSummary,
    Accordion,
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
import { SafetyMeasure } from '../../types';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';

const validationSchema = yup.object({
    content: yup.string().required('Nhập nội dung'),
});

const SafetyMeasures: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedSafetyMeasure, setSelectedSafetyMeasure] = useState<SafetyMeasure | null>(null);
    const [value, setValue] = useState("")
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);

    const handleChangeAction = (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded);
        if (isExpanded) {
            setOpen(true);
        } else {
            setOpen(false);
            setSelectedSafetyMeasure(null);
            setExpanded(false);
        }
    };
    const defaultColumns = [
        { id: 'number', label: 'STT', width: 100 },
        { id: 'content', label: 'Nội dung' },
        { id: 'actions', label: 'Thao tác', width: 100 },
    ];

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(c => c.id));

    const handleToggleColumn = (columnId: string) => {
        setVisibleColumns(prev =>
            prev.includes(columnId)
                ? prev.filter(id => id !== columnId)
                : [...prev, columnId]
        );
    };

    const { data: safetyMeasures = [], isLoading } = useQuery({
        queryKey: ['safetyMeasures', value],
        queryFn: () => api.get(`/safetyMeasures`).then(res => res.data.data),
    });


    const createMutation = useMutation({
        mutationFn: (newsafetyMeasure: Partial<SafetyMeasure>) =>
            api.post('/safetyMeasures', newsafetyMeasure).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['safetyMeasures'] });
            showSuccessAlert('Thêm biện pháp an toàn thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedsafetyMeasure: Partial<SafetyMeasure>) =>
            api.put(`/safetyMeasures/${updatedsafetyMeasure._id}`, updatedsafetyMeasure).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['safetyMeasures'] });
            showSuccessAlert('Cập nhật biện pháp an toàn thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/safetyMeasures/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['safetyMeasures'] });
            showSuccessAlert('Xóa biện pháp an toàn thành công');
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
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
        setExpanded(true);

        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedSafetyMeasure(null);
        setExpanded(false);
        formik.resetForm();
    };

    const handleDelete = (id: string) => {
        if (!id) {
            showErrorAlert('Không tìm thấy bản ghi');
            return;
        }
        showConfirmAlert('Bạn có muốn xóa bản ghi này?').then((result) => {
            if (result.isConfirmed) {
                deleteMutation.mutate(id);
            }
        });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý biện pháp an toàn</Typography>


            </Box>
            <Accordion expanded={expanded} onChange={handleChangeAction}>
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                        Thêm biện pháp an toàn
                    </Button>
                </AccordionSummary>
                <AccordionDetails>
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
                </AccordionDetails>
            </Accordion>
            <Box display="flex" justifyContent='space-between' alignItems='center' sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h3" sx={{ p: 2 }}>Bảng biện pháp an toàn</Typography>
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
                <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHead>
                        <TableRow>
                            {defaultColumns.map((item) =>
                                visibleColumns.includes(item.id) && (
                                    <TableCell key={item.id} align='center' sx={{ backgroundColor: '#f5f5f5', border: '1px solid black', fontWeight: 'bold', fontSize: 18, width: item.width, minWidth: item.width }}>{item.label}</TableCell>
                                )
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!isLoading ? safetyMeasures.map((safetyMeasure: SafetyMeasure, index: number) => (
                            <TableRow key={safetyMeasure._id}>
                                {visibleColumns.includes('number') &&
                                    <TableCell align='center' sx={{ border: '1px solid black' }}>{index + 1}</TableCell>
                                }
                                {visibleColumns.includes('content') &&
                                    <TableCell sx={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        border: '1px solid black',
                                    }}>{safetyMeasure.content}</TableCell>}
                                {visibleColumns.includes('actions') &&
                                    <TableCell align='center' sx={{ border: '1px solid black', }}>
                                        <IconButton color="primary" onClick={async () => {
                                            if (open) {
                                                const result = await showConfirmAlert('Bạn đang cập nhật một mục. Nếu tiếp tục chỉnh sửa, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?');
                                                if (result.isConfirmed) {
                                                    handleOpen(safetyMeasure);
                                                }
                                            } else {
                                                handleOpen(safetyMeasure);
                                            }
                                        }}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton color="error" onClick={() => handleDelete(safetyMeasure._id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>}
                            </TableRow>
                        )) : <Typography>Loading...</Typography>}
                    </TableBody>
                </Table>
            </TableContainer>

        </Box>
    );
};

export default SafetyMeasures;
