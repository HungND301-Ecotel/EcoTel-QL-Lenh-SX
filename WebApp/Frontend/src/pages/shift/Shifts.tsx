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
    Checkbox,
    ListItemText,
    Switch,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TablePagination,
    Breadcrumbs,
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
import { Shift } from '../../types';
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';
import { shiftValidationSchema } from '../../utils/validation';
import ShiftService from '../../services/shiftService';

const Shifts: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
    const [value, setValue] = useState("")
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);
    const [user] = useAtom(userAtom)

    const handleSelected = (shiftId: string) => {
        setSelectedShifts(prev =>
            prev.includes(shiftId)
                ? prev.filter(id => id !== shiftId)
                : [...prev, shiftId]
        );
    };
    const defaultColumns = [
        { id: 'name', label: 'Ca', width: 50 },
        { id: 'startTime', label: 'Thời gian bắt đầu' },
        { id: 'endTime', label: 'Thời gian kết thúc' },
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

    const { data: shifts = [], isLoading } = useQuery({
        queryKey: ['shifts', value],
        queryFn: () => ShiftService.getAll({}),
    });


    const createMutation = useMutation({
        mutationFn: ShiftService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            showSuccessAlert('Thêm ca làm việc thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: ShiftService.update,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            showSuccessAlert('Cập nhật ca làm việc thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: ShiftService.delete,
        onSuccess: (message) => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            setSelectedShifts([]);
            showSuccessAlert(message || 'Xóa thành công');
            handleClose()
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            name: undefined as number | undefined,
            startTime: '',
            endTime: '',
        },
        validationSchema: shiftValidationSchema,
        onSubmit: (values) => {
            if (selectedShift) {
                updateMutation.mutate({ ...values, _id: selectedShift._id });
            } else {
                createMutation.mutate(values);
            }
        },
    });

    const handleOpen = (shift?: Shift) => {
        if (shift) {
            setSelectedShift(shift);
            formik.setValues(shift);
        } else {
            setSelectedShift(null);
            formik.resetForm();
        }
        setExpanded(true);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedShift(null);
        setExpanded(false)
        formik.resetForm();
    };

    const handleDelete = () => {
        if (selectedShifts.length === 0) {
            showErrorAlert('Không tìm thấy bản ghi cần xóa');
            return;
        }
        showConfirmAlert(`Bạn có muốn xóa ${selectedShifts.length} bản ghi?`).then((result) => {
            if (result.isConfirmed) {
                deleteMutation.mutate(selectedShifts);
            }
        });
    };

    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);

    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, page: number) => {
        setPage(page);
    };

    const pageData = (shifts: any[], page: number, pageSize: number) => {
        let data;
        if (!page && !pageSize) {
            data = shifts
        } else {
            data = shifts.slice(page * pageSize, (page + 1) * pageSize)
        }
        return data
    }
    const paginatedData = pageData(shifts, page, pageSize);

    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb">
                <Typography>Danh mục</Typography>
                <Typography>Ca làm việc</Typography>
            </Breadcrumbs>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 3 }}>
                <Typography variant="h3" color={'blue'}>Ca làm việc</Typography>
            </Box>
            <Accordion expanded={expanded}>
                <AccordionSummary
                    expandIcon={
                        <></>}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    {user?.role === "admin" && <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                            Thêm
                        </Button>
                        <Button variant="contained" startIcon={<DeleteIcon />} color='error' onClick={handleDelete}>
                            Xóa
                        </Button>
                    </Box>}
                </AccordionSummary>
                <AccordionDetails>
                    <DialogTitle>{selectedShift ? 'Sửa ca làm việc' : 'Thêm ca làm việc'}</DialogTitle>
                    <DialogContent>
                        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    id="name"
                                    name="name"
                                    label="Ca làm việc"
                                    value={formik.values.name?.toString() ?? ''}
                                    onChange={formik.handleChange}
                                    error={formik.touched.name && Boolean(formik.errors.name)}
                                    helperText={formik.touched.name && formik.errors.name}
                                />
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <TimePicker
                                        label="Bắt đầu"
                                        ampm={false}
                                        value={formik.values.startTime ? dayjs(formik.values.startTime, 'HH:mm') : null}
                                        onChange={(value) => {
                                            formik.setFieldValue('startTime', value?.format('HH:mm') || '');
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                                size="small"
                                                error={formik.touched.startTime && Boolean(formik.errors.startTime)}
                                                helperText={formik.touched.startTime && formik.errors.startTime}
                                            />
                                        )}
                                    />

                                    <TimePicker
                                        label="Kết thúc"
                                        ampm={false}
                                        value={formik.values.endTime ? dayjs(formik.values.endTime, 'HH:mm') : null}
                                        onChange={(value) => {
                                            formik.setFieldValue('endTime', value?.format('HH:mm') || '');
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                                size="small"
                                                error={formik.touched.endTime && Boolean(formik.errors.endTime)}
                                                helperText={formik.touched.endTime && formik.errors.endTime}
                                            />
                                        )}
                                    />
                                </LocalizationProvider>
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Hủy</Button>
                        <Button onClick={() => formik.submitForm()} variant="contained">
                            {selectedShift ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogActions>
                </AccordionDetails>
            </Accordion>
            <Box display="flex" alignItems='center' sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h4">Bảng ca làm việc</Typography>
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
            <Paper>
                <TableContainer>
                    <Table sx={{
                        "& td, & th": { padding: "4px 8px" },
                    }}>
                        <TableHead>
                            <TableRow>
                                {user?.role === "admin" && <TableCell align="center" sx={{
                                    backgroundColor: '#f5f5f5',
                                }}>
                                    <Checkbox
                                        color="primary"
                                        checked={shifts.length > 0 && selectedShifts.length === shifts.length}
                                        indeterminate={selectedShifts.length > 0 && selectedShifts.length < shifts.length}
                                        onChange={() => {
                                            if (selectedShifts.length === shifts.length) {
                                                setSelectedShifts([]);
                                            } else {
                                                setSelectedShifts(shifts.map((shift: Shift) => shift._id));
                                            }
                                        }}
                                    />
                                </TableCell>}
                                {defaultColumns.map((col) =>
                                    visibleColumns.includes(col.id) && (
                                        <TableCell key={col.id} align="center" sx={{
                                            backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: 18, width: col.width, minWidth: col.width
                                        }}>
                                            {col.label}
                                        </TableCell>
                                    )
                                )}
                                {user?.role === "admin" && <TableCell align="center" sx={{
                                    backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: 18, width: 50
                                }}>
                                    Sửa
                                </TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {!isLoading ? paginatedData.map((shift: Shift, index: number) => (
                                <TableRow key={shift._id} sx={{
                                    // Dùng chỉ mục index để tạo màu xen kẽ
                                    backgroundColor: index % 2 === 0 ? 'white' : '#e3f2fd',
                                }}>
                                    {user?.role === "admin" && <TableCell align='center' sx={{ width: 50 }}><Checkbox onChange={() => handleSelected(shift._id)} checked={selectedShifts.includes(shift._id)} /></TableCell>}
                                    {visibleColumns.includes('name') && (
                                        <TableCell align='center' sx={{}}>{shift.name}</TableCell>
                                    )}
                                    {visibleColumns.includes('startTime') && (
                                        <TableCell align='center' sx={{}}>{shift.startTime}</TableCell>
                                    )}
                                    {visibleColumns.includes('endTime') && (
                                        <TableCell align='center' sx={{}}>{shift.endTime}</TableCell>
                                    )}
                                    {user?.role === "admin" && (
                                        <TableCell align='center' sx={{}}>
                                            <IconButton color="primary" onClick={async () => {
                                                if (open) {
                                                    const result = await showConfirmAlert('Bạn đang cập nhật một mục. Nếu tiếp tục chỉnh sửa, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?');
                                                    if (result.isConfirmed) {
                                                        handleOpen(shift);
                                                    }
                                                } else {
                                                    handleOpen(shift);
                                                }
                                            }}>
                                                <EditIcon />
                                            </IconButton>
                                        </TableCell>
                                    )}
                                </TableRow>
                            )) : <Typography>Loading...</Typography>}
                        </TableBody>

                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={shifts.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={pageSize}
                    onRowsPerPageChange={(event) => {
                        setPageSize(parseInt(event.target.value, 10));
                        setPage(0);
                    }}
                />
            </Paper>

        </Box>
    );
};

export default Shifts;
