import React, { useRef, useState } from 'react';
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
    TablePagination,
    Breadcrumbs,
    LinearProgress,
    Autocomplete,
    styled,
    Popper,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Settings,
    ExpandMore,
    UploadFile,
    Download,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Job, Position, SafetyMeasure } from '../../types';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';


const StyledPopper = styled(Popper)({
    '& .MuiAutocomplete-listbox': {
        maxHeight: '200px', // Đặt chiều cao tối đa mong muốn
        overflowY: 'auto', // Thêm thanh cuộn khi nội dung vượt quá chiều cao
    },
});

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
    const formRef = useRef<HTMLDivElement>(null);


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
    const { data: positions = [] } = useQuery({
        queryKey: ['positions', value],
        queryFn: () => api.get(`/positions`).then(res => res.data.data),
    });
    const { data: jobs = [] } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => api.get(`/jobs`).then(res => res.data.data),
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
    const [progress, setProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false);
    const importFile = useMutation({
        mutationFn: (formData: FormData) =>
            api.post('/safetyMeasures/importFile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
                    );
                    setProgress(percent);
                }
            }).then(res => res.data),
        onMutate: () => {
            setIsUploading(true);
            setProgress(0); // Reset tiến trình khi bắt đầu
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['safetyMeasures'] });
            setIsUploading(false);
            let combinedMessage = `Import dữ liệu hoàn tất. Đã xử lý ${data.summary.totalProcessed} bản ghi.`;
            combinedMessage += `\nĐã thêm mới: ${data.summary.insertedCount}`;
            combinedMessage += `\nĐã cập nhật: ${data.summary.updatedCount}`;

            // Thêm chi tiết lỗi nếu có
            if (data.invalidRows && data.invalidRows.length > 0) {
                combinedMessage += `\n\n--- CÓ LỖI XẢY RA TRONG QUÁ TRÌNH IMPORT ---`;
                combinedMessage += `\n${data.invalidRows.length} bản ghi không hợp lệ:`;

                // Liệt kê chi tiết một vài lỗi đầu tiên
                data.invalidRows.slice(0, 5).forEach((item: any, index: number) => {
                    combinedMessage += `\n- Dòng ${index + 1}: Lỗi "${item.error}"`;
                });

                // Thông báo nếu còn nhiều lỗi hơn
                if (data.invalidRows.length > 5) {
                    combinedMessage += `\n... và ${data.invalidRows.length - 5} lỗi khác.`;
                }
            }

            showSuccessAlert(combinedMessage);
            handleClose()
        },
        onError: (error: any) => {
            setIsUploading(false);
            showErrorAlert(error.response?.data?.message || 'Lỗi khi import');
        }
    });

    const exportExcel = useMutation({
        mutationFn: () => {
            return api.post('/safetyMeasures/exportFile', {}, {
                responseType: 'blob',
            }).then(res => {
                const blob = new Blob([res.data], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `*.xlsx`);

                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
                window.URL.revokeObjectURL(url);
            });
        },
        onSuccess: () => { },
        onError: (error: any) => {
            showErrorAlert(error.response?.data?.message || error.message || 'Lỗi');
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
            handleClose()
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            content: '',
            master_content: '',
            job: undefined,
            position:[] as string[]
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            if (selectedSafetyMeasure) {
                updateMutation.mutate({ ...values, _id: selectedSafetyMeasure._id });
            } else {
                createMutation.mutate({ ...values });
            }
        },
    });

    const handleOpen = (safetyMeasure?: any) => {
        if (safetyMeasure) {
            setSelectedSafetyMeasure(safetyMeasure);
            formik.setValues({
                content: safetyMeasure.content,
                master_content: safetyMeasure.master_content,
                job: safetyMeasure.job !== null && typeof safetyMeasure.job === 'object'
                    ? safetyMeasure.job?._id
                    : safetyMeasure.job || undefined,
                position: Array.isArray(safetyMeasure.position)
                    ? safetyMeasure.position.map((d: any) => typeof d === 'object' ? d._id : d)
                    : safetyMeasure.position
                        ? [typeof safetyMeasure.position === 'object' ? safetyMeasure.position._id : safetyMeasure.position]
                        : [],
            });
        } else {
            setSelectedSafetyMeasure(null);
            formik.resetForm();
        }
        setExpanded(true);
        setOpen(true);
        setTimeout(() => {
            if (formRef.current) {
                formRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 500);
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
    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);

    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, page: number) => {
        setPage(page);
    };

    const pageData = (safetyMeasures: any[], page: number, pageSize: number) => {
        let data;
        if (!page && !pageSize) {
            data = safetyMeasures
        } else {
            data = safetyMeasures.slice(page * pageSize, (page + 1) * pageSize)
        }
        return data
    }
    const paginatedData = pageData(safetyMeasures, page, pageSize);
    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb">
                <Typography>Danh mục</Typography>
                <Typography>Biện pháp an toàn</Typography>
            </Breadcrumbs>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, mt: 3 }}>
                <Typography variant="h3" color={'blue'}>Biện pháp an toàn</Typography>
            </Box>
            <Accordion expanded={expanded} ref={formRef}>
                <AccordionSummary
                    expandIcon={
                        <></>}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                            Thêm
                        </Button>
                        <Button variant="contained" startIcon={<DeleteIcon />} color='error' onClick={handleDelete}>
                            Xóa
                        </Button>
                        <Box display="flex" gap={2}>
                            <input
                                id="upload-excel"
                                type="file"
                                accept=".xlsx, .xls"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        importFile.mutate(formData);
                                    }
                                    e.target.value = "";
                                }}
                            />

                            <label htmlFor="upload-excel">
                                <Button
                                    component="span"
                                    variant="contained"
                                    startIcon={<UploadFile />}
                                >
                                    Tải lên excel
                                </Button>
                            </label>
                            <Button
                                component="span"
                                variant="contained"
                                startIcon={<Download />}
                                onClick={() => exportExcel.mutate()}
                            >
                                Tải xuống
                            </Button>
                        </Box>

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
                                    label="Biện pháp chung"
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
                                    label="Biện pháp riêng"
                                    value={formik.values.master_content}
                                    onChange={formik.handleChange}
                                    error={formik.touched.master_content && Boolean(formik.errors.master_content)}
                                    helperText={formik.touched.master_content && formik.errors.master_content}
                                />
                                <Autocomplete
                                    fullWidth
                                    options={jobs}
                                    getOptionLabel={(option: Job) =>
                                        option.name || ''
                                    }
                                    value={jobs.find((p: any) => p._id === formik.values.job) || null}
                                    // disabled
                                    onChange={(event, newValue) => {
                                        formik.setFieldValue('job', newValue?._id || '');
                                    }}
                                    PopperComponent={StyledPopper}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Loại công việc"
                                            error={formik.touched.job && Boolean(formik.errors.job)}
                                            helperText={formik.touched.job && typeof formik.errors.job === 'string' ? formik.errors.job : ''}
                                        />
                                    )}
                                />
                                <Autocomplete
                                    fullWidth
                                    multiple
                                    options={positions}
                                    getOptionLabel={(option: Position) =>
                                        option.name || ''
                                    }
                                    value={positions.filter((d: Position) =>
                                        formik.values.position.includes(d._id)
                                    )}
                                    onChange={(event, newValue) => {
                                        const selectedIds = newValue.map((item: any) => item._id);

                                        formik.setFieldValue('position', selectedIds);
                                    }}
                                    PopperComponent={StyledPopper}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Chức danh, nghề nghiệp"
                                            error={formik.touched.position && Boolean(formik.errors.position)}
                                            helperText={formik.touched.position && typeof formik.errors.position === 'string' ? formik.errors.position : ''}
                                        />
                                    )}
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
            {isUploading && (
                <Box sx={{ mt: 2 }}>
                    {progress < 100 ? (
                        <>
                            <Typography variant="body2" align="center">
                                Đang tải lên... {progress}%
                            </Typography>
                            <LinearProgress variant="determinate" value={progress} />
                        </>
                    ) : (
                        <>
                            <Typography variant="body2" align="center">
                                Đang xử lý dữ liệu trên server...
                            </Typography>
                            <LinearProgress />
                        </>
                    )}
                </Box>
            )}
            <Box display="flex" alignItems='center' sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h4">Bảng biện pháp chung</Typography>
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
                            <TableCell align='center' sx={{ backgroundColor: '#f5f5f5', width: 50 }}>
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
                                    <TableCell key={item.id} align='center' sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: 18, width: item.width, minWidth: item.width }}>{item.label}</TableCell>
                                )
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!isLoading ? paginatedData.map((safetyMeasure: SafetyMeasure, index: number) => (
                            <TableRow key={safetyMeasure._id} sx={{
                                // Dùng chỉ mục index để tạo màu xen kẽ
                                backgroundColor: index % 2 === 0 ? 'white' : '#e3f2fd',
                            }}>
                                <TableCell align='center' sx={{ width: 50 }}><Checkbox onChange={() => handleSelected(safetyMeasure._id)} checked={selectedSafetyMeasures.includes(safetyMeasure._id)} /></TableCell>
                                {visibleColumns.includes('number') &&
                                    <TableCell align='center' sx={{}}>{index + 1}</TableCell>
                                }
                                {visibleColumns.includes('content') &&
                                    <TableCell sx={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>{safetyMeasure.content}</TableCell>}
                                {visibleColumns.includes('edit') &&
                                    <TableCell align='center' sx={{}}>
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
                <TablePagination
                    component="div"
                    count={safetyMeasures.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={pageSize}
                    onRowsPerPageChange={(event) => {
                        setPageSize(parseInt(event.target.value, 10));
                        setPage(0);
                    }}
                />
            </TableContainer >

        </Box >
    );
};

export default SafetyMeasures;
