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
    Switch,
    Menu,
    ListItemText,
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

const OrderByUsers: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [history, setHistory] = useState(false);
    const [transfer, setTransfer] = useState(false);
    const [employee, setEmployee] = useState("");
    const [startTime, setStartTime] = useState<Dayjs | null>(null);
    const [endTime, setEndTime] = useState<Dayjs | null>(null);
    const [department, setDepartment] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [status, setStatus] = useState('')
    const queryClient = useQueryClient();


    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    const defaultColumns = [
        { id: 'assignedTo', label: 'Nhân viên' },
        { id: 'salaryCode', label: 'Mã thẻ lương' },
        { id: 'shift', label: 'Ca' },
        { id: 'workingDate', label: 'Ngày làm việc' },
        { id: 'job', label: 'Công việc' },
        { id: 'content', label: 'Nội dung' },
        { id: 'device', label: 'Phương tiện' },
        { id: 'createdBy', label: 'Người tạo lệnh' },
        { id: 'createdAt', label: 'Thời gian tạo lệnh' },
        { id: 'startTime', label: 'Bắt đầu' },
        { id: 'endTime', label: 'Kết thúc' },
        { id: 'status', label: 'Trạng thái' },
        { id: 'note', label: 'Ghi chú' },
    ]
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(i => i.id))

    const handleToggleColumn = (id: string) => {
        setVisibleColumns(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const handleChange = (value: string) => {
        setStatus(prev => (prev === value ? '' : value)); // bỏ chọn nếu click lại
    };
    const { data: orderByUser = [], isLoading, refetch } = useQuery({
        queryKey: ['orderByUser', status],
        queryFn: () => api.get(`/orders/user?status=${status}&startTime=${startTime ? startTime.toISOString() : ''}&endTime=${endTime ? endTime.toISOString() : ''}`).then(res => res.data.data),
    });

    const { data: allOrders = [] } = useQuery({
        queryKey: ['allOrders'],
        queryFn: () => api.get(`/orders/user`).then(res => res.data.data),
    });

    return (
        <Box>
            <Typography variant="h4">Công việc của tôi</Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, flexDirection: 'column' }}>
                    <Typography>Từ ngày:</Typography>
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
                </Box>

                <Box sx={{ flex: 1, flexDirection: 'column' }}>
                    <Typography>Đến ngày:</Typography>
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
            </Box>
            <Box display="flex" justifyContent='space-between' alignItems='center' sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h3" sx={{ p: 2 }}>Bảng lệnh sản xuất</Typography>
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
            <Paper sx={{ width: '100%', overflowX: "initial" }}>
                <TableContainer sx={{ height: '80vh' }}>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead>
                            <TableRow>
                                {visibleColumns.includes('assignedTo') && <TableCell align='center' sx={{
                                    position: 'sticky',
                                    left: 0,
                                    backgroundColor: 'white',
                                    zIndex: 3,
                                    minWidth: 150,
                                    border: '1px solid black',
                                    fontWeight: 'bold', fontSize: 18
                                }}>Nhân viên</TableCell>}
                                {visibleColumns.includes('salaryCode') && <TableCell align='center' sx={{ minWidth: 130, border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Mã thẻ lương</TableCell>}
                                {visibleColumns.includes('shift') && <TableCell align='center' sx={{ minWidth: 50, border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Ca</TableCell>}
                                {visibleColumns.includes('workingDate') && <TableCell align='center' sx={{ minWidth: 120, border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Ngày làm việc</TableCell>}
                                {visibleColumns.includes('job') && <TableCell align='center' sx={{ minWidth: 150, border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Công việc</TableCell>}
                                {visibleColumns.includes('content') && <TableCell align='center' sx={{ minWidth: 200, border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Nội dung</TableCell>}
                                {visibleColumns.includes('device') && <TableCell align='center' sx={{ minWidth: 150, border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Phương tiện</TableCell>}
                                {visibleColumns.includes('createdBy') && <TableCell align='center' sx={{ minWidth: 150, border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Người tạo lệnh</TableCell>}
                                {visibleColumns.includes('createdAt') && <TableCell align='center' sx={{ minWidth: 150, border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Thời gian tạo lệnh</TableCell>}
                                {visibleColumns.includes('startTime') && <TableCell align='center' sx={{ minWidth: 120, border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Bắt đầu</TableCell>}
                                {visibleColumns.includes('endTime') && <TableCell align='center' sx={{ minWidth: 120, border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Kết thúc</TableCell>}
                                {visibleColumns.includes('status') && <TableCell align='center' sx={{ minWidth: 150, border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Trạng thái</TableCell>}
                                {visibleColumns.includes('note') && <TableCell align='center' sx={{ minWidth: 150, border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}>Ghi chú</TableCell>}
                            </TableRow>
                        </TableHead>
                        {!isLoading ? <TableBody>
                            {orderByUser.map((order: any) => (
                                <TableRow key={order._id}>
                                    {visibleColumns.includes('assignedTo') && <TableCell sx={{
                                        position: 'sticky',
                                        left: 0,
                                        backgroundColor: 'white',
                                        zIndex: 1,
                                        minWidth: 150,
                                        border: '1px solid black'
                                    }}>{order.assignedTo?.fullName}</TableCell>}
                                    {visibleColumns.includes('salaryCode') && <TableCell sx={{ border: '1px solid black' }}>
                                        {order.assignedTo?.salaryCode}
                                    </TableCell>}
                                    {visibleColumns.includes('shift') && <TableCell sx={{ border: '1px solid black' }}>
                                        {order.shift?.name}
                                    </TableCell>}
                                    {visibleColumns.includes('workingDate') && <TableCell sx={{ border: '1px solid black' }}>
                                        {order.workingDate ? format(new Date(order.workingDate), 'yyyy-MM-dd') : ''}
                                    </TableCell>}
                                    {visibleColumns.includes('job') && <TableCell sx={{ border: '1px solid black' }}>
                                        {order.job.name || ''}
                                    </TableCell>}
                                    {visibleColumns.includes('content') && <TableCell sx={{
                                        whiteSpace: 'pre-wrap',
                                        overflow: 'hidden',
                                        // textOverflow: 'ellipsis',
                                        maxWidth: 400,
                                        border: '1px solid black'
                                    }}>
                                        {order.workContent || ''}
                                    </TableCell>}
                                    {visibleColumns.includes('device') && <TableCell sx={{ border: '1px solid black' }}>
                                        {order.device?.map((dev: any) => dev.code).join(', ')}
                                    </TableCell>}
                                    {visibleColumns.includes('createdBy') && <TableCell sx={{ border: '1px solid black' }}>
                                        {order.createdBy.username || ''}
                                    </TableCell>}
                                    {visibleColumns.includes('createdAt') && <TableCell sx={{ border: '1px solid black' }}>
                                        {order.createdAt ? format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm') : ''}
                                    </TableCell>}
                                    {visibleColumns.includes('startTime') && <TableCell sx={{ border: '1px solid black' }}>
                                        {order.startTime ? format(new Date(order.startTime), 'HH:mm:ss') : ''}
                                    </TableCell>}
                                    {visibleColumns.includes('endTime') && <TableCell sx={{ border: '1px solid black' }}>
                                        {order.endTime ? format(new Date(order.endTime), 'HH:mm:ss') : ''}
                                    </TableCell>}
                                    {visibleColumns.includes('status') && <TableCell sx={{ border: '1px solid black' }}>
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
                                    {visibleColumns.includes('note') && <TableCell sx={{ border: '1px solid black' }}>
                                        {order.temporaryError || ''}
                                    </TableCell>}
                                </TableRow>
                            ))}
                        </TableBody> : <Typography>Loading...</Typography>}
                    </Table>
                </TableContainer>
            </Paper>
        </Box >
    );
};

export default OrderByUsers; 