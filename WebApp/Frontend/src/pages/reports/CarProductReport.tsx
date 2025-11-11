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
import dayjs from "dayjs";
import { Department } from "../../types";
import { useAtom } from "jotai";
import { userAtom } from "../../atoms/userAtoms";

export default function CarProductReport({
  data,
  signatureUrl,
  department,
  day,
}: {
  data: any[];
  signatureUrl: string | null;
  department: Department | null;
  day: dayjs.Dayjs | null;
}) {
  const [user] = useAtom(userAtom);
  const report = data?.[0];
  if (!report) return <Typography>Không có dữ liệu</Typography>;

  // Luôn có ít nhất mảng rỗng để render đủ header
  const landGroups = report.landGroups || [];
  const coalGroups = report.coalGroups || [];
  const totals = report.totals || {
    land: { m3: 0, tkm: 0 },
    coal: { ton: 0, tkm: 0 },
  };

  // === Header động ===
  const landHeaders = Array.from(
    new Set<string>(
      landGroups.map(
        (g: any) =>
          `${g.locationName}|${g.excavationLevel}|${g.fullLiftHeightM}|${g.excavatorCode}|${g.distance}|${g.materialName}`
      )
    )
  ).map((k) => k.split("|"));

  const coalHeaders = Array.from(
    new Set<string>(
      coalGroups.map(
        (g: any) =>
          `${g.locationName}|${g.excavationLevel}|${g.fullLiftHeightM}|${g.excavatorCode}|${g.distance}|${g.materialName}`
      )
    )
  ).map((k) => k.split("|"));

  // Nếu không có dữ liệu, vẫn hiển thị 1 cột trống
  const safeLandHeaders = landHeaders.length ? landHeaders : [["-", "-", "-", "-", "-", "-"]];
  const safeCoalHeaders = coalHeaders.length ? coalHeaders : [["-", "-", "-", "-", "-", "-"]];

  const allDevices = Array.from(
    new Set([...landGroups, ...coalGroups].flatMap((g: any) => g.devices || []))
  );
  const allShifts = Array.from(
    new Set([...landGroups, ...coalGroups].flatMap((g: any) => g.shifts || []))
  ).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <Grid item xs={12}>
      <Paper>
        {/* ===== Header ===== */}
        <Typography sx={{ fontSize: 15, fontWeight: "bold" }}>
          CÔNG TY CP THAN CAO SƠN - TKV
        </Typography>
        <Typography
          textAlign="center"
          sx={{ fontWeight: "bold", fontSize: 18, mt: 2, mb: 2 }}
        >
          BÁO CÁO SẢN LƯỢNG XE Ô TÔ THỰC HIỆN
        </Typography>
        <Typography>
          Đơn vị: {department ? department.code : user?.department?.code}
        </Typography>
        <Typography sx={{ mb: 1 }}>
          Ngày: {day ? day.format("DD/MM/YYYY") : ""}
        </Typography>

        {/* ===== Table ===== */}
        <TableContainer>
          <Table
            size="small"
            sx={{
              border: "1px solid #000",
              "& th, & td": {
                border: "1px solid #000",
                textAlign: "center",
                padding: "4px 6px",
                fontSize: 12,
              },
            }}
          >
            <TableHead>
              {/* === Hàng 1: nhóm chính === */}
              <TableRow>
                <TableCell rowSpan={3} sx={{ fontWeight: "bold", }}>CÁC CHỈ TIÊU</TableCell>
                <TableCell rowSpan={3}></TableCell>
                <TableCell colSpan={safeLandHeaders.length + 2} sx={{ fontWeight: "bold", }}>
                  CHUYỂN VẬN CHUYỂN ĐẤT, SPNT, BÙN...
                </TableCell>
                <TableCell colSpan={safeCoalHeaders.length + 2} sx={{ fontWeight: "bold", }}>
                  CHUYỂN VẬN CHUYỂN THAN
                </TableCell>
              </TableRow>

              {/* === Hàng 2: tiêu đề phụ === */}
              <TableRow>
                {safeLandHeaders.map((h, i) => (
                  <TableCell key={`lh-${i}`}>{h[0] || "-"}</TableCell>
                ))}
                <TableCell colSpan={2} sx={{ fontWeight: "bold" }}>
                  TỔNG ĐẤT
                </TableCell>

                {safeCoalHeaders.map((h, i) => (
                  <TableCell key={`ch-${i}`}>{h[0] || "-"}</TableCell>
                ))}
                <TableCell colSpan={2} sx={{ fontWeight: "bold" }}>
                  TỔNG THAN
                </TableCell>
              </TableRow>

              {/* === Hàng 3: đơn vị đo === */}
              <TableRow>
                {safeLandHeaders.map((_, i) => (
                  <TableCell key={`lh-unit-${i}`}></TableCell>
                ))}
                <TableCell>(M³)</TableCell>
                <TableCell>(Tkm)</TableCell>

                {safeCoalHeaders.map((_, i) => (
                  <TableCell key={`ch-unit-${i}`}></TableCell>
                ))}
                <TableCell>(Tấn)</TableCell>
                <TableCell>(Tkm)</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {/* === Tiêu chí cố định === */}
              {[
                "Nơi đổ tải",
                "Tầng xúc",
                "Chiều cao nâng tải",
                "Máy xúc",
                "Cung độ v/c (Km)",
                "Vật liệu",
              ].map((label, rowIdx) => (
                <TableRow key={label}>
                  <TableCell align="left" sx={{ fontWeight: "bold", }}>{label}</TableCell>
                  {rowIdx === 0 && (
                    <TableCell
                      rowSpan={6}
                      sx={{
                        verticalAlign: "middle",
                      }}
                    >
                      Ca xe /đ trong ngày
                    </TableCell>
                  )}
                  {safeLandHeaders.map((h, i) => (
                    <TableCell key={`l-${label}-${i}`}>{h[rowIdx] || "-"}</TableCell>
                  ))}
                  {rowIdx === 0 && (
                    <>
                      <TableCell rowSpan={6}></TableCell>
                      <TableCell rowSpan={6}></TableCell>
                    </>
                  )}
                  {safeCoalHeaders.map((h, i) => (
                    <TableCell key={`c-${label}-${i}`}>{h[rowIdx] || "-"}</TableCell>
                  ))}
                  {rowIdx === 0 && (
                    <>
                      <TableCell rowSpan={6}></TableCell>
                      <TableCell rowSpan={6}></TableCell>
                    </>
                  )}
                </TableRow>
              ))}

              {/* === Danh sách xe/ca === */}
              {allDevices.map((device) =>
                allShifts.map((shift) => {
                  const landCells = safeLandHeaders.map((h, i) => {
                    const matched = landGroups.find(
                      (g: any) =>
                        g.devices?.includes(device) &&
                        g.shifts?.includes(shift) &&
                        g.locationName === h[0] &&
                        g.excavatorCode === h[3] &&
                        String(g.distance || "") === String(h[4] || "") &&
                        g.materialName === h[5]
                    );
                    return matched?.quantity ?? "";
                  });

                  const coalCells = safeCoalHeaders.map((h, i) => {
                    const matched = coalGroups.find(
                      (g: any) =>
                        g.devices?.includes(device) &&
                        g.shifts?.includes(shift) &&
                        g.locationName === h[0] &&
                        g.excavatorCode === h[3] &&
                        String(g.distance || "") === String(h[4] || "") &&
                        g.materialName === h[5]
                    );
                    return matched?.quantity ?? "";
                  });

                  const totalLand = landGroups
                    .filter(
                      (g: any) =>
                        g.devices?.includes(device) && g.shifts?.includes(shift)
                    )
                    .reduce(
                      (acc: any, g: any) => ({
                        m3: acc.m3 + (g.totalCubicMeter || 0),
                        tkm: acc.tkm + (g.production || 0),
                      }),
                      { m3: 0, tkm: 0 }
                    );

                  const totalCoal = coalGroups
                    .filter(
                      (g: any) =>
                        g.devices?.includes(device) && g.shifts?.includes(shift)
                    )
                    .reduce(
                      (acc: any, g: any) => ({
                        ton: acc.ton + (g.totalTon || 0),
                        tkm: acc.tkm + (g.production || 0),
                      }),
                      { ton: 0, tkm: 0 }
                    );

                  return (
                    <TableRow key={`${device}-${shift}`}>
                      <TableCell>{device}</TableCell>
                      <TableCell>{shift}</TableCell>
                      {landCells.map((v, i) => (
                        <TableCell key={`v-${device}-${i}`}>{v}</TableCell>
                      ))}
                      <TableCell>{totalLand.m3.toFixed(1)}</TableCell>
                      <TableCell>{totalLand.tkm.toFixed(1)}</TableCell>
                      {coalCells.map((v, i) => (
                        <TableCell key={`c-${device}-${i}`}>{v}</TableCell>
                      ))}
                      <TableCell>{totalCoal.ton.toFixed(1)}</TableCell>
                      <TableCell>{totalCoal.tkm.toFixed(1)}</TableCell>
                    </TableRow>
                  );
                })
              )}

              {/* === Tổng cộng === */}
              <TableRow sx={{ fontWeight: "bold" }}>
                <TableCell colSpan={2}>TỔNG CỘNG</TableCell>
                {safeLandHeaders.map((h, i) => {
                  const sum = landGroups
                    .filter(
                      (g: any) =>
                        g.locationName === h[0] &&
                        g.excavatorCode === h[3] &&
                        String(g.distance || "") === String(h[4] || "") &&
                        g.materialName === h[5]
                    )
                    .reduce((s: any, g: any) => s + (g.quantity || 0), 0);
                  return <TableCell key={`sum-l-${i}`}>{sum.toFixed(1)}</TableCell>;
                })}
                <TableCell>{totals.land.m3.toFixed(1)}</TableCell>
                <TableCell>{totals.land.tkm.toFixed(1)}</TableCell>
                {safeCoalHeaders.map((h, i) => {
                  const sum = coalGroups
                    .filter(
                      (g: any) =>
                        g.locationName === h[0] &&
                        g.excavatorCode === h[3] &&
                        String(g.distance || "") === String(h[4] || "") &&
                        g.materialName === h[5]
                    )
                    .reduce((s: any, g: any) => s + (g.quantity || 0), 0);
                  return <TableCell key={`sum-c-${i}`}>{sum.toFixed(1)}</TableCell>;
                })}
                <TableCell>{totals.coal.ton.toFixed(1)}</TableCell>
                <TableCell>{totals.coal.tkm.toFixed(1)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* === Chữ ký === */}
        {
          signatureUrl && (
            <Box mt={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <img src={signatureUrl} alt="Chữ ký" style={{ maxWidth: 200, maxHeight: 100 }} />
            </Box>
          )
        }
      </Paper>
    </Grid>
  );
}
