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
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [selectedRow, setSelectedRow] = useState<any | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<any[]>([]);
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);

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
        { id: 'note', label: 'Ghi chú' },
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

    const { data: orders = [], isLoading, refetch } = useQuery({
        queryKey: ['orders', status],
        queryFn: () => api.get(`/orders?status=${status}&employee=${employee}&device=${device}&startTime=${startTime ? startTime.toISOString() : ''}&endTime=${endTime ? endTime.toISOString() : ''}`).then(res => res.data.data),
    });

    const { data: allOrders = [] } = useQuery({
        queryKey: ['allOrders'],
        queryFn: () => api.get(`/orders`).then(res => res.data.data),
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
            showErrorAlert('Không tìm thấy bản ghi cần xóa');
            return;
        }
        for (const order of selectedOrders) {
            if (order.status === "in_progress") {
                return showErrorAlert(`Công việc ${order?.assignedTo?.fullName}-${order?.assignedTo?.salaryCode} đang thực hiện không thể xóa`);
            }
            if (order.status === "completed") {
                return showErrorAlert(`Công việc ${order?.assignedTo?.fullName}-${order?.assignedTo?.salaryCode} đã hoàn thành không thể xóa`);
            }
        }
        showConfirmAlert(`Bạn có muốn xóa ${selectedOrders.length} bản ghi?`).then((result) => {
            if (result.isConfirmed) {
                deleteMutation.mutate(selectedOrders.map(o => o._id));
            }
        });
    };



    //

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
    const paginatedOrders = pageData(orders, page, pageSize);
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h3" color={'blue'}>Lệnh sản xuất</Typography>
            </Box>
            <Accordion expanded={expanded}>
                <AccordionSummary
                    expandIcon={
                        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
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
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: "100%" }}>
                        <Box display={'flex'} gap={2}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpen()}
                            >
                                Thêm
                            </Button>
                            <Button variant="contained" startIcon={<DeleteIcon />} color='error' onClick={handleDelete}>
                                Xóa
                            </Button>
                            <Button variant="contained" startIcon={<InfoOutlined />} color='inherit' onClick={() => setHistory(true)}>
                                Lịch sử
                            </Button>
                            <Button variant="contained" startIcon={<FileDownload />} color='success' onClick={() => {
                                if (selectedOrders.length > 0) {
                                    reportExcel.mutate();
                                } else {
                                    showErrorAlert('Vui lòng chọn bản ghi cần tải xuống');
                                }
                            }}>
                                Tải xuống
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', flex: 1, gap: 2, alignItems: 'center' }}>
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
                                        size='small'
                                        label="Phương tiện"
                                    />
                                )}
                            />
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Từ ngày"
                                    inputFormat="DD/MM/YYYY" // v5 vẫn hỗ trợ
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
                                    inputFormat="DD/MM/YYYY" // v5 vẫn hỗ trợ
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

                            <Box>
                                <Button
                                    variant="contained"
                                    startIcon={<Search />}
                                    onClick={() => refetch()}
                                >
                                    Tìm
                                </Button>
                            </Box>
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
                    <ListItemText primary={`Tất cả (${allOrders.length})`} sx={{ color: 'blue' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='default' name="status" checked={status === 'pending'}
                        onChange={() => handleChange('pending')} />
                    <ListItemText primary={`Chưa nhận lệnh (${allOrders.filter((o: Order) => o.status === "pending").length})`} sx={{ color: 'grey' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='success' name="status" checked={status === 'in_progress'}
                        onChange={() => handleChange('in_progress')} />
                    <ListItemText primary={`Đã nhận lệnh (${allOrders.filter((o: Order) => o.status === "in_progress").length})`} sx={{ color: 'green' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='warning' name="status" checked={status === 'warning'}
                        onChange={() => handleChange('warning')} />
                    <ListItemText primary={`Lỗi (${allOrders.filter((o: Order) => o.status === "warning").length})`} sx={{ color: 'orange' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='error' name="status" checked={status === 'completed'}
                        onChange={() => handleChange('completed')} />
                    <ListItemText primary={`Đã kết thúc (${allOrders.filter((o: Order) => o.status === "completed").length})`} sx={{ color: 'red' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='secondary' name="status" checked={status === 'cancel'}
                        onChange={() => handleChange('cancel')} />
                    <ListItemText primary={`Đã hủy (${allOrders.filter((o: Order) => o.status === "cancel").length})`} sx={{ color: 'purple' }} />
                </Box>
            </Box>
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
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={9}>
                    <Paper sx={{ width: '100%', overflowX: "initial" }}>
                        <TableContainer sx={{ maxHeight: '80vh' }}>
                            <Table stickyHeader aria-label="sticky table" sx={{
                                "& td, & th": { padding: "4px 8px" },
                            }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align='center' sx={{
                                            position: 'sticky',
                                            left: 0,
                                            top: 0,
                                            zIndex: 3,
                                            width: 50,

                                            fontWeight: 'bold', fontSize: 18
                                        }}> <Checkbox
                                                color="primary"
                                                checked={orders.length > 0 && selectedOrders.length === orders.length}
                                                indeterminate={selectedOrders.length > 0 && selectedOrders.length < orders.length}
                                                onChange={() => {
                                                    if (selectedOrders.length === orders.length) {
                                                        setSelectedOrders([]);
                                                    } else {
                                                        setSelectedOrders(orders);
                                                    }
                                                }}
                                            /></TableCell>
                                        <TableCell align='center' sx={{
                                            position: 'sticky',
                                            left: 50,
                                            top: 0,
                                            zIndex: 3,
                                            width: 50,

                                            fontWeight: 'bold', fontSize: 18
                                        }}>STT</TableCell>
                                        {visibleColumns.includes('assignedTo') && <TableCell align='center' sx={{
                                            position: 'sticky',
                                            left: 100,
                                            top: 0,
                                            zIndex: 3,
                                            minWidth: 150,

                                            fontWeight: 'bold', fontSize: 18
                                        }}>Nhân viên</TableCell>}
                                        {visibleColumns.includes('salaryCode') && <TableCell align='center' sx={{ minWidth: 130, fontWeight: 'bold', fontSize: 18 }}>Mã thẻ lương</TableCell>}
                                        {visibleColumns.includes('workingDate') && <TableCell align='center' sx={{ minWidth: 120, fontWeight: 'bold', fontSize: 18 }}>Ngày làm việc</TableCell>}
                                        {visibleColumns.includes('shift') && <TableCell align='center' sx={{ minWidth: 50, fontWeight: 'bold', fontSize: 18 }}>Ca</TableCell>}
                                        {visibleColumns.includes('shiftHour') && <TableCell align='center' sx={{ minWidth: 50, fontWeight: 'bold', fontSize: 18 }}>Giờ làm</TableCell>}
                                        {visibleColumns.includes('job') && <TableCell align='center' sx={{ minWidth: 150, fontWeight: 'bold', fontSize: 18 }}>Công việc</TableCell>}
                                        {visibleColumns.includes('content') && <TableCell align='center' sx={{ minWidth: 200, fontWeight: 'bold', fontSize: 18 }}>Nội dung</TableCell>}
                                        {visibleColumns.includes('device') && <TableCell align='center' sx={{ minWidth: 150, fontWeight: 'bold', fontSize: 18 }}>Phương tiện</TableCell>}
                                        {visibleColumns.includes('createdBy') && <TableCell align='center' sx={{ minWidth: 150, fontWeight: 'bold', fontSize: 18 }}>Người tạo lệnh</TableCell>}
                                        {visibleColumns.includes('createdAt') && <TableCell align='center' sx={{ minWidth: 150, fontWeight: 'bold', fontSize: 18 }}>Thời gian tạo lệnh</TableCell>}
                                        {visibleColumns.includes('startTime') && <TableCell align='center' sx={{ minWidth: 120, fontWeight: 'bold', fontSize: 18 }}>Bắt đầu</TableCell>}
                                        {visibleColumns.includes('endTime') && <TableCell align='center' sx={{ minWidth: 120, fontWeight: 'bold', fontSize: 18 }}>Kết thúc</TableCell>}
                                        {visibleColumns.includes('status') && <TableCell align='center' sx={{ minWidth: 150, fontWeight: 'bold', fontSize: 18 }}>Trạng thái</TableCell>}
                                        {visibleColumns.includes('note') && <TableCell align='center' sx={{ minWidth: 150, fontWeight: 'bold', fontSize: 18 }}>Ghi chú</TableCell>}
                                        {visibleColumns.includes('view') && <TableCell align='center' sx={{ minWidth: 100, fontWeight: 'bold', fontSize: 18 }}>Xem báo công</TableCell>}
                                        {visibleColumns.includes('edit') && <TableCell align='center' sx={{ minWidth: 50, fontWeight: 'bold', fontSize: 18 }}>Sửa</TableCell>}
                                        {visibleColumns.includes('cancel') && <TableCell align='center' sx={{ minWidth: 50, fontWeight: 'bold', fontSize: 18 }}>Hủy</TableCell>}
                                        {visibleColumns.includes('transfer') && <TableCell align='center' sx={{ minWidth: 50, fontWeight: 'bold', fontSize: 18 }}>Chuyển ca</TableCell>}

                                    </TableRow>
                                </TableHead>
                                {!isLoading ? <TableBody>
                                    {paginatedOrders.map((order: any, index: number) => (
                                        <TableRow key={order._id} sx={{
                                            cursor: 'pointer',
                                            backgroundColor: order.status === 'pending'
                                                ? 'white' // xám nhạt
                                                : order.status === 'completed'
                                                    ? '#ffe5e5' // đỏ nhạt
                                                    : order.status === 'in_progress'
                                                        ? '#e5f7e5' // xanh lá nhạt
                                                        : order.status === 'warning'
                                                            ? '#fff8e1' // vàng nhạt
                                                            : '#ede7f6', // tím nhạt
                                        }} onClick={() => setSelectedRow(order)}>
                                            <TableCell align='center' sx={{
                                                position: 'sticky',
                                                left: 0,
                                                zIndex: 1,
                                                width: 50,
                                                backgroundColor: order.status === 'pending'
                                                    ? 'white' // xám nhạt
                                                    : order.status === 'completed'
                                                        ? '#ffe5e5' // đỏ nhạt
                                                        : order.status === 'in_progress'
                                                            ? '#e5f7e5' // xanh lá nhạt
                                                            : order.status === 'warning'
                                                                ? '#fff8e1' // vàng nhạt
                                                                : '#ede7f6', // tím nhạt
                                            }}><Checkbox onChange={() => handleSelected(order)} checked={selectedOrders.some(o => o._id === order._id)} /></TableCell>
                                            <TableCell align='center' sx={{
                                                position: 'sticky',
                                                left: 50,
                                                zIndex: 1,
                                                width: 50,
                                                backgroundColor: order.status === 'pending'
                                                    ? 'white' // xám nhạt
                                                    : order.status === 'completed'
                                                        ? '#ffe5e5' // đỏ nhạt
                                                        : order.status === 'in_progress'
                                                            ? '#e5f7e5' // xanh lá nhạt
                                                            : order.status === 'warning'
                                                                ? '#fff8e1' // vàng nhạt
                                                                : '#ede7f6', // tím nhạt,
                                            }}>{index + 1}</TableCell>
                                            {visibleColumns.includes('assignedTo') && <TableCell sx={{
                                                position: 'sticky',
                                                left: 100,
                                                zIndex: 1,
                                                minWidth: 150,
                                                backgroundColor: order.status === 'pending'
                                                    ? 'white' // xám nhạt
                                                    : order.status === 'completed'
                                                        ? '#ffe5e5' // đỏ nhạt
                                                        : order.status === 'in_progress'
                                                            ? '#e5f7e5' // xanh lá nhạt
                                                            : order.status === 'warning'
                                                                ? '#fff8e1' // vàng nhạt
                                                                : '#ede7f6', // tím nhạt,
                                            }}>{order.assignedTo?.fullName}</TableCell>}
                                            {visibleColumns.includes('salaryCode') && <TableCell align='center' sx={{}}>
                                                {order.assignedTo?.salaryCode}
                                            </TableCell>}
                                            {visibleColumns.includes('workingDate') && <TableCell align='center' sx={{}}>
                                                {order.workingDate ? format(new Date(order.workingDate), 'yyyy-MM-dd') : ''}
                                            </TableCell>}
                                            {visibleColumns.includes('shift') && <TableCell align='center' sx={{}}>
                                                {order.shift?.name}
                                            </TableCell>}
                                            {visibleColumns.includes('shiftHour') && <TableCell align='center' sx={{}}>
                                                {order.shiftHour || ''}
                                            </TableCell>}
                                            {visibleColumns.includes('job') && <TableCell sx={{}}>
                                                {order.job?.name || ''}
                                            </TableCell>}
                                            {visibleColumns.includes('content') && <TableCell sx={{
                                                whiteSpace: 'pre-wrap',
                                                overflow: 'hidden',
                                                // textOverflow: 'ellipsis',
                                                maxWidth: 400,
                                            }}>
                                                {order.workContent || ''}
                                            </TableCell>}
                                            {visibleColumns.includes('device') && <TableCell sx={{}}>
                                                {order.device?.map((dev: any) => dev.code).join(', ') || order.devicesToProduce?.map((dev: any) => `${dev?.deviceType?.name}-SL:${dev?.quantity}`).join('\n')}
                                            </TableCell>}
                                            {visibleColumns.includes('createdBy') && <TableCell sx={{}}>
                                                {order.createdBy?.username || ''}
                                            </TableCell>}
                                            {visibleColumns.includes('createdAt') && <TableCell align='center' sx={{}}>
                                                {order.createdAt ? format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm') : ''}
                                            </TableCell>}
                                            {visibleColumns.includes('startTime') && <TableCell align='center' sx={{}}>
                                                {order.startTime ? format(new Date(order.startTime), 'HH:mm:ss') : ''}
                                            </TableCell>}
                                            {visibleColumns.includes('endTime') && <TableCell align='center' sx={{}}>
                                                {order.endTime ? format(new Date(order.endTime), 'HH:mm:ss') : ''}
                                            </TableCell>}
                                            {visibleColumns.includes('status') && <TableCell sx={{}}>
                                                <Chip
                                                    sx={{ width: '120px' }}
                                                    label={order.status === 'pending' ? 'Chưa nhận lệnh' :
                                                        order.status === 'in_progress' ? 'Đã nhận lệnh' :
                                                            order.status === 'completed' ? 'Đã hoàn thành' :
                                                                order.status === 'warning' ? 'Lỗi' : "Đã hủy"
                                                    }
                                                    color={
                                                        order.status === 'pending' ? 'default' :
                                                            order.status === 'completed' ? 'error' :
                                                                order.status === 'in_progress' ? 'success' :
                                                                    order.status === 'warning' ? 'warning' : 'secondary'}
                                                />
                                            </TableCell>}
                                            {visibleColumns.includes('note') && <TableCell sx={{}}>
                                                {order.temporaryError || ''}
                                            </TableCell>}
                                            {visibleColumns.includes('view') && <TableCell align='center' sx={{}}>
                                                <IconButton
                                                    color="secondary"
                                                    onClick={() => {
                                                        setSelectedOrder(order)
                                                        setShiftReport(true)
                                                    }}
                                                >
                                                    <Tooltip title="Báo công" placement='top'>
                                                        <Visibility />
                                                    </Tooltip>
                                                </IconButton>

                                            </TableCell>}
                                            {visibleColumns.includes('edit') && <TableCell align='center' sx={{}}>
                                                <IconButton
                                                    color="primary"
                                                    disabled={!['pending', 'warning'].includes(order.status)}
                                                    onClick={async () => {
                                                        if (open) {
                                                            const result = await showConfirmAlert('Bạn đang cập nhật một mục. Nếu tiếp tục chỉnh sửa, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?');
                                                            if (result.isConfirmed) {
                                                                handleOpen(order);
                                                            }
                                                        } else {
                                                            handleOpen(order);
                                                        }
                                                    }}
                                                >
                                                    <Tooltip title="Sửa" placement='top'>
                                                        <EditIcon />
                                                    </Tooltip>
                                                </IconButton>
                                            </TableCell>}
                                            {visibleColumns.includes('cancel') && <TableCell align='center' sx={{}}>
                                                <IconButton
                                                    disabled={!['pending', 'warning'].includes(order.status)}
                                                    color="warning"
                                                    onClick={() => handleCancel(order)}
                                                >
                                                    <Tooltip title="Hủy" placement='top'>
                                                        <CancelOutlined />
                                                    </Tooltip>
                                                </IconButton>
                                            </TableCell>}
                                            {visibleColumns.includes('transfer') && <TableCell align='center' sx={{}}>
                                                <IconButton
                                                    color="info"
                                                    disabled={!['completed'].includes(order.status)}
                                                    onClick={async () => {
                                                        if (open) {
                                                            const result = await showConfirmAlert('Bạn đang cập nhật một mục. Nếu tiếp tục, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?');
                                                            if (result.isConfirmed) {
                                                                setSelectedOrder(order)
                                                                setOpen(false)
                                                                setExpanded(true)
                                                                setTransfer(true)
                                                            }
                                                        } else {
                                                            setSelectedOrder(order)
                                                            setOpen(false)
                                                            setExpanded(true)
                                                            setTransfer(true)
                                                        }
                                                    }}
                                                >
                                                    <Tooltip title="Chuyển ca" placement='top'>
                                                        <SyncAlt />
                                                    </Tooltip>
                                                </IconButton>

                                            </TableCell>}
                                        </TableRow>
                                    ))}
                                </TableBody> : <Typography>Loading...</Typography>}
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={orders.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={pageSize}
                            onRowsPerPageChange={(event) => {
                                setPageSize(parseInt(event.target.value, 10));
                                setPage(0);
                            }}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Box sx={{ position: 'sticky', top: 0, maxHeight: '80vh', overflowY: 'auto', border: '1px solid #ccc', borderRadius: 2, p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Thông tin lệnh sản xuất</Typography>
                        {selectedRow ? (
                            <Box>
                                <Typography><strong>Nhân viên:</strong> {selectedRow.assignedTo?.fullName}-{selectedRow.assignedTo?.salaryCode}</Typography>
                                <Typography><strong>Ngày:</strong> {selectedRow.workingDate ? format(new Date(selectedRow.workingDate), 'yyyy-MM-dd') : ''}</Typography>
                                <Typography><strong>Ca:</strong> {selectedRow.shift?.name} {selectedRow.shiftHour ?? ''}</Typography>
                                <Typography><strong>Công việc:</strong> {selectedRow.job.name}</Typography>
                                <Typography><strong>Phương tiện:</strong> {selectedRow.device?.map((dev: any) => dev.code).join(', ') || selectedRow.devicesToProduce?.map((dev: any) => `${dev?.deviceType?.name}-SL:${dev?.quantity}`).join('\n')}</Typography>
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