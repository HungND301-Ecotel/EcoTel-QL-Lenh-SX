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
    Checkbox,
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
    const [selectedSafetyMeasures, setSelectedSafetyMeasures] = useState<string[]>([]);


    const handleSelected = (safetyMeasureId: string) => {
        setSelectedSafetyMeasures(prev =>
            prev.includes(safetyMeasureId)
                ? prev.filter(id => id !== safetyMeasureId)
                : [...prev, safetyMeasureId]
        );
    };
    const defaultColumns = [
        { id: 'number', label: 'STT', width: 50 },
        { id: 'content', label: 'Nội dung' },
        { id: 'edit', label: 'Sửa', width: 50 },
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
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
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
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (ids: string[]) => api.delete(`/safetyMeasures`, { data: { ids } }).then(res => res.data.message),
        onSuccess: (message) => {
            queryClient.invalidateQueries({ queryKey: ['safetyMeasures'] });
            setSelectedSafetyMeasures([]);
            showSuccessAlert(message || 'Xóa thành công');
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            content: '',
            master_content: '',
            jobType: ''
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            if (selectedSafetyMeasure) {
                updateMutation.mutate({ ...values, _id: selectedSafetyMeasure._id, jobType: values.jobType as SafetyMeasure['jobType'] });
            } else {
                createMutation.mutate({ ...values, jobType: values.jobType as SafetyMeasure['jobType'] });
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

    const handleDelete = () => {
        if (selectedSafetyMeasures.length === 0) {
            showErrorAlert('Không tìm thấy bản ghi cần xóa');
            return;
        }
        showConfirmAlert(`Bạn có muốn xóa ${selectedSafetyMeasures.length} bản ghi?`).then((result) => {
            if (result.isConfirmed) {
                deleteMutation.mutate(selectedSafetyMeasures);
            }
        });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý biện pháp an toàn</Typography>


            </Box>
            <Accordion expanded={expanded}>
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                            Thêm biện pháp an toàn
                        </Button>
                        <Button variant="contained" startIcon={<DeleteIcon />} color='error' onClick={handleDelete}>
                            Xóa
                        </Button>

                    </Box>
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
                                    label="Biện pháp riêng"
                                    value={formik.values.content}
                                    onChange={formik.handleChange}
                                    error={formik.touched.content && Boolean(formik.errors.content)}
                                    helperText={formik.touched.content && formik.errors.content}
                                />
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={5}
                                    id="master_content"
                                    name="master_content"
                                    label="Biện pháp chung"
                                    value={formik.values.master_content}
                                    onChange={formik.handleChange}
                                    error={formik.touched.master_content && Boolean(formik.errors.master_content)}
                                    helperText={formik.touched.master_content && formik.errors.master_content}
                                />
                                <TextField
                                    fullWidth
                                    select
                                    id="jobType"
                                    name="jobType"
                                    label="Loại công việc"
                                    value={formik.values.jobType}
                                    onChange={formik.handleChange}
                                    error={formik.touched.jobType && Boolean(formik.errors.jobType)}
                                    helperText={formik.touched.jobType && formik.errors.jobType}
                                >
                                    <MenuItem value="Vận hành xe">Vận hành xe</MenuItem>
                                    <MenuItem value="Vận hành khoan">Vận hành khoan</MenuItem>
                                    <MenuItem value="Vận hành xe phục vụ">Vận hành xe phục vụ</MenuItem>
                                    <MenuItem value="Vận hành gạt">Vận hành gạt</MenuItem>
                                    <MenuItem value="Vận hành xúc">Vận hành xúc</MenuItem>
                                    <MenuItem value="Khác">Khác</MenuItem>
                                </TextField>
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
                <Table sx={{ tableLayout: 'fixed', width: '100%', "& td, & th": { padding: "4px 8px" } }} >
                    <TableHead>
                        <TableRow>
                            <TableCell align='center' sx={{ backgroundColor: '#f5f5f5', border: '1px solid black', width: 50 }}>
                                <Checkbox
                                    color="primary"
                                    checked={safetyMeasures.length > 0 && selectedSafetyMeasures.length === safetyMeasures.length}
                                    indeterminate={selectedSafetyMeasures.length > 0 && selectedSafetyMeasures.length < safetyMeasures.length}
                                    onChange={() => {
                                        if (selectedSafetyMeasures.length === safetyMeasures.length) {
                                            setSelectedSafetyMeasures([]);
                                        } else {
                                            setSelectedSafetyMeasures(safetyMeasures.map((item: SafetyMeasure) => item._id));
                                        }
                                    }}
                                />
                            </TableCell>
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
                                <TableCell align='center' sx={{ border: '1px solid black', width: 50 }}><Checkbox onChange={() => handleSelected(safetyMeasure._id)} checked={selectedSafetyMeasures.includes(safetyMeasure._id)} /></TableCell>
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
                                {visibleColumns.includes('edit') &&
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
