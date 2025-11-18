import React from "react";
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
} from "@mui/material";
import { Department, Shift } from "../../types";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import { userAtom } from "../../atoms/userAtoms";

const MAX_LEFT_ROWS = 12;
const MAX_RIGHT_ROWS = 20;

export default function AssignmentManagerReport({
  data,
  signatureUrl,
  startDate,
  endDate,
  shifts,
  department,
  date,
  day
}: {
  data: any[];
  signatureUrl: string | null;
  startDate: dayjs.Dayjs | null;
  endDate: dayjs.Dayjs | null;
  shifts: Shift[];
  department: Department | null;
  date: dayjs.Dayjs | null;
  day: dayjs.Dayjs | null;
}) {

  const [user] = useAtom(userAtom)

  const leftRows = data[0]?.activity || [];
  const leftFilled = [
    ...leftRows,
    ...Array.from({ length: Math.max(0, MAX_LEFT_ROWS - leftRows.length) },
      () => ({ excavator: "", vehicles: [], materials: [], locations: [] })
    ),
  ];

  const rightRows = data[0]?.repairs || [];
  const rightFilled = [
    ...rightRows,
    ...Array.from({ length: Math.max(0, MAX_RIGHT_ROWS - rightRows.length) },
      () => ({ vehicle: "", status: "", result: "", note: "" })
    ),
  ];
  return (
    <Grid item xs={12}>
      <Paper
        sx={{
          p: 2,
          // width: "100%",
          // maxWidth: "100%",
          "@media print": {
            width: "297mm",
            height: "210mm",
          },
          overflowX: 'scroll'
        }}
      >
        {/* ===== HEADER ===== */}
        <Typography textAlign="center" sx={{ fontWeight: "bold", fontSize: 20 }}>
          SỔ GIAO CA CÁN BỘ
        </Typography>

        <Box display={'flex'} justifyContent={'center'} gap={5}>
          <Typography>Ca: {shifts[0]?.name}</Typography>
          <Typography>
            Ngày {day?.date()} tháng {day ? day?.month() + 1 : ''} năm {day?.year()}
          </Typography>
          <Typography>Cán bộ: {user?.fullName}</Typography>
        </Box>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* ================= LEFT TABLE ================ */}
          <Grid item xs={6}>
            <Typography sx={{ fontWeight: "bold", mt: 2 }}>
              I – Tình hình hoạt động trong ca:
            </Typography>

            <TableContainer sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={cell}>STT</TableCell>
                    <TableCell sx={{ ...cell, width: 100 }}>MÁY XÚC</TableCell>
                    <TableCell sx={cell}>SỐ XE</TableCell>
                    <TableCell sx={cell}>HÀNG V/C</TableCell>
                    <TableCell sx={cell}>BÃI THẢI</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leftFilled.map((row: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell sx={cell} align="center">{idx + 1}</TableCell>
                      <TableCell sx={cell}>{row?.excavator}</TableCell>
                      <TableCell sx={cell}>{row?.vehicles?.join(", ")}</TableCell>
                      <TableCell sx={cell}>{row?.materials?.join(", ")}</TableCell>
                      <TableCell sx={cell}>{row?.locations?.join(", ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, fontSize: 14 }}>
              - Các thiết bị kiểm tu, bảo dưỡng bao gồm:
              <br />+ Kiểm tu:
              <br />+ Bảo dưỡng cấp 1 (250h):
              <br />+ Bảo dưỡng cấp 2 (500h):
              <br />+ Bảo dưỡng 1000h:
              <br />+ Bảo dưỡng 2000h:
              <br />+ Trung đại tu:
              <br />+ Sửa chữa đột xuất lớn:
            </Box>
          </Grid>

          {/* ================= RIGHT TABLE ================ */}
          <Grid item xs={6}>
            <Typography sx={{ fontWeight: "bold", mt: 2 }}>
              - Các thiết bị dừng do các lý do khác nhau:
            </Typography>

            <TableContainer sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={cell}>STT</TableCell>
                    <TableCell sx={cell}>SỐ XE</TableCell>
                    <TableCell sx={cell}>TÌNH TRẠNG</TableCell>
                    <TableCell sx={cell}>KẾT QUẢ SC TRONG CA</TableCell>
                    <TableCell sx={cell}>GHI CHÚ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rightFilled.map((row: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell sx={cell}>{idx + 1}</TableCell>
                      <TableCell sx={cell}>{row?.vehicle}</TableCell>
                      <TableCell sx={cell}>{row?.status}</TableCell>
                      <TableCell sx={cell}>{row?.result}</TableCell>
                      <TableCell sx={cell}>{row?.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>

        {/* ===== SECTION II ===== */}
        <Grid container spacing={2} p={2}>
          <Grid item xs={6}>
            <Typography sx={{ fontWeight: "bold", mt: 3 }} align="center">
              II – Nội dung công việc trong ca và bàn giao sau ca:
            </Typography>
            <Typography sx={{ mt: 1 }}></Typography>

          </Grid>
          <Grid item xs={6}>
            {/* ===== SECTION III ===== */}
            <Typography sx={{ fontWeight: "bold", mt: 3 }} align="center">
              III – Dự báo nguy cơ mất an toàn:
            </Typography>
            <Typography sx={{ mt: 1 }}></Typography>
          </Grid>
        </Grid>
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
    </Grid>
  );
}

const cell = {
  border: "1px solid black",
  padding: "4px 6px",
  fontSize: 13,
  lineHeight: "16px",
};
