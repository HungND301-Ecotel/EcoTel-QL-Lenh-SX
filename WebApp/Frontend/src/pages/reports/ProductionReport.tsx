import { Typography, IconButton, Paper, Grid, TableContainer, TableHead, Table, TableCell, TableRow, TableBody, Box } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react'
import { Device } from '../../types';

export default function ProductionReport({ data, signatureUrl }: { data: any[], signatureUrl: string | null }) {

    return (
        <Grid item xs={12}>
            <Paper sx={{ minHeight: "80vh", overflowX: 'auto', padding: 1, width: '100%', }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell align='center' rowSpan={3} sx={{ border: '1px solid black' }}>Số TT</TableCell>
                                <TableCell align='center' rowSpan={3} sx={{ border: '1px solid black' }}>Số đăng kí thiết bị</TableCell>
                                <TableCell align='center' rowSpan={3} colSpan={3} sx={{ border: '1px solid black', }}>Họ và tên công nhân vận hành</TableCell>
                                <TableCell align='center' colSpan={2} sx={{ border: '1px solid black' }}>Tuyến vận tải</TableCell>
                                <TableCell align='center' colSpan={6} sx={{ border: '1px solid black' }}>Sản lượng thực hiện</TableCell>
                                <TableCell align='center' rowSpan={3} sx={{ border: '1px solid black' }}>T.km phục vụ</TableCell>
                                <TableCell align='center' rowSpan={3} sx={{ border: '1px solid black' }}>Tổng sản lượng TKm</TableCell>
                                <TableCell align='center' rowSpan={3} sx={{ border: '1px solid black' }}>Giờ hoạt động ra sản phẩm</TableCell>
                                <TableCell align='center' colSpan={5} sx={{ border: '1px solid black' }}>Cấp nhiên liệu, dầu nhờn, mỡ máy</TableCell>
                                <TableCell align='center' rowSpan={3} sx={{ border: '1px solid black' }}>CN vận hành kí nhận</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ border: '1px solid black' }} rowSpan={2} align="center">Cung độ (Km)</TableCell>
                                <TableCell sx={{ border: '1px solid black' }} rowSpan={2} align="center">Độ cao nâng tải (mét)</TableCell>
                                <TableCell align="center" colSpan={3} sx={{ border: '1px solid black' }}>Than</TableCell>
                                <TableCell align="center" colSpan={3} sx={{ border: '1px solid black' }}>Đất, đá</TableCell>
                                <TableCell align="center" colSpan={3} sx={{ border: '1px solid black' }}>Ga doan (Lít)</TableCell>
                                <TableCell align="center" rowSpan={2} sx={{ border: '1px solid black' }}>Dầu nhờn(lít)</TableCell>
                                <TableCell align="center" rowSpan={2} sx={{ border: '1px solid black' }}>Mỡ máy(Kg)</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="center" sx={{ border: '1px solid black' }}>Số chuyến</TableCell>
                                <TableCell align="center" sx={{ border: '1px solid black' }}>Số tấn</TableCell>
                                <TableCell align="center" sx={{ border: '1px solid black' }}>T.Km</TableCell>
                                <TableCell align="center" sx={{ border: '1px solid black' }}>Số chuyến</TableCell>
                                <TableCell align="center" sx={{ border: '1px solid black' }}>Số m3</TableCell>
                                <TableCell align="center" sx={{ border: '1px solid black' }}>T.Km</TableCell>
                                <TableCell align="center" sx={{ border: '1px solid black' }}>Tổng đầu ca</TableCell>
                                <TableCell align="center" sx={{ border: '1px solid black' }}>Cấp trong ca</TableCell>
                                <TableCell align="center" sx={{ border: '1px solid black' }}>Tiêu thụ trong ca</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                {/* Dữ liệu dòng */}
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                                <TableCell>...</TableCell>
                            </TableRow>
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
