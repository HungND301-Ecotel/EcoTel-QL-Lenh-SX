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

export default function ExcavatorTripReport({
    data,
    signatureUrl,
    maxTrip,
    materials
}: {
    data: any[]; signatureUrl: string | null,
    maxTrip: number,
    materials: any[]
}) {

    return (
        <Grid item xs={12}>
            <Paper sx={{ p: 1 }}>
                <Typography textAlign={'center'} mb={2} variant='h3'>Báo cáo số chuyến của máy xúc</Typography>
                <TableContainer sx={{ maxHeight: '80vh' }}>
                    <Table stickyHeader size="small" aria-label="car-trip-report" sx={{
                        '& th, & td': { border: '1px solid black', padding: "2px 8px" }
                    }}>
                        <TableHead>
                            <TableRow>
                                <TableCell align='center' rowSpan={2} sx={{ width: 60 }}>STT</TableCell>
                                <TableCell align='center' rowSpan={2}>Người nhận lệnh</TableCell>
                                <TableCell align='center' rowSpan={2}>Số thẻ</TableCell>
                                <TableCell align='center' rowSpan={2}>Máy xúc</TableCell>
                                <TableCell align='center' rowSpan={2}>Xe nhận tải</TableCell>
                                <TableCell align='center' colSpan={maxTrip > 0 ? maxTrip : 1}>Thời điểm xúc tải - Loại vật liệu</TableCell>
                                <TableCell align='center' colSpan={materials.length > 0 ? materials.length + 1 : 1}>Tổng hợp</TableCell>
                            </TableRow>
                            <TableRow>
                                {Array.from({ length: maxTrip || 1 }).map((_, i) => (
                                    <TableCell align='center'>{i + 1}</TableCell>
                                ))}
                                {materials.map((m: any) => (
                                    <TableCell align='center'>{m?.name}</TableCell>
                                ))}
                                <TableCell align='center'>Tổng chuyến</TableCell>
                            </TableRow>

                        </TableHead>
                        <TableBody>
                            {data.map((item: any, idx: number) => {
                                const reps = (item.reports && item.reports.length)
                                    ? item.reports
                                    : [{ code: '', trips: [], summary: {}, totalTrips: '' }]; // vẫn render 1 dòng nếu không có report
                                const spanReps = reps.length;

                                return reps.map((r: any, i: number) => (
                                    <TableRow key={`${item._id}-${i}`}>
                                        {i === 0 && (
                                            <>
                                                <TableCell rowSpan={spanReps} align="center">{idx + 1}</TableCell>
                                                <TableCell rowSpan={spanReps} sx={{ whiteSpace: "pre-line" }}>{(item.assignedTo || []).map((i: any) => i?.fullName).join('\n')}</TableCell>
                                                <TableCell rowSpan={spanReps} sx={{ whiteSpace: "pre-line" }}>{(item.assignedTo || []).map((i: any) => i?.salaryCode).join('\n')}</TableCell>
                                                <TableCell rowSpan={spanReps}>{item.excavator || ''}</TableCell>
                                            </>
                                        )}
                                        <TableCell align="center">{r.code || ''}</TableCell>
                                        {Array.from({ length: maxTrip }).map((_, tIdx) => {
                                            const trip = r.trips[tIdx]; // có thể undefined
                                            return (
                                                <TableCell key={tIdx} align="center" sx={{ whiteSpace: "pre-line" }}>
                                                    {trip ? (
                                                        <>
                                                            <Typography>{trip.time ? format(new Date(trip.time), 'HH:mm:ss') : ''}</Typography>
                                                            <Typography>{trip.material?.name || ''}</Typography>
                                                        </>
                                                    ) : null}
                                                </TableCell>
                                            );
                                        })}
                                        {materials.map((m: any) => (
                                            <TableCell align='center' key={m._id}>{r.summary[m?.name] || 0}</TableCell>
                                        ))}
                                        <TableCell align='center'>{r.totalTrips || 0}</TableCell>
                                    </TableRow>
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
