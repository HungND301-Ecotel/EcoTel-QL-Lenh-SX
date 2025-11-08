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

// Format số gọn (bỏ .00 nếu là số nguyên)
const formatNumber = (num?: number) =>
  num ? num.toFixed(2).replace(/\.00$/, '') : '';

export default function ExcavatorProductReport({
  data,
  signatureUrl,
  startDate,
  endDate,
  department,
  day,
}: {
  data: any[];
  signatureUrl: string | null;
  startDate: dayjs.Dayjs | null;
  endDate: dayjs.Dayjs | null;
  department: Department | null;
  day: dayjs.Dayjs | null;
}) {
  const unitCode = department?.code || 'N/A';

  // 🧠 Phân loại vật liệu theo loại sản phẩm (Đất / Than)
  const { landList, coalList } = useMemo(() => {
    const land = new Set<string>();
    const coal = new Set<string>();

    data?.forEach((item) => {
      Object.entries(item.materialDetails || {}).forEach(([name, detail]: any) => {
        if (
          detail.acceptedProduct === 'Đất' ||
          detail.acceptedProduct === 'LAND'
        )
          land.add(name);
        if (
          detail.acceptedProduct === 'Than' ||
          detail.acceptedProduct === 'COAL'
        )
          coal.add(name);
      });
    });

    return { landList: Array.from(land).sort(), coalList: Array.from(coal).sort() };
  }, [data]);

  // Tổng số cột phần sản lượng
  const totalProductColumns = (landList.length + 1) + (coalList.length + 1);

  // 🧮 Tổng cộng toàn bảng
  const totalDat = data.reduce((s, r) => s + (r.totalDat || 0), 0);
  const totalThan = data.reduce((s, r) => s + (r.totalThan || 0), 0);
  const totalLandByName = Object.fromEntries(
    landList.map((name) => [
      name,
      data.reduce((s, r) => s + (r.materialDetails?.[name]?.quantity || 0), 0),
    ])
  );
  const totalCoalByName = Object.fromEntries(
    coalList.map((name) => [
      name,
      data.reduce((s, r) => s + (r.materialDetails?.[name]?.quantity || 0), 0),
    ])
  );

  return (
    <Grid item xs={12}>
      <Paper sx={{ p: 2, minWidth: 'max-content' }}>
        {/* Header */}
        <Typography sx={{ fontSize: 16, fontStyle: 'italic' }}>
          CÔNG TY CỔ PHẦN THAN CAO SƠN - TKV
        </Typography>

        <Typography
          textAlign="center"
          variant="h5"
          sx={{ fontWeight: 'bold', mb: 1 }}
        >
          BẢNG TỔNG HỢP THỐNG KÊ THAN, ĐẤT
        </Typography>

        <Typography>Đơn vị: {unitCode}</Typography>
        <Typography>Ngày: {day?.format('DD-MM-YYYY')}</Typography>

        {/* Table */}
        <TableContainer sx={{ mt: 2, overflowX: 'auto' }}>
          <Table
            sx={{
              border: '1px solid #000',
              '& th, & td': {
                border: '1px solid #000',
                textAlign: 'center',
                padding: '4px 8px',
                whiteSpace: 'nowrap',
                fontSize: 13,
              },
              '& th': { fontWeight: 'bold' },
            }}
          >
            <TableHead>
              {/* Hàng 1 */}
              <TableRow>
                <TableCell rowSpan={3} sx={{ minWidth: 40 }}>
                  TT
                </TableCell>
                <TableCell rowSpan={3} sx={{ minWidth: 100 }}>
                  MÁY XÚC
                </TableCell>
                <TableCell
                  colSpan={totalProductColumns}
                  sx={{ fontWeight: 'bold', }}
                >
                  SẢN LƯỢNG THỰC HIỆN TRONG NGÀY
                </TableCell>
                <TableCell rowSpan={3} sx={{ minWidth: 80 }}>
                  GHI CHÚ
                </TableCell>
              </TableRow>

              {/* Hàng 2 */}
              <TableRow>
                <TableCell
                  colSpan={landList.length + 1}
                  sx={{ fontWeight: 'bold', }}
                >
                  Đất đá (m³)
                </TableCell>
                <TableCell
                  colSpan={coalList.length + 1}
                  sx={{ fontWeight: 'bold', }}
                >
                  Than (tấn)
                </TableCell>
              </TableRow>

              {/* Hàng 3 */}
              <TableRow>
                {/* Đất */}
                <TableCell >Tổng cộng</TableCell>
                {landList.map((name) => (
                  <TableCell key={`land-header-${name}`} >
                    {name}
                  </TableCell>
                ))}

                {/* Than */}
                <TableCell >Tổng cộng</TableCell>
                {coalList.map((name) => (
                  <TableCell key={`coal-header-${name}`} >
                    {name}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {/* Dữ liệu từng máy xúc */}
              {data.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{row.excavatorCode}</TableCell>

                  {/* Tổng đất */}
                  <TableCell >
                    {formatNumber(row.totalDat)}
                  </TableCell>
                  {/* Chi tiết đất */}
                  {landList.map((name) => (
                    <TableCell key={`land-${idx}-${name}`}>
                      {formatNumber(row.materialDetails?.[name]?.quantity)}
                    </TableCell>
                  ))}

                  {/* Tổng than */}
                  <TableCell >
                    {formatNumber(row.totalThan)}
                  </TableCell>
                  {/* Chi tiết than */}
                  {coalList.map((name) => (
                    <TableCell key={`coal-${idx}-${name}`}>
                      {formatNumber(row.materialDetails?.[name]?.quantity)}
                    </TableCell>
                  ))}

                  <TableCell />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Chữ ký */}
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
