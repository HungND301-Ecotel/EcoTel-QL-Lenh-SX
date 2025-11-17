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
import { AcceptedProductEnum, ReportEnum, RoleEnum } from '../../enums';
import { parseAxiosError } from '../../utils/handleApiError';
import AttendanceReport from './AttendanceReport';
import 'dayjs/locale/vi';
import CarTripDateReport from './CarTripDateReport';
import ExcavatorProductReport from './ExcavatorProductReport';
import CarProductReport from './CarProductReport';
import CarProductivityReport from './CarProductivityReport';
import CarProductLandReport from './CarProductLandReport';
import CarProductCoalReport from './CarProductCoalReport';
import AssignmentManagerReport from './AssignmentManagerReport';

function Reports() {
    const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
    const [date, setDate] = useState<dayjs.Dayjs | null>(null);
    const [day, setDay] = useState<dayjs.Dayjs | null>(null);
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
        { name: ReportEnum.INACTIVE_VEHICLES },
        { name: ReportEnum.WORK_REPORT_SLIP },
        { name: ReportEnum.TIMESHEET },
        { name: ReportEnum.MEAL_REPORT_SLIP },
        { name: ReportEnum.SHIFT_HANDOVER },
        { name: ReportEnum.STAFF_SHIFT_HANDOVER },
        { name: ReportEnum.SHIFT_SUMMARY_GRADER },
        { name: ReportEnum.SHIFT_SUMMARY_DRILL },
        { name: ReportEnum.SHIFT_SUMMARY_EXCAVATOR },
        { name: ReportEnum.SHIFT_SUMMARY_CAR },
        { name: ReportEnum.DATE_TRIP_CAR },
        { name: ReportEnum.EXCAVATOR_TRIP_LIST },
        { name: ReportEnum.DAILY_PRODUCTION_EXCAVATOR_REPORT },
        { name: ReportEnum.CAR_TRIP_LIST },
        { name: ReportEnum.DAILY_PRODUCTION_CAR_REPORT },
        { name: ReportEnum.PRODUCTIVITY_CAR_REPORT },
        { name: ReportEnum.PRODUCTION_LAND_CAR_REPORT },
        { name: ReportEnum.PRODUCTION_COAL_CAR_REPORT },
    ];
    const reportsMap: Record<ReportEnum, { viewUrl: string, exportUrl: string, PreviewComponent: React.ComponentType<any> }> = {
        [ReportEnum.INACTIVE_VEHICLES]: {
            viewUrl: '/exports/vehicleShiftReport/view',
            exportUrl: '/exports/vehicleShiftReport',
            PreviewComponent: VehicleShiftReport,
        },
        [ReportEnum.EXCAVATOR_TRIP_LIST]: {
            viewUrl: '/exports/excavatorTripReport/view',
            exportUrl: '/exports/excavatorTripReport',
            PreviewComponent: ExcavatorTripReport,
        },
        [ReportEnum.CAR_TRIP_LIST]: {
            viewUrl: '/exports/carTripReport/view',
            exportUrl: '/exports/carTripReport',
            PreviewComponent: CarTripReport,
        },
        [ReportEnum.WORK_REPORT_SLIP]: {
            viewUrl: '/exports/worklog/view',
            exportUrl: '/exports/worklog',
            PreviewComponent: WorkLogReport,
        },
        [ReportEnum.TIMESHEET]: {
            viewUrl: '/exports/attendance/view',
            exportUrl: '/exports/attendance',
            PreviewComponent: AttendanceReport,
        },
        [ReportEnum.MEAL_REPORT_SLIP]: {
            viewUrl: '/exports/meal_request/view',
            exportUrl: '/exports/meal_request',
            PreviewComponent: mealRequestReport,
        },
        [ReportEnum.SHIFT_HANDOVER]: {
            viewUrl: '',
            exportUrl: '/exports/assignmentTo',
            PreviewComponent: AssignmentManagerReport, // Giả sử dùng tạm component này
        },
        [ReportEnum.STAFF_SHIFT_HANDOVER]: {
            viewUrl: '',
            exportUrl: '/exports/assignmentManager',
            PreviewComponent: AssignmentManagerReport, // Giả sử dùng tạm component này
        },
        [ReportEnum.SHIFT_SUMMARY_GRADER]: {
            viewUrl: '/exports/dozerReport/view',
            exportUrl: '/exports/dozerReport',
            PreviewComponent: DozerReport,
        },
        [ReportEnum.SHIFT_SUMMARY_DRILL]: {
            viewUrl: '/exports/drillReport/view',
            exportUrl: '/exports/drillReport',
            PreviewComponent: DrillReport,
        },
        [ReportEnum.SHIFT_SUMMARY_CAR]: {
            viewUrl: '/exports/carReport/view',
            exportUrl: '/exports/carReport',
            PreviewComponent: CarReport,
        },
        [ReportEnum.SHIFT_SUMMARY_EXCAVATOR]: {
            viewUrl: '/exports/excavatorReport/view',
            exportUrl: '/exports/excavatorReport',
            PreviewComponent: ExcavatorReport,
        },
        [ReportEnum.DATE_TRIP_CAR]: {
            viewUrl: '/exports/carTripReportByDay/view',
            exportUrl: '/exports/carTripReportByDay',
            PreviewComponent: CarTripDateReport,
        },
        [ReportEnum.DAILY_PRODUCTION_EXCAVATOR_REPORT]: {
            viewUrl: '/exports/excavatorProductReport/view',
            exportUrl: '/exports/excavatorProductReport',
            PreviewComponent: ExcavatorProductReport,
        },
        [ReportEnum.DAILY_PRODUCTION_CAR_REPORT]: {
            viewUrl: '/exports/carProductReport/view',
            exportUrl: '/exports/carProductReport',
            PreviewComponent: CarProductReport,
        },
        [ReportEnum.PRODUCTIVITY_CAR_REPORT]: {
            viewUrl: '/exports/carProductivityReport/view',
            exportUrl: '/exports/carProductivityReport',
            PreviewComponent: CarProductivityReport,
        },
        [ReportEnum.PRODUCTION_LAND_CAR_REPORT]: {
            viewUrl: `/exports/carProductionLandCoalReport/view?type=${AcceptedProductEnum.LAND}`,
            exportUrl: `/exports/carProductionLandCoalReport?type=${AcceptedProductEnum.LAND}`,
            PreviewComponent: CarProductLandReport,
        },
        [ReportEnum.PRODUCTION_COAL_CAR_REPORT]: {
            viewUrl: `/exports/carProductionLandCoalReport/view?type=${AcceptedProductEnum.COAL}`,
            exportUrl: `/exports/carProductionLandCoalReport?type=${AcceptedProductEnum.COAL}`,
            PreviewComponent: CarProductCoalReport,
        }
    };

    const config = title ? reportsMap[title as ReportEnum] : undefined;
    const PreviewComponent = config?.PreviewComponent;


    const reportView = useMutation({
        mutationFn: () => {
            if (!config) throw new Error('Chưa chọn loại báo cáo');
            if ((!startDate || !endDate) && ![ReportEnum.TIMESHEET, ReportEnum.DATE_TRIP_CAR, ReportEnum.DAILY_PRODUCTION_EXCAVATOR_REPORT, ReportEnum.DAILY_PRODUCTION_CAR_REPORT].includes(title as ReportEnum)) throw new Error('Chọn thời gian bắt đầu và kết thúc');
            if (shift.length === 0 && ![ReportEnum.TIMESHEET, ReportEnum.DAILY_PRODUCTION_EXCAVATOR_REPORT, ReportEnum.DATE_TRIP_CAR, ReportEnum.DAILY_PRODUCTION_EXCAVATOR_REPORT, ReportEnum.DAILY_PRODUCTION_CAR_REPORT, ReportEnum.PRODUCTIVITY_CAR_REPORT, ReportEnum.PRODUCTION_LAND_CAR_REPORT, ReportEnum.PRODUCTION_COAL_CAR_REPORT].includes(title as ReportEnum)) throw new Error('Chọn ca làm việc');
            if ([ReportEnum.TIMESHEET].includes(title as ReportEnum) && !date) throw new Error('Chọn tháng');
            if ([ReportEnum.DATE_TRIP_CAR, ReportEnum.DAILY_PRODUCTION_CAR_REPORT].includes(title as ReportEnum) && !day) throw new Error('Chọn ngày');
            return api.post(config.viewUrl, {
                startDate: startDate?.format('YYYY-MM-DD') || '',
                endDate: endDate?.format('YYYY-MM-DD') || '',
                shift: shift.map(s => s._id),
                title,
                signature: signatureUrl || null,
                department: department?._id || '',
                date: date ? date.format('MM/YYYY') : '',
                day: day?.format('YYYY-MM-DD') || '',
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
            if ((!startDate || !endDate) && ![ReportEnum.TIMESHEET, ReportEnum.DATE_TRIP_CAR, ReportEnum.DAILY_PRODUCTION_EXCAVATOR_REPORT, ReportEnum.DAILY_PRODUCTION_CAR_REPORT].includes(title as ReportEnum)) throw new Error('Chọn thời gian bắt đầu và kết thúc');
            if (shift.length === 0 && ![ReportEnum.TIMESHEET, ReportEnum.DATE_TRIP_CAR, ReportEnum.DAILY_PRODUCTION_EXCAVATOR_REPORT, ReportEnum.DAILY_PRODUCTION_CAR_REPORT, ReportEnum.PRODUCTIVITY_CAR_REPORT, ReportEnum.PRODUCTION_LAND_CAR_REPORT, ReportEnum.PRODUCTION_COAL_CAR_REPORT, ReportEnum.DAILY_PRODUCTION_EXCAVATOR_REPORT].includes(title as ReportEnum)) throw new Error('Chọn ca làm việc');
            if ([ReportEnum.TIMESHEET].includes(title as ReportEnum) && !date) throw new Error('Chọn tháng');
            if ([ReportEnum.DATE_TRIP_CAR, ReportEnum.DAILY_PRODUCTION_CAR_REPORT].includes(title as ReportEnum) && !day) throw new Error('Chọn ngày');
            return api.post(config.exportUrl, {
                startDate: startDate?.format('YYYY-MM-DD') || '',
                endDate: endDate?.format('YYYY-MM-DD') || '',
                shift,
                title,
                signature: signatureUrl || null,
                department,
                date: date ? date.format('MM/YYYY') : '',
                day: day?.format('YYYY-MM-DD') || '',
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
                    {![ReportEnum.DATE_TRIP_CAR, ReportEnum.TIMESHEET, ReportEnum.DAILY_PRODUCTION_CAR_REPORT].includes(title as ReportEnum) && <Grid item xs={6}>
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
                    </Grid>}
                    {/* Từ ngày - Thời gian bắt đầu */}
                    {![ReportEnum.DATE_TRIP_CAR, ReportEnum.TIMESHEET, ReportEnum.DAILY_PRODUCTION_CAR_REPORT].includes(title as ReportEnum) && <Grid item xs={6}>
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
                    </Grid>}
                    {![ReportEnum.DAILY_PRODUCTION_EXCAVATOR_REPORT, ReportEnum.DATE_TRIP_CAR, ReportEnum.TIMESHEET, ReportEnum.DAILY_PRODUCTION_CAR_REPORT, ReportEnum.PRODUCTIVITY_CAR_REPORT, ReportEnum.PRODUCTION_LAND_CAR_REPORT, ReportEnum.PRODUCTION_COAL_CAR_REPORT].includes(title as ReportEnum) && <Grid item xs={12}>
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
                    </Grid>}
                    {[ReportEnum.TIMESHEET].includes(title as ReportEnum) && <Grid item xs={12}>
                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                            <DatePicker
                                label="Chọn tháng"
                                inputFormat="MM/YYYY" // v5 vẫn hỗ trợ
                                views={['year', 'month']}
                                openTo="month"
                                value={date ? dayjs(date) : null}
                                onChange={(value) => setDate(value)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        size="small"
                                    />
                                )}
                            />
                        </LocalizationProvider>
                    </Grid>}
                    {[ReportEnum.DATE_TRIP_CAR, ReportEnum.DAILY_PRODUCTION_CAR_REPORT].includes(title as ReportEnum) && <Grid item xs={12}>
                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                            <DatePicker
                                label="Chọn ngày"
                                inputFormat="DD/MM/YYYY" // v5 vẫn hỗ trợ
                                value={day ? dayjs(day) : null}
                                onChange={(value) => setDay(value)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        size="small"
                                    />
                                )}
                            />
                        </LocalizationProvider>
                    </Grid>}
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
                                Bỏ chữ kí
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
                        {preview && PreviewComponent ? <PreviewComponent data={data} signatureUrl={signatureUrl} maxTrip={maxTrip} materials={materials} startDate={startDate} endDate={endDate} shifts={shift} department={department} date={date} day={day} /> : null}
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