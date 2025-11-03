import { useState } from 'react';
import {
    Typography,
    Grid,
    TextField,
    MenuItem,
    Button,
    Box,
    Paper,
    Autocomplete,
    LinearProgress
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../config/api.config';
import { Department, Shift } from '../../types';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import VehicleShiftReport from './VehicleShiftReport';
import CarReport from './CarReport';
import ExcavatorTripReport from './ExcavatorTripReport';
import CarTripReport from './CarTripReport';
import WorkLogReport from './WorkLogReport';
import mealRequestReport from './MealRepuestReport';
import { Close, Edit } from '@mui/icons-material';
import { showErrorAlert, showSuccessAlert } from '../../components/Alert';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';
import ExcavatorReport from './ExcavatorReport';
import DozerReport from './DozerReport';
import DrillReport from './DrillReport';
import { RoleEnum } from '../../enums';
import { parseAxiosError } from '../../utils/handleApiError';


function Reports() {
    const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
    const [title, setTitle] = useState("");
    const [shift, setShift] = useState<Shift[]>([]);
    const [department, setDepartment] = useState<Department | null>(null);
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [maxTrip, setMaxTrip] = useState(1);
    const [materials, setMaterials] = useState<any[]>([]);
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
    const getSignatureAndS3Url = useMutation({
        mutationFn: async () => {
            // Bước 1: Lấy key chữ ký
            const userRes = await api.get("/auth/me");
            const signatureKey = userRes.data.data.user?.signature;

            if (!signatureKey) {
                // Nếu không có key, bạn có thể throw error hoặc return null
                throw new Error("Không tìm thấy key chữ kí.");
            }

            // Bước 2: Dùng key để lấy S3 URL
            const s3UrlRes = await api.get(`/uploads/get?key=${signatureKey}`);
            return s3UrlRes.data.data as string;
        },
        onSuccess: (s3Url) => {
            if (!s3Url) {
                showErrorAlert("Lỗi lấy URL chữ kí");
            } else {
                setSignatureUrl(s3Url);
            }
        },
        onError: (error: any) => {
            showErrorAlert(error.message || error.response?.data?.message || 'Lỗi');
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
        { name: 'Tổng hợp số liệu trong ca (Máy gạt)', },
        { name: 'Tổng hợp số liệu trong ca (Máy khoan)', },
        { name: 'Tổng hợp số liệu trong ca (Máy xúc)', },
        { name: 'Tổng hợp số liệu trong ca (Ô tô)', },
        // { name: 'Theo dõi sản lượng, nhiên liệu, dầu mỡ' }
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
        // 'Theo dõi sản lượng, nhiên liệu, dầu mỡ': {
        //     viewUrl: '/exports/productReport/view',
        //     exportUrl: '/exports/productReport',
        //     PreviewComponent: ProductionReport,
        // },
        'Tổng hợp số liệu trong ca (Máy gạt)': {
            viewUrl: '/exports/dozerReport/view',
            exportUrl: '/exports/dozerReport',
            PreviewComponent: DozerReport,
        },
        'Tổng hợp số liệu trong ca (Máy khoan)': {
            viewUrl: '/exports/drillReport/view',
            exportUrl: '/exports/drillReport',
            PreviewComponent: DrillReport,
        },
        'Tổng hợp số liệu trong ca (Ô tô)': {
            viewUrl: '/exports/carReport/view',
            exportUrl: '/exports/carReport',
            PreviewComponent: CarReport,
        },
        'Tổng hợp số liệu trong ca (Máy xúc)': {
            viewUrl: '/exports/excavatorReport/view',
            exportUrl: '/exports/excavatorReport',
            PreviewComponent: ExcavatorReport,
        },

    };

    const config = title ? reportsMap[title as keyof typeof reportsMap] : undefined;
    const PreviewComponent = config?.PreviewComponent;


    const reportView = useMutation({
        mutationFn: () => {
            if (!config) throw new Error('Chưa chọn loại báo cáo');
            if (!startDate || !endDate) throw new Error('Chọn thời gian bắt đầu và kết thúc');
            if (shift.length === 0) throw new Error('Chọn ca làm việc');
            return api.post(config.viewUrl, {
                startDate: startDate?.format('YYYY-MM-DD') || '',
                endDate: endDate?.format('YYYY-MM-DD') || '',
                shift: shift.map(s => s._id),
                title,
                signature: signatureUrl || null,
                department: department?._id || ''
            }).then(res => {
                setData(res.data.data);
                setMaxTrip(res.data.maxTrips)
                setMaterials(res.data.materials)
            });
        },
        onSuccess: () => { },
        onError: (error: any) => {
            showErrorAlert(error.response?.data?.message || error.message || 'Lỗi');
        }
    });

    const [progress, setProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false);
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
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
                    );
                    setProgress(percent);
                }
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
        onMutate: () => {
            setIsUploading(true);
            setProgress(0); // Reset tiến trình khi bắt đầu
        },
        onSuccess: () => { setIsUploading(false); },
        onError: async (error: any) => {
            setIsUploading(false)
            const message = await parseAxiosError(error)
            showErrorAlert(message);
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
                    {user?.role === RoleEnum.ADMIN && <Grid item xs={12}>
                        <Autocomplete
                            fullWidth
                            size="small"
                            options={departments}
                            getOptionLabel={(option: Department) => option?.code || ''}
                            value={departments.find((d: Department) => d._id === department?._id)}
                            onChange={(event, newValue) => {
                                setDepartment(newValue);
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
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setPreview(false);
                                setData([]);
                                setMaterials([])
                            }}>
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
                            value={shifts.filter((s: Shift) => shift.includes(s))}
                            onChange={(event, newValue) => {
                                setShift(newValue);
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
                                getSignatureAndS3Url.mutate()
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
                    {isUploading && (
                        <Grid item xs={12}>
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
                                        Đang xử lý dữ liệu...
                                    </Typography>
                                    <LinearProgress />
                                </>
                            )}
                        </Grid>
                    )}
                    <Grid item xs={12}>
                        {preview && PreviewComponent ? <PreviewComponent data={data} signatureUrl={signatureUrl} maxTrip={maxTrip} materials={materials} startDate={startDate} endDate={endDate} shifts={shift} department={department} /> : null}
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