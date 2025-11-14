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
import { userAtom } from '../../atoms/userAtoms';
import { useAtom } from 'jotai';
import { Department, Shift } from '../../types';
import dayjs from 'dayjs';

// Hàm hỗ trợ chia nhỏ mảng thành các phần tử con (chunk)
const chunkArray = (array: any[], size: number) => {
    if (!array || array.length === 0) return [[]]; // Trả về mảng chứa 1 mảng rỗng để vẫn render được dòng
    const results = [];
    for (let i = 0; i < array.length; i += size) {
        results.push(array.slice(i, i + size));
    }
    return results;
};

export default function ExcavatorTripReport({
    data,
    signatureUrl,
    maxTrip,
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
    const [user] = useAtom(userAtom);

    // 1. Giới hạn số cột hiển thị tối đa là 15, hoặc theo maxTrip nếu maxTrip nhỏ hơn 15
    const MAX_COL_PER_ROW = 15;
    const displayCols = (maxTrip > 0 && maxTrip < MAX_COL_PER_ROW) ? maxTrip : MAX_COL_PER_ROW;

    return (
        <Grid item xs={12}>
            <Paper sx={{ p: 1 }}>
                <i style={{ fontSize: 20 }}>CÔNG TY CỔ PHẦN THAN CAO SƠN-TKV</i>
                <Typography textAlign={'center'} mb={2} variant='h3' fontWeight={'bold'}>Biểu chấm chuyến máy xúc</Typography>
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
                                <TableCell align='center' rowSpan={2} sx={{ minWidth: 120 }}>Người nhận lệnh</TableCell>
                                <TableCell align='center' rowSpan={2} sx={{ minWidth: 60 }}>Số thẻ</TableCell>
                                <TableCell align='center' rowSpan={2} sx={{ minWidth: 80 }}>Máy xúc</TableCell>
                                <TableCell align='center' rowSpan={2} sx={{ minWidth: 80 }}>Xe nhận tải</TableCell>
                                {/* ColSpan theo số cột hiển thị thực tế */}
                                <TableCell align='center' colSpan={displayCols || 1}>Thời điểm xúc tải - Loại vật liệu</TableCell>
                                <TableCell align='center' colSpan={materials?.length > 0 ? materials.length + 1 : 1}>Tổng hợp</TableCell>
                            </TableRow>
                            <TableRow>
                                {/* Chỉ render số thứ tự từ 1 đến displayCols */}
                                {Array.from({ length: displayCols || 1 }).map((_, i) => (
                                    <TableCell key={i} align='center'>{i + 1}</TableCell>
                                ))}
                                {(materials || []).map((m: any) => (
                                    <TableCell key={m?._id || m?.name} align='center'>{m?.name}</TableCell>
                                ))}
                                <TableCell align='center'>Tổng chuyến</TableCell>
                            </TableRow>

                        </TableHead>
                        <TableBody>
                            {data.map((item: any, idx: number) => {
                                const rawReps = (item?.reports && item?.reports.length)
                                    ? item.reports
                                    : [{ code: '', trips: [], summary: {}, totalTrips: '' }];

                                // 2. Tính toán trước số dòng cần thiết cho mỗi item (để rowSpan cột STT, Tên...)
                                // Một 'rep' (1 xe) có thể chiếm nhiều dòng nếu số chuyến > 15
                                let totalRowsForItem = 0;
                                const processedReps = rawReps.map((r: any) => {
                                    const trips = r.trips || [];
                                    const chunks = chunkArray(trips, MAX_COL_PER_ROW);
                                    const rowCount = chunks.length; // Số dòng mà xe này sẽ chiếm
                                    totalRowsForItem += rowCount;
                                    return { ...r, chunks, rowCount };
                                });

                                return processedReps.map((r: any, rIndex: number) => {
                                    // Render từng chunk (mỗi chunk là 1 dòng tr)
                                    return r.chunks.map((chunkTrips: any[], chunkIndex: number) => (
                                        <TableRow key={`${item._id}-${rIndex}-${chunkIndex}`}>
                                            {/* Cột thông tin chung (STT, Tên...) chỉ hiện ở dòng đầu tiên của Item */}
                                            {rIndex === 0 && chunkIndex === 0 && (
                                                <>
                                                    <TableCell rowSpan={totalRowsForItem} align="center">{idx + 1}</TableCell>
                                                    <TableCell rowSpan={totalRowsForItem} sx={{ whiteSpace: "pre-line" }}>{(item.assignedTo || []).map((i: any) => i?.fullName).join('\n')}</TableCell>
                                                    <TableCell rowSpan={totalRowsForItem} sx={{ whiteSpace: "pre-line" }}>{(item.assignedTo || []).map((i: any) => i?.salaryCode).join('\n')}</TableCell>
                                                    <TableCell rowSpan={totalRowsForItem}>{item.excavator || ''}</TableCell>
                                                </>
                                            )}

                                            {/* Cột Xe nhận tải: Rowspan theo số dòng của riêng xe đó (rowCount) */}
                                            {chunkIndex === 0 && (
                                                <TableCell rowSpan={r.rowCount} align="center">{r.code || ''}</TableCell>
                                            )}

                                            {/* Render các chuyến xe trong chunk hiện tại */}
                                            {Array.from({ length: displayCols }).map((_, tIdx) => {
                                                const trip = chunkTrips[tIdx];
                                                return (
                                                    <TableCell key={tIdx} align="center" sx={{ whiteSpace: "pre-line" }}>
                                                        {trip ? (
                                                            <>
                                                                <Typography variant="caption" display="block">{trip.time ? format(new Date(trip.time), 'HH:mm:ss') : ''}</Typography>
                                                                <Typography variant="caption" fontWeight="bold">{trip.material?.name || ''}</Typography>
                                                            </>
                                                        ) : null}
                                                    </TableCell>
                                                );
                                            })}

                                            {/* Cột Tổng hợp: Chỉ hiện ở dòng đầu tiên của xe đó, rowSpan bao trùm các dòng chunk */}
                                            {chunkIndex === 0 && (
                                                <>
                                                    {materials.map((m: any) => (
                                                        <TableCell rowSpan={r.rowCount} align='center' key={m._id}>{r.summary[m?.name] || 0}</TableCell>
                                                    ))}
                                                    <TableCell rowSpan={r.rowCount} align='center'>{r.totalTrips || 0}</TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    ));
                                });
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {signatureUrl && (
                    <Box mt={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <img src={signatureUrl} alt="Chữ ký" style={{ maxWidth: 200, maxHeight: 100 }} />
                    </Box>
                )}
            </Paper >
        </Grid >
    );
}