import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    Checkbox,
    TextField,
    MenuItem,
    Tooltip,
    Autocomplete,
    styled,
    Popper,
    Menu,
    Switch,
    ListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Pagination,
    TablePagination,
} from '@mui/material';
import { format } from 'date-fns';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search,
    MoreVert,
    MoreHoriz,
    FileDownload,
    InfoOutlined,
    SyncAlt,
    Visibility,
    CancelOutlined,
    Settings,
    ExpandMore,
    FilterTiltShiftSharp,
    Download,
    UploadFile,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Device, Location, Order, Shift } from '../../types';
import { DatePicker, DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useSocket } from '../../hooks/useSocket';
import ShiftReport from '../../components/ShiftReport/ShiftReport';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Table, TableColumnsType, TableProps } from 'antd';
import { TableRowSelection } from 'antd/es/table/interface';
import { trvelLogValidationSchema } from '../../utils/validate';
const StyledPopper = styled(Popper)({
    '& .MuiAutocomplete-listbox': {
        maxHeight: '300px',
        overflowY: 'auto',
    },
});

const TravelLogs: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [history, setHistory] = useState(false);
    const [shiftReport, setShiftReport] = useState(false);
    const [transfer, setTransfer] = useState(false);
    const [status, setStatus] = useState("");
    const [startTime, setStartTime] = useState<Dayjs | null>(null);
    const [endTime, setEndTime] = useState<Dayjs | null>(null);
    const [device, setDevice] = useState("");
    const [department, setDepartment] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<any[]>([]);
    const [user] = useAtom(userAtom)
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [total, setTotal] = useState(0);
    const [orders, setOrders] = useState<any[]>([]);

    const defaultColumns = [
        { id: 'number', label: 'STT' },
        { id: 'excavator', label: 'Máy xúc' },
        { id: 'location', label: 'Điểm đổ tải' },
        { id: 'distance', label: 'Cung độ (km)' },
        { id: 'startTime', label: 'Bắt đầu' },
        { id: 'endTime', label: 'Kết thúc' },
        { id: 'note', label: 'Ghi chú' },
    ]
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(i => i.id))

    const handleToggleColumn = (id: string) => {
        setVisibleColumns(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }


    const [serverFilters, setServerFilters] = useState<any>({});
    const { data: excavators = [] } = useQuery({
        queryKey: ['excavators'],
        queryFn: () => api.get('/devices/excavators/all').then(res => res.data.data),
    });
    const { data: locations = [] } = useQuery({
        queryKey: ['locations'],
        queryFn: () => api.get('/locations').then(res => res.data.data),
    });
    const { data, isLoading } = useQuery({
        queryKey: ['orders', page, pageSize, status, department, device, startTime, endTime, serverFilters],
        queryFn: () => api.get(`/orders`, {
            params: {
                page,
                limit: pageSize,
                department,
                status: status || undefined,
                startTime: startTime ? startTime.toISOString() : '',
                endTime: endTime ? endTime.toISOString() : '',

                // filters từ Table
                assignedTo: serverFilters.assignedTo || undefined,
                createdBy: serverFilters.createdBy || undefined,
                shift: serverFilters.shift || undefined,
                job: serverFilters.job || undefined,
                device: serverFilters.device || undefined,
                excavator: serverFilters.excavator || undefined,
                location: serverFilters.location || undefined,
                material: serverFilters.material || undefined,
            }
        }).then(res => res.data)
    })
    useEffect(() => {
        if (data) {
            setOrders(data.data);     // mảng order
            setTotal(data.totalDocs);   // tổng số bản ghi từ API
        }
    }, [data]);

    const createMutation = useMutation({
        mutationFn: (newOrder: Partial<Order>) =>
            api.post('/orders', newOrder).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
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
        mutationFn: (updatedOrder: Partial<Order>) =>
            api.put(`/orders/${updatedOrder._id}`, updatedOrder).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            showSuccessAlert('Cập nhật lệnh sản xuất thành công');
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (ids: string[]) => api.delete(`/orders`, { data: { ids } }).then(res => res.data.message),
        onSuccess: (message) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setSelectedOrders([]);
            showSuccessAlert(message || 'Xóa thành công');
            handleClose()
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            excavator: undefined,
            location: undefined,
            distance: undefined as number | undefined,
            startTime: '',
            endTime: '',
        },
        enableReinitialize: true,
        validationSchema: trvelLogValidationSchema,
        onSubmit: (values) => {
            // if (selectedMaterial) {
            //     updateMutation.mutate({ ...values, _id: selectedMaterial._id });
            // } else {
            //     createMutation.mutate({ ...values });
            // }
        },
    });


    const handleCancel = (order: any) => {
        if (order.status === "in_progress") {
            return showErrorAlert('Lệnh đang thực hiện không thể hủy')
        }
        if (order.status === "completed") {
            return showErrorAlert('Lệnh đã hoàn thành không thể hủy')
        }
        showConfirmAlert('Bạn có chắc chắn muốn hủy lệnh sản xuất này?. Bạn sẽ không thể thay đổi').then((result) => {
            if (result.isConfirmed) {
                updateMutation.mutate({ _id: order._id, status: 'cancel' });
            }
        })
    }

    const handleOpen = (order?: any) => {
        if (order) {
            setSelectedOrder(order);
        } else {
            setSelectedOrder(null);
        }
        setTransfer(false)
        setExpanded(true)
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
        setTransfer(false);
        setSelectedOrder(null);
        setExpanded(false)
    };

    const handleSubmit = (values: Partial<Order>) => {
        if (selectedOrder) {
            updateMutation.mutate({ ...values, _id: selectedOrder._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleDelete = () => {
        if (selectedOrders.length === 0) {
            return showErrorAlert('Không tìm thấy bản ghi cần xóa');
        }

        if (user?.role === "admin") {
            showConfirmAlert('Bạn có muốn xóa?. Bạn sẽ không thể hoàn tác.').then((result) => {
                if (result.isConfirmed) {
                    deleteMutation.mutate(selectedOrders.map(o => o._id));
                }
            });
        } else {
            // lọc ra những order có thể xoá
            const deletableOrders = selectedOrders.filter(o =>
                o.status !== "in_progress" && o.status !== "completed"
            );

            if (deletableOrders.length === 0) {
                return showErrorAlert("Không có bản ghi nào hợp lệ để xoá");
            }

            // cảnh báo cho các bản ghi bị bỏ qua
            const skipped = selectedOrders.length - deletableOrders.length;

            let message = "";
            if (skipped > 0) {
                message = `${skipped} bản ghi đang thực hiện hoặc đã hoàn thành. `;
            }

            message += `Bạn có thể xóa ${deletableOrders.length} bản ghi. Bạn có muốn xóa?`;

            showConfirmAlert(message).then((result) => {
                if (result.isConfirmed) {
                    deleteMutation.mutate(deletableOrders.map(o => o._id));
                }
            });
        }

    };

    useEffect(() => {
        if (transfer && formRef.current) {
            setTimeout(() => {
                if (formRef.current) {
                    formRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 500);
        }
    }, [transfer]);


    const trvelLogColumns: TableProps<any>['columns'] = [
        {
            title: 'STT', dataIndex: 'number', key: 'number', width: 50, align: 'center',
            render: (text, record, index) => index + 1,
            fixed: 'left'
        },
        {
            title: 'Máy xúc', dataIndex: 'excavator', key: 'excavator', width: 200, align: 'center',
            render: (text, record) => record.excavator?.code || '',
            fixed: 'left',
            filterSearch: true,
            filters: excavators.map((d: any) => ({ text: `${d.code}`, value: d._id })),
            onFilter: undefined,
            filteredValue: serverFilters.excavator ?? null,
        },
        {
            title: 'Điểm đổ tải', dataIndex: 'location', key: 'location', width: 150,
            render: (text, record) => record.location?.map((loc: any) => loc.name).join(', '),
            filterSearch: true,
            filters: locations.map((d: any) => ({ text: d.name, value: d._id })),
            onFilter: undefined,
            filteredValue: serverFilters.location ?? null,
        },
        {
            title: 'Cung độ (km)', dataIndex: 'distance', key: 'distance', width: 170, align: 'center',
            render: (text, record) => record.distance ?? ''
        },
        {
            title: 'Bắt đầu', dataIndex: 'startTime', key: 'startTime', width: 100, align: 'center',
            render: (text, record) => record.startTime ? format(new Date(record.startTime), 'HH:mm:ss') : ''
        },
        {
            title: 'Kết thúc', dataIndex: 'endTime', key: 'endTime', width: 100, align: 'center',
            render: (text, record) => record.endTime ? format(new Date(record.endTime), 'HH:mm:ss') : ''
        },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 150, align: 'center',
            render: (text, record) => record.note ?? ''
        },
        {
            title: 'Xem báo công',
            dataIndex: 'view',
            key: 'view',
            width: 100,
            align: 'center',
            render: (text, record) => (
                <IconButton
                    color="secondary"
                    onClick={() => {
                        setSelectedOrder(record)
                        setShiftReport(true)
                    }}
                >
                    <Tooltip title="Báo công" placement='top'>
                        <Visibility />
                    </Tooltip>
                </IconButton>
            ),
        },
        {
            title: 'Sửa',
            dataIndex: 'edit',
            key: 'edit',
            width: 60,
            render: (text, record) => (
                <IconButton
                    color="primary"
                    disabled={!['pending', 'warning'].includes(record?.status)
                    }
                    onClick={async () => {
                        if (open) {
                            const result = await showConfirmAlert('Bạn đang cập nhật một mục. Nếu tiếp tục chỉnh sửa, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?');
                            if (result.isConfirmed) {
                                handleOpen(record);
                            }
                        } else {
                            handleOpen(record);
                        }
                    }}
                >
                    <Tooltip title="Sửa" placement='top'>
                        <EditIcon />
                    </Tooltip>
                </IconButton >
            )
        },
        {
            title: 'Hủy',
            dataIndex: 'cancel',
            key: 'cancel',
            width: 60,
            render: (text, record) => (
                <IconButton
                    disabled={!['pending', 'warning'].includes(record.status)}
                    color="warning"
                    onClick={() => handleCancel(record)}
                >
                    <Tooltip title="Hủy" placement='top'>
                        <CancelOutlined />
                    </Tooltip>
                </IconButton>
            ),
        },
        {
            title: 'Chuyển ca',
            dataIndex: 'transfer',
            key: 'transfer',
            width: 100,
            align: 'center',
            render: (text, record) => (
                <IconButton
                    color="info"
                    onClick={async () => {
                        if (open) {
                            const result = await showConfirmAlert('Bạn đang cập nhật một mục. Nếu tiếp tục, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?');
                            if (result.isConfirmed) {
                                setSelectedOrder(record)
                                setOpen(false)
                                setExpanded(true)
                                setTransfer(true)

                            }
                        } else {
                            setSelectedOrder(record)
                            setOpen(false)
                            setExpanded(true)
                            setTransfer(true)
                            setTimeout(() => {
                                if (formRef.current) {
                                    formRef.current.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'start'
                                    });
                                }
                            }, 500);
                        }
                    }}
                >
                    <Tooltip title="Chuyển ca" placement='top'>
                        <SyncAlt />
                    </Tooltip>
                </IconButton>
            ),
        },
    ];

    const rowSelection: TableRowSelection<any> = {
        // AntD yêu cầu selectedRowKeys phải là mảng id
        selectedRowKeys: selectedOrders.map(o => o._id),
        onChange: (newKeys: React.Key[], newRows: any[]) => {
            setSelectedOrders(newRows);   // lưu luôn object đầy đủ
        },
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h3" color={'blue'}>Cung độ</Typography>
            </Box>
            <Accordion expanded={expanded} ref={formRef}>
                <AccordionSummary
                    expandIcon={
                        <></>}
                    aria-controls="panel1-content"
                    id="panel1-header"
                    sx={{
                        backgroundColor: 'white', '&.Mui-focusVisible': {
                            backgroundColor: 'white',
                        },
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            alignItems: 'center',
                            width: '100%',
                            flexWrap: 'wrap', // Tự động xuống dòng khi không đủ không gian
                            flexDirection: {
                                xs: 'column', // Màn hình nhỏ: các items xếp dọc
                                md: 'row',    // Màn hình lớn: các items xếp ngang
                            },
                            // Thêm các thuộc tính căn chỉnh để bố cục đẹp hơn
                            justifyContent: {
                                xs: 'flex-start', // Màn hình nhỏ: căn trái
                                md: 'space-between', // Màn hình lớn: giãn đều các items
                            },
                        }}
                    >
                        {/* Nhóm các nút lại với nhau */}
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1, // Khoảng cách nhỏ hơn giữa các nút
                                flexDirection: {
                                    xs: 'column',
                                    md: 'row',
                                },
                                width: {
                                    xs: '100%', // Group này chiếm 100% khi xếp dọc
                                    md: 'auto',
                                },
                            }}
                        >
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpen()}
                            >
                                Thêm
                            </Button>
                            <Button variant="contained" startIcon={<DeleteIcon />} color="error" onClick={handleDelete}>
                                Xóa
                            </Button>
                        </Box>

                        {/* Nhóm các Autocomplete và DatePicker lại với nhau */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexGrow: 1, // Chiếm hết phần còn lại của không gian
                                gap: 2,
                                alignItems: 'center',
                                flexDirection: {
                                    xs: 'column',
                                    md: 'row',
                                },
                                width: {
                                    xs: '100%', // Group này chiếm 100% khi xếp dọc
                                    md: 'auto',
                                },
                            }}
                        >
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Từ ngày"
                                    inputFormat="DD/MM/YYYY"
                                    value={startTime ? dayjs(startTime) : null}
                                    onChange={(value) => setStartTime(value)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            size="small"
                                        />
                                    )}
                                />
                            </LocalizationProvider>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Đến ngày"
                                    inputFormat="DD/MM/YYYY"
                                    value={endTime ? dayjs(endTime) : null}
                                    onChange={(value) => setEndTime(value)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            size="small"
                                        />
                                    )}
                                />
                            </LocalizationProvider>
                        </Box>

                        <Box display="flex" gap={2} sx={{
                            display: 'flex',
                            gap: 1, // Khoảng cách nhỏ hơn giữa các nút
                            flexDirection: {
                                xs: 'column',
                                md: 'row',
                            },
                            width: {
                                xs: '100%', // Group này chiếm 100% khi xếp dọc
                                md: 'auto',
                            },
                        }}>
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
                                    fullWidth
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
                    <AccordionDetails>
                        <DialogTitle>Thêm cung độ</DialogTitle>
                        <DialogContent>
                            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Autocomplete
                                        fullWidth
                                        options={excavators}
                                        getOptionLabel={(option: Device) =>
                                            option.name || ''
                                        }
                                        value={excavators.find((p: any) => p._id === formik.values.excavator) || null}
                                        onChange={(event, newValue) => {
                                            formik.setFieldValue('excavator', newValue?._id || '');
                                        }}
                                        PopperComponent={StyledPopper}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Máy xúc"
                                                error={formik.touched.excavator && Boolean(formik.errors.excavator)}
                                                helperText={formik.touched.excavator && typeof formik.errors.excavator === 'string' ? formik.errors.excavator : ''}
                                            />
                                        )}
                                    />
                                    <Autocomplete
                                        fullWidth
                                        options={locations}
                                        getOptionLabel={(option: Location) =>
                                            option.name || ''
                                        }
                                        value={locations.find((p: any) => p._id === formik.values.location) || null}
                                        onChange={(event, newValue) => {
                                            formik.setFieldValue('location', newValue?._id || '');
                                        }}
                                        PopperComponent={StyledPopper}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Điểm đổ tải"
                                                error={formik.touched.location && Boolean(formik.errors.location)}
                                                helperText={formik.touched.location && typeof formik.errors.location === 'string' ? formik.errors.excavator : ''}
                                            />
                                        )}
                                    />
                                    <TextField
                                        type="number"
                                        fullWidth
                                        id="distance"
                                        name="distance"
                                        label="Cung độ (km)"
                                        value={formik.values.distance?.toString() ?? ''}
                                        onChange={formik.handleChange}
                                        error={formik.touched.distance && Boolean(formik.errors.distance)}
                                        helperText={formik.touched.distance && formik.errors.distance}
                                    />
                                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                                        <DateTimePicker
                                            label="Bắt đầu"
                                            inputFormat="DD/MM/YYYY HH:mm" // v5 vẫn hỗ trợ
                                            value={formik.values.startTime ? dayjs(formik.values.startTime) : null}
                                            onChange={(value) => {
                                                formik.setFieldValue('startTime', value ? value : '');
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    fullWidth
                                                    error={formik.touched.startTime && Boolean(formik.errors.startTime)}
                                                    helperText={
                                                        formik.touched.startTime && typeof formik.errors.startTime === 'string'
                                                            ? formik.errors.startTime
                                                            : ''
                                                    }
                                                />
                                            )}
                                        />
                                    </LocalizationProvider>
                                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                                        <DateTimePicker
                                            label="Kết thúc"
                                            inputFormat="DD/MM/YYYY HH:mm" // v5 vẫn hỗ trợ
                                            value={formik.values.endTime ? dayjs(formik.values.endTime) : null}
                                            onChange={(value) => {
                                                formik.setFieldValue('endTime', value ? value : '');
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    fullWidth
                                                    error={formik.touched.endTime && Boolean(formik.errors.endTime)}
                                                    helperText={
                                                        formik.touched.endTime && typeof formik.errors.endTime === 'string'
                                                            ? formik.errors.endTime
                                                            : ''
                                                    }
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
                                Thêm mới
                            </Button>
                        </DialogActions>
                    </AccordionDetails>
                </AccordionDetails>
            </Accordion>
            <Box display="flex" alignItems='center' sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h4">Bảng cung độ</Typography>
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
            <Table<any>
                size="small"
                rowKey="_id" rowSelection={rowSelection}
                pagination={{
                    current: page,
                    pageSize,
                    total,
                    showSizeChanger: true,
                    pageSizeOptions: ['50', '100', '150', '200', '500'],
                    showTotal: (total, range) => (
                        <div style={{ flex: 1, textAlign: 'left' }}>
                            Hiển thị {range[0]}-{range[1]}/ {total}
                        </div>
                    ),
                }}
                columns={trvelLogColumns.filter(col => col.key && visibleColumns.includes(col.key.toString()))}
                dataSource={orders}
                onChange={(pagination, filters) => {
                    setPage(pagination.current!);      // 👈 cập nhật page
                    setPageSize(pagination.pageSize!); // 👈 cập nhật pageSize
                    setServerFilters(filters);         // 👈 cập nhật filters
                }}
                loading={{
                    spinning: isLoading,
                    tip: 'Đang tải dữ liệu...',
                }}
                scroll={{ x: 'max-content', y: '60vh' }}
                tableLayout="fixed"
            />

        </Box >
    );
};

export default TravelLogs;