import {
    Paper,
    TableContainer,
    Table,
    TableRow,
    TableHead,
    TableCell,
    TableBody,
    Grid,
    Box,
    Autocomplete,
    TextField,
    IconButton,
    Radio,
} from '@mui/material';
import LineChartProduction from '../../components/LineChartProduction';
import { useState, useMemo } from 'react';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';
import { BarChart } from '@mui/icons-material';
import VehicleProductionChart from '../../components/VehicleProductionChart';
import { useQuery } from '@tanstack/react-query';
import api from '../../config/api.config';

// Danh sách loại sản lượng
const productions = [
    { key: 'SLD', name: 'Sản lượng đất (m³)' },
    { key: 'SLT', name: 'Sản lượng than nguyên khai (m³)' },
    { key: 'MKS', name: 'Mét khoan sâu (mks)' },
    { key: 'KLD', name: 'Khối lượng vận chuyển đất (Tkm)' },
    { key: 'KLT', name: 'Khối lượng than' },
    { key: 'TTK', name: 'Thể tích khối thực hiện' },
    { key: 'CD', name: 'Cung độ thực hiện' },
];

export default function ProductionAnalysic({ departments }: { departments: any[] }) {
    const [user] = useAtom(userAtom);
    const [department, setDepartment] = useState('');
    const [date, setDate] = useState<Dayjs | null>(dayjs());
    const [open, setOpen] = useState(false);
    const [selectedKey, setSelectedKey] = useState('MKS');

    const selectedName = productions.find(p => p.key === selectedKey)?.name || selectedKey;

    // 🔹 Lấy dữ liệu API
    const { data: analysicsData = [] } = useQuery({
        queryKey: ['analysics', department, date],
        queryFn: async () => {
            const res = await api.get(
                `/analysics?date=${date ? date.toISOString() : ''}&department=${department}`
            );
            return res.data.data || [];
        },
        enabled: !!department && !!date,
    });

    // 🔹 Chuẩn hóa dữ liệu cho bảng và biểu đồ
    // 🔹 Chuẩn hóa dữ liệu cho bảng và biểu đồ (đảm bảo đủ loại)
    const dataset = useMemo(() => {
        const merged: Record<string, any> = {};

        analysicsData.forEach((item: any) => {
            item.productionByDay.forEach((day: any) => {
                const date = dayjs(day.date).format('DD/MM');
                if (!merged[date]) merged[date] = { date };

                // Cập nhật giá trị cho loại có dữ liệu
                merged[date][item.jobType] = day.dayTotal || 0;
                merged[date][`${item.jobType}_cum`] = item.cumulativeTotal || 0;
            });
        });

        // 🔹 Bổ sung các loại còn thiếu, gán 0
        const allDates = Object.keys(merged);
        allDates.forEach((date) => {
            productions.forEach((prod) => {
                if (merged[date][prod.key] === undefined) merged[date][prod.key] = 0;
                if (merged[date][`${prod.key}_cum`] === undefined) merged[date][`${prod.key}_cum`] = 0;
            });
        });

        return Object.values(merged).sort((a: any, b: any) => {
            const da = dayjs(a.date, 'DD/MM');
            const db = dayjs(b.date, 'DD/MM');
            return da.diff(db);
        });
    }, [analysicsData]);


    return (
        <Paper variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
            {/* Bộ lọc */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    mb: 2,
                    p: 2,
                }}
            >
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {(user?.role === 'admin' || user?.role === 'dispatcher') && (
                        <Autocomplete
                            size="small"
                            options={departments}
                            getOptionLabel={(option: any) => option.code || ''}
                            value={departments.find((p: any) => p._id === department) || null}
                            onChange={(event, newValue) => {
                                setDepartment(newValue?._id || '');
                            }}
                            sx={{ width: 200 }}
                            renderInput={(params) => <TextField {...params} label="Đơn vị" />}
                        />
                    )}
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                inputFormat="DD/MM/YYYY"
                                label="Ngày"
                                value={date ? dayjs(date) : null}
                                onChange={(newValue) => setDate(newValue)}
                                renderInput={(params) => <TextField {...params} size="small" sx={{ width: 200 }} />}
                            />
                        </LocalizationProvider>
                    </LocalizationProvider>
                    <IconButton onClick={() => setOpen(true)}>
                        <BarChart color="primary" sx={{ fontSize: 30 }} />
                    </IconButton>
                </Box>
            </Box>

            {/* Bảng và Biểu đồ */}
            <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table
                            stickyHeader
                            sx={{
                                '& td, & th': { border: '1px solid #e0e0e0', padding: '4px' },
                            }}
                        >
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        align="center"
                                        sx={{ bgcolor: '#ffe8d6', fontWeight: 'bold', fontSize: 18 }}
                                    >
                                        SẢN LƯỢNG
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell align="center" colSpan={2} sx={{ fontWeight: 'bold', fontSize: 16 }}>
                                        Sản lượng
                                    </TableCell>
                                    <TableCell align="center">Ca 1</TableCell>
                                    <TableCell align="center">Ca 2</TableCell>
                                    <TableCell align="center">Ca 3</TableCell>
                                    <TableCell align="center">Ngày</TableCell>
                                    <TableCell align="center">Lũy kế</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {productions.map((item) => {
                                    const typeData = analysicsData.find((r: any) => r.jobType === item.key);
                                    const dayTotal = typeData
                                        ? typeData.productionByDay.reduce((s: number, d: any) => s + d.dayTotal, 0)
                                        : 0;
                                    const cumulativeTotal = typeData?.cumulativeTotal || 0;

                                    return (
                                        <TableRow
                                            key={item.key}
                                            sx={{ '&:nth-of-type(odd)': { bgcolor: '#fafafa' } }}
                                        >
                                            <TableCell align="center" sx={{ width: 30 }}>
                                                <Radio
                                                    onChange={() => setSelectedKey(item.key)}
                                                    checked={selectedKey === item.key}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell align="center">
                                                {
                                                    typeData?.productionByDay?.flatMap((d: any) =>
                                                        d.shifts.filter((s: any) => s.shift === 1).map((s: any) => s.production)
                                                    )[0] || 0
                                                }
                                            </TableCell>
                                            <TableCell align="center">
                                                {
                                                    typeData?.productionByDay?.flatMap((d: any) =>
                                                        d.shifts.filter((s: any) => s.shift === 2).map((s: any) => s.production)
                                                    )[0] || 0
                                                }
                                            </TableCell>
                                            <TableCell align="center">
                                                {
                                                    typeData?.productionByDay?.flatMap((d: any) =>
                                                        d.shifts.filter((s: any) => s.shift === 3).map((s: any) => s.production)
                                                    )[0] || 0
                                                }
                                            </TableCell>
                                            <TableCell align="center">{dayTotal}</TableCell>
                                            <TableCell align="center">{cumulativeTotal}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                <Grid item xs={12} md={4}>
                    <LineChartProduction
                        dataset={dataset}
                        selectedName={selectedName}
                        selectedKey={selectedKey}
                    />
                </Grid>
            </Grid>

            <VehicleProductionChart
                open={open}
                setOpen={setOpen}
                departments={departments}
            />
        </Paper>
    );
}
