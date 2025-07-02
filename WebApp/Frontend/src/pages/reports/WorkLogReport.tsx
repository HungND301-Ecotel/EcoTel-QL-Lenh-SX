import { Typography, IconButton, Paper, Grid, Box } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react'

export default function WorkLogReport({ data, signatureUrl }: { data: any[], signatureUrl: string | null }) {

    const reportColumns: GridColDef[] = [
        {
            field: 'STT', headerName: 'STT', width: 50,
            renderCell: (params) => params.api.getRowIndex(params.id) + 1,
        },
        {
            field: 'fullName', headerName: 'Họ và tên', minWidth: 200,
        },
        {
            field: 'salaryCode', headerName: 'Số thẻ', width: 100,
        },
        {
            field: 'device', headerName: 'Thiết bị vận hành, vị trí làm việc', width: 150,
        },
        {
            field: 'eatPosition', headerName: 'Vị trí ăn', width: 100,
        },
        {
            field: 'lv1Salary', headerName: 'Lương cấp bậc 1 ngày', width: 100,
        }, {
            field: 'productSalary', headerName: 'Lương sản phẩm', minWidth: 100,
        },
        {
            field: 'job',
            headerName: 'Nội dung công việc và TH SP trong ca',
            minWidth: 200,
        },
        { field: 'generalNote', headerName: 'Ghi chú', minWidth: 100 },
    ];

    return (
        <Grid item xs={12}>
            <Paper sx={{ minHeight: "80vh", overflowX: 'auto', padding: 1, width: '100%', }}>
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
