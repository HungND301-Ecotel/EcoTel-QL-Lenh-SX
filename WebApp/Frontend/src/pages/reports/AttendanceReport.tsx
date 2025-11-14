import React, { useMemo } from 'react';
import { Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Box, Paper } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { Department, Shift } from '../../types';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';

dayjs.locale('vi');

interface AttendanceRow {
    key: string;
    id: string;
    fullName?: string;
    salaryCode?: string;
    days: Record<string, string>;
    totalDay: number;
    totalCa1: number;
    totalCa2: number;
    totalCa3: number;
}

export default function AttendanceReportAntd({
    data,
    signatureUrl,
    startDate,
    endDate,
    shifts,
    department,
    date,
}: {
    data: any[];
    signatureUrl: string | null;
    startDate: dayjs.Dayjs | null;
    endDate: dayjs.Dayjs | null;
    shifts: Shift[];
    department: Department | null;
    date: dayjs.Dayjs | null;
}) {
    const [user] = useAtom(userAtom);

    /** 🗓️ Tính danh sách ngày trong tháng */
    const daysInMonth = useMemo(() => {
        return (data[0]?.dateRange || []).map((d: string) => dayjs(d, 'YYYY-MM-DD'));
    }, [data]);

    /** 🧱 Dòng dữ liệu chính */
    const rows: AttendanceRow[] = useMemo(() => {
        return (data[0]?.data || []).map((u: any, i: number) => ({
            key: u.userId || u.fullName,
            id: u.userId || u.fullName,
            fullName: u?.fullName,
            salaryCode: u?.salaryCode,
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

    /** 🧾 Dòng tổng cộng */
    const totalSummary: AttendanceRow = useMemo(() => {
        let totalDay = 0,
            totalCa1 = 0,
            totalCa2 = 0,
            totalCa3 = 0;
        data[0]?.data.forEach((r: any) => {
            totalDay += r.totalDay || 0;
            totalCa1 += r.totalCa1 || 0;
            totalCa2 += r.totalCa2 || 0;
            totalCa3 += r.totalCa3 || 0;
        });
        return {
            key: 'summary',
            id: 'summary',
            fullName: 'TỔNG CỘNG',
            salaryCode: '',
            totalDay,
            totalCa1,
            totalCa2,
            totalCa3,
            days: {},
        };
    }, [data]);

    /** 🧩 Cấu hình cột */
    const columns: ColumnsType<AttendanceRow> = useMemo(() => {
        const baseCols: ColumnsType<AttendanceRow> = [
            {
                title: 'TT',
                dataIndex: 'index',
                width: 50,
                align: 'center',
                render: (_: any, record: AttendanceRow, index: number) =>
                    record.id === 'summary' ? '' : index + 1,
            },
            {
                title: 'Họ và tên',
                dataIndex: 'fullName',
                align: 'center',
                width: 200,
            },
            {
                title: 'Số thẻ',
                dataIndex: 'salaryCode',
                align: 'center',
                width: 100,
            },
        ];

        const dayCols: ColumnsType<AttendanceRow> = daysInMonth.map((d: any) => {
            const day = d.format('DD');
            const dayOfWeek = d.format('dd');
            return {
                title: (
                    <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
                        <div style={{ fontWeight: 'bold' }}>{day}</div>
                        <div style={{ fontSize: '0.8em' }}>{dayOfWeek}</div>
                    </div>
                ),
                dataIndex: ['days', day],
                align: 'center',
                width: 35,
                render: (_: any, record: AttendanceRow) => {
                    if (record.id === 'summary') return '';
                    return record.days?.[day] ?? 'N';
                },
            };
        });

        const totalCols: ColumnsType<AttendanceRow> = [
            {
                title: 'Tổng',
                dataIndex: 'totalDay',
                align: 'center',
                width: 70,
            },
            {
                title: 'Ca1',
                dataIndex: 'totalCa1',
                align: 'center',
                width: 70,
            },
            {
                title: 'Ca2',
                dataIndex: 'totalCa2',
                align: 'center',
                width: 70,
            },
            {
                title: 'Ca3',
                dataIndex: 'totalCa3',
                align: 'center',
                width: 70,
            },
        ];

        return [...baseCols, ...dayCols, ...totalCols];
    }, [daysInMonth]);

    const rowsWithTotal = [...rows, totalSummary];

    return (
        <Box sx={{ p: 2 }}>
            <i style={{ fontSize: 20 }}>CÔNG TY CỔ PHẦN THAN CAO SƠN-TKV</i>
            <Typography
                style={{
                    textAlign: 'center',
                    marginBottom: 16,
                    fontSize: 24,
                    fontWeight: 600,
                }}
            >
                BẢNG CHẤM CÔNG
            </Typography>

            <Typography style={{ textAlign: 'center' }}>
                Tháng {date?.format('MM')} năm {date?.format('YYYY')}
            </Typography>
            <Typography>Đơn vị: {department ? department.code : user?.department?.code}</Typography>

            <Paper>
                <Table
                    bordered
                    dataSource={rowsWithTotal}
                    columns={columns}
                    pagination={false}
                    scroll={{ x: 'max-content', y: 600 }}
                    rowClassName={(record) =>
                        record.id === 'summary' ? 'summary-row' : ''
                    }
                    style={{ marginTop: 20 }}
                />

                {signatureUrl && (
                    <div
                        style={{
                            marginTop: 20,
                            textAlign: 'right',
                        }}
                    >
                        <img
                            src={signatureUrl}
                            alt="Chữ ký"
                            style={{ maxWidth: 200, maxHeight: 100 }}
                        />
                    </div>
                )}
            </Paper>

            {/* CSS inline hoặc global */}
            <style>
                {`
          .summary-row td {
            font-weight: bold;
            background-color: #f5f5f5 !important;
          }
        `}
            </style>
        </Box>
    );
}
