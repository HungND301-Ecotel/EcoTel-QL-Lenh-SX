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
import React from "react";
import { Department, Shift } from "../../types";
import { useAtom } from "jotai";
import dayjs from "dayjs";
import { userAtom } from "../../atoms/userAtoms";

export default function CarReport({
  data,
  signatureUrl,
  maxTrip,
  materials,
  startDate,
  endDate,
  shifts,
  department,
}: {
  data: any[];
  signatureUrl: string | null;
  maxTrip: number;
  materials: any[];
  startDate: dayjs.Dayjs | null;
  endDate: dayjs.Dayjs | null;
  shifts: Shift[];
  department: Department | null;
}) {
  const [user] = useAtom(userAtom);

  return (
    <Grid item xs={12}>
      <Paper sx={{ p: 1 }}>
        <i style={{ fontSize: 20 }}>CÔNG TY CỔ PHẦN THAN CAO SƠN-TKV</i>
        <Typography
          textAlign={"center"}
          mb={2}
          variant="h3"
          fontWeight={"bold"}
        >
          Báo cáo tổng hợp số liệu trong ca (Ô tô)
        </Typography>
        <Typography>
          Đơn vị: {department ? department.code : user?.department?.code}
        </Typography>
        <Typography>Từ ngày: {startDate?.format("DD-MM-YYYY")}</Typography>
        <Typography>Đến ngày: {endDate?.format("DD-MM-YYYY")}</Typography>
        <Typography>Ca: {shifts.map((s) => s.name).join(", ")}</Typography>
        <TableContainer sx={{ maxHeight: "80vh" }}>
          <Table
            stickyHeader
            size="small"
            aria-label="car-trip-report"
            sx={{
              "& th, & td": { border: "1px solid black", padding: "2px 8px" },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell align="center" rowSpan={2} sx={{ width: 60 }}>
                  STT
                </TableCell>
                <TableCell align="center" rowSpan={2}>
                  Người nhận lệnh
                </TableCell>
                <TableCell align="center" rowSpan={2}>
                  Số thẻ
                </TableCell>
                <TableCell align="center" rowSpan={2}>
                  Phương tiện
                </TableCell>
                <TableCell align="center" rowSpan={2}>
                  Máy xúc
                </TableCell>
                <TableCell align="center" rowSpan={2}>
                  Điểm đổ tải
                </TableCell>
                <TableCell align="center" rowSpan={2}>
                  Loại vật liệu
                </TableCell>
                <TableCell align="center" rowSpan={2}>
                  Cung độ thực hiện
                </TableCell>
                <TableCell align="center" rowSpan={2}>
                  Chiều cao nâng tải (m)
                </TableCell>
                <TableCell align="center" colSpan={3}>
                  Sản lượng
                </TableCell>
                <TableCell align="center" colSpan={7}>
                  Nhiên liệu/ Điện năng
                </TableCell>
                <TableCell align="center" colSpan={3}>
                  Sử dụng thiết bị (giờ)
                </TableCell>
                <TableCell align="center" rowSpan={2}>
                  Bồi dưỡng (đồng)
                </TableCell>
                <TableCell align="center" rowSpan={2}>
                  Lương tạm tính
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell align="center">Chuyến định mức</TableCell>
                <TableCell align="center">Chuyến thực hiện</TableCell>
                <TableCell align="center">Km</TableCell>
                <TableCell align="center">Tồn dầu</TableCell>
                <TableCell align="center">Lĩnh</TableCell>
                <TableCell align="center">Tồn cuối</TableCell>
                <TableCell align="center">Tiêu thụ</TableCell>
                <TableCell align="center">Định mức</TableCell>
                <TableCell align="center">Tiết kiệm</TableCell>
                <TableCell align="center">Vượt</TableCell>
                <TableCell align="center">Giờ hoạt động</TableCell>
                <TableCell align="center">Giờ ngừng</TableCell>
                <TableCell align="center">Giờ hoạt động lũy kế</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item: any, idx: number) => {
                const reps =
                  item.reports && item.reports.length
                    ? item.reports
                    : [{ excavator: "", toLocation: "", materials: {} }];

                // Tổng số dòng = tổng số vật liệu của tất cả reports
                const totalMaterials = reps.reduce(
                  (sum: number, r: any) => sum + (r.materials?.length || 1),
                  0,
                );

                return reps.map((r: any, i: number) => {
                  const mats = r.materials?.length
                    ? r.materials
                    : [{ material: "" }];

                  return mats.map((m: any, mIdx: number) => (
                    <React.Fragment key={`${item._id}-${i}-${mIdx}`}>
                      {/* --- Dòng 1: hiển thị tổng --- */}
                      <TableRow>
                        {/* render STT, Người nhận lệnh... */}
                        {i === 0 && mIdx === 0 && (
                          <>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              align="center"
                            >
                              {idx + 1}
                            </TableCell>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              sx={{ whiteSpace: "pre-line", minWidth: 200 }}
                            >
                              {(item.assignedTo || [])
                                .map((u: any) => u?.fullName)
                                .join("\n")}
                            </TableCell>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              sx={{ whiteSpace: "pre-line", minWidth: 80 }}
                            >
                              {(item.assignedTo || [])
                                .map((u: any) => u?.salaryCode)
                                .join("\n")}
                            </TableCell>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              sx={{ whiteSpace: "pre-line", minWidth: 80 }}
                            >
                              {(item.device || [])
                                .map((i: any) => i)
                                .join("\n") || ""}
                            </TableCell>
                          </>
                        )}

                        {/* code máy xúc + điểm đổ tải */}
                        {mIdx === 0 && (
                          <TableCell
                            rowSpan={mats.length * 2}
                            sx={{ minWidth: 100 }}
                          >
                            {r.excavator || ""}
                          </TableCell>
                        )}
                        {mIdx === 0 && (
                          <TableCell
                            rowSpan={mats.length * 2}
                            sx={{ minWidth: 100 }}
                          >
                            {r.toLocation || ""}
                          </TableCell>
                        )}

                        {/* Vật liệu */}
                        <TableCell
                          rowSpan={2}
                          sx={{ minWidth: 80 }}
                          align="center"
                        >
                          {m.material?.name || ""}
                        </TableCell>

                        {/* --- Cung độ (tổng) --- */}
                        <TableCell align="center" sx={{ minWidth: 80 }}>
                          {(m.totalDistance || 0).toFixed(1) || 0}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ minWidth: 80 }}
                          rowSpan={2}
                        ></TableCell>
                        <TableCell
                          align="center"
                          sx={{ minWidth: 80 }}
                          rowSpan={2}
                        ></TableCell>
                        <TableCell align="center" sx={{ minWidth: 80 }}>
                          {m.count || 0}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ minWidth: 80 }}
                          rowSpan={2}
                        ></TableCell>
                        {i === 0 && mIdx === 0 && (
                          <>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              align="center"
                              sx={{ minWidth: 80, whiteSpace: "pre-line" }}
                            >
                              {(item?.fuelRemain || [])
                                .map((i: any) => i)
                                .join("\n")}
                            </TableCell>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              align="center"
                              sx={{ minWidth: 80, whiteSpace: "pre-line" }}
                            >
                              {(item?.fuelReceived || [])
                                .map((i: any) => i)
                                .join("\n")}
                            </TableCell>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              align="center"
                              sx={{ minWidth: 80, whiteSpace: "pre-line" }}
                            >
                              {(item?.fuelRemainEnd || [])
                                .map((i: any) => i)
                                .join("\n")}
                            </TableCell>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              align="center"
                              sx={{ minWidth: 80, whiteSpace: "pre-line" }}
                            >
                              {(item?.fuelRemainUsed || [])
                                .map((i: any) => i)
                                .join("\n")}
                            </TableCell>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              align="center"
                              sx={{ whiteSpace: "pre-line", minWidth: 80 }}
                            ></TableCell>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              align="center"
                              sx={{ whiteSpace: "pre-line", minWidth: 80 }}
                            ></TableCell>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              align="center"
                              sx={{ whiteSpace: "pre-line", minWidth: 80 }}
                            ></TableCell>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              align="center"
                              sx={{ whiteSpace: "pre-line", minWidth: 80 }}
                            >
                              {(item?.travelHours || [])
                                .map((i: any) => i)
                                .join("\n")}
                            </TableCell>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              align="center"
                              sx={{ whiteSpace: "pre-line", minWidth: 80 }}
                            ></TableCell>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              align="center"
                              sx={{ whiteSpace: "pre-line", minWidth: 80 }}
                            ></TableCell>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              align="center"
                              sx={{ whiteSpace: "pre-line", minWidth: 80 }}
                            ></TableCell>
                            <TableCell
                              rowSpan={totalMaterials * 2}
                              align="center"
                              sx={{ whiteSpace: "pre-line", minWidth: 80 }}
                            ></TableCell>
                          </>
                        )}
                      </TableRow>

                      {/* --- Dòng 2: hiển thị danh sách cung độ --- */}
                      <TableRow>
                        <TableCell
                          sx={{ whiteSpace: "pre-line" }}
                          align="center"
                        >
                          {(m.distances || [])
                            .map((d: number, idx: number) => `${d}`)
                            .join("\n")}
                        </TableCell>
                        <TableCell
                          sx={{ whiteSpace: "pre-line" }}
                          align="center"
                        >
                          {(m.distances || [])
                            .map(
                              (d: number, idx: number) =>
                                `${m.times[idx] ? new Date(m.times[idx]).toLocaleTimeString("vi-VN") : ""}`,
                            )
                            .join("\n")}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ));
                });
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {signatureUrl && (
          <Box mt={2} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <img
              src={signatureUrl}
              alt="Chữ ký"
              style={{ maxWidth: 200, maxHeight: 100 }}
            />
          </Box>
        )}
      </Paper>
    </Grid>
  );
}
