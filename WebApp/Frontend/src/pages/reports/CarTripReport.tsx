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
import { useAtom } from 'jotai';
import React from 'react';
import { userAtom } from '../../atoms/userAtoms';
import dayjs from 'dayjs';
import { Department, Shift } from '../../types';

export default function CarTripReport({
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

    const [user] = useAtom(userAtom)

    return (
        <Grid item xs={12}>
            <Paper sx={{ p: 1 }}>
                <i style={{ fontSize: 20 }}>CÔNG TY CỔ PHẦN THAN CAO SƠN-TKV</i>
                <Typography textAlign={'center'} mb={2} variant='h3' sx={{ fontWeight: 'bold' }}>Báo cáo số chuyến của ô tô</Typography>
                <Typography>Đơn vị: {department ? department.code : user?.department?.code}</Typography>
                <Typography>Từ ngày: {startDate?.format('DD-MM-YYYY')}</Typography>
                <Typography>Đến ngày: {endDate?.format('DD-MM-YYYY')}</Typography>
                <Typography>Ca: {shifts.map(s => s.name).join(', ')}</Typography>
                <TableContainer sx={{ maxHeight: '80vh' }}>
                    <Table stickyHeader size="small" aria-label="car-trip-report" sx={{
                        '& th, & td': { border: '1px solid black', padding: "2px 8px" }
                    }}>
                        <TableHead sx={{
                            position: "sticky",
                            top: 0,
                            backgroundColor: "white",
                            zIndex: 2,
                            "& th": {
                                backgroundColor: "white",
                                zIndex: 3,
                            },
                            "& tr:nth-of-type(2) th": {
                                top: 27, // chỉnh khoảng cách đúng bằng chiều cao hàng đầu tiên
                                position: "sticky",
                            },
                        }}>
                            <TableRow>
                                <TableCell align='center' rowSpan={2} sx={{ width: 60 }}>STT</TableCell>
                                <TableCell align='center' rowSpan={2}>Người nhận lệnh</TableCell>
                                <TableCell align='center' rowSpan={2}>Số thẻ</TableCell>
                                <TableCell align='center' rowSpan={2}>Thiết bị vận hành</TableCell>
                                <TableCell align='center' rowSpan={2}>Máy xúc</TableCell>
                                <TableCell align='center' rowSpan={2}>Điểm đổ tải</TableCell>
                                <TableCell align='center' colSpan={maxTrip > 0 ? maxTrip + 1 : 2}>Cung độ - Thời điểm xúc tải - Loại vật liệu</TableCell>
                                <TableCell align='center' colSpan={materials.length > 0 ? materials.length + 1 : 1}>Tổng hợp</TableCell>
                            </TableRow>
                            <TableRow sx={{ top: 27 }}>
                                <TableCell align='center'>Chuyến</TableCell>
                                {Array.from({ length: maxTrip || 1 }).map((_, i) => (
                                    <TableCell align='center'>{i + 1}</TableCell>
                                ))}
                                {materials.map((m: any) => (
                                    <TableCell align='center' sx={{ minWidth: 80 }}>{m?.name}</TableCell>
                                ))}
                                <TableCell align='center' sx={{ minWidth: 80 }}>Tổng cộng</TableCell>
                            </TableRow>

                        </TableHead>
                        <TableBody>
                            {data.map((item: any, idx: number) => {
                                const reps = (item.reports && item.reports.length)
                                    ? item.reports
                                    : [{ code: '', trips: [], summary: {}, totalTrips: '', totalDistance: '' }]; // vẫn render 1 dòng nếu không có report
                                const spanReps = reps.length * 3;

                                return reps.map((r: any, i: number) => (
                                    <React.Fragment>
                                        <TableRow key={`${item._id}-${i}`}>
                                            {i === 0 && (
                                                <>
                                                    <TableCell rowSpan={spanReps} sx={{ width: 80 }} align="center">{idx + 1}</TableCell>
                                                    <TableCell rowSpan={spanReps} sx={{ whiteSpace: "pre-line", minWidth: 200 }}>{(item.assignedTo || []).map((i: any) => i?.fullName).join('\n')}</TableCell>
                                                    <TableCell rowSpan={spanReps} sx={{ whiteSpace: "pre-line", minWidth: 80 }}>{(item.assignedTo || []).map((i: any) => i?.salaryCode).join('\n')}</TableCell>
                                                    <TableCell rowSpan={spanReps} sx={{ minWidth: 100 }}>{item.device || ''}</TableCell>
                                                </>
                                            )}
                                            <TableCell rowSpan={3} align="center" sx={{ minWidth: 80 }}>{r.excavator || ''}</TableCell>
                                            <TableCell rowSpan={3} align="center" sx={{ minWidth: 80 }}>{r.toLocation || ''}</TableCell>
                                            <TableCell align="center" sx={{ minWidth: 80 }}>Cung độ tạm tính(km)</TableCell>
                                            {Array.from({ length: maxTrip }).map((_, tIdx) => {
                                                const trip = r.trips[tIdx]; // có thể undefined
                                                return (
                                                    <TableCell key={tIdx} align="center" sx={{ whiteSpace: "pre-line", minWidth: 80 }}>
                                                        {trip?.distance || ''}
                                                    </TableCell>
                                                );
                                            })}
                                            {materials.map((m: any) => (
                                                <TableCell align='center' key={m._id}>{r.summary[m?.name]?.distance || 0}</TableCell>
                                            ))}
                                            <TableCell align='center'>{r.totalDistance || 0}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell align="center" sx={{ minWidth: 80 }}>Thời gian</TableCell>
                                            {Array.from({ length: maxTrip }).map((_, tIdx) => {
                                                const trip = r.trips[tIdx];
                                                return (
                                                    <TableCell key={tIdx} align="center" sx={{ minWidth: 80 }}>
                                                        {trip?.time ? format(new Date(trip.time), 'HH:mm:ss') : ''}
                                                    </TableCell>
                                                );
                                            })}
                                            {materials.map((m: any) => (
                                                <TableCell align='center' rowSpan={2} key={m._id}>{r.summary[m?.name]?.count || 0}</TableCell>
                                            ))}
                                            <TableCell align='center' rowSpan={2}>{r.totalTrips || 0}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell align="center" sx={{ minWidth: 80 }}>Loại vật liệu</TableCell>
                                            {Array.from({ length: maxTrip }).map((_, tIdx) => {
                                                const trip = r.trips[tIdx];
                                                return (
                                                    <TableCell key={tIdx} align="center" sx={{ minWidth: 80 }}>
                                                        {trip?.material?.name || ''}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    </React.Fragment>
                                ));
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
