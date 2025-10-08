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
    Checkbox,
    Radio,
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
import React from 'react';


const rawData = [
    { date: "2025-09-01", SLD: 100, SLT: 200, MKS: 50, KLD: 120, KLT: 300, TTK: 90, CD: 70 },
    { date: "2025-09-02", SLD: 80, SLT: 220, MKS: 60, KLD: 110, KLT: 280, TTK: 100, CD: 60 },
    { date: "2025-09-03", SLD: 120, SLT: 210, MKS: 55, KLD: 130, KLT: 320, TTK: 95, CD: 65 },
];

const productions = [
    { key: "SLD", name: "Sản lượng đất thực hiện (m3)" },
    { key: "SLT", name: "Sản lượng than nguyên khai (m3)" },
    { key: "MKS", name: "Mét khoan sâu (mks)" },
    { key: "KLD", name: "Khối lượng vận chuyển đất (Tkm)" },
    { key: "KLT", name: "Khối lượng vận chuyển than" },
    { key: "TTK", name: "Thể tích khối thực hiện" },
    { key: "CD", name: "Cung độ thực hiện" },
];

export default function ProductionAnalysic({ departments }: { departments: any[] }) {
    const [user] = useAtom(userAtom)
    const [department, setDepartment] = useState('');
    const [date, setDate] = useState<Dayjs | null>(dayjs());
    const [open, setOpen] = useState(false)

    const [selectedKey, setSelectedKey] = React.useState("SLD");
    const selectedName = productions.find(p => p.key === selectedKey)?.name || selectedKey;


    function transformData(data: any[]) {
        const keys = productions.map(p => p.key);
        return data.map((row, idx) => {
            const newRow: any = { ...row };
            keys.forEach(k => {
                const prev = idx > 0 ? data.slice(0, idx + 1).reduce((s, r) => s + (r[k] || 0), 0) : row[k];
                newRow[`${k}_cum`] = prev;
            });
            return newRow;
        });
    }

    const dataset = transformData(rawData);

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
                        <Table stickyHeader sx={{ p: 2, '& td, & th': { border: '1px solid #e0e0e0', padding: '0 4px' } }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ bgcolor: '#ffe8d6', fontWeight: 'bold', fontSize: 18 }}>SẢN LƯỢNG</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell align="center" colSpan={2} sx={{ fontWeight: 'bold', fontSize: 18, width: '20%' }}>Sản lượng</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 18, width: '10%' }}>Ca 1</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 18, width: '10%' }}>Ca 2</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 18, width: '10%' }}>Ca 3</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 18, width: '10%' }}>Ngày</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 18, width: '10%' }}>Lũy kế tháng</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {productions.map((item, index) => (
                                    <TableRow key={item.key} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' } }}>
                                        <TableCell align="center" sx={{ width: 30 }}>
                                            <Radio onChange={() => setSelectedKey(item.key)} checked={selectedKey === item.key} size='small' />
                                        </TableCell>
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
                    <LineChartProduction dataset={dataset} selectedName={selectedName} selectedKey={selectedKey} />
                </Grid>
            </Grid>
            <VehicleProductionChart open={open} setOpen={setOpen} departments={departments} />
        </Paper>
    )
}
