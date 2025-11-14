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

  // === Lấy dữ liệu gộp từ backend ===
  const landGroups = report.landGroups || [];
  const coalGroups = report.coalGroups || [];
  const totals = report.totals || {
    land: { m3: 0, tkm: 0 },
    coal: { ton: 0, tkm: 0 },
  };

  const shifts = [1, 2, 3];
  const sumByShift = (arr: any[], shift: number, field: string) =>
    arr
      .filter((g) => Number(g.shift) === shift)
      .reduce((s, g) => s + (g[field] || 0), 0);

  // === Header động (Đất / Than) ===
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

  // Nếu không có dữ liệu, vẫn render 1 cột trống
  const safeLandHeaders = landHeaders.length ? landHeaders : [["-", "-", "-", "-", "-", "-"]];
  const safeCoalHeaders = coalHeaders.length ? coalHeaders : [["-", "-", "-", "-", "-", "-"]];

  // === Danh sách tất cả xe & ca có trong báo cáo ===
  const allDevices = Array.from(
    new Set([...landGroups, ...coalGroups].map((g: any) => g.deviceCode))
  );
  const allShifts = Array.from(
    new Set([...landGroups, ...coalGroups].map((g: any) => g.shift))
  ).sort((a, b) => parseInt(a) - parseInt(b));

  // === BẮT ĐẦU RENDER ===
  return (
    <Grid item xs={12}>
      <Paper sx={{ p: 1 }}>
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
                <TableCell rowSpan={3} sx={{ fontWeight: "bold" }}>
                  CÁC CHỈ TIÊU
                </TableCell>
                <TableCell rowSpan={3}></TableCell>
                <TableCell colSpan={safeLandHeaders.length + 3} sx={{ fontWeight: "bold" }}>
                  CHUYỂN VẬN CHUYỂN ĐẤT, SPNT, BÙN...
                </TableCell>
                <TableCell colSpan={safeCoalHeaders.length + 3} sx={{ fontWeight: "bold" }}>
                  CHUYỂN VẬN CHUYỂN THAN
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {/* === Tiêu chí cố định (hàng ngang đầu) === */}
              {[
                "Nơi đổ tải",
                "Tầng xúc",
                "Chiều cao nâng tải",
                "Máy xúc",
                "Cung độ v/c (Km)",
                "Vật liệu",
              ].map((label, rowIdx) => (
                <TableRow key={label}>
                  <TableCell align="left" sx={{ fontWeight: "bold" }}>
                    {label}
                  </TableCell>

                  {/* Cột "Ca xe h/đ" */}
                  {rowIdx === 0 && (
                    <TableCell
                      rowSpan={6}
                      sx={{
                        verticalAlign: "middle",
                        fontWeight: "bold",
                      }}
                    >
                      Ca xe h/đ trong ngày
                    </TableCell>
                  )}

                  {/* Render header nhóm ĐẤT */}
                  {safeLandHeaders.map((h, i) => (
                    <TableCell key={`l-${label}-${i}`}>{h[rowIdx] || "-"}</TableCell>
                  ))}

                  {/* Cột tổng đất */}
                  {rowIdx === 0 && (
                    <>
                      <TableCell colSpan={3} sx={{ fontWeight: "bold" }}>
                        TỔNG ĐẤT
                      </TableCell>
                    </>
                  )}
                  {rowIdx === 1 && (
                    <>
                      <TableCell rowSpan={5}>
                        Chuyến
                      </TableCell>
                      <TableCell rowSpan={5}>(M³)</TableCell>
                      <TableCell rowSpan={5}>(Tkm)</TableCell>
                    </>
                  )}

                  {/* Render header nhóm THAN */}
                  {safeCoalHeaders.map((h, i) => (
                    <TableCell key={`c-${label}-${i}`}>{h[rowIdx] || "-"}</TableCell>
                  ))}

                  {/* Cột tổng than */}
                  {rowIdx === 0 && (
                    <>
                      <TableCell colSpan={3} sx={{ fontWeight: "bold" }}>
                        TỔNG THAN
                      </TableCell>
                    </>
                  )}
                  {rowIdx === 1 && (
                    <>
                      <TableCell rowSpan={5}>
                        Chuyến
                      </TableCell>
                      <TableCell rowSpan={5}>(Tấn)</TableCell>
                      <TableCell rowSpan={5}>(Tkm)</TableCell>
                    </>
                  )}
                  {rowIdx === 0 && (
                    <TableCell rowSpan={6} sx={{ fontWeight: "bold" }}>
                      TỔNG CHUYẾN
                    </TableCell>
                  )}
                </TableRow>
              ))}

              {/* === DỮ LIỆU THEO XE / CA === */}
              {allShifts.map((shift) => {
                const shiftDevices = allDevices.filter(device =>
                  [...landGroups, ...coalGroups].some(g => g.deviceCode === device && g.shift === shift)
                );

                const shiftLand = landGroups.filter((g: any) => g.shift === shift);
                const shiftCoal = coalGroups.filter((g: any) => g.shift === shift);

                return (
                  <React.Fragment key={`shift-${shift}`}>
                    {/* === Các dòng chi tiết xe trong ca === */}
                    {shiftDevices.map((device) => {
                      const landCells = safeLandHeaders.map((h, i) => {
                        const matched = shiftLand.find(
                          (g: any) =>
                            g.deviceCode === device &&
                            g.locationName === h[0] &&
                            g.excavatorCode === h[3] &&
                            String(g.distance || "") === String(h[4] || "") &&
                            g.materialName === h[5]
                        );
                        return matched?.quantity ?? "";
                      });

                      const coalCells = safeCoalHeaders.map((h, i) => {
                        const matched = shiftCoal.find(
                          (g: any) =>
                            g.deviceCode === device &&
                            g.locationName === h[0] &&
                            g.excavatorCode === h[3] &&
                            String(g.distance || "") === String(h[4] || "") &&
                            g.materialName === h[5]
                        );
                        return matched?.quantity ?? "";
                      });

                      const totalLand = shiftLand
                        .filter((g: any) => g.deviceCode === device)
                        .reduce(
                          (acc: any, g: any) => ({
                            m3: acc.m3 + (g.totalCubicMeter || 0),
                            tkm: acc.tkm + (g.production || 0),
                          }),
                          { m3: 0, tkm: 0 }
                        );

                      const totalCoal = shiftCoal
                        .filter((g: any) => g.deviceCode === device)
                        .reduce(
                          (acc: any, g: any) => ({
                            ton: acc.ton + (g.totalTon || 0),
                            tkm: acc.tkm + (g.production || 0),
                          }),
                          { ton: 0, tkm: 0 }
                        );

                      return (
                        <TableRow key={`${shift}-${device}`}>
                          <TableCell>{device}</TableCell>
                          <TableCell>{shift}</TableCell>
                          {landCells.map((v, i) => (
                            <TableCell key={`land-${device}-${i}`}>{v}</TableCell>
                          ))}
                          <TableCell>
                            {
                              shiftLand
                                .filter((g: any) => g.deviceCode === device)
                                .reduce((s: any, g: any) => s + (g.quantity || 0), 0)
                            }
                          </TableCell>
                          <TableCell>{totalLand.m3.toFixed(1)}</TableCell>
                          <TableCell>{totalLand.tkm.toFixed(1)}</TableCell>
                          {coalCells.map((v, i) => (
                            <TableCell key={`coal-${device}-${i}`}>{v}</TableCell>
                          ))}
                          <TableCell>
                            {
                              shiftCoal
                                .filter((g: any) => g.deviceCode === device)
                                .reduce((s: any, g: any) => s + (g.quantity || 0), 0)
                            }
                          </TableCell>
                          <TableCell>{totalCoal.ton.toFixed(1)}</TableCell>
                          <TableCell>{totalCoal.tkm.toFixed(1)}</TableCell>
                          <TableCell>
                            {
                              [...shiftLand, ...shiftCoal]
                                .filter((g: any) => g.deviceCode === device)
                                .reduce((s, g) => s + (g.quantity || 0), 0)
                            }
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* === Dòng tổng ca === */}
                    <TableRow sx={{ fontWeight: "bold", backgroundColor: "#f2f2f2" }}>
                      <TableCell colSpan={2}>TỔNG CA {shift}</TableCell>

                      {/* Tổng từng cột đất */}
                      {safeLandHeaders.map((h, i) => {
                        const sum = shiftLand
                          .filter(
                            (g: any) =>
                              g.locationName === h[0] &&
                              g.excavatorCode === h[3] &&
                              String(g.distance || "") === String(h[4] || "") &&
                              g.materialName === h[5]
                          )
                          .reduce((s: any, g: any) => s + (g.quantity || 0), 0);
                        return <TableCell key={`sum-l-${shift}-${i}`}>{sum.toFixed(1)}</TableCell>;
                      })}
                      <TableCell>
                        {shiftLand.reduce((s: any, g: any) => s + (g.quantity || 0), 0).toFixed(1)}
                      </TableCell>
                      <TableCell>
                        {shiftLand.reduce((s: any, g: any) => s + (g.totalCubicMeter || 0), 0).toFixed(1)}
                      </TableCell>
                      <TableCell>
                        {shiftLand.reduce((s: any, g: any) => s + (g.production || 0), 0).toFixed(1)}
                      </TableCell>

                      {/* Tổng từng cột than */}
                      {safeCoalHeaders.map((h, i) => {
                        const sum = shiftCoal
                          .filter(
                            (g: any) =>
                              g.locationName === h[0] &&
                              g.excavatorCode === h[3] &&
                              String(g.distance || "") === String(h[4] || "") &&
                              g.materialName === h[5]
                          )
                          .reduce((s: any, g: any) => s + (g.quantity || 0), 0);
                        return <TableCell key={`sum-c-${shift}-${i}`}>{sum.toFixed(1)}</TableCell>;
                      })}
                      <TableCell>
                        {shiftCoal.reduce((s: any, g: any) => s + (g.quantity || 0), 0).toFixed(1)}
                      </TableCell>
                      <TableCell>
                        {shiftCoal.reduce((s: any, g: any) => s + (g.totalTon || 0), 0).toFixed(1)}
                      </TableCell>
                      <TableCell>
                        {shiftCoal.reduce((s: any, g: any) => s + (g.production || 0), 0).toFixed(1)}
                      </TableCell>
                      <TableCell>
                        {
                          [...shiftLand, ...shiftCoal]
                            .reduce((s, g) => s + (g.quantity || 0), 0)
                            .toFixed(1)
                        }
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}


              {/* === TỔNG CỘNG TOÀN BỘ === */}
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
                <TableCell>
                  {landGroups.reduce((s: any, g: any) => s + (g.quantity || 0), 0).toFixed(1)}
                </TableCell>
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
                <TableCell>
                  {coalGroups.reduce((s: any, g: any) => s + (g.quantity || 0), 0).toFixed(1)}
                </TableCell>
                <TableCell>{totals.coal.ton.toFixed(1)}</TableCell>
                <TableCell>{totals.coal.tkm.toFixed(1)}</TableCell>
                <TableCell>
                  {
                    [...landGroups, ...coalGroups]
                      .reduce((s, g) => s + (g.quantity || 0), 0)
                      .toFixed(1)
                  }
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          {/* === Tổng theo ca === */}

          TỔNG CHUYẾN
          {shifts.map((s) => {
            const val =
              sumByShift([...landGroups, ...coalGroups], s, "quantity") || 0;
            return (
              <Typography key={`trip-${s}`} align="left" sx={{ fontSize: 14 }}>
                Ca {s}: {val}
              </Typography>
            );
          })}

          TỔNG ĐẤT (m³)

          {shifts.map((s) => {
            const val = sumByShift(landGroups, s, "totalCubicMeter") || 0;
            return (
              <Typography key={`land-m3-${s}`} align="left" sx={{ fontSize: 14 }}>
                Ca {s}: {val.toFixed(1)}
              </Typography>
            );
          })}


          TỔNG ĐẤT (Tkm)
          {shifts.map((s) => {
            const val = sumByShift(landGroups, s, "production") || 0;
            return (
              <Typography key={`land-tkm-${s}`} align="left" sx={{ fontSize: 14 }}>
                Ca {s}: {val.toFixed(1)}
              </Typography>
            );
          })}

          TỔNG THAN (tấn)
          {shifts.map((s) => {
            const val = sumByShift(coalGroups, s, "totalTon") || 0;
            return (
              <Typography key={`coal-ton-${s}`} align="left" sx={{ fontSize: 14 }}>
                Ca {s}: {val.toFixed(1)}
              </Typography>
            );
          })}

          TỔNG THAN (Tkm)
          {shifts.map((s) => {
            const val = sumByShift(coalGroups, s, "production") || 0;
            return (
              <Typography key={`coal-tkm-${s}`} align="left" sx={{ fontSize: 14 }}>
                Ca {s}: {val.toFixed(1)}
              </Typography>
            );
          })}

        </TableContainer>

        {/* ===== Chữ ký ===== */}
        {signatureUrl && (
          <Box mt={2} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <img src={signatureUrl} alt="Chữ ký" style={{ maxWidth: 200, maxHeight: 100 }} />
          </Box>
        )}
      </Paper>
    </Grid>
  );
}
