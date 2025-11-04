import React, { useMemo } from 'react';
import {
    Typography,
    Paper,
    Grid,
    Box,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Department, Shift } from '../../types';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';

import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

export default function AttendanceReport({
    data,
    signatureUrl,
    startDate,
    endDate,
    shifts,
    department,
    date
}: {
    data: any[];
    signatureUrl: string | null;
    startDate: dayjs.Dayjs | null;
    endDate: dayjs.Dayjs | null;
    shifts: Shift[];
    department: Department | null;
    date: dayjs.Dayjs | null
}) {
    const [user] = useAtom(userAtom);

    // Cột cơ bản
    const baseColumns: GridColDef<any>[] = [ // 💡 FIX: GridColDef<any>
        {
            field: 'stt',
            headerName: 'TT',
            width: 50,
            align: 'center',
            headerAlign: 'center',
            // 💡 FIX: Sử dụng renderCell để lấy index chính xác và bỏ trống dòng summary
            renderCell: (params: GridRenderCellParams<any>) => {
                if (params.row.id === 'summary') {
                    return ''; // Bỏ trống ô TT của dòng Tổng Cộng
                }
                // Tính số thứ tự dựa trên vị trí hiển thị
                const index = params.api.getRowIndexRelativeToVisibleRows(params.id);
                return index + 1;
            },
        },
        {
            field: 'fullName',
            headerName: 'Họ và tên',
            minWidth: 200,
            headerAlign: 'center',
        },
    ];

    const daysInMonth = useMemo(() => {
        // Chỉ cần map qua mảng chuỗi ngày (YYYY-MM-DD) đã được BE trả về
        return (data[0]?.dateRange || []).map((dateStr: string) => dayjs(dateStr, "YYYY-MM-DD"));
    }, [data]);

    // Cột động theo ngày
    const dayColumns: GridColDef<any>[] = daysInMonth.map((dayjsObject: any) => { // 💡 FIX: GridColDef<any>
        const day = dayjsObject.format('DD');
        const dayOfWeek = dayjsObject.format('dd');

        // 💡 SỬA: Dùng renderHeader để hiển thị Thứ và Ngày trên hai dòng
        const headerTitle = (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    lineHeight: 1.2
                }}
            >
                <span style={{ fontWeight: 'bold' }}>{day}</span>
                <span style={{ fontSize: '0.8em', fontWeight: 'normal' }}>{dayOfWeek}</span>
            </Box>
        );

        return {
            field: `d_${day}`,
            headerName: day,
            renderHeader: () => headerTitle,
            width: 35,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params: GridRenderCellParams<any>) => {
                // 💡 SỬA: Bỏ trống các ô ngày của dòng summary
                if (params.row.id === 'summary') {
                    return '';
                }
                const cellValue = params.row.days?.[day];
                return cellValue ?? 'N';
            },
        };
    });

    // Cột tổng hợp
    const totalColumns: GridColDef<any>[] = [ // 💡 FIX: GridColDef<any>
        {
            field: 'totalDay',
            headerName: 'Tổng',
            width: 70,
            align: 'center',
            headerAlign: 'center',
        },
        {
            field: 'totalCa1',
            headerName: 'Ca1',
            width: 70,
            align: 'center',
            headerAlign: 'center',
        },
        {
            field: 'totalCa2',
            headerName: 'Ca2',
            width: 70,
            align: 'center',
            headerAlign: 'center',
        },
        {
            field: 'totalCa3',
            headerName: 'Ca3',
            width: 70,
            align: 'center',
            headerAlign: 'center',
        },
    ];

    // Dữ liệu rows hiển thị
    const rows = useMemo(() => {
        return (data[0]?.data || []).map((u: any, i: number) => ({
            // Đảm bảo ID là chuỗi hợp lệ
            id: u?.userId || u?.fullName,
            // Vẫn giữ index để tham khảo, dù không dùng cho stt nữa
            index: i,
            fullName: u.fullName,
            totalDay: u.totalDay,
            totalCa1: u.totalCa1,
            totalCa2: u.totalCa2,
            totalCa3: u.totalCa3,
            days: Object.fromEntries(
                Object.entries(u.days || {}).map(([key, val]) => [
                    dayjs(key).format('DD'),
                    val,
                ])
            ),
        }));
    }, [data]);

    // Dòng tổng cộng
    const totalSummary = useMemo(() => {
        let totalDay = 0, totalCa1 = 0, totalCa2 = 0, totalCa3 = 0;
        data[0]?.data.forEach((r: any) => {
            totalDay += r.totalDay || 0;
            totalCa1 += r.totalCa1 || 0;
            totalCa2 += r.totalCa2 || 0;
            totalCa3 += r.totalCa3 || 0;
        });
        return {
            // Đảm bảo ID này không trùng với bất kỳ ID nhân viên nào
            id: 'summary',
            fullName: 'TỔNG CỘNG',
            totalDay,
            totalCa1,
            totalCa2,
            totalCa3,
            // Không cần thuộc tính days/index để các ô trống
        };
    }, [data]);

    const allColumns = [...baseColumns, ...dayColumns, ...totalColumns];

    const rowsWithTotal = [...rows, totalSummary];

    return (
        <Grid item xs={12}>
            <Paper sx={{ p: 2, minHeight: '80vh', overflowX: 'auto' }}>
                <Typography textAlign="center" mb={2} variant="h3">
                    BẢNG CHẤM CÔNG
                </Typography>
                <Typography textAlign="center">
                    Tháng {date?.format('MM')} năm {date?.format('YYYY')}
                </Typography>

                <Box mt={2}>
                    <DataGrid
                        rows={rowsWithTotal}
                        columns={allColumns}
                        // getRowId={(row) => row.id}
                        hideFooter
                        autoHeight
                        sx={{
                            '& .MuiDataGrid-cell': {
                                border: '1px solid black',
                                fontSize: 14,
                                padding: '2px 4px',
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: '#f0f0f0',
                                border: '1px solid black',
                                fontWeight: 'bold',
                                fontSize: 13,
                            },
                            '& .MuiDataGrid-row:last-child': {
                                backgroundColor: '#f5f5f5',
                                fontWeight: 'bold',
                            },
                            '& .MuiDataGrid-virtualScroller': {
                                overflowY: 'hidden !important',
                            },
                        }}
                    />
                </Box>

                {signatureUrl && (
                    <Box mt={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <img src={signatureUrl} alt="Chữ ký" style={{ maxWidth: 200, maxHeight: 100 }} />
                    </Box>
                )}
            </Paper>
        </Grid>
    );
}
