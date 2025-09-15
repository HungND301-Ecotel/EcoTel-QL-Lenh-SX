import { Typography, IconButton, Paper, Grid, Box } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react'

export default function VehicleShiftReport({ data, signatureUrl }: { data: any[], signatureUrl: string | null }) {

    const reportColumns: GridColDef[] = [
        {
            field: 'STT', headerName: 'STT', flex: 0.4,
            renderCell: (params) => params.api.getRowIndex(params.id) + 1,
        },
        {
            field: 'vehicleNumber', headerName: 'Số xe', flex: 0.4,
            valueGetter: (params) => params.row.vehicleNumber || '',
        },
        {
            field: 'note',
            headerName: 'Tình trạng hư/ hỏng',
            flex: 1,
            valueGetter: (params) => params.row.note || '',
        },
        { field: 'repairResult', headerName: 'Kết quả sửa chữa trong ca', flex: 1 },
        { field: 'generalNote', headerName: 'Ghi chú', flex: 1 },
    ];

    return (
        <Grid item xs={12}>
            <Paper sx={{ minHeight: "80vh", overflowX: 'auto', padding: 1, width: '100%', }}>
                <Typography textAlign={'center'} mb={2} variant='h3'>Xe không hoạt động</Typography>
                <DataGrid
                    rows={data}
                    columns={reportColumns}
                    getRowId={(row) => row._id}
                    autoHeight
                    hideFooter
                    sx={{
                        width: '100%',
                        '& .MuiDataGrid-cell': {
                            border: '1px solid black',
                        },
                        '& .MuiDataGrid-columnHeader': {
                            border: '1px solid black',
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
