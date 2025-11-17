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

const MAX_LEFT_ROWS = 12;
const MAX_RIGHT_ROWS = 20;

const data = {
  shift: 1,
  day: 16,
  month: 11,
  year: 2025,
  officer: "Đặng Hữu Tùng – TV",
  section: "Phòng Kỹ thuật vận tải",

  activeExcavators: [
    { stt: 1, mayXuc: "EK1", soXe: "79K, 19K, 15B, 18B, 19T", hangVc: "BĐAT", baiThai: "B20 + BĐQT" },
    { stt: 2, mayXuc: "EK2", soXe: "99T, 109T", hangVc: "Đổ đất", baiThai: "B20, 59" },
    { stt: 3, mayXuc: "PC05", soXe: "98J, 115-79", hangVc: "Dọn dẹp", baiThai: "B20, 59" },
    { stt: 4, mayXuc: "TT", soXe: "77J, 105", hangVc: "Đổ đất", baiThai: "R20, 51" },
    { stt: 5, mayXuc: "EK3", soXe: "65, 97, 100, 112, 116, 17", hangVc: "Đổ đất", baiThai: "BĐQT, P62" }
  ],

  brokenVehicles: [
    { stt: 1, soXe: "97", tinhTrang: "Hư cầu, bỏ giao hàng", ketQua: "Đề nghị" },
    { stt: 2, soXe: "109", tinhTrang: "Số 2 yếu, phụ tùng mòn", ketQua: "Đề nghị" },
    { stt: 3, soXe: "152", tinhTrang: "Bật hộp cầu trước, rung mạnh", ketQua: "Đề nghị" },
    { stt: 4, soXe: "129", tinhTrang: "Gầm yếu, lò xo yếu", ketQua: "Đề nghị" },
    { stt: 5, soXe: "820", tinhTrang: "Sốc trước yếu chạy chậm", ketQua: "Đề nghị" }
  ],

  workSummary:
    "Đầu ca trực phối hợp điều hành, chỉ đạo xử lý phát sinh xe thiết bị đảm bảo mọi việc ổn định. Các thiết bị về nghỉ đúng tinh thần an toàn.",
  safetySummary:
    "Trong công việc cần chấp hành an toàn. Đảm bảo xe vận tải lưu thông đúng tốc độ, chú ý gầm cầu, điểm giao cắt, quan sát kỹ khi vào bãi thải.",

  giao: "Phụ trách ca: Tùng – TV",
  nhan: "Người nhận ca: ................................",
};

export default function AssignmentManagerReport() {

  // ép đúng 12 hàng bên trái
  const leftRows = [
    ...data.activeExcavators.slice(0, MAX_LEFT_ROWS),
    ...Array(Math.max(0, MAX_LEFT_ROWS - data.activeExcavators.length)).fill({
      stt: "",
      mayXuc: "",
      soXe: "",
      hangVc: "",
      baiThai: "",
    }),
  ];

  // ép đúng 20 hàng bên phải
  const rightRows = [
    ...data.brokenVehicles.slice(0, MAX_RIGHT_ROWS),
    ...Array(Math.max(0, MAX_RIGHT_ROWS - data.brokenVehicles.length)).fill({
      stt: "",
      soXe: "",
      tinhTrang: "",
      ketQua: "",
      ghiChu: "",
    }),
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
          <Typography>Ca: {data.shift}</Typography>
          <Typography>
            Ngày {data.day} tháng {data.month} năm {data.year}
          </Typography>
          <Typography>Cán bộ: {data.officer}</Typography>
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
                    <TableCell sx={cell}>MÁY XÚC</TableCell>
                    <TableCell sx={cell}>SỐ XE</TableCell>
                    <TableCell sx={cell}>HÀNG V/C</TableCell>
                    <TableCell sx={cell}>BÃI THẢI</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leftRows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={cell}>{row.stt || idx + 1}</TableCell>
                      <TableCell sx={cell}>{row.mayXuc}</TableCell>
                      <TableCell sx={cell}>{row.soXe}</TableCell>
                      <TableCell sx={cell}>{row.hangVc}</TableCell>
                      <TableCell sx={cell}>{row.baiThai}</TableCell>
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
                  {rightRows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={cell}>{idx + 1}</TableCell>
                      <TableCell sx={cell}>{row.soXe}</TableCell>
                      <TableCell sx={cell}>{row.tinhTrang}</TableCell>
                      <TableCell sx={cell}>{row.ketQua}</TableCell>
                      <TableCell sx={cell}></TableCell>
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
            <Typography sx={{ mt: 1 }}>{data.workSummary}</Typography>

          </Grid>
          <Grid item xs={6}>
            {/* ===== SECTION III ===== */}
            <Typography sx={{ fontWeight: "bold", mt: 3 }} align="center">
              III – Dự báo nguy cơ mất an toàn:
            </Typography>
            <Typography sx={{ mt: 1 }}>{data.safetySummary}</Typography>
          </Grid>
        </Grid>

        {/* ===== SIGN =====
        <Grid container sx={{ mt: 4 }}>
          <Grid item xs={6} textAlign="center">
            <Typography sx={{ fontWeight: "bold" }}>NGƯỜI GIAO</Typography>
            <Typography sx={{ fontWeight: "bold" }}>(ký và</Typography>
            <Typography sx={{ mt: 6 }}>{data.giao}</Typography>
          </Grid>

          <Grid item xs={6} textAlign="center">
            <Typography sx={{ fontWeight: "bold" }}>NGƯỜI NHẬN</Typography>
            <Typography sx={{ mt: 6 }}>{data.nhan}</Typography>
          </Grid>
        </Grid> */}
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
