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
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Order, Shift } from '../../types';
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
import { Table, TableColumnsType, TableProps } from 'antd';
import { TableRowSelection } from 'antd/es/table/interface';
import { StyledPopper } from '../../ui/poppers';
import { useResizableColumns } from '../../hooks/useResizableColumns';
import ResizableTitle from '../../components/ResizableTable/ResizableTable';

const Orders: React.FC = () => {
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
    const [selectedRow, setSelectedRow] = useState<any | null>(null);
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
    const [statusCounts, setStatusCounts] = useState<any>({
        all: 0,
        pending: 0,
        in_progress: 0,
        warning: 0,
        completed: 0,
        cancel: 0,
    });

    const defaultColumns = [
        { id: 'number', label: 'Số thứ tự' },
        { id: 'assignedTo', label: 'Nhân viên' },
        { id: 'salaryCode', label: 'Mã thẻ lương' },
        { id: 'workingDate', label: 'Ngày làm việc' },
        { id: 'shift', label: 'Ca' },
        { id: 'shiftHour', label: 'Giờ làm việc' },
        { id: 'job', label: 'Công việc' },
        { id: 'content', label: 'Nội dung' },
        { id: 'device', label: 'Phương tiện' },
        { id: 'excavator', label: 'Máy xúc' },
        { id: 'material', label: 'Vật liệu' },
        { id: 'location', label: 'Điểm đổ' },
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

    const [serverFilters, setServerFilters] = useState<any>({});
    const { data: devices = [] } = useQuery({
        queryKey: ['devices'],
        queryFn: () => api.get('/devices').then(res => res.data.data),
    });
    const { data: excavators = [] } = useQuery({
        queryKey: ['excavators'],
        queryFn: () => api.get('/devices/excavators/all').then(res => res.data.data),
    });
    const { data: locations = [] } = useQuery({
        queryKey: ['locations'],
        queryFn: () => api.get('/locations').then(res => res.data.data),
    });
    const { data: materials = [] } = useQuery({
        queryKey: ['materials'],
        queryFn: () => api.get('/materials').then(res => res.data.data),
    });
    const { data: jobs = [] } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => api.get('/jobs').then(res => res.data.data),
    });
    const { data: shifts = [] } = useQuery({
        queryKey: ['shifts'],
        queryFn: () => api.get('/shifts').then(res => res.data.data),
    });
    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(res => res.data.data),
    });
    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data.data),
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
            setStatusCounts({
                all: data.statusCounts.all,
                pending: data.statusCounts.pending,
                in_progress: data.statusCounts.in_progress,
                warning: data.statusCounts.warning,
                completed: data.statusCounts.completed,
                cancel: data.statusCounts.cancel,
            });
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


    const orderColumns: TableProps<any>['columns'] = [
        {
            title: 'STT', dataIndex: 'number', key: 'number', width: 50, align: 'center',
            render: (text, record, index) => index + 1,
            fixed: 'left'
        },
        {
            title: 'Nhân viên', dataIndex: 'assignedTo', key: 'assignedTo', width: 200, align: 'center',
            render: (text, record) => record.assignedTo?.fullName || '',
            fixed: 'left',
            filterSearch: true,
            filters: users.map((d: any) => ({ text: `${d.fullName}-${d.salaryCode}`, value: d._id })),
            onFilter: undefined,
            filteredValue: serverFilters.assignedTo ?? null,
        },
        {
            title: 'Mã thẻ lương', dataIndex: 'salaryCode', key: 'salaryCode', width: 120, align: 'center',
            render: (text, record) => record.assignedTo?.salaryCode || '',
        },
        {
            title: 'Ngày làm việc', dataIndex: 'workingDate', key: 'workingDate', width: 150, align: 'center',
            render: (text, record) => record.workingDate ? format(new Date(record.workingDate), 'yyyy-MM-dd') : ''
        },
        {
            title: 'Ca', dataIndex: 'shift', key: 'shift', width: 70, align: 'center',
            render: (text, record) => record.shift?.name || '',
            filterSearch: true,
            filters: shifts.map((d: any) => ({ text: d.name, value: d._id })),
            onFilter: undefined,
            filteredValue: serverFilters.shift ?? null,
        },
        { title: 'Giờ làm', dataIndex: 'shiftHour', key: 'shiftHour', width: 100, align: 'center' },
        {
            title: 'Công việc',
            dataIndex: 'job',
            key: 'job',
            width: 250,
            align: 'center',
            ellipsis: true,
            render: (text, record) => record.job?.name || '',
            filterSearch: true,
            filters: jobs.map((d: any) => ({ text: d.name, value: d._id })),
            onFilter: undefined,
            filteredValue: serverFilters.job ?? null,
        },
        {
            title: 'Nội dung',
            dataIndex: 'workContent',
            key: 'content',
            width: 250,           // width khởi tạo, sẽ được update khi resize
            ellipsis: true,       // để AntD tự xử lý cắt ...
        },
        {
            title: 'Phương tiện', dataIndex: 'device', key: 'device', width: 150,
            render: (text, record) => record.device?.map((dev: any) => dev.code).join(', '),
            filterSearch: true,
            filters: devices.map((d: any) => ({ text: d.code, value: d._id })),
            onFilter: undefined,
            filteredValue: serverFilters.device ?? null,
        },
        {
            title: 'Máy xúc', dataIndex: 'excavator', key: 'excavator', width: 150,
            render: (text, record) => record.excavator?.map((dev: any) => dev.code).join(', '),
            filterSearch: true,
            filters: excavators.map((d: any) => ({ text: d.code, value: d._id })),
            onFilter: undefined,
            filteredValue: serverFilters.excavator ?? null,
        },
        {
            title: 'Vật liệu', dataIndex: 'material', key: 'material', width: 150,
            render: (text, record) => record.material?.map((mat: any) => mat.name).join(', '),
            filterSearch: true,
            filters: materials.map((d: any) => ({ text: d.name, value: d._id })),
            onFilter: undefined,
            filteredValue: serverFilters.material ?? null,
        },
        {
            title: 'Điểm đổ', dataIndex: 'location', key: 'location', width: 150,
            render: (text, record) => record.location?.map((loc: any) => loc.name).join(', '),
            filterSearch: true,
            filters: locations.map((d: any) => ({ text: d.name, value: d._id })),
            onFilter: undefined,
            filteredValue: serverFilters.location ?? null,
        },
        {
            title: 'Người tạo lệnh', dataIndex: 'createdBy', key: 'createdBy', width: 200, align: 'center',
            filterSearch: true,
            filters: users.map((d: any) => ({ text: `${d.username}-${d.salaryCode}`, value: d._id })),
            onFilter: undefined,
            filteredValue: serverFilters.createdBy ?? null,
            render: (text, record) => record.createdBy?.username || '',
        },
        {
            title: 'Thời gian tạo lệnh', dataIndex: 'createdAt', key: 'createdAt', width: 170, align: 'center',
            render: (text, record) => record.createdAt ? format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm') : ''
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
            render: (text, record) => (
                <Chip
                    sx={{ width: '120px' }}
                    label={record.status === 'pending' ? 'Chưa nhận lệnh' :
                        record.status === 'in_progress' ? 'Đã nhận lệnh' :
                            record.status === 'completed' ? 'Đã hoàn thành' :
                                record.status === 'warning' ? 'Lỗi' : "Đã hủy"
                    }
                    color={
                        record.status === 'pending' ? 'default' :
                            record.status === 'completed' ? 'error' :
                                record.status === 'in_progress' ? 'success' :
                                    record.status === 'warning' ? 'warning' : 'secondary'}
                />
            ),
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

    const filteredColumns = React.useMemo(
        () => orderColumns.filter(
            (col) => col.key && visibleColumns.includes(String(col.key))
        ),
        [orderColumns, visibleColumns]
    );

    // 👉 truyền visibleColumns như 1 dep cho hook
    const { mergedColumns } = useResizableColumns<any>(filteredColumns, [visibleColumns]);
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
                    <ListItemText primary={`Tất cả (${statusCounts.all})`} sx={{ color: 'blue' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='default' name="status" checked={status === 'pending'}
                        onChange={() => handleChange('pending')} />
                    <ListItemText primary={`Chưa nhận lệnh (${statusCounts.pending})`} sx={{ color: 'grey' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='success' name="status" checked={status === 'in_progress'}
                        onChange={() => handleChange('in_progress')} />
                    <ListItemText primary={`Đã nhận lệnh (${statusCounts.in_progress})`} sx={{ color: 'green' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='warning' name="status" checked={status === 'warning'}
                        onChange={() => handleChange('warning')} />
                    <ListItemText primary={`Lỗi (${statusCounts.warning})`} sx={{ color: 'orange' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='error' name="status" checked={status === 'completed'}
                        onChange={() => handleChange('completed')} />
                    <ListItemText primary={`Đã kết thúc (${statusCounts.completed})`} sx={{ color: 'red' }} />
                </Box>
                <Box display="flex" alignItems={'center'}>
                    <Checkbox color='secondary' name="status" checked={status === 'cancel'}
                        onChange={() => handleChange('cancel')} />
                    <ListItemText primary={`Đã hủy (${statusCounts.cancel})`} sx={{ color: 'purple' }} />
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
                        columns={mergedColumns}
                        components={{ header: { cell: ResizableTitle } }}
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
                        scroll={{ x: '100vw', y: 500 }}
                        tableLayout="fixed"
                        onRow={(record) => ({
                            onClick: () => setSelectedRow(record),
                        })}
                        rowClassName={(record) => {
                            let base = '';
                            switch (record.status) {
                                case 'pending': base = 'row-pending'; break;
                                case 'in_progress': base = 'row-in-progress'; break;
                                case 'completed': base = 'row-completed'; break;
                                case 'warning': base = 'row-warning'; break;
                                case 'cancel': base = 'row-cancel'; break;
                            }
                            return `${base} ${selectedRow?._id === record._id ? 'row-selected' : ''}`;
                        }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Box sx={{ position: 'sticky', top: 0, maxHeight: '80vh', overflowY: 'auto', border: '1px solid #ccc', borderRadius: 2, p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Thông tin lệnh sản xuất</Typography>
                        {selectedRow ? (
                            <Box>
                                <Typography sx={{ display: 'flex', gap: 3 }}>
                                    <Typography><strong>Ngày:</strong> {selectedRow.workingDate ? format(new Date(selectedRow.workingDate), 'dd-MM-yyyy') : ''}</Typography>
                                    <Typography><strong>Ca:</strong> {selectedRow.shift?.name}</Typography>
                                    <Typography><strong>Giờ ca:</strong>  {selectedRow.shiftHour ?? ''}</Typography>
                                </Typography>
                                <Grid container spacing={2}>
                                    {/* Nhân viên */}
                                    <Grid item xs={12} sm={6}>
                                        <Typography fontWeight="bold">Nhân viên:</Typography>
                                        <Typography>{selectedRow.assignedTo?.fullName}</Typography>
                                    </Grid>

                                    {/* Thẻ lương */}
                                    <Grid item xs={12} sm={6}>
                                        <Typography fontWeight="bold">Thẻ lương:</Typography>
                                        <Typography>{selectedRow.assignedTo?.salaryCode}</Typography>
                                    </Grid>
                                </Grid>
                                <Grid container spacing={2}>
                                    {/* Nhân viên */}
                                    <Grid item xs={12} sm={6}>
                                        <Typography fontWeight="bold">Người tạo lệnh:</Typography>
                                        <Typography>{selectedRow.createdBy?.username}</Typography>
                                    </Grid>

                                    {/* Thẻ lương */}
                                    <Grid item xs={12} sm={6}>
                                        <Typography fontWeight="bold">Thẻ lương:</Typography>
                                        <Typography>{selectedRow.createdBy?.salaryCode}</Typography>
                                    </Grid>
                                </Grid>
                                <Typography><strong>Công việc:</strong> {selectedRow.job?.name}</Typography>
                                {selectedRow.device?.length > 0 && <Typography><strong>Phương tiện:</strong> {selectedRow.device?.map((dev: any) => dev.code).join(', ')}</Typography>}
                                {selectedRow.excavator?.length > 0 && <Typography><strong>Máy xúc:</strong> {selectedRow.excavator?.map((dev: any) => dev.code).join(', ')}</Typography>}
                                {selectedRow.location?.length > 0 && <Typography><strong>Vật liệu:</strong> {selectedRow.location?.map((dev: any) => dev.name).join(', ')}</Typography>}
                                {selectedRow.material?.length > 0 && <Typography><strong>Điểm đổ:</strong> {selectedRow.material?.map((dev: any) => dev.name).join(', ')}</Typography>}
                                <Typography><strong>Nội dung:</strong> {selectedRow.workContent}</Typography>
                                <Typography><strong>Trạng thái:</strong> {
                                    selectedRow.status === 'pending' ? 'Chưa nhận lệnh' :
                                        selectedRow.status === 'in_progress' ? 'Đã nhận lệnh' :
                                            selectedRow.status === 'completed' ? 'Đã hoàn thành' :
                                                selectedRow.status === 'warning' ? 'Lỗi' : "Đã hủy"}</Typography>
                                <Typography><strong>Nội dung bàn giao ca:</strong> {selectedRow?.note}</Typography>
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