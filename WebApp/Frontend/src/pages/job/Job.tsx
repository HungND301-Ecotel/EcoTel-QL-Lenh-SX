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
    Switch,
    ListItemText,
    Menu,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Checkbox,
    TablePagination,
    InputAdornment,
    Breadcrumbs,
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
import { Job } from '../../types';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';

const validationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên công việc'),
    type: yup
        .string()
        .oneOf(['Vận hành xe', 'Vận hành khoan', 'Vận hành xe phục vụ', 'Vận hành gạt', 'Vận hành xúc', 'Khác'])
        .required('Vui lòng chọn loại công việc'),
});

const Jobs: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
    const [value, setValue] = useState("")
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);

    const handleSelected = (jobId: string) => {
        setSelectedJobs(prev =>
            prev.includes(jobId)
                ? prev.filter(id => id !== jobId)
                : [...prev, jobId]
        );
    };
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    const defaultColumns = [
        { id: 'name', label: 'Tên công việc' },
        { id: 'category', label: 'Loại công việc' },
        { id: 'edit', label: 'Sửa', width: 50 },
    ]
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(i => i.id))

    const handleToggleColumn = (id: string) => {
        setVisibleColumns(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }


    const { data: jobs = [], isLoading } = useQuery({
        queryKey: ['jobs', value],
        queryFn: () => api.get(`/jobs?name=${value}`).then(res => res.data.data),
    });


    const createMutation = useMutation({
        mutationFn: (newJob: Partial<Job>) =>
            api.post('/jobs', newJob).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            showSuccessAlert('Thêm công việc thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedJob: Partial<Job>) =>
            api.put(`/jobs/${updatedJob._id}`, updatedJob).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            showSuccessAlert('Cập nhật công việc thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (ids: string[]) => api.delete(`/jobs`, { data: { ids } }).then(res => res.data.message),
        onSuccess: (message) => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            setSelectedJobs([]);
            showSuccessAlert(message || 'Xóa thành công');
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            name: '',
            type: '',
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            if (selectedJob) {
                updateMutation.mutate({ ...values, _id: selectedJob._id, type: values.type as Job['type'] });
            } else {
                createMutation.mutate({ ...values, type: values.type as Job['type'] });
            }
        },
    });

    const handleOpen = (job?: Job) => {
        if (job) {
            setSelectedJob(job);
            formik.setValues(job);
        } else {
            setSelectedJob(null);
            formik.resetForm();
        }
        setExpanded(true);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedJob(null);
        setExpanded(false);
        formik.resetForm();
    };

    const handleDelete = () => {
        if (selectedJobs.length === 0) {
            showErrorAlert('Không tìm thấy bản ghi cần xóa');
            return;
        }
        showConfirmAlert(`Bạn có muốn xóa ${selectedJobs.length} bản ghi?`).then((result) => {
            if (result.isConfirmed) {
                deleteMutation.mutate(selectedJobs);
            }
        });
    };
    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);

    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, page: number) => {
        setPage(page);
    };

    const pageData = (jobs: any[], page: number, pageSize: number) => {
        let data;
        if (!page && !pageSize) {
            data = jobs
        } else {
            data = jobs.slice(page * pageSize, (page + 1) * pageSize)
        }
        return data
    }
    const paginatedData = pageData(jobs, page, pageSize);
    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb">
                <Typography>Danh mục</Typography>
                <Typography>Công việc</Typography>
            </Breadcrumbs>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, mt: 3 }}>
                <Typography variant="h3" color={'blue'}>Công việc</Typography>
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
                                Thêm
                            </Button>
                            <Button variant="contained" startIcon={<DeleteIcon />} color='error' onClick={handleDelete}>
                                Xóa
                            </Button>
                        </Box>
                        <Box flex={2}>
                            <TextField fullWidth size="small" value={value}
                                placeholder='Tìm kiếm theo tên công việc'
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
                    <DialogTitle>{selectedJob ? 'Sửa công việc' : 'Thêm công việc'}</DialogTitle>
                    <DialogContent>
                        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    id="name"
                                    name="name"
                                    label="Tên công việc"
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
                                    label="Loại công việc"
                                    value={formik.values.type}
                                    onChange={formik.handleChange}
                                    error={formik.touched.type && Boolean(formik.errors.type)}
                                    helperText={formik.touched.type && formik.errors.type}
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
                            {selectedJob ? 'Cập nhật' : 'Thêm mới'}
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
                                    checked={jobs.length > 0 && selectedJobs.length === jobs.length}
                                    indeterminate={selectedJobs.length > 0 && selectedJobs.length < jobs.length}
                                    onChange={() => {
                                        if (selectedJobs.length === jobs.length) {
                                            setSelectedJobs([]);
                                        } else {
                                            setSelectedJobs(jobs.map((item: Job) => item._id));
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
                    <TableBody>
                        {!isLoading ? paginatedData.map((job: any, index: number) => (
                            <TableRow key={job._id} sx={{
                                // Dùng chỉ mục index để tạo màu xen kẽ
                                backgroundColor: index % 2 === 0 ? 'white' : '#e3f2fd',
                            }}>
                                <TableCell align='center' sx={{ width: 50 }}><Checkbox onChange={() => handleSelected(job._id)} checked={selectedJobs.includes(job._id)} /></TableCell>
                                {visibleColumns.includes('name') && <TableCell sx={{}}>{job.name}</TableCell>}
                                {visibleColumns.includes('category') && <TableCell sx={{}}>{job.type}</TableCell>}
                                {visibleColumns.includes('edit') && <TableCell sx={{}}>
                                    <IconButton color="primary" onClick={async () => {
                                        if (open) {
                                            const result = await showConfirmAlert('Bạn đang cập nhật một mục. Nếu tiếp tục chỉnh sửa, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?');
                                            if (result.isConfirmed) {
                                                handleOpen(job);
                                            }
                                        } else {
                                            handleOpen(job);
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
                    count={jobs.length}
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

export default Jobs;
