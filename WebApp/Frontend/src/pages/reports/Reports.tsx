import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    Grid,
    TextField,
    MenuItem,
    Button,
    Checkbox,
    FormControlLabel,
    Box,
    Select,
    FormControl,
    InputLabel,
    Paper,
    Autocomplete
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../config/api.config';
import { Department, DeviceType, Shift } from '../../types';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import VehicleShiftReport from './VehicleShiftReport';
import CarReport from './CarReport';
import ExcavatorTripReport from './ExcavatorTripReport';
import CarTripReport from './CarTripReport';
import ProductionReport from './ProductionReport';
import WorkLogReport from './WorkLogReport';
import mealRequestReport from './MealRepuestReport';
import { Close, Edit } from '@mui/icons-material';
import { showErrorAlert } from '../../components/Alert';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';


function Reports() {
    const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
    const [deviceType, setDeviceType] = useState("");
    const [title, setTitle] = useState("");
    const [account, setAccount] = useState('');
    const [shift, setShift] = useState<string[]>([]);
    const [department, setDepartment] = useState<string>('');
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [preview, setPreview] = useState(false);
    const [user] = useAtom(userAtom)


    const { data: shifts = [] } = useQuery({
        queryKey: ['shifts'],
        queryFn: () => api.get('/shifts').then(res => res.data.data),
    });
    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data.data),
    });
    const getSignatureUrl = useMutation({
        mutationFn: async () => {
            const res = await api.get("/auth/me");
            const userData = res.data.data;
            return userData.user?.signature;
        },
        onSuccess: (signature: string) => {
            if (!signature || signature === "") {
                showErrorAlert("Bạn không có chữ kí")
            } else {
                setSignatureUrl(signature);
            }
        },
        onError: (error: any) => {
            showErrorAlert(error.response?.data?.message || error.message || 'Lỗi');
        }
    });
    const reportNames = [
        { name: 'Xe không hoạt động', },
        { name: 'Danh sách chuyến máy xúc', },
        { name: 'Danh sách chuyến ô tô', },
        { name: 'Phiếu báo công', },
        { name: 'Phiếu báo ăn', },
        { name: 'Giao nhận ca', },
        { name: 'Giao ca cán bộ', },
        // { name: 'Phiếu bồi dưỡng hiện vật', },
        // { name: 'Phiếu lĩnh dầu', },
        // { name: 'Tổng hợp số liệu trong ca (Gạt)', },
        // { name: 'Tổng hợp số liệu trong ca (Khoan)', },
        // { name: 'Tổng hợp số liệu trong ca (Máy xúc)', },
        { name: 'Tổng hợp số liệu trong ca (Ô tô)', },
        { name: 'Theo dõi sản lượng, nhiên liệu, dầu mỡ' }
    ];
    const reportsMap = {
        'Xe không hoạt động': {
            viewUrl: '/exports/vehicleShiftReport/view',
            exportUrl: '/exports/vehicleShiftReport',
            PreviewComponent: VehicleShiftReport,
        },
        'Danh sách chuyến máy xúc': {
            viewUrl: '/exports/excavatorTripReport/view',
            exportUrl: '/exports/excavatorTripReport',
            PreviewComponent: ExcavatorTripReport,
        },
        'Danh sách chuyến ô tô': {
            viewUrl: '/exports/carTripReport/view',
            exportUrl: '/exports/carTripReport',
            PreviewComponent: CarTripReport,
        },
        'Phiếu báo công': {
            viewUrl: '/exports/worklog/view',
            exportUrl: '/exports/worklog',
            PreviewComponent: WorkLogReport,
        },
        'Phiếu báo ăn': {
            viewUrl: '/exports/meal_request/view',
            exportUrl: '/exports/meal_request',
            PreviewComponent: mealRequestReport,
        },
        'Giao nhận ca': {
            viewUrl: '',
            exportUrl: '/exports/assignmentTo',
            PreviewComponent: mealRequestReport,
        },
        'Giao ca cán bộ': {
            viewUrl: '',
            exportUrl: '/exports/assignmentManager',
            PreviewComponent: mealRequestReport,
        },
        'Theo dõi sản lượng, nhiên liệu, dầu mỡ': {
            viewUrl: '/exports/productReport/view',
            exportUrl: '/exports/productReport',
            PreviewComponent: ProductionReport,
        },
        'Tổng hợp số liệu trong ca (Ô tô)': {
            viewUrl: '/exports/carReport/view',
            exportUrl: '/exports/carReport',
            PreviewComponent: CarReport,
        },

    };

    const config = reportsMap[title as keyof typeof reportsMap];
    const PreviewComponent = config?.PreviewComponent;


    const reportView = useMutation({
        mutationFn: () => {
            if (!config) throw new Error('Chưa chọn loại báo cáo');
            if (!startDate || !endDate) throw new Error('Chọn thời gian bắt đầu và kết thúc');
            if (shift.length === 0) throw new Error('Chọn ca làm việc');
            return api.post(config.viewUrl, {
                startDate: startDate?.format('YYYY-MM-DD') || '',
                endDate: endDate?.format('YYYY-MM-DD') || '',
                shift,
                title,
                signature: signatureUrl || null,
                department
            }).then(res => {
                setData(res.data.data);
            });
        },
        onSuccess: () => { },
        onError: (error: any) => {
            showErrorAlert(error.response?.data?.message || error.message || 'Lỗi');
        }
    });
    const reportExcel = useMutation({
        mutationFn: () => {
            if (!config) throw new Error('Chưa chọn loại báo cáo');
            if (!startDate || !endDate) throw new Error('Chọn thời gian bắt đầu và kết thúc');
            if (shift.length === 0) throw new Error('Chọn ca làm việc');
            return api.post(config.exportUrl, {
                startDate: startDate?.format('YYYY-MM-DD') || '',
                endDate: endDate?.format('YYYY-MM-DD') || '',
                shift,
                title,
                signature: signatureUrl || null,
                department
            }, {
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


    return (
        <Box sx={{}}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Kết xuất báo cáo</Typography>
            </Box>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {/* Tên báo cáo & Số ngày xem */}
                    {user?.role === "admin" && <Grid item xs={12}>
                        <Autocomplete
                            fullWidth
                            size="small"
                            options={departments}
                            getOptionLabel={(option: Department) => option?.code || ''}
                            value={departments.find((d: Department) => d._id === department)}
                            onChange={(event, newValue) => {
                                setDepartment(newValue?._id || '')
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Đơn vị"
                                />
                            )}
                        />
                    </Grid>}
                    <Grid item xs={12}>
                        <TextField
                            size="small"
                            fullWidth
                            select
                            value={title}
                            label="Tên báo cáo"
                            SelectProps={{
                                displayEmpty: true,
                            }}
                            onChange={(e) => setTitle(e.target.value)}>
                            {reportNames.map((report) => (
                                <MenuItem key={report.name} value={report.name}>
                                    {report.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    {/* Từ ngày - Thời gian bắt đầu */}
                    <Grid item xs={6}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Từ ngày"
                                inputFormat="DD/MM/YYYY" // v5 vẫn hỗ trợ
                                value={startDate ? dayjs(startDate) : null}
                                onChange={(value) => setStartDate(value)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        size="small"
                                    />
                                )}
                            />
                        </LocalizationProvider>
                    </Grid>
                    {/* Từ ngày - Thời gian bắt đầu */}
                    <Grid item xs={6}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Đến ngày"
                                inputFormat="DD/MM/YYYY" // v5 vẫn hỗ trợ
                                value={endDate ? dayjs(endDate) : null}
                                onChange={(value) => setEndDate(value)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        size="small"
                                    />
                                )}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12}>
                        <Autocomplete
                            multiple
                            fullWidth
                            filterSelectedOptions
                            size="small"
                            options={shifts}
                            getOptionLabel={(option: Shift) => `Ca ${option.name} (${option.startTime})`}
                            value={shifts.filter((s: Shift) => shift.includes(s._id))}
                            onChange={(event, newValue) => {
                                setShift(newValue.map((item: Shift) => item._id))
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Ca"
                                />
                            )}
                        />
                    </Grid>
                    {/* Buttons */}
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                        <Button variant="contained" onClick={() => {
                            if (!title) {
                                showErrorAlert("Vui lòng chọn loại báo cáo");
                                return;
                            }
                            reportView.mutate();
                            setPreview(true)
                        }}>
                            Xem trước
                        </Button>
                        {!signatureUrl ? <Button
                            variant="contained"
                            component="label"
                            startIcon={<Edit />}
                            onClick={() => {
                                getSignatureUrl.mutate()
                            }}
                        >
                            Thêm chữ kí
                        </Button>
                            : <Button
                                variant="contained"
                                component="label"
                                startIcon={<Close />}
                                onClick={() => setSignatureUrl(null)}
                            >
                                bỏ chữ kí
                            </Button>}
                        <Button variant="contained" onClick={() => {
                            if (!title) {
                                showErrorAlert("Vui lòng chọn loại báo cáo");
                                return;
                            }
                            reportExcel.mutate();
                        }}>
                            Tải xuống
                        </Button>
                    </Grid>
                    <Grid item xs={12}>
                        {preview && PreviewComponent ? <PreviewComponent data={data} signatureUrl={signatureUrl} /> : null}
                        {signatureUrl && !preview && (
                            <Box mt={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <img src={signatureUrl} alt="Chữ ký" style={{ maxWidth: 200, maxHeight: 100 }} />
                            </Box>
                        )}
                    </Grid>

                </Grid>
            </Paper>
        </Box >
    );
}

export default Reports;