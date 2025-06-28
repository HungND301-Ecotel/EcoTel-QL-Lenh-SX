import { Typography, IconButton, Paper, Grid } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react'
import { Device } from '../../types';

export default function ExcavatorTripReport({ data }: { data: any[] }) {

    const reportColumns: GridColDef[] = [
        {
            field: 'STT', headerName: 'STT', flex: 0.4,
            renderCell: (params) => params.api.getRowIndex(params.id) + 1,
        },
        {
            field: 'fullName', headerName: 'Họ và tên', flex: 0.4,
            valueGetter: (params) => params.row.assignedTo?.fullName || '',
        },
        {
            field: 'salaryCode',
            headerName: 'Số thẻ',
            flex: 1,
            valueGetter: (params) => params.row.assignedTo?.salaryCode || '',
        },
        {
            field: 'code', headerName: 'Máy vận hành', flex: 1,
            renderCell: (params) => {
                const codes = params.row.device?.map((item: Device) => item.code).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
        {
            field: 'quantity', headerName: 'Số chuyến', flex: 1,
            renderCell: (params) => {
                const codes = params.row.shiftReport?.vehicleReports?.map((item: any) => item.tripCount).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
    ];

    return (
        <Grid item xs={12}>
            <Paper sx={{ maxHeight: "80vh", overflowX: 'auto', padding: 1, width: '100%', }}>
                <DataGrid
                    rows={data}
                    columns={reportColumns}
                    getRowId={(row) => row._id}
                    autoHeight
                    sx={{
                        width: '100%',
                        '& .MuiDataGrid-cell': {
                            whiteSpace: 'pre-line',
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
