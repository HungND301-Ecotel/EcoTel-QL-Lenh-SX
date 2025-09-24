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
} from '@mui/material';
import LineChartProduction from '../../components/LineChartProduction';
import { useState } from 'react';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';
import dayjs, { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Analytics, BarChart } from '@mui/icons-material';
import VehicleProductionChart from '../../components/VehicleProductionChart';

export default function ProductionAnalysic({ departments }: { departments: any[] }) {
    const [user] = useAtom(userAtom)
    const [department, setDepartment] = useState('');
    const [date, setDate] = useState<Dayjs | null>(dayjs());
    const [open, setOpen] = useState(false)
    const productions = [
        { key: "SLD", name: "Sản lượng đất thực hiện (m3)" },
        { key: "SLT", name: "Sản lượng than nguyên khai (m3)" },
        { key: "MKS", name: "Mét khoan sâu (m3)" },
        { key: "KLD", name: "Khối lượng vận chuyển đất (Tkm)" },
        { key: "KLT", name: "Khối lượng vận chuyển than" },
        { key: "TTK", name: "Thể tích khối thực hiện" },
        { key: "CD", name: "Cung độ thực hiện" },
    ];

    return (
        <Paper variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    mb: 2,
                    p: 2
                }}
            >
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {(user?.role === "admin" || user?.role === "dispatcher") && <Autocomplete
                        size="small"
                        options={departments}
                        getOptionLabel={(option: any) =>
                            option.code || ''
                        }
                        value={departments.find((p: any) => p._id === department) || null}
                        onChange={(event, newValue) => {
                            setDepartment(newValue?._id || '');
                        }}
                        sx={{ width: 200 }}
                        renderInput={(params) => <TextField {...params} label="Đơn vị" />}
                    />}
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            inputFormat="DD/MM/YYYY"
                            label="Ngày"
                            value={date}
                            onChange={(newValue) => setDate(newValue)}
                            renderInput={(params) => <TextField {...params} size="small" sx={{ width: 200 }} />}
                        />
                    </LocalizationProvider>
                    <IconButton onClick={() => setOpen(true)}>
                        <BarChart color='primary' sx={{ fontSize: 30 }} />
                    </IconButton>
                </Box>
            </Box>
            <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader sx={{ '& td, & th': { border: '1px solid #e0e0e0' } }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ bgcolor: '#ffe8d6', fontWeight: 'bold', fontSize: 18 }}>SẢN LƯỢNG</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell align="center" colSpan={2} sx={{ fontWeight: 'bold', fontSize: 20, width: '20%' }}>Sản lượng</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ca 1</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ca 2</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ca 3</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ngày</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Lũy kế tháng</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {productions.map((item, index) => (
                                    <TableRow key={item.key} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' } }}>
                                        <TableCell align="center" sx={{ width: '2%' }}>{index + 1}</TableCell>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell align="center">0</TableCell>
                                        <TableCell align="center">0</TableCell>
                                        <TableCell align="center">0</TableCell>
                                        <TableCell align="center">0</TableCell>
                                        <TableCell align="center">0</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
                <Grid item xs={12} md={4}>
                    <LineChartProduction />
                </Grid>
            </Grid>
            <VehicleProductionChart open={open} setOpen={setOpen} departments={departments} />
        </Paper>
    )
}
