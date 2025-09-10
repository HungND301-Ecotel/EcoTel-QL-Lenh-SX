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
    Switch,
    Menu,
    ListItemText,
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
    Settings,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Order } from '../../types';
import OrderFormAdd from './OrderFormAdd';
import OrderFormEdit from './OrderFormEdit';
import OrderHistories from '../../components/OrderHistory/OrderHistories';
import OrderFormTransfer from './OrderFormTransfer';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useSocket } from '../../hooks/useSocket';
import { Table, TableProps } from 'antd';

const OrderByUsers: React.FC = () => {

    const [startTime, setStartTime] = useState<Dayjs | null>(null);
    const [endTime, setEndTime] = useState<Dayjs | null>(null);
    const [status, setStatus] = useState('')
    const [selectedRow, setSelectedRow] = useState<any | null>(null);

    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [total, setTotal] = useState(0);
    const [orderByUser, setOrderByUser] = useState<any[]>([]);


    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    const defaultColumns = [
        { id: 'number', label: 'Số thứ tự' },
        { id: 'assignedTo', label: 'Nhân viên' },
        { id: 'salaryCode', label: 'Mã thẻ lương' },
        { id: 'workingDate', label: 'Ngày làm việc' },
        { id: 'job', label: 'Công việc' },
        { id: 'content', label: 'Nội dung' },
        { id: 'createdBy', label: 'Người tạo lệnh' },
        { id: 'createdAt', label: 'Thời gian tạo lệnh' },
        { id: 'startTime', label: 'Bắt đầu' },
        { id: 'endTime', label: 'Kết thúc' },
        { id: 'status', label: 'Trạng thái' },
    ]
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(i => i.id))

    const handleToggleColumn = (id: string) => {
        setVisibleColumns(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const handleChange = (value: string) => {
        setStatus(prev => (prev === value ? '' : value)); // bỏ chọn nếu click lại
    };
    const [serverFilters, setServerFilters] = useState<any>({});
    const [statusCounts, setStatusCounts] = useState<any>({
        all: 0,
        pending: 0,
        in_progress: 0,
        warning: 0,
        completed: 0,
        cancel: 0,
    });
    const { data, isLoading } = useQuery({
        queryKey: ['orders', page, pageSize, status, startTime, endTime, serverFilters],
        queryFn: () => api.get(`/orders`, {
            params: {
                page,
                limit: pageSize,
                status: status || undefined,
                startTime: startTime ? startTime.toISOString() : '',
                endTime: endTime ? endTime.toISOString() : '',

                shift: serverFilters.shift || undefined,
            }
        }).then(res => res.data)
    })
    useEffect(() => {
        if (data) {
            setOrderByUser(data.data);     // mảng order
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

    const orderColumns: TableProps<any>['columns'] = [
        {
            title: 'STT', dataIndex: 'number', key: 'number', width: 50, align: 'center',
            render: (text, record, index) => index + 1,
            fixed: 'left'
        },
        {
            title: 'Nhân viên', dataIndex: 'assignedTo', key: 'assignedTo', width: 200, align: 'center',
            render: (text, record) => record.assignedTo?.fullName || '',
            fixed: 'left'
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
            title: 'Công việc',
            dataIndex: 'job',
            key: 'job',
            width: 250,
            align: 'center',
            render: (text, record) => record.job?.name || '',
        },
        {
            title: 'Nội dung',
            dataIndex: 'workContent',
            key: 'content',
            render: (text: string) => (
                <span
                    style={{
                        display: 'inline-block',
                        width: 250,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        verticalAlign: 'middle',
                    }}
                >
                    {text}
                </span>
            ),
        },
        {
            title: 'Người tạo lệnh', dataIndex: 'createdBy', key: 'createdBy', width: 200, align: 'center',
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
    ];

    return (
        <Box>
            <Typography variant="h3" color='blue'>Công việc của tôi</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 3, mb: 3, border: '1px solid white', p: 1, boxShadow: 2 }}>
                <Box display={'flex'} gap={2} flex={1}>
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
                </Box>
            </Box>
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
                        rowKey="_id"
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
                        columns={orderColumns.filter(col => col.key && visibleColumns.includes(col.key.toString()))}
                        dataSource={orderByUser}
                        onChange={(pagination, filters) => {
                            setPage(pagination.current!);      // 👈 cập nhật page
                            setPageSize(pagination.pageSize!); // 👈 cập nhật pageSize
                            setServerFilters(filters);         // 👈 cập nhật filters
                        }}
                        loading={{
                            spinning: isLoading,
                            tip: 'Đang tải dữ liệu...',
                        }}
                        scroll={{ x: 'max-content', y: 500 }}
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
                                <Typography><strong>Ngày:</strong> {selectedRow.workingDate ? format(new Date(selectedRow.workingDate), 'dd-MM-yyyy') : ''}</Typography>
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
                                        <Typography fontWeight="bold">Nhân viên:</Typography>
                                        <Typography>{selectedRow.createdBy?.username}</Typography>
                                    </Grid>

                                    {/* Thẻ lương */}
                                    <Grid item xs={12} sm={6}>
                                        <Typography fontWeight="bold">Thẻ lương:</Typography>
                                        <Typography>{selectedRow.createdBy?.salaryCode}</Typography>
                                    </Grid>
                                </Grid>
                                <Typography><strong>Công việc:</strong> {selectedRow.job?.name}</Typography>
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
            </Grid >
        </Box >
    );
};

export default OrderByUsers; 