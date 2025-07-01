import { Typography, IconButton, Paper, Grid } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react'

export default function WorkLogReport({ data }: { data: any[] }) {

    const reportColumns: GridColDef[] = [
        {
            field: 'STT', headerName: 'STT', width: 50,
            renderCell: (params) => params.api.getRowIndex(params.id) + 1,
        },
        {
            field: 'fullName', headerName: 'Họ và tên', minWidth:200,
            valueGetter: (params) => params.row.vehicleNumber || '',
        },
        {
            field: 'salaryCode', headerName: 'Số thẻ', width:100,
            valueGetter: (params) => params.row.vehicleNumber || '',
        },
        {
            field: 'device', headerName: 'Thiết bị vận hành, vị trí làm việc', width:150,
            valueGetter: (params) => params.row.vehicleNumber || '',
        },
        {
            field: 'eatPosition', headerName: 'Vị trí ăn', width:100,
            valueGetter: (params) => params.row.vehicleNumber || '',
        }, 
        {
            field: 'lv1Salary', headerName: 'Lương cấp bậc 1 ngày', width:100,
            valueGetter: (params) => params.row.vehicleNumber || '',
        }, {
            field: 'productSalary', headerName: 'Lương sản phẩm', minWidth:100,
            valueGetter: (params) => params.row.vehicleNumber || '',
        },
        {
            field: 'job',
            headerName: 'Nội dung công việc và TH SP trong ca',
            minWidth: 200,
            valueGetter: (params) => params.row.note || '',
        },
        { field: 'generalNote', headerName: 'Ghi chú', minWidth: 100 },
    ];

    return (
        <Grid item xs={12}>
            <Paper sx={{ height: "80vh", overflowX: 'auto', padding: 1, width: '100%', }}>
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
            </Paper>

        </Grid>
    )
}
