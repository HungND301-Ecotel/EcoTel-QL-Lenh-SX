import { Typography, IconButton, Paper, Grid, TableContainer, TableHead, Table, TableCell, TableRow, TableBody, Box } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react'
import { Department, Device, Shift } from '../../types';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';
import dayjs from 'dayjs';

export default function ProductionReport({ data, signatureUrl, department, shifts, day }
    : {
        data: any[],
        signatureUrl: string | null,
        department: Department | null,
        shifts: Shift[],
        day: dayjs.Dayjs | null;
    }) {
    const [user] = useAtom(userAtom)
    return (
        <Grid item xs={12}>
            <Paper sx={{ overflowX: 'auto', padding: 1, width: '100%', }}>
                <Typography textAlign="center" sx={{ fontWeight: "bold", fontSize: 20 }}>
                    Sổ theo dõi sản lượng, nhiên liệu, gps, niêm phong kẹp chì
                </Typography>
                <Typography>Đơn vị: {department ? department.code : user?.department?.code}</Typography>
                <Typography>
                    Ngày {day?.date()} tháng {day ? day?.month() + 1 : ''} năm {day?.year()}
                </Typography>
                <Typography>Ca: {shifts[0]?.name}</Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell align='center' rowSpan={2} sx={{ width: 50, border: '1px solid black' }}>Số TT</TableCell>
                                <TableCell align='center' rowSpan={2} sx={{ width: 150, border: '1px solid black' }}>Họ và tên lái xe</TableCell>
                                <TableCell align='center' rowSpan={2} sx={{ width: 150, border: '1px solid black', }}>Số xe</TableCell>
                                <TableCell align='center' rowSpan={2} sx={{ width: 100, border: '1px solid black' }}>Máy xúc</TableCell>
                                <TableCell align='center' colSpan={3} sx={{ width: 100, border: '1px solid black' }}>Chuyến</TableCell>
                                <TableCell align='center' colSpan={4} sx={{ width: 100, border: '1px solid black' }}>Nhiên liệu</TableCell>
                                <TableCell align='center' colSpan={1} sx={{ width: 100, border: '1px solid black' }}>Giờ HĐ</TableCell>
                                <TableCell align='center' colSpan={2} sx={{ width: 100, border: '1px solid black' }}>Kẹp chì, niêm phong</TableCell>
                                <TableCell align='center' colSpan={2} sx={{ width: 100, border: '1px solid black' }}>JPS</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="center" sx={{ width: 100, border: '1px solid black' }}>Than</TableCell>
                                <TableCell align="center" sx={{ width: 100, border: '1px solid black' }}>Đất</TableCell>
                                <TableCell align="center" sx={{ width: 100, border: '1px solid black' }}>Cung độ (km)</TableCell>
                                <TableCell align="center" sx={{ width: 100, border: '1px solid black' }}>Tồn đầu ca</TableCell>
                                <TableCell align="center" sx={{ width: 100, border: '1px solid black' }}>Lĩnh thêm</TableCell>
                                <TableCell align="center" sx={{ width: 100, border: '1px solid black' }}>Tiêu hao</TableCell>
                                <TableCell align="center" sx={{ width: 100, border: '1px solid black' }}>Tồn cuối ca</TableCell>
                                <TableCell align="center" sx={{ width: 100, border: '1px solid black' }}>Trong ca</TableCell>
                                <TableCell align="center" sx={{ width: 100, border: '1px solid black' }}>Tốt</TableCell>
                                <TableCell align="center" sx={{ width: 100, border: '1px solid black' }}>Hỏng</TableCell>
                                <TableCell align="center" sx={{ width: 100, border: '1px solid black' }}>HĐBT</TableCell>
                                <TableCell align="center" sx={{ width: 100, border: '1px solid black' }}>Mất tín hiệu</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((driver, driverIndex) => {
                                const vehicleCount = driver.vehicles.length;

                                return driver.vehicles.map((v: any, vIndex: number) => (
                                    <TableRow key={`${driverIndex}-${vIndex}`}>

                                        {/* STT: hiển thị 1 lần, merge xuống n xe */}
                                        {vIndex === 0 && (
                                            <TableCell
                                                rowSpan={vehicleCount}
                                                sx={{ border: '1px solid black', verticalAlign: 'middle' }}
                                            >
                                                {driverIndex + 1}
                                            </TableCell>
                                        )}

                                        {/* Họ tên lái xe: chỉ hiện 1 lần */}
                                        {vIndex === 0 && (
                                            <TableCell
                                                rowSpan={vehicleCount}
                                                sx={{ border: '1px solid black', verticalAlign: 'middle' }}
                                            >
                                                {driver.assignedTo}
                                            </TableCell>
                                        )}

                                        {/* Số xe */}
                                        <TableCell sx={{ border: '1px solid black' }}>
                                            {v.device}
                                        </TableCell>

                                        {/* Máy xúc */}
                                        <TableCell sx={{ border: '1px solid black' }}>
                                            {v.excavators.join(", ")}
                                        </TableCell>

                                        {/* Chuyến than */}
                                        <TableCell sx={{ border: '1px solid black' }}>
                                            {v.coalTrip}
                                        </TableCell>

                                        {/* Chuyến đất */}
                                        <TableCell sx={{ border: '1px solid black' }}>
                                            {v.landTrip}
                                        </TableCell>

                                        {/* Cung độ */}
                                        <TableCell sx={{ border: '1px solid black' }}>
                                            {v.distances.join(", ")}
                                        </TableCell>

                                        {/* Nhiên liệu */}
                                        <TableCell sx={{ border: '1px solid black' }}>{v.fuelRemain}</TableCell>
                                        <TableCell sx={{ border: '1px solid black' }}>{v.fuelReceived}</TableCell>
                                        <TableCell sx={{ border: '1px solid black' }}>{v.fuelRemainUsed}</TableCell>
                                        <TableCell sx={{ border: '1px solid black' }}>{v.fuelRemainEnd}</TableCell>

                                        {/* Giờ HĐ */}
                                        <TableCell sx={{ border: '1px solid black' }}>{v.travelHours}</TableCell>

                                        {/* Kẹp chì */}
                                        <TableCell sx={{ border: '1px solid black' }}>{v.sealStatus ? '✘' : ''}</TableCell>
                                        <TableCell sx={{ border: '1px solid black' }}>{!v.sealStatus ? '✘' : ''}</TableCell>

                                        {/* JPS */}
                                        <TableCell sx={{ border: '1px solid black' }}>{v.gpsStatus ? '✘' : ''}</TableCell>
                                        <TableCell sx={{ border: '1px solid black' }}>{!v.gpsStatus ? '✘' : ''}</TableCell>
                                    </TableRow>
                                ));
                            })}
                        </TableBody>


                    </Table>
                </TableContainer>
                {signatureUrl && (
                    <Box mt={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <img src={signatureUrl} alt="Chữ ký" style={{ maxWidth: 200, maxHeight: 100 }} />
                    </Box>
                )}
            </Paper>

        </Grid>
    )
}
