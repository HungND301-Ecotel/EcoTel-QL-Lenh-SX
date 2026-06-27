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
  Typography
} from '@mui/material';
import { useAtom } from 'jotai';
import React from 'react';
import { userAtom } from '../../atoms/userAtoms';
import dayjs from 'dayjs';
import { Department } from '../../types';

// Định nghĩa lại Type cho Data
interface Header {
  key: string;
  excavator: string;
  toLocation: string;
}

interface CarData {
  carCode: string;
  totalDat: number;
  totalThan: number;
  totalCarTrips: number;
  datDetailsMap: Record<string, { trips: number }>;
  thanDetailsMap: Record<string, { trips: number }>;
}

interface ShiftData {
  shiftName: string; // Tên ca, ví dụ: "1", "2", "3"
  cars: CarData[];
  totalTripsInShift: number;
}

interface ReportData {
  shifts: ShiftData[];
  uniqueHeadersDat: Header[];
  uniqueHeadersThan: Header[];
  grandTotal: {
    grandTotalDat: number;
    grandTotalThan: number;
    grandTotalAll: number;
  };
}


export default function CarTripReport({
  data,
  signatureUrl,
  startDate,
  endDate,
  department,
  day,
  shifts
}: {
  data: any[]; signatureUrl: string | null;
  startDate: dayjs.Dayjs | null;
  endDate: dayjs.Dayjs | null;
  department: Department | null;
  day: dayjs.Dayjs | null;
  shifts?: any[];
}) {

  const [user] = useAtom(userAtom);

  const reportData: ReportData = data.length > 0 ? data[0] : {
    shifts: [],
    uniqueHeadersDat: [],
    uniqueHeadersThan: [],
    grandTotal: { grandTotalDat: 0, grandTotalThan: 0, grandTotalAll: 0 }
  };

  const {
    shifts: shiftReports,
    uniqueHeadersDat,
    uniqueHeadersThan,
    grandTotal
  } = reportData;

  const totalDetailColsDat = uniqueHeadersDat.length;
  const totalDetailColsThan = uniqueHeadersThan.length;

  // ColSpan = Số cột chi tiết + 1 cột Tổng chuyến Đất/Than
  const colSpanDat = totalDetailColsDat > 0 ? totalDetailColsDat + 1 : 2;
  const colSpanThan = totalDetailColsThan > 0 ? totalDetailColsThan + 1 : 2;


  const calculateShiftDetailTotal = (
    shiftCars: CarData[],
    headers: Header[],
    materialType: 'dat' | 'than'
  ) => {
    const totalDetails: Record<string, number> = {};

    headers.forEach(h => {
      totalDetails[h.key] = 0;
    });

    shiftCars.forEach(car => {
      const detailsMap = materialType === 'dat' ? car.datDetailsMap : car.thanDetailsMap;

      headers.forEach(h => {
        const trips = detailsMap[h.key]?.trips || 0;
        totalDetails[h.key] += trips;
      });
    });

    return totalDetails;
  }

  const shiftNamesList = shiftReports.map(s => `Ca ${s.shiftName}`).join(', ');


  return (
    <Grid item xs={12}>
      <Paper sx={{ p: 1 }}>
        <i style={{ fontSize: 20 }}>CÔNG TY CỔ PHẦN THAN CAO SƠN-TKV</i>
        <Typography textAlign={'center'} mb={2} variant='h3' sx={{ fontWeight: 'bold' }}>Báo cáo chuyến</Typography>
        <Typography>Đơn vị: {department ? department.code : user?.department?.code}</Typography>
        <Typography>Ngày: {day?.format('DD-MM-YYYY')}</Typography>

        <TableContainer sx={{ maxHeight: '80vh' }}>
          <Table stickyHeader size="small" aria-label="car-trip-report" sx={{
            '& th, & td': { border: '1px solid black', padding: "2px 8px" },
            tableLayout: 'fixed'
          }}>
            <TableHead sx={{
              position: "sticky",
              top: 0,
              backgroundColor: "white",
              zIndex: 2,
            }}>
              {/* HÀNG HEADER 1 */}
              <TableRow>
                <TableCell align='center' rowSpan={2} sx={{ width: 60, fontWeight: 'bold' }}>CA</TableCell>
                <TableCell align='center' rowSpan={2} sx={{ width: 80, fontWeight: 'bold' }}>SỐ XE</TableCell>

                {/* Cột ĐẤT */}
                <TableCell align='center' colSpan={colSpanDat} sx={{ fontWeight: 'bold' }}>
                  ĐẤT, SPNT, BÙN ĐẶC, BÙN LOÃNG...
                </TableCell>

                {/* Cột THAN */}
                <TableCell align='center' colSpan={colSpanThan} sx={{ fontWeight: 'bold' }}>
                  THAN
                </TableCell>

                <TableCell align='center' rowSpan={2} sx={{ width: 100, fontWeight: 'bold' }}>TỔNG HỢP CHUYẾN</TableCell>
              </TableRow>

              {/* HÀNG HEADER 2 */}
              <TableRow sx={{ top: 27 }}>

                {/* Header cho ĐẤT */}
                {uniqueHeadersDat.map((h: Header) => (
                  <TableCell
                    key={`dat-${h.key}`}
                    sx={{
                      minWidth: 80,
                      whiteSpace: "pre-line"
                    }}
                  >
                    Máy xúc: {h.excavator}
                    {'\n'}
                    Nơi đổ: {h.toLocation}
                  </TableCell>
                ))}
                {totalDetailColsDat === 0 && (
                  <TableCell align='center' sx={{ minWidth: 80 }}>-</TableCell>
                )}

                <TableCell align='center' sx={{ width: 100, fontWeight: 'bold' }}>TỔNG CHUYẾN ĐẤT</TableCell>

                {/* Header cho THAN */}
                {uniqueHeadersThan.map((h: Header) => (
                  <TableCell
                    key={`than-${h.key}`}
                    align='center'
                    sx={{
                      minWidth: 80,
                      whiteSpace: "pre-line"
                    }}
                  >
                    **Máy xúc:** {h.excavator}
                    {'\n'}
                    **Nơi đổ:** {h.toLocation}
                  </TableCell>
                ))}
                {/* Thêm ô giữ chỗ cho Than nếu không có header chi tiết */}
                {totalDetailColsThan === 0 && (
                  <TableCell align='center' sx={{ minWidth: 80 }}>-</TableCell>
                )}

                <TableCell align='center' sx={{ width: 100, fontWeight: 'bold', }}>TỔNG CHUYẾN THAN</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {/* LẶP QUA CÁC CA TRẢ VỀ TỪ DỮ LIỆU */}
              {shiftReports.map((shiftData: ShiftData) => {
                const shiftName = shiftData.shiftName;
                const shiftCars = shiftData.cars || [];
                const totalTripsInShift = shiftData.totalTripsInShift || 0;

                // Nếu có xe, rowSpan = số lượng xe + 1 (cho dòng Tổng ca)
                // Nếu không có xe, rowSpan = 2 (cho dòng "Không có xe" và dòng "Tổng ca")
                const rowSpanShift = shiftCars.length > 0 ? shiftCars.length + 1 : 2;

                // Tính tổng chi tiết Đất và Than cho dòng Tổng ca
                const totalDetailsDat = calculateShiftDetailTotal(shiftCars, uniqueHeadersDat, 'dat');
                const totalDetailsThan = calculateShiftDetailTotal(shiftCars, uniqueHeadersThan, 'than');


                const shiftRows: JSX.Element[] = [];

                // 1. THÊM DÒNG "KHÔNG CÓ XE" hoặc CÁC DÒNG XE
                if (shiftCars.length === 0) {
                  // Trường hợp 1: KHÔNG CÓ XE (Hiển thị dòng "Không có xe")
                  shiftRows.push(
                    <TableRow key={`${shiftName}-empty`}>
                      {/* Cột CA, rowSpan = 2 (Không có xe + Tổng ca) */}
                      <TableCell rowSpan={rowSpanShift} align="center" sx={{ fontWeight: 'bold', }}>
                        CA {shiftName}
                      </TableCell>

                      <TableCell align="center" sx={{ fontStyle: 'italic' }}>Không có xe</TableCell>

                      {/* Các cột chi tiết Đất (0) */}
                      {uniqueHeadersDat.map((h: Header) => <TableCell key={`empty-dat-${h.key}`} align='center'>0</TableCell>)}
                      {totalDetailColsDat === 0 && <TableCell align='center'>0</TableCell>}

                      <TableCell align='center' sx={{ fontWeight: 'bold' }}>0</TableCell>

                      {/* Các cột chi tiết Than (0) */}
                      {uniqueHeadersThan.map((h: Header) => <TableCell key={`empty-than-${h.key}`} align='center'>0</TableCell>)}
                      {totalDetailColsThan === 0 && <TableCell align='center'>0</TableCell>}

                      <TableCell align='center' sx={{ fontWeight: 'bold' }}>0</TableCell>

                      <TableCell align='center' sx={{ fontWeight: 'bold', }}>0</TableCell>
                    </TableRow>
                  );

                } else {
                  // Trường hợp 2: CÓ XE (Hiển thị chi tiết từng xe)
                  shiftCars.forEach((car: CarData, carIdx: number) => {
                    shiftRows.push(
                      <TableRow key={`${shiftName}-${car.carCode}`}>
                        {/* Cột CA - chỉ hiển thị ở dòng xe đầu tiên */}
                        {carIdx === 0 && (
                          <TableCell rowSpan={rowSpanShift} align="center" sx={{ fontWeight: 'bold', }}>
                            CA {shiftName}
                          </TableCell>
                        )}

                        {/* Cột SỐ XE */}
                        <TableCell align="center">{car.carCode}</TableCell>

                        {/* Dữ liệu chi tiết ĐẤT */}
                        {uniqueHeadersDat.map((h: Header) => (
                          <TableCell align='center' key={`dat-data-${h.key}`}>
                            {car.datDetailsMap[h.key]?.trips || ''}
                          </TableCell>
                        ))}
                        {totalDetailColsDat === 0 && <TableCell />}

                        {/* TỔNG CHUYẾN ĐẤT */}
                        <TableCell align='center' sx={{ fontWeight: 'bold' }}>
                          {car.totalDat || 0}
                        </TableCell>

                        {/* Dữ liệu chi tiết THAN */}
                        {uniqueHeadersThan.map((h: Header) => (
                          <TableCell align='center' key={`than-data-${h.key}`}>
                            {car.thanDetailsMap[h.key]?.trips || ''}
                          </TableCell>
                        ))}
                        {/* Ô rỗng cho Than nếu không có header chi tiết */}
                        {totalDetailColsThan === 0 && <TableCell />}


                        {/* TỔNG CHUYẾN THAN */}
                        <TableCell align='center' sx={{ fontWeight: 'bold' }}>
                          {car.totalThan || 0}
                        </TableCell>

                        {/* TỔNG HỢP CHUYẾN (Cả Đất và Than) */}
                        <TableCell align='center' sx={{ fontWeight: 'bold', }}>
                          {car.totalCarTrips || 0}
                        </TableCell>
                      </TableRow>
                    );
                  });
                }

                // 2. Dòng TỔNG CA (luôn được render ở cuối mỗi Ca)
                const totalDatCa = shiftData.cars.reduce((acc, car) => acc + car.totalDat, 0);
                const totalThanCa = shiftData.cars.reduce((acc, car) => acc + car.totalThan, 0);

                shiftRows.push(
                  <TableRow key={`total-${shiftName}`} sx={{}}>
                    {/* Cột Số Xe: Đặt thành "Tổng ca X" */}
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      Tổng ca {shiftName}
                    </TableCell>

                    {/* Tổng chi tiết Đất */}
                    {uniqueHeadersDat.map((h: Header) => (
                      <TableCell align='center' key={`total-dat-detail-${h.key}`} sx={{ fontWeight: 'bold' }}>
                        {totalDetailsDat[h.key] || 0}
                      </TableCell>
                    ))}
                    {totalDetailColsDat === 0 && <TableCell />}

                    {/* Tổng chuyến Đất */}
                    <TableCell colSpan={1} align='center' sx={{ fontWeight: 'bold' }}>
                      {totalDatCa}
                    </TableCell>

                    {/* Tổng chi tiết Than */}
                    {uniqueHeadersThan.map((h: Header) => (
                      <TableCell align='center' key={`total-than-detail-${h.key}`} sx={{ fontWeight: 'bold' }}>
                        {totalDetailsThan[h.key] || 0}
                      </TableCell>
                    ))}
                    {/* Ô rỗng cho Than nếu không có header chi tiết */}
                    {totalDetailColsThan === 0 && <TableCell />}

                    {/* Tổng chuyến Than */}
                    <TableCell colSpan={1} align='center' sx={{ fontWeight: 'bold' }}>
                      {totalThanCa}
                    </TableCell>

                    {/* TỔNG HỢP CHUYẾN */}
                    <TableCell colSpan={1} align='center' sx={{ fontWeight: 'bold' }}>
                      {totalTripsInShift || 0}
                    </TableCell>
                  </TableRow>
                );

                return <React.Fragment key={shiftName}>{shiftRows}</React.Fragment>;
              })}

              {/* Dòng TỔNG CẢ NGÀY */}
              <TableRow sx={{}}>
                {/* Đảm bảo colSpan=2 */}
                <TableCell align="center" colSpan={2} sx={{ fontWeight: 'bold' }}>
                  {shifts && shifts.length > 0 ? `TỔNG CA ${shifts.map(s => s.name).join('+')}` : 'TỔNG CẢ NGÀY'}
                </TableCell>

                {/* Cells trống cho các cột chi tiết ĐẤT */}
                {uniqueHeadersDat.map((h: Header) => (
                  <TableCell align='center' key={`grand-total-dat-detail-${h.key}`} sx={{ fontWeight: 'bold' }} />
                ))}
                {totalDetailColsDat === 0 && <TableCell />}


                {/* TỔNG CHUYẾN ĐẤT CẢ NGÀY */}
                <TableCell align='center' sx={{ fontWeight: 'bold' }}>
                  {grandTotal.grandTotalDat || 0}
                </TableCell>

                {/* Cells trống cho các cột chi tiết THAN */}
                {uniqueHeadersThan.map((h: Header) => (
                  <TableCell align='center' key={`grand-total-than-detail-${h.key}`} sx={{ fontWeight: 'bold' }} />
                ))}
                {totalDetailColsThan === 0 && <TableCell />}

                {/* TỔNG CHUYẾN THAN CẢ NGÀY */}
                <TableCell align='center' sx={{ fontWeight: 'bold' }}>
                  {grandTotal.grandTotalThan || 0}
                </TableCell>

                {/* TỔNG HỢP CHUYẾN CẢ NGÀY */}
                <TableCell align='center' sx={{ fontWeight: 'bold' }}>
                  {grandTotal.grandTotalAll || 0}
                </TableCell>
              </TableRow>

            </TableBody>
          </Table>
        </TableContainer>

        {
          signatureUrl && (
            <Box mt={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <img src={signatureUrl} alt="Chữ ký" style={{ maxWidth: 200, maxHeight: 100 }} />
            </Box>
          )
        }
      </Paper >
    </Grid >
  );
}