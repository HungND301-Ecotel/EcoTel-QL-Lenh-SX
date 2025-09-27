import { Typography, IconButton, Paper, Grid, Box } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, useGridApiRef } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react'


export default function MealRequestReport({ data, signatureUrl }: { data: any[], signatureUrl: string | null }) {

    const apiRef = useGridApiRef()
    const reportColumns: GridColDef[] = [
        {
            field: 'STT', headerName: 'STT', width: 50, headerAlign: 'center', align: 'center',
            renderCell: (params: GridRenderCellParams) => {
                const sortedIds = params.api.getSortedRowIds();
                const index = sortedIds.indexOf(params.id);
                return index >= 0 ? index + 1 : '';
            },
        },
        {
            field: 'fullName', headerName: 'Họ và tên', flex: 1, headerAlign: 'center',
        },
        {
            field: 'salaryCode', headerName: 'Số thẻ', flex: 1, headerAlign: 'center', align: 'center',
        },
        {
            field: 'device', headerName: 'Số xe', flex: 1, headerAlign: 'center', align: 'center',
        },
        {
            field: 'job',
            headerName: 'Công việc',
            headerAlign: 'center',
            flex: 1,
        },
        {
            field: 'eatPosition', headerName: 'Vị trí ăn', flex: 1, headerAlign: 'center', align: 'center',
        },
        { field: 'generalNote', headerName: 'Ghi chú', flex: 1, headerAlign: 'center' },
    ];

    return (
        <Grid item xs={12}>
            <Paper sx={{ minHeight: "80vh", overflowX: 'auto', padding: 1, width: '100%', }}>
                <DataGrid
                    rows={data}
                    apiRef={apiRef}
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
