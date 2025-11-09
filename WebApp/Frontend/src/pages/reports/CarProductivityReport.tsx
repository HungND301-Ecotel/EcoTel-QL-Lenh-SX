import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { Department } from '../../types';

const formatNumber = (num?: number) =>
  num ? num.toFixed(2).replace(/\.00$/, '') : '';

export default function CarProductivityReport({
  data,
  signatureUrl,
  startDate,
  endDate,
  department,
  day,
  date,
}: {
  data: any[];
  signatureUrl: string | null;
  startDate: dayjs.Dayjs | null;
  endDate: dayjs.Dayjs | null;
  department: Department | null;
  day: dayjs.Dayjs | null;
  date: dayjs.Dayjs | null;
}) {
  // --- Tổng toàn bộ ---
  const grandTotal = useMemo(() => {
    const total = {
      land: { trips: 0, m3: 0, tkm: 0 },
      coal: { trips: 0, ton: 0, tkm: 0 },
      totalTkm: 0,
    };
    data.forEach((m) => {
      total.land.trips += m.summary.land.trips;
      total.land.m3 += m.summary.land.m3;
      total.land.tkm += m.summary.land.tkm;
      total.coal.trips += m.summary.coal.trips;
      total.coal.ton += m.summary.coal.ton;
      total.coal.tkm += m.summary.coal.tkm;
      total.totalTkm += m.summary.totalTkm;
    });
    return total;
  }, [data]);

  return (
    <Grid item xs={12}>
      <Paper sx={{ p: 2 }}>
        {/* Header */}
        <Typography sx={{ fontSize: 16, fontStyle: 'italic' }}>
          CÔNG TY CỔ PHẦN THAN CAO SƠN - TKV
        </Typography>

        <Typography
          textAlign="center"
          variant="h5"
          sx={{ fontWeight: 'bold', mb: 1 }}
        >
          BÁO CÁO NĂNG SUẤT ĐẦU XE
        </Typography>

        <Typography>Đơn vị: {department?.code}</Typography>
        <Typography>Tháng: {date?.format('MM/YYYY')}</Typography>

        {/* Table */}
        <TableContainer sx={{ mt: 2 }}>
          <Table
            size="small"
            sx={{
              border: '1px solid black',
              '& td, & th': {
                border: '1px solid black',
                fontSize: 13,
                padding: '4px 8px',
              },
              '& td': {
                textAlign: 'center',
                verticalAlign: 'middle',
              },
            }}
          >
            {/* --- Header --- */}
            <TableHead>
              <TableRow>
                <TableCell align="center" rowSpan={2} sx={{ fontWeight: 'bold' }}>
                  TT
                </TableCell>
                <TableCell align="center" rowSpan={2} sx={{ fontWeight: 'bold' }}>
                  LOẠI XE - SỐ XE
                </TableCell>
                <TableCell align="center" colSpan={3} sx={{ fontWeight: 'bold' }}>
                  VẬN CHUYỂN ĐẤT
                </TableCell>
                <TableCell align="center" colSpan={3} sx={{ fontWeight: 'bold' }}>
                  VẬN CHUYỂN THAN
                </TableCell>
                <TableCell align="center" rowSpan={2} sx={{ fontWeight: 'bold' }}>
                  TỔNG TKM
                </TableCell>
                <TableCell align="center" colSpan={2} sx={{ fontWeight: 'bold' }}>
                  XE HOẠT ĐỘNG
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Số chuyến</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>m³</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>tkm</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Số chuyến</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Tấn</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>tkm</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ca xe</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ngày xe</TableCell>
              </TableRow>
            </TableHead>

            {/* --- Body --- */}
            <TableBody>
              {data?.map((model, modelIndex) => {
                const vehicles = model.vehicles || [];
                const s = model.summary;

                return (
                  <React.Fragment key={modelIndex}>
                    {/* Dòng tiêu đề + tổng của model */}
                    <TableRow sx={{ background: '#f0f0f0' }}>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        {modelIndex + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'left' }}>
                        ∑ {model.modelName}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{formatNumber(s.land.trips)}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{formatNumber(s.land.m3)}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{formatNumber(s.land.tkm)}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{formatNumber(s.coal.trips)}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{formatNumber(s.coal.ton)}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{formatNumber(s.coal.tkm)}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{formatNumber(s.totalTkm)}</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>

                    {/* Các xe thuộc model */}
                    {vehicles.map((v: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell></TableCell>
                        <TableCell sx={{ textAlign: 'left' }}>{v.carCode}</TableCell>
                        <TableCell>{formatNumber(v.land?.trips)}</TableCell>
                        <TableCell>{formatNumber(v.land?.m3)}</TableCell>
                        <TableCell>{formatNumber(v.land?.tkm)}</TableCell>
                        <TableCell>{formatNumber(v.coal?.trips)}</TableCell>
                        <TableCell>{formatNumber(v.coal?.ton)}</TableCell>
                        <TableCell>{formatNumber(v.coal?.tkm)}</TableCell>
                        <TableCell>{formatNumber(v.totalTkm)}</TableCell>
                        <TableCell>{v.shift}</TableCell>
                        <TableCell>
                          {dayjs(v.workingDate).isValid()
                            ? dayjs(v.workingDate).format('DD/MM/YYYY')
                            : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}

              {/* --- Tổng toàn bộ --- */}
              <TableRow sx={{ background: '#e0e0e0' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                  TỔNG CỘNG
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {formatNumber(grandTotal.land.trips)}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {formatNumber(grandTotal.land.m3)}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {formatNumber(grandTotal.land.tkm)}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {formatNumber(grandTotal.coal.trips)}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {formatNumber(grandTotal.coal.ton)}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {formatNumber(grandTotal.coal.tkm)}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {formatNumber(grandTotal.totalTkm)}
                </TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Signature */}
        {signatureUrl && (
          <Box mt={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <img
              src={signatureUrl}
              alt="Chữ ký"
              style={{ width: 120, height: 50, objectFit: 'contain' }}
            />
          </Box>
        )}
      </Paper>
    </Grid>
  );
}
