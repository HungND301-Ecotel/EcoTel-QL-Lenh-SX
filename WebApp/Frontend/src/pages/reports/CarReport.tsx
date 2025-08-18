import { Typography, IconButton, Paper, Grid, Box } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React from 'react'
import { Device } from '../../types';

export default function CarReport({ data, signatureUrl }: { data: any[], signatureUrl: string | null }) {
    const reportColumns: GridColDef[] = [
        {
            field: 'STT', headerName: 'STT', width: 50,
            renderCell: (params) => params.api.getRowIndex(params.id) + 1,
        },
        {
            field: 'fullName', headerName: 'Họ tên', width: 150,
        },
        {
            field: 'salaryCode',
            headerName: 'Số thẻ',
            width: 120,
        },
        {
            field: 'code', headerName: 'Biển số', width: 150,
            renderCell: (params) => {
                const codes = params.row.code?.map((item: string) => item).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
        {
            field: 'excavator', headerName: 'Vị trí nhận tải', width: 150,
            renderCell: (params) => {
                const codes = params.row.excavator?.map((item: string) => item).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
        {
            field: 'location', headerName: 'Vị trí đổ tải', width: 150,
            renderCell: (params) => {
                const codes = params.row.toLocation?.map((item: string) => item).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
        {
            field: 'material', headerName: 'Chủng loại', width: 150,
            renderCell: (params) => {
                const codes = params.row.material?.map((item: string) => item).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }

        },
        {
            field: 'distance', headerName: 'Cung độ tạm tính', width: 150,
            valueGetter: (params) => ''
        },
        {
            field: 'fuelRemain', headerName: 'Tồn dầu', width: 150,
            renderCell: (params) => {
                const codes = params.row.fuelRemain?.map((item: any) => item).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
        {
            field: 'fuelReceived', headerName: 'Lĩnh dầu', width: 150,
            renderCell: (params) => {
                const codes = params.row.fuelReceived?.map((item: any) => item).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
        {
            field: 'consume', headerName: 'Tiêu thụ', width: 150,
            renderCell: (params) => {
                const codes = params.row.consume.map((item: any) => item).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
        { field: 'foster', headerName: 'Phụ cấp/ bồi dưỡng', width: 150 },
        { field: 'salary', headerName: 'Lương tạm tính', width: 150 },
    ];

    return (
        <Grid item xs={12}>
            <Paper sx={{ minHeight: "80vh", overflowX: 'auto', padding: 1 }}>
                <DataGrid
                    rows={data}
                    columns={reportColumns}
                    getRowId={(row) => row._id}
                    autoHeight
                    hideFooter
                    sx={{
                        '& .MuiDataGrid-cell': {
                            whiteSpace: 'pre-line',
                            border: '1px solid black',
                        },
                        '& .MuiDataGrid-columnHeader': {
                            border: '1px solid black', // 👈 viền xung quanh header cell
                        },
                    }}
                />
                {signatureUrl && (
                    <Box mt={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <img src={signatureUrl} alt="Chữ ký" style={{ maxWidth: 200, maxHeight: 100 }} />
                    </Box>
                )}
            </Paper>

        </Grid>
    )
}
