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

export default function CarTripReportTable({
    data,
    signatureUrl
}: { data: any[]; signatureUrl: string | null }) {

    return (
        <Grid item xs={12}>
            <Paper sx={{ p: 1 }}>
                <Typography textAlign={'center'} mb={2} variant='h3'>Báo cáo số chuyến của ô tô</Typography>
                <TableContainer sx={{ maxHeight: '80vh' }}>
                    <Table stickyHeader size="small" aria-label="car-trip-report" sx={{
                        '& th, & td': { border: '1px solid black' }
                    }}>
                        <TableHead>
                            <TableRow>
                                <TableCell align='center' sx={{ width: 60 }}>STT</TableCell>
                                <TableCell align='center'>Người ra lệnh</TableCell>
                                <TableCell align='center' sx={{ width: 180 }}>Thẻ lương công nhân</TableCell>
                                <TableCell align='center' sx={{ width: 200 }}>Đơn vị</TableCell>
                                <TableCell align='center' sx={{ width: 160 }}>Biển số ô tô</TableCell>
                                <TableCell align='center' sx={{ width: 160 }}>Vật liệu</TableCell>
                                <TableCell align='center' sx={{ width: 120 }}>Số chuyến</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((item: any, idx: number) => {
                                const reps = (item.reports && item.reports.length)
                                    ? item.reports
                                    : [{ code: '', material: '', tripCount: '' }]; // vẫn render 1 dòng nếu không có report
                                const span = reps.length;

                                return reps.map((r: any, i: number) => (
                                    <TableRow key={`${item._id}-${i}`}>
                                        {i === 0 && (
                                            <>
                                                <TableCell rowSpan={span} align="center">{idx + 1}</TableCell>
                                                <TableCell rowSpan={span}>{item.fullName || ''}</TableCell>
                                                <TableCell align='center' rowSpan={span}>{item.salaryCode || ''}</TableCell>
                                                <TableCell rowSpan={span}>{item.department || ''}</TableCell>
                                            </>
                                        )}
                                        <TableCell align='center'>{r.code || ''}</TableCell>
                                        <TableCell align='center'>{r.material || ''}</TableCell>
                                        <TableCell align='center'>
                                            {r.tripCount ?? ''}
                                        </TableCell>
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
