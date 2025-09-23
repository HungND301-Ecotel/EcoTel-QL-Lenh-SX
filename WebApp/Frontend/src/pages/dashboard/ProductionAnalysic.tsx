import {
    Paper,
    TableContainer,
    Table,
    TableRow,
    TableHead,
    TableCell,
    TableBody,
} from '@mui/material';

export default function ProductionAnalysic() {
    const productions = [
        { key: "SLD", name: "Sản lượng đất thực hiện (m3)" },
        { key: "SLT", name: "Sản lượng than nguyên khai (m3)" },
        { key: "MKS", name: "Mét khoan sâu (m3)" },
        { key: "KLD", name: "Khối lượng vận chuyển đất (Tkm)" },
        { key: "KLT", name: "Khối lượng vận chuyển than" },
        { key: "TTK", name: "Thể tích khối thực hiện" },
        { key: "CD", name: "Cung độ thực hiện" },
    ];

    return (
        <Paper variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
            <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader sx={{ '& td, & th': { border: '1px solid #e0e0e0' } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ bgcolor: '#ffe8d6', fontWeight: 'bold', fontSize: 18 }}>SẢN LƯỢNG</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell align="center" colSpan={2} sx={{ fontWeight: 'bold', fontSize: 20, width: '20%' }}>Sản lượng</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ca 1</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ca 2</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ca 3</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Ngày</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 20, width: '10%' }}>Lũy kế tháng</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {productions.map((item, index) => (
                            <TableRow key={item.key} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' } }}>
                                <TableCell align="center" sx={{ width: '2%' }}>{index + 1}</TableCell>
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
        </Paper>
    )
}
