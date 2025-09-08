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
    Table,
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
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Order } from '../../types';
import OrderFormAdd from './OrderFormAdd';
import OrderFormEdit from './OrderFormEdit';
import OrderHistories from '../../components/OrderHistory/OrderHistories';
import OrderFormTransfer from './OrderFormTransfer';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useSocket } from '../../hooks/useSocket';
import ShiftReport from '../../components/ShiftReport/ShiftReport';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

const StyledPopper = styled(Popper)({
    '& .MuiAutocomplete-listbox': {
        maxHeight: '200px', // Đặt chiều cao tối đa mong muốn
        overflowY: 'auto', // Thêm thanh cuộn khi nội dung vượt quá chiều cao
    },
});


const Orders: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [history, setHistory] = useState(false);
    const [shiftReport, setShiftReport] = useState(false);
    const [transfer, setTransfer] = useState(false);
    const [employee, setEmployee] = useState("");
    const [status, setStatus] = useState("");
    const [startTime, setStartTime] = useState<Dayjs | null>(null);
    const [endTime, setEndTime] = useState<Dayjs | null>(null);
    const [device, setDevice] = useState("");
    const [department, setDepartment] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [selectedRow, setSelectedRow] = useState<any | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<any[]>([]);
    const [user] = useAtom(userAtom)
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);

    const handleSelected = (order: any) => {
        setSelectedOrders(prev =>
            prev.some(o => o._id === order._id)
                ? prev.filter(o => o._id !== order._id)
                : [...prev, order]
        );
    };

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    const defaultColumns = [
        { id: 'assignedTo', label: 'Nhân viên' },
        { id: 'salaryCode', label: 'Mã thẻ lương' },
        { id: 'workingDate', label: 'Ngày làm việc' },
        { id: 'shift', label: 'Ca' },
        { id: 'shiftHour', label: 'Giờ làm việc' },
        { id: 'job', label: 'Công việc' },
        { id: 'content', label: 'Nội dung' },
        { id: 'device', label: 'Phương tiện' },
        { id: 'createdBy', label: 'Người tạo lệnh' },
        { id: 'createdAt', label: 'Thời gian tạo lệnh' },
        { id: 'startTime', label: 'Bắt đầu' },
        { id: 'endTime', label: 'Kết thúc' },
        { id: 'status', label: 'Trạng thái' },
        { id: 'view', label: 'Xem' },
        { id: 'edit', label: 'Sửa' },
        { id: 'cancel', label: 'Hủy' },
        { id: 'transfer', label: 'Chuyển ca' },

    ]
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(i => i.id))

    const handleToggleColumn = (id: string) => {
        setVisibleColumns(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const handleChange = (value: string) => {
        setStatus(prev => (prev === value ? '' : value)); // bỏ chọn nếu click lại
    };


    const { data: devices = [] } = useQuery({
        queryKey: ['devices'],
        queryFn: () => api.get('/devices').then(res => res.data.data),
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(res => res.data.data),
    });
    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data.data),
    });

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders', employee, department, device, startTime, endTime],
        queryFn: () => api.get(`/orders?employee=${employee}&department=${department}&device=${device}&startTime=${startTime ? startTime.toISOString() : ''}&endTime=${endTime ? endTime.toISOString() : ''}`).then(res => res.data.data),

    });


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

    const reportExcel = useMutation({
        mutationFn: () =>
            api.post(`/exports/order/bulk`, { ids: selectedOrders.map(o => o._id) }, {
                responseType: 'blob',
            }).then(res => {
                const blob = new Blob([res.data], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });

                // Tạo một URL tạm từ Blob
                const url = window.URL.createObjectURL(blob);
                // Tạo thẻ <a> động và kích hoạt tải file
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', '*.xlsx');

                document.body.appendChild(link);
                link.click();

                // Dọn dẹp URL Blob và xóa thẻ <a>
                link.parentNode?.removeChild(link);
                window.URL.revokeObjectURL(url);
            }),
        onSuccess: () => {
            showSuccessAlert('Xuất file thành công');
            setSelectedOrders([])
        },
        onError: (error: any) => {
            console.log(error)
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
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


    //

    const orderColumns: GridColDef[] = [
        {
            field: 'number', headerName: 'STT', width: 50, headerAlign: 'center', align: 'center',
            valueGetter: (params) => params.api.getRowIndexRelativeToVisibleRows(params.row._id) + 1,
            headerClassName: 'super-sticky-col-number',
            cellClassName: 'super-sticky-col-number',
        },
        {
            field: 'fullName', headerName: 'Nhân viên', width: 200, headerAlign: 'center',
            valueGetter: (params) => params.row.assignedTo?.fullName || '',
            headerClassName: 'super-sticky-col-fullName',
            cellClassName: 'super-sticky-col-fullName',
        },
        {
            field: 'salaryCode',
            headerName: 'Mã thẻ lương',
            align: 'center',
            width: 120,
            headerAlign: 'center',
            valueGetter: (params) => params.row.assignedTo?.salaryCode || ''
        },
        {
            field: 'workingDate', headerName: 'Ngày làm việc', width: 150, headerAlign: 'center', align: 'center',
            valueGetter: (params) => params.row.workingDate ? format(new Date(params.row.workingDate), 'yyyy-MM-dd') : ''
        },
        {
            field: 'shift', headerName: 'Ca', width: 50, headerAlign: 'center', align: 'center',
            valueGetter: (params) => params.row.shift?.name || ''
        },
        { field: 'shiftHour', headerName: 'Giờ làm', width: 100, headerAlign: 'center', align: 'center' },
        {
            field: 'job',
            headerName: 'Công việc',
            valueGetter: (params) => params.row.job?.name || '',
            width: 250,
            headerAlign: 'center'
        },
        {
            field: 'workContent',
            headerName: 'Nội dung',
            minWidth: 250,
            flex: 1,
            headerAlign: 'center'
        },
        {
            field: 'device', headerName: 'Phương tiện', width: 150, headerAlign: 'center',
            valueGetter: (params) => params.row.device?.map((dev: any) => dev.code).join(', ') || params.row.devicesToProduce?.map((dev: any) => `${dev?.deviceType?.name}-SL:${dev?.quantity}`).join('\n')
        },
        {
            field: 'excavator', headerName: 'Máy xúc', width: 150, headerAlign: 'center',
            valueGetter: (params) => params.row.excavator?.map((dev: any) => dev.code).join(', ')
        },
        {
            field: 'material', headerName: 'Vật liệu', width: 150, headerAlign: 'center',
            valueGetter: (params) => params.row.material?.map((mat: any) => mat.name).join(', ')
        },
        {
            field: 'location', headerName: 'Điểm đổ', width: 150, headerAlign: 'center',
            valueGetter: (params) => params.row.location?.map((loc: any) => loc.name).join(', ')
        },
        {
            field: 'createdBy', headerName: 'Người tạo lệnh', width: 200, headerAlign: 'center', align: 'center',
            valueGetter: (params) => params.row.createdBy?.username || ''
        },
        {
            field: 'createdAt', headerName: 'Thời gian tạo lệnh', width: 170, headerAlign: 'center', align: 'center',
            valueGetter: (params) => params.row.createdAt ? format(new Date(params.row.createdAt), 'yyyy-MM-dd HH:mm') : ''
        },
        {
            field: 'startTime', headerName: 'Bắt đầu', width: 100, headerAlign: 'center', align: 'center',
            valueGetter: (params) => params.row.startTime ? format(new Date(params.row.startTime), 'HH:mm:ss') : ''
        },
        {
            field: 'endTime', headerName: 'Kết thúc', width: 100, headerAlign: 'center', align: 'center',
            valueGetter: (params) => params.row.endTime ? format(new Date(params.row.endTime), 'HH:mm:ss') : ''
        },
        {
            field: 'status', headerName: 'Trạng thái', width: 150, headerAlign: 'center', align: 'center',
            renderCell: (params) => (
                <Chip
                    sx={{ width: '120px' }}
                    label={params.row.status === 'pending' ? 'Chưa nhận lệnh' :
                        params.row.status === 'in_progress' ? 'Đã nhận lệnh' :
                            params.row.status === 'completed' ? 'Đã hoàn thành' :
                                params.row.status === 'warning' ? 'Lỗi' : "Đã hủy"
                    }
                    color={
                        params.row.status === 'pending' ? 'default' :
                            params.row.status === 'completed' ? 'error' :
                                params.row.status === 'in_progress' ? 'success' :
                                    params.row.status === 'warning' ? 'warning' : 'secondary'}
                />
            )
        },
        {
            field: 'view',
            headerName: 'Xem báo công',
            width: 100,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <IconButton
                    color="secondary"
                    onClick={() => {
                        setSelectedOrder(params.row)
                        setShiftReport(true)
                    }}
                >
                    <Tooltip title="Báo công" placement='top'>
                        <Visibility />
                    </Tooltip>
                </IconButton>
            ),
            sortable: false,
            filterable: false,
        },
        {
            field: 'edit',
            headerName: 'Sửa',
            width: 60,
            headerAlign: 'center',
            renderCell: (params) => (
                <IconButton
                    color="primary"
                    disabled={!['pending', 'warning'].includes(params.row?.status)
                    }
                    onClick={async () => {
                        if (open) {
                            const result = await showConfirmAlert('Bạn đang cập nhật một mục. Nếu tiếp tục chỉnh sửa, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?');
                            if (result.isConfirmed) {
                                handleOpen(params.row);
                            }
                        } else {
                            handleOpen(params.row);
                        }
                    }}
                >
                    <Tooltip title="Sửa" placement='top'>
                        <EditIcon />
                    </Tooltip>
                </IconButton >
            ),
            sortable: false,
            filterable: false,
        },
        {
            field: 'cancel',
            headerName: 'Hủy',
            width: 60,
            headerAlign: 'center',
            renderCell: (params) => (
                <IconButton
                    disabled={!['pending', 'warning'].includes(params.row.status)}
                    color="warning"
                    onClick={() => handleCancel(params.row)}
                >
                    <Tooltip title="Hủy" placement='top'>
                        <CancelOutlined />
                    </Tooltip>
                </IconButton>
            ),
            sortable: false,
            filterable: false,
        },
        {
            field: 'tranfer',
            headerName: 'Chuyển ca',
            width: 100,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <IconButton
                    color="info"
                    onClick={async () => {
                        if (open) {
                            const result = await showConfirmAlert('Bạn đang cập nhật một mục. Nếu tiếp tục, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?');
                            if (result.isConfirmed) {
                                setSelectedOrder(params.row)
                                setOpen(false)
                                setExpanded(true)
                                setTransfer(true)

                            }
                        } else {
                            setSelectedOrder(params.row)
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
            sortable: false,
            filterable: false,
        },
    ];

    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);

    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, page: number) => {
        setPage(page);
    };

    const pageData = (orders: any[], page: number, pageSize: number) => {
        let data;
        if (!page && !pageSize) {
            data = orders
        } else {
            data = orders.slice(page * pageSize, (page + 1) * pageSize)
        }
        return data
    }
    const filteredOrders = React.useMemo(() => {
        if (!status) return orders;
        return orders.filter((o: Order) => o.status === status);
    }, [orders, status]);
    const paginatedOrders = pageData(filteredOrders, page, pageSize);
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h3" color={'blue'}>Lệnh sản xuất</Typography>
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
                            <Button variant="contained" startIcon={<InfoOutlined />} color="inherit" onClick={() => setHistory(true)}>
                                Lịch sử
                            </Button>
                            <Button variant="contained" startIcon={<FileDownload />} color="success" onClick={() => {
                                if (selectedOrders.length > 0) {
                                    reportExcel.mutate();
                                } else {
                                    showErrorAlert('Vui lòng chọn bản ghi cần tải xuống');
                                }
                            }}>
                                Tải xuống
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
                            <Autocomplete
                                fullWidth
                                options={users}
                                getOptionLabel={(option: any) =>
                                    `${option?.fullName || ""}-${option?.salaryCode || ''}`
                                }
                                value={users.find((p: any) => p._id === employee) || null}
                                onChange={(event, newValue) => {
                                    setEmployee(newValue?._id || '');
                                }}
                                PopperComponent={StyledPopper}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        size='small'
                                        label="Nhân viên"
                                    />
                                )}
                            />
                            <Autocomplete
                                fullWidth
                                options={devices}
                                getOptionLabel={(option: any) =>
                                    option.code || ''
                                }
                                value={devices.find((p: any) => p._id === device) || null}
                                onChange={(event, newValue) => {
                                    setDevice(newValue?._id || '');
                                }}
                                PopperComponent={StyledPopper}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        size='small'
                                        label="Phương tiện"
                                    />
                                )}
                            />
                            {user?.role === "admin" && <Autocomplete
                                fullWidth
                                options={departments}
                                getOptionLabel={(option: any) =>
                                    option.code || ''
                                }
                                value={departments.find((p: any) => p._id === department) || null}
                                onChange={(event, newValue) => {
                                    setDepartment(newValue?._id || '');
                                }}
                                PopperComponent={StyledPopper}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        size='small'
                                        label="Đơn vị"
                                    />
                                )}
                            />}
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
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {selectedOrder && open && <OrderFormEdit
                        initialValues={selectedOrder}
                        onSubmit={handleSubmit}
                        onCancel={handleClose}
                    />}
                    {!selectedOrder && open && <OrderFormAdd
                        onSubmit={handleSubmit}
                        onCancel={handleClose}
                    />}
                    {selectedOrder && transfer && < OrderFormTransfer
                        initialValues={selectedOrder}
                        onCancel={handleClose}
                    />}
                </AccordionDetails>
            </Accordion>
            <Box display="flex" gap={2} alignItems={'center'} justifyContent='flex-end'>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='info' name="status" checked={status === ''}
                        onChange={() => handleChange('')} />
                    <ListItemText primary={`Tất cả (${orders.length})`} sx={{ color: 'blue' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='default' name="status" checked={status === 'pending'}
                        onChange={() => handleChange('pending')} />
                    <ListItemText primary={`Chưa nhận lệnh (${orders.filter((o: Order) => o.status === "pending").length})`} sx={{ color: 'grey' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='success' name="status" checked={status === 'in_progress'}
                        onChange={() => handleChange('in_progress')} />
                    <ListItemText primary={`Đã nhận lệnh (${orders.filter((o: Order) => o.status === "in_progress").length})`} sx={{ color: 'green' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='warning' name="status" checked={status === 'warning'}
                        onChange={() => handleChange('warning')} />
                    <ListItemText primary={`Lỗi (${orders.filter((o: Order) => o.status === "warning").length})`} sx={{ color: 'orange' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='error' name="status" checked={status === 'completed'}
                        onChange={() => handleChange('completed')} />
                    <ListItemText primary={`Đã kết thúc (${orders.filter((o: Order) => o.status === "completed").length})`} sx={{ color: 'red' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='secondary' name="status" checked={status === 'cancel'}
                        onChange={() => handleChange('cancel')} />
                    <ListItemText primary={`Đã hủy (${orders.filter((o: Order) => o.status === "cancel").length})`} sx={{ color: 'purple' }} />
                </Box>
            </Box>
            <Box display="flex" alignItems='center' sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h4">Bảng lệnh sản xuất</Typography>
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
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={9}>
                    <DataGrid
                        rows={filteredOrders}
                        columns={orderColumns}
                        getRowId={(row) => row._id}
                        rowsPerPageOptions={[10, 50, 100, 200]}
                        autoHeight
                        disableSelectionOnClick
                        checkboxSelection
                        isRowSelectable={(params) => params.row.role !== 'admin'}
                        onSelectionModelChange={(newSelection) => {
                            setSelectedOrders(newSelection as string[]);
                        }}
                        onRowClick={(params) => {
                            setSelectedRow(params.row); // lưu cả object row
                        }}
                        initialState={{
                            pagination: {
                                pageSize: 10,
                            },
                        }}
                        loading={isLoading}
                        getRowClassName={(params) => `status-${params.row.status}`}
                        sx={{
                            '& .MuiDataGrid-columnHeaderTitle': {
                                width: '100%',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                fontSize: 18,
                            },
                            '& .status-pending': { backgroundColor: 'white' },
                            '& .status-completed': { backgroundColor: '#ffe5e5' },
                            '& .status-in_progress': { backgroundColor: '#e5f7e5' },
                            '& .status-warning': { backgroundColor: '#fff8e1' },
                            '& .status-other': { backgroundColor: '#ede7f6' },
                            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5' },

                            // 🔒 Ghim 3 cột đầu: checkbox + STT + Nhân viên
                            '& .MuiDataGrid-columnHeaderCheckbox, & .MuiDataGrid-cellCheckbox': {
                                position: 'sticky',
                                left: 0,
                                zIndex: 3,
                                background: '#fff',
                                minWidth: 50,
                                maxWidth: 50,
                            },
                            '& .super-sticky-col-number': {
                                position: 'sticky',
                                left: 50, // checkbox
                                zIndex: 3,
                                background: '#fff',
                            },
                            '& .super-sticky-col-fullName': {
                                position: 'sticky',
                                left: 100, // checkbox (50) + STT (50)
                                zIndex: 3,
                                background: '#fff',
                            },
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Box sx={{ position: 'sticky', top: 0, maxHeight: '80vh', overflowY: 'auto', border: '1px solid #ccc', borderRadius: 2, p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Thông tin lệnh sản xuất</Typography>
                        {selectedRow ? (
                            <Box>
                                <Typography><strong>Nhân viên:</strong> {selectedRow.assignedTo?.fullName}-{selectedRow.assignedTo?.salaryCode}</Typography>
                                <Typography><strong>Ngày:</strong> {selectedRow.workingDate ? format(new Date(selectedRow.workingDate), 'yyyy-MM-dd') : ''}</Typography>
                                <Typography><strong>Ca:</strong> {selectedRow.shift?.name} {selectedRow.shiftHour ?? ''}</Typography>
                                <Typography><strong>Công việc:</strong> {selectedRow.job?.name}</Typography>
                                <Typography><strong>Phương tiện:</strong> {selectedRow.device?.map((dev: any) => dev.code).join(', ')}</Typography>
                                <Typography><strong>Máy xúc:</strong> {selectedRow.excavator?.map((dev: any) => dev.code).join(', ')}</Typography>
                                <Typography><strong>Vật liệu:</strong> {selectedRow.material?.map((dev: any) => dev.name).join(', ')}</Typography>
                                <Typography><strong>Điểm đổ:</strong> {selectedRow.location?.map((dev: any) => dev.name).join(', ')}</Typography>
                                <Typography><strong>Nội dung:</strong> {selectedRow.workContent}</Typography>
                                <Typography><strong>Trạng thái:</strong> {
                                    selectedRow.status === 'pending' ? 'Chưa nhận lệnh' :
                                        selectedRow.status === 'in_progress' ? 'Đã nhận lệnh' :
                                            selectedRow.status === 'completed' ? 'Đã hoàn thành' :
                                                selectedRow.status === 'warning' ? 'Lỗi' : "Đã hủy"}</Typography>
                            </Box>
                        ) : (
                            <Typography>Chọn một lệnh sản xuất để xem chi tiết</Typography>
                        )}
                    </Box>
                </Grid>
            </Grid>
            <OrderHistories open={history} setOpen={setHistory} selectedOrders={selectedOrders} setSelectedOrders={setSelectedOrders} />
            <ShiftReport open={shiftReport} setOpen={setShiftReport} initialValues={selectedOrder} />
        </Box >
    );
};

export default Orders; 