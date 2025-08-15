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
    Breadcrumbs,
    InputAdornment,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Settings,
    ExpandMore,
    Search,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Job, Position } from '../../types';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên chức danh'),
    note: yup.string(),
});

const Positions: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
    const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
    const [value, setValue] = useState("")
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);

    const handleSelected = (positionId: string) => {
        setSelectedPositions(prev =>
            prev.includes(positionId)
                ? prev.filter(id => id !== positionId)
                : [...prev, positionId]
        );
    };
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    const defaultColumns = [
        { id: 'name', label: 'Tên chức danh, nghề nghiệp' },
        { id: 'note', label: 'Mô tả' },
        { id: 'edit', label: 'Sửa', width: 50 },
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
            showSuccessAlert('Thêm chức danh thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedPosition: Partial<Position>) =>
            api.put(`/positions/${updatedPosition._id}`, updatedPosition).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            showSuccessAlert('Cập nhật chức danh thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (ids: string[]) => api.delete(`/positions`, { data: { ids } }).then(res => res.data.message),
        onSuccess: (message) => {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            setSelectedPositions([]);
            showSuccessAlert(message || 'Xóa thành công');
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
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

    const handleDelete = () => {
        if (selectedPositions.length === 0) {
            showErrorAlert('Không tìm thấy bản ghi cần xóa');
            return;
        }
        showConfirmAlert(`Bạn có muốn xóa ${selectedPositions.length} bản ghi?`).then((result) => {
            if (result.isConfirmed) {
                deleteMutation.mutate(selectedPositions);
            }
        });
    };

    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);

    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, page: number) => {
        setPage(page);
    };

    const pageData = (positions: any[], page: number, pageSize: number) => {
        let data;
        if (!page && !pageSize) {
            data = positions
        } else {
            data = positions.slice(page * pageSize, (page + 1) * pageSize)
        }
        return data
    }
    const paginatedData = pageData(positions, page, pageSize);
    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb">
                <Typography>Danh mục</Typography>
                <Typography>Chức danh, nghề nghiệp</Typography>
            </Breadcrumbs>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, mt: 3 }}>
                <Typography variant="h3" color={'blue'}>Chức danh, nghề nghiệp</Typography>
            </Box>
            <Accordion expanded={expanded}>
                <AccordionSummary
                    expandIcon={<IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <Settings sx={{ fontSize: 30 }} />
                    </IconButton>}
                    aria-controls="panel1-content"
                    id="panel1-header"
                    sx={{
                        backgroundColor: 'white', '&.Mui-focusVisible': {
                            backgroundColor: 'white',
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
                        <Box display={'flex'} gap={2}>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                                Thêm chức danh
                            </Button>
                            <Button variant="contained" startIcon={<DeleteIcon />} color='error' onClick={handleDelete}>
                                Xóa
                            </Button>
                        </Box>
                        <Box flex={2}>
                            <TextField fullWidth size="small" value={value}
                                placeholder='Tìm kiếm theo tên chức danh, nghề nghiệp'
                                onChange={(e) => setValue(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Search sx={{ fontSize: 24 }} />
                                        </InputAdornment>
                                    )
                                }}>
                            </TextField>
                        </Box>
                    </Box>
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
                            <TableCell align='center' sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: 18 }}>
                                <Checkbox
                                    color="primary"
                                    checked={positions.length > 0 && selectedPositions.length === positions.length}
                                    indeterminate={selectedPositions.length > 0 && selectedPositions.length < positions.length}
                                    onChange={() => {
                                        if (selectedPositions.length === positions.length) {
                                            setSelectedPositions([]);
                                        } else {
                                            setSelectedPositions(positions.map((item: Position) => item._id));
                                        }
                                    }}
                                />
                            </TableCell>
                            {defaultColumns.map((col) =>
                                visibleColumns.includes(col.id) && (
                                    <TableCell key={col.id} align="center" sx={{
                                        backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: 18, width: col.width, minWidth: col.width
                                    }}>
                                        {col.label}
                                    </TableCell>
                                )
                            )}
                        </TableRow>
                    </TableHead>
                    {!isLoading ? <TableBody>
                        {paginatedData.map((position: Position, index: number) => (
                            <TableRow key={position._id} sx={{
                                // Dùng chỉ mục index để tạo màu xen kẽ
                                backgroundColor: index % 2 === 0 ? 'white' : '#e3f2fd',
                            }}>
                                <TableCell align='center' sx={{ width: 50 }}><Checkbox onChange={() => handleSelected(position._id)} checked={selectedPositions.includes(position._id)} /></TableCell>
                                {visibleColumns.includes('name') && <TableCell sx={{}}>{position.name}</TableCell>}
                                {visibleColumns.includes('note') && <TableCell sx={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: 400,
                                }}>{position.note}</TableCell>}
                                {visibleColumns.includes('edit') && <TableCell sx={{}}>
                                    <IconButton color="primary" onClick={async () => {
                                        if (open) {
                                            const result = await showConfirmAlert('Bạn đang cập nhật một mục. Nếu tiếp tục chỉnh sửa, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?');
                                            if (result.isConfirmed) {
                                                handleOpen(position);
                                            }
                                        } else {
                                            handleOpen(position);
                                        }
                                    }}>
                                        <EditIcon />
                                    </IconButton>
                                </TableCell>}
                            </TableRow>
                        ))}
                    </TableBody> : <Typography>Loading...</Typography>}
                </Table>
                <TablePagination
                    component="div"
                    count={positions.length}
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

export default Positions;
