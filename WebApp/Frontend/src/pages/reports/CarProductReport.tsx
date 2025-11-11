import React, { useMemo } from "react";
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
import { AcceptedProductEnum } from "../../enums";
import { userAtom } from "../../atoms/userAtoms";
import { useAtom } from "jotai";

const formatNumber = (num?: number) =>
  num ? num.toFixed(2).replace(/\.00$/, "") : "";

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
  // 🔹 Tính tổng các cột
  const totals = useMemo(() => {
    const totalTrips = data.reduce((s, d) => s + (d.quantity || 0), 0);
    const totalM3 = data
      .filter((d) => d.material?.acceptedProduct === AcceptedProductEnum.LAND)
      .reduce((s, d) => s + (d.totalCubicMeter || 0), 0);
    const totalTkmLand = data
      .filter((d) => d.material?.acceptedProduct === AcceptedProductEnum.LAND)
      .reduce((s, d) => s + (d.production || 0), 0);
    const totalTonCoal = data
      .filter((d) => d.material?.acceptedProduct === AcceptedProductEnum.COAL)
      .reduce((s, d) => s + (d.totalTon || 0), 0);
    const totalTkmCoal = data
      .filter((d) => d.material?.acceptedProduct === AcceptedProductEnum.COAL)
      .reduce((s, d) => s + (d.production || 0), 0);

    return {
      totalTrips,
      totalM3,
      totalTkmLand,
      totalTonCoal,
      totalTkmCoal,
    };
  }, [data]);

  const [user] = useAtom(userAtom);

  return (
    <Grid item xs={12}>
      <Paper
      >
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
        <Typography>Đơn vị: {department ? department.code : user?.department?.code}</Typography>

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
              "& th": { fontWeight: "bold", background: "#f8f8f8" },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell rowSpan={2}>Ca</TableCell>
                <TableCell rowSpan={2}>Nơi đổ tải</TableCell>
                <TableCell rowSpan={2}>Tầng xúc</TableCell>
                <TableCell rowSpan={2}>Chiều cao nâng tải</TableCell>
                <TableCell rowSpan={2}>Máy xúc</TableCell>
                <TableCell rowSpan={2}>Cung độ v/c (Km)</TableCell>
                <TableCell rowSpan={2}>SX/CN</TableCell>
                <TableCell rowSpan={2}>Số xe</TableCell>
                <TableCell rowSpan={2}>Số chuyến</TableCell>
                <TableCell colSpan={2}>TỔNG ĐẤT</TableCell>
                <TableCell colSpan={2}>TỔNG THAN</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>m³</TableCell>
                <TableCell>Tkm</TableCell>
                <TableCell>Tấn</TableCell>
                <TableCell>Tkm</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {data?.length ? (
                <>
                  {data.map((row: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{row.shift}</TableCell>
                      <TableCell>{row.location?.name}</TableCell>
                      <TableCell>{row.excavationLevel}</TableCell>
                      <TableCell>{row.fullLiftHeightM}</TableCell>
                      <TableCell>{row.excavator?.code}</TableCell>
                      <TableCell>{row.distance}</TableCell>
                      <TableCell>{row.material?.name}</TableCell>
                      <TableCell>{row.device?.code}</TableCell>
                      <TableCell>{row.quantity}</TableCell>

                      {/* Tổng Đất */}
                      <TableCell>
                        {row.material?.acceptedProduct === AcceptedProductEnum.LAND
                          ? formatNumber(row.totalCubicMeter)
                          : ""}
                      </TableCell>
                      <TableCell>
                        {row.material?.acceptedProduct === AcceptedProductEnum.LAND
                          ? formatNumber(row.production)
                          : ""}
                      </TableCell>

                      {/* Tổng Than */}
                      <TableCell>
                        {row.material?.acceptedProduct === AcceptedProductEnum.COAL
                          ? formatNumber(row.totalTon)
                          : ""}
                      </TableCell>
                      <TableCell>
                        {row.material?.acceptedProduct === AcceptedProductEnum.COAL
                          ? formatNumber(row.production)
                          : ""}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* --- Dòng TỔNG CỘNG --- */}
                  <TableRow sx={{ backgroundColor: "#f1f1f1" }}>
                    <TableCell colSpan={8} align="center" sx={{ fontWeight: "bold" }}>
                      TỔNG CỘNG
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {formatNumber(totals.totalTrips)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {formatNumber(totals.totalM3)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {formatNumber(totals.totalTkmLand)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {formatNumber(totals.totalTonCoal)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {formatNumber(totals.totalTkmCoal)}
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={13}>Không có dữ liệu</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Chữ ký hình ảnh */}
        {signatureUrl && (
          <Box mt={3} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <img
              src={signatureUrl}
              alt="Chữ ký"
              style={{ width: 120, height: 50, objectFit: "contain" }}
            />
          </Box>
        )}
      </Paper>
    </Grid>
  );
}
