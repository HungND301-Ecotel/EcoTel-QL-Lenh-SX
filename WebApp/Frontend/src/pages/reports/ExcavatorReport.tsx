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
import { Department, Shift } from '../../types';
import dayjs from 'dayjs';
import { userAtom } from '../../atoms/userAtoms';
import { useAtom } from 'jotai';

export default function ExcavatorReport({
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
                <Typography textAlign={'center'} mb={2} variant='h3' fontWeight={'bold'}>Báo cáo tổng hợp số liệu trong ca (Máy xúc)</Typography>
                <Typography>Đơn vị: {department ? department.code : user?.department?.code}</Typography>
                <Typography>Từ ngày: {startDate?.format('DD-MM-YYYY')}</Typography>
                <Typography>Đến ngày: {endDate?.format('DD-MM-YYYY')}</Typography>
                <Typography>Ca: {shifts.map(s => s.name).join(', ')}</Typography>
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
                                <TableCell align='center' rowSpan={2}>Phương tiện</TableCell>
                                <TableCell align='center' rowSpan={2}>Loại vật liệu</TableCell>
                                <TableCell align='center' colSpan={4}>Sản lượng</TableCell>
                                <TableCell align='center' colSpan={7}>Nhiên liệu/ Điện năng</TableCell>
                                <TableCell align='center' colSpan={3}>Sử dụng thiết bị (giờ)</TableCell>
                                <TableCell align='center' rowSpan={2}>Bồi dưỡng (đồng)</TableCell>
                                <TableCell align='center' rowSpan={2}>Lương tạm tính</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align='center' >Chuyến định mức</TableCell>
                                <TableCell align='center' >Chuyến thực hiện</TableCell>
                                <TableCell align='center' >Tấn</TableCell>
                                <TableCell align='center' >m3</TableCell>
                                <TableCell align='center' >Tồn dầu</TableCell>
                                <TableCell align='center' >Lĩnh</TableCell>
                                <TableCell align='center' >Tồn cuối</TableCell>
                                <TableCell align='center' >Tiêu thụ</TableCell>
                                <TableCell align='center' >Định mức</TableCell>
                                <TableCell align='center' >Tiết kiệm</TableCell>
                                <TableCell align='center' >Vượt</TableCell>
                                <TableCell align='center' >Giờ hoạt động</TableCell>
                                <TableCell align='center' >Giờ ngừng</TableCell>
                                <TableCell align='center' >Giờ hoạt động lũy kế</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((item: any, idx: number) => {
                                const reps = (item.reports && item.reports.length)
                                    ? item.reports
                                    : [{ code: '', materials: [] }];

                                // Tổng số dòng = tổng số vật liệu của tất cả reports
                                const totalMaterials = reps.reduce((sum: number, r: any) => sum + (r.materials?.length || 1), 0);

                                return reps.map((r: any, i: number) => {
                                    const mats = r.materials?.length ? r.materials : [{ material: "", workingMinutes: '' }];

                                    return mats.map((m: any, mIdx: number) => (
                                        <TableRow key={`${item._id}-${i}-${mIdx}`}>
                                            {/* Chỉ render STT + Người nhận lệnh ở dòng đầu tiên của cả nhóm */}
                                            {i === 0 && mIdx === 0 && (
                                                <>
                                                    <TableCell rowSpan={totalMaterials} align="center">{idx + 1}</TableCell>
                                                    <TableCell rowSpan={totalMaterials} sx={{ whiteSpace: "pre-line", minWidth: 200 }}>
                                                        {(item.assignedTo || []).map((u: any) => u?.fullName).join('\n')}
                                                    </TableCell>
                                                    <TableCell rowSpan={totalMaterials} sx={{ whiteSpace: "pre-line", minWidth: 80 }}>
                                                        {(item.assignedTo || []).map((u: any) => u?.salaryCode).join('\n')}
                                                    </TableCell>
                                                    <TableCell rowSpan={totalMaterials} sx={{ whiteSpace: "pre-line", minWidth: 80 }}>
                                                        {(item.excavator || []).map((i: any) => i).join('\n') || ''}
                                                    </TableCell>
                                                </>
                                            )}

                                            {/* Chỉ render code ở dòng đầu tiên của report đó */}
                                            {mIdx === 0 && (
                                                <TableCell rowSpan={mats.length} sx={{ minWidth: 100 }}>
                                                    {r.code || ''}
                                                </TableCell>
                                            )}

                                            {/* Luôn render vật liệu */}
                                            <TableCell sx={{ minWidth: 80 }} align='center'>{m.material?.name || ''}</TableCell>
                                            <TableCell sx={{ minWidth: 80 }} align='center'></TableCell>
                                            <TableCell sx={{ minWidth: 80 }} align='center'>{m.quantity || ''}</TableCell>
                                            <TableCell sx={{ minWidth: 80 }} align='center'>{m.ton || ''}</TableCell>
                                            <TableCell sx={{ minWidth: 80 }} align='center'>{m.cubicMeter || ''}</TableCell>
                                            {i === 0 && mIdx === 0 && (
                                                <React.Fragment>
                                                    <TableCell rowSpan={totalMaterials} align='center' sx={{ minWidth: 80, whiteSpace: "pre-line", }}>{(item?.fuelRemain || []).map((i: any) => i).join('\n')}</TableCell>
                                                    <TableCell rowSpan={totalMaterials} align='center' sx={{ minWidth: 80, whiteSpace: "pre-line", }}>{(item?.fuelReceived || []).map((i: any) => i).join('\n')}</TableCell>
                                                    <TableCell rowSpan={totalMaterials} align='center' sx={{ minWidth: 80, whiteSpace: "pre-line", }}>{(item?.fuelRemainEnd || []).map((i: any) => i).join('\n')}</TableCell>
                                                    <TableCell rowSpan={totalMaterials} align='center' sx={{ minWidth: 80, whiteSpace: "pre-line", }}>{(item?.fuelRemainUsed || []).map((i: any) => i).join('\n')}</TableCell>
                                                    <TableCell rowSpan={totalMaterials} align='center' sx={{ minWidth: 80 }}></TableCell>
                                                    <TableCell rowSpan={totalMaterials} align='center' sx={{ minWidth: 80 }}></TableCell>
                                                    <TableCell rowSpan={totalMaterials} align='center' sx={{ minWidth: 80 }}></TableCell>
                                                    <TableCell rowSpan={totalMaterials} align='center' sx={{ minWidth: 80, whiteSpace: "pre-line", }}>{(item?.travelHours || []).map((i: any) => i).join('\n')}</TableCell>
                                                    <TableCell rowSpan={totalMaterials} align='center' sx={{ minWidth: 80 }}></TableCell>
                                                    <TableCell rowSpan={totalMaterials} align='center' sx={{ minWidth: 80 }}></TableCell>
                                                    <TableCell rowSpan={totalMaterials} align='center' sx={{ minWidth: 80 }}></TableCell>
                                                    <TableCell rowSpan={totalMaterials} align='center' sx={{ minWidth: 80 }}></TableCell>
                                                </React.Fragment>
                                            )}
                                        </TableRow>
                                    ));
                                });
                            })}
                            <TableRow>
                                <TableCell colSpan={8} sx={{ fontWeight: 'bold' }}>Tổng</TableCell>
                                <TableCell align='center' sx={{ fontWeight: 'bold' }}>{data
                                    .flatMap(d => d.reports)
                                    .reduce((sum, r) => sum + (r.totalTon || 0), 0).toFixed(1)
                                }</TableCell>
                                <TableCell align='center' sx={{ fontWeight: 'bold' }}>{data
                                    .flatMap(d => d.reports)
                                    .reduce((sum, r) => sum + (r.totalCubicMeter || 0), 0).toFixed(1)
                                }</TableCell>
                                <TableCell colSpan={12}></TableCell>
                            </TableRow>
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
