import { Typography, IconButton, Paper, Grid } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React from 'react'
import { Device } from '../../types';

export default function CarReport({ data }: { data: any[] }) {
    const reportColumns: GridColDef[] = [
        {
            field: 'STT', headerName: 'STT', width: 50,
            renderCell: (params) => params.api.getRowIndex(params.id) + 1,
        },
        {
            field: 'fullName', headerName: 'Họ tên', width: 150,
            valueGetter: (params) => params.row.assignedTo?.fullName
        },
        {
            field: 'salaryCode',
            headerName: 'Số thẻ',
            width: 120,
            valueGetter: (params) => params.row.assignedTo?.salaryCode
        },
        {
            field: 'code', headerName: 'Biển số', width: 150,
            renderCell: (params) => {
                const codes = params.row.device?.map((item: Device) => item.code).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
        {
            field: 'job', headerName: 'Nghề nghiệp/ công việc', width: 150,
            valueGetter: (params) => params.row.job?.name
        },
        {
            field: 'excavator', headerName: 'Thiết bị nhận đổ tải', width: 150,
            renderCell: (params) => {
                const codes = params.row.excavator?.map((item: Device) => item.code).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
        {
            field: 'location', headerName: 'Vị trí đổ tải', width: 150,
            valueGetter: (params) => params.row.location?.name
        },
        {
            field: 'material', headerName: 'Loại hàng', width: 150,
            valueGetter: (params) => params.row.material?.name

        },
        {
            field: 'liftHeight', headerName: 'Chiều cao nâng tải', width: 150,
            valueGetter: (params) => params.row.liftHeight
        },
        {
            field: 'distance', headerName: 'Cung độ thực hiện', width: 150,
            valueGetter: (params) => params.row.distance
        },
        {
            field: 'fuelRemain', headerName: 'Tồn dầu', width: 150,
            renderCell: (params) => {
                const codes = params.row.shiftReport?.vehicleSummaries?.map((item: any) => item?.fuelRemain).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
        {
            field: 'fuelReceived', headerName: 'Lĩnh', width: 150,
            renderCell: (params) => {
                const codes = params.row.shiftReport?.vehicleSummaries?.map((item: any) => item?.fuelReceived).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
        {
            field: 'fuelRemainEnd', headerName: 'Tồn cuối', width: 150,
            renderCell: (params) => {
                const codes = params.row.shiftReport?.vehicleSummaries?.map((item: any) => item?.fuelRemainEnd).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
        {
            field: 'consume', headerName: 'Tiêu thụ', width: 150,
            renderCell: (params) => {
                const codes = params.row.shiftReport?.vehicleSummaries?.map((item: any) => (item?.fuelRemain || 0) + (item?.fuelReceived || 0) - (item?.fuelRemainEnd || 0)).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
        {
            field: 'rated', headerName: 'Định mức', width: 150,
        },
        {
            field: 'cheeseparings', headerName: 'Tiết kiệm', width: 150,
        },
        {
            field: 'exceed', headerName: 'Vượt', width: 150,
        },
        {
            field: 'sealStatus', headerName: 'Kẹp chì/ niêm phong', width: 150,
            renderCell: (params) => {
                const codes = params.row.shiftReport?.vehicleSummaries?.map((item: any) => item?.sealStatus).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
        {
            field: 'gpsStatus', headerName: 'GPS', width: 150,
            renderCell: (params) => {
                const codes = params.row.shiftReport?.vehicleSummaries?.map((item: any) => item?.gpsStatus).join('<br/>');
                return <span dangerouslySetInnerHTML={{ __html: codes }} />;
            }
        },
        { field: 'foster', headerName: 'Bồi dưỡng', width: 150 },
        { field: 'salary', headerName: 'Tính lương', width: 150 },
    ];

    return (
        <Grid item xs={12}>
            <Paper sx={{ height: "80vh", overflowX: 'auto', padding: 1 }}>
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
            </Paper>

        </Grid>
    )
}
