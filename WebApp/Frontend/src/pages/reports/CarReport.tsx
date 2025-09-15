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

export default function CarReport({
    data,
    signatureUrl
}: { data: any[]; signatureUrl: string | null }) {

    return (
        <Grid item xs={12}>
            <Paper sx={{ p: 1 }}>
                <Typography textAlign={'center'} mb={2} variant='h3'>Tổng hợp số liệu trong ca (Ô tô)</Typography>
                <TableContainer sx={{ maxHeight: '80vh' }}>
                    <Table stickyHeader size="small" aria-label="car-trip-report" sx={{
                        '& th, & td': { border: '1px solid black' }
                    }}>
                        <TableHead>
                            <TableRow>
                                <TableCell align='center' sx={{ width: 60, fontWeight: 600 }}>STT</TableCell>
                                <TableCell align='center' sx={{ width: "10%", fontWeight: 600 }}>Người tạo lệnh</TableCell>
                                <TableCell align='center' sx={{ width: "10%", fontWeight: 600 }}>Công nhân</TableCell>
                                <TableCell align='center' sx={{ width: "10%", fontWeight: 600 }}>Đơn vị</TableCell>
                                <TableCell align='center' sx={{ width: "10%", fontWeight: 600 }}>Biển số ô tô</TableCell>
                                <TableCell align='center' sx={{ width: "10%", fontWeight: 600 }}>Vị trí nhận tải</TableCell>
                                <TableCell align='center' sx={{ width: "10%", fontWeight: 600 }}>Vị trí đổ tải</TableCell>
                                <TableCell align='center' sx={{ width: "10%", fontWeight: 600 }}>Cung độ tạm tính</TableCell>
                                <TableCell align='center' sx={{ width: "5%", fontWeight: 600 }}>Tồn dầu</TableCell>
                                <TableCell align='center' sx={{ width: "5%", fontWeight: 600 }}>Lĩnh dầu</TableCell>
                                <TableCell align='center' sx={{ width: "5%", fontWeight: 600 }}>Tiêu thụ</TableCell>
                                <TableCell align='center' sx={{ width: "5%", fontWeight: 600 }}>Phụ cấp/ bồi dưỡng</TableCell>
                                <TableCell align='center' sx={{ width: "5%", fontWeight: 600 }}>Lương tạm tính</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((item: any, idx: number) => {
                                const reps = (item.reports && item.reports.length)
                                    ? item.reports
                                    : [{ excavator: '', toLocation: '', distance: '' }]; // vẫn render 1 dòng nếu không có report
                                const span = reps.length;

                                return reps.map((r: any, i: number) => (
                                    <TableRow key={`${item._id}-${i}`}>
                                        {i === 0 && (
                                            <>
                                                <TableCell rowSpan={span} align="center">{idx + 1}</TableCell>
                                                <TableCell rowSpan={span}>{item.createdBy || ''}</TableCell>
                                                <TableCell align='center' rowSpan={span}>{item.assignedTo || ''}</TableCell>
                                                <TableCell rowSpan={span}>{item.department || ''}</TableCell>
                                                <TableCell rowSpan={span}>{item.code || ''}</TableCell>
                                            </>
                                        )}
                                        <TableCell align='center'>{r.excavator || ''}</TableCell>
                                        <TableCell align='center'>{r.toLocation || ''}</TableCell>
                                        <TableCell align='center'>{r.distance ?? ''}</TableCell>
                                        {i === 0 && (
                                            <>
                                                <TableCell rowSpan={span}>
                                                    {(item.fuelRemain || []).join('\n')}
                                                </TableCell>
                                                <TableCell rowSpan={span}>
                                                    {(item.fuelReceived || []).join('\n')}
                                                </TableCell>
                                                <TableCell rowSpan={span}>
                                                    {(item.consume || []).join('\n')}
                                                </TableCell>
                                                <TableCell rowSpan={span}></TableCell>
                                                <TableCell rowSpan={span}></TableCell>
                                            </>
                                        )}
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
    );
}
