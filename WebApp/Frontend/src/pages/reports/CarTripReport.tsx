import {
    Box,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { format } from 'date-fns';
import React from 'react';
import dayjs from 'dayjs';
import { Department, Shift } from '../../types';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';

// --- Hằng số giới hạn số cột ---
const MAX_COL_PER_ROW = 15;

// --- Hàm hỗ trợ chia mảng ---
const chunkArray = (array: any[], size: number) => {
    // Nếu mảng rỗng, vẫn trả về [[]] (một mảng chứa 1 chunk rỗng)
    // để vòng lặp chunk vẫn chạy 1 lần, giúp render hàng trống
    if (!array || array.length === 0) return [[]];
    const results = [];
    for (let i = 0; i < array.length; i += size) {
        results.push(array.slice(i, i + size));
    }
    return results;
};


export default function CarTripReport({
    data,
    signatureUrl,
    maxTrip, // maxTrip global (ví dụ: 40)
    materials,
    startDate,
    endDate,
    shifts,
    department
}: {
    data: any[]; signatureUrl: string | null,
    maxTrip: number,
    materials: any[],
    startDate: dayjs.Dayjs | null,
    endDate: dayjs.Dayjs | null,
    shifts: Shift[],
    department: Department | null
}) {

    const [user] = useAtom(userAtom); // Removed jotai import

    // 1. Tính toán số cột hiển thị
    const displayCols = Math.min(Math.max(maxTrip, 1), MAX_COL_PER_ROW);

    return (
        <Grid item xs={12}>
            <Paper sx={{ p: 1 }}>
                <i style={{ fontSize: 20 }}>CÔNG TY CỔ PHẦN THAN CAO SƠN-TKV</i>
                <Typography textAlign={'center'} mb={2} variant='h3' sx={{ fontWeight: 'bold' }}>Biểu chấm chuyến xe</Typography>
                {/* Sử dụng department?.code thay vì user?.department?.code */}
                <Typography>Đơn vị: {department ? department.code : user?.department?.code}</Typography>
                <Typography>Từ ngày: {startDate?.format('DD-MM-YYYY')}</Typography>
                <Typography>Đến ngày: {endDate?.format('DD-MM-YYYY')}</Typography>
                <Typography>Ca: {shifts.map(s => s.name).join(', ')}</Typography>
                <TableContainer sx={{ maxHeight: '80vh' }}>
                    <Table stickyHeader size="small" aria-label="car-trip-report" sx={{
                        '& th, & td': { border: '1px solid black', padding: "2px 8px" }
                    }}>
                        <TableHead sx={{
                            position: "sticky", top: 0, backgroundColor: "white", zIndex: 2,
                            "& th": { backgroundColor: "white", zIndex: 3 },
                            "& tr:nth-of-type(2) th": { top: 27, position: "sticky" },
                        }}>
                            <TableRow>
                                <TableCell align='center' rowSpan={2} sx={{ width: 60 }}>STT</TableCell>
                                <TableCell align='center' rowSpan={2}>Người nhận lệnh</TableCell>
                                <TableCell align='center' rowSpan={2}>Số thẻ</TableCell>
                                <TableCell align='center' rowSpan={2}>Thiết bị vận hành</TableCell>
                                <TableCell align='center' rowSpan={2}>Máy xúc</TableCell>
                                <TableCell align='center' rowSpan={2}>Điểm đổ tải</TableCell>
                                {/* Cập nhật colSpan dựa trên displayCols */}
                                <TableCell align='center' colSpan={displayCols > 0 ? displayCols + 1 : 2}>Cung độ - Thời điểm xúc tải - Loại vật liệu</TableCell>
                                <TableCell align='center' colSpan={materials.length > 0 ? materials.length + 1 : 1}>Tổng hợp</TableCell>
                            </TableRow>
                            <TableRow sx={{ top: 27 }}>
                                <TableCell align='center'>Chuyến</TableCell>
                                {/* Cập nhật vòng lặp header dựa trên displayCols */}
                                {Array.from({ length: displayCols || 1 }).map((_, i) => (
                                    <TableCell key={i} align='center'>{i + 1}</TableCell>
                                ))}
                                {materials.map((m: any) => (
                                    <TableCell key={m._id} align='center' sx={{ minWidth: 80 }}>{m?.name}</TableCell>
                                ))}
                                <TableCell align='center' sx={{ minWidth: 80 }}>Tổng cộng</TableCell>
                            </TableRow>

                        </TableHead>
                        <TableBody>
                            {data.map((item: any, idx: number) => {

                                const rawReps = (item.reports && item.reports.length)
                                    ? item.reports
                                    : [{ code: '', trips: [], summary: {}, totalTrips: '', totalDistance: '' }];

                                let totalRowsForItem = 0;
                                const processedReps = rawReps.map((r: any) => {
                                    const trips = r.trips || [];
                                    const chunks = chunkArray(trips, MAX_COL_PER_ROW);
                                    const rowCount = chunks.length;
                                    totalRowsForItem += (rowCount * 3);
                                    return { ...r, chunks, rowCount };
                                });

                                return processedReps.map((r: any, rIndex: number) =>
                                    r.chunks.map((chunkTrips: any[], chunkIndex: number) => {

                                        const isFirstReport = rIndex === 0;
                                        const isFirstChunk = chunkIndex === 0;
                                        const reportTotalRows = r.rowCount * 3;

                                        // ====== TÍNH TỔNG THEO CHUNK ======
                                        const chunkDistance = chunkTrips.reduce(
                                            (sum, t) => sum + (t?.distance || 0),
                                            0
                                        );

                                        const chunkTripsCount = chunkTrips.reduce(
                                            (sum, t) => sum + (t?.quantity || 0),
                                            0
                                        );

                                        // Tổng vật liệu theo chunk
                                        const chunkMatSummary: any = {};
                                        materials.forEach(m => {
                                            chunkMatSummary[m.name] = { count: 0, distance: 0 };
                                        });

                                        chunkTrips.forEach(t => {
                                            const name = t.material?.name;
                                            if (!name) return;
                                            if (!chunkMatSummary[name])
                                                chunkMatSummary[name] = { count: 0, distance: 0 };

                                            chunkMatSummary[name].count += (t.quantity || 0);
                                            chunkMatSummary[name].distance += (t.distance || 0);
                                        });

                                        return (
                                            <React.Fragment key={`${item._id}-${rIndex}-${chunkIndex}`}>

                                                {/* --- HÀNG 1: CUNG ĐỘ --- */}
                                                <TableRow>

                                                    {isFirstReport && isFirstChunk && (
                                                        <>
                                                            <TableCell rowSpan={totalRowsForItem} align="center">{idx + 1}</TableCell>
                                                            <TableCell rowSpan={totalRowsForItem} sx={{ whiteSpace: "pre-line" }}>
                                                                {(item.assignedTo || []).map((i: any) => i.fullName).join('\n')}
                                                            </TableCell>
                                                            <TableCell rowSpan={totalRowsForItem} sx={{ whiteSpace: "pre-line" }}>
                                                                {(item.assignedTo || []).map((i: any) => i.salaryCode).join('\n')}
                                                            </TableCell>
                                                            <TableCell rowSpan={totalRowsForItem}>{item.device}</TableCell>
                                                        </>
                                                    )}

                                                    {isFirstChunk && (
                                                        <>
                                                            <TableCell rowSpan={reportTotalRows} align="center">{r.excavator}</TableCell>
                                                            <TableCell rowSpan={reportTotalRows} align="center">{r.toLocation}</TableCell>
                                                        </>
                                                    )}

                                                    <TableCell align="center">Cung độ tạm tính(km)</TableCell>

                                                    {Array.from({ length: displayCols }).map((_, tIdx) => {
                                                        const trip = chunkTrips[tIdx];
                                                        return (
                                                            <TableCell key={tIdx} align="center">
                                                                {trip?.distance || ""}
                                                            </TableCell>
                                                        );
                                                    })}

                                                    {/* Tổng hợp theo chunk */}
                                                    {materials.map((m: any) => (
                                                        <TableCell key={m._id} align="center">
                                                            {chunkMatSummary[m.name].distance}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell align="center">{chunkDistance}</TableCell>
                                                </TableRow>

                                                {/* --- HÀNG 2: THỜI GIAN --- */}
                                                <TableRow>
                                                    <TableCell align="center">Thời gian</TableCell>
                                                    {Array.from({ length: displayCols }).map((_, tIdx) => {
                                                        const trip = chunkTrips[tIdx];
                                                        return (
                                                            <TableCell key={tIdx} align="center">
                                                                {trip?.time ? format(new Date(trip.time), 'HH:mm:ss') : ''}
                                                            </TableCell>
                                                        );
                                                    })}

                                                    {materials.map((m: any) => (
                                                        <TableCell key={m._id} align="center" rowSpan={2}>
                                                            {chunkMatSummary[m.name].count}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell align="center" rowSpan={2}>{chunkTripsCount}</TableCell>
                                                </TableRow>

                                                {/* --- HÀNG 3: VẬT LIỆU --- */}
                                                <TableRow>
                                                    <TableCell align="center">Loại vật liệu</TableCell>

                                                    {Array.from({ length: displayCols }).map((_, tIdx) => {
                                                        const trip = chunkTrips[tIdx];
                                                        return (
                                                            <TableCell key={tIdx} align="center">
                                                                {trip?.material?.name || ""}
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>

                                            </React.Fragment>
                                        );
                                    })
                                );
                            })}
                        </TableBody>

                    </Table>
                </TableContainer>

                {
                    signatureUrl && (
                        <Box mt={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <img src={signatureUrl} alt="Chữ ký" style={{ maxWidth: 200, maxHeight: 100 }} />
                        </Box>
                    )
                }
            </Paper >
        </Grid >
    );
}