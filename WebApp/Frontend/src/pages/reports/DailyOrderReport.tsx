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
import { format } from "date-fns";
import dayjs from "dayjs";
import React from "react";
import { Department, Shift } from "../../types";
import { userAtom } from "../../atoms/userAtoms";
import { useAtom } from "jotai";

export default function DailyOrderReport({
  data,
  signatureUrl,
  maxTrip,
  materials,
  startDate,
  endDate,
  shifts,
  department,
  day,
}: {
  data: any[];
  signatureUrl: string | null;
  maxTrip: number;
  materials: any[];
  startDate: dayjs.Dayjs | null;
  endDate: dayjs.Dayjs | null;
  shifts: Shift[];
  department: Department | null;
  day: dayjs.Dayjs | null;
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
          BÁO CÁO NHẬT LỆNH QUẢN ĐỐC
        </Typography>
        <Typography>
          Đơn vị: {department ? department.code : user?.department?.code}
        </Typography>
        <Typography>Ngày: {day?.format("DD-MM-YYYY")}</Typography>
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
                <TableCell align="center" width={150}>
                  Tên tổ sản xuất
                </TableCell>
                <TableCell align="center" width={150}>
                  Tên-Số hiệu thiết bị
                </TableCell>
                <TableCell align="center" width={150}>
                  Khu vực
                </TableCell>
                <TableCell align="center" width={150}>
                  Nơi chất tải
                </TableCell>
                <TableCell align="center" width={150}>
                  Tên hàng
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 200 }}>
                  Nội dung công việc
                </TableCell>
                <TableCell align="center" width={150}>
                  Sản lượng theo định mức
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 200 }}>
                  Dự báo nguy cơ mất AT
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 200 }}>
                  Biện pháp an toàn
                </TableCell>
                <TableCell align="center" width={150}>
                  Nhóm trưởng
                </TableCell>
                <TableCell align="center" width={150}>
                  Họ tên - Bậc lương
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item: any) => (
                <TableRow>
                  <TableCell>{item?.department?.name || ""}</TableCell>
                  <TableCell>
                    {item?.device.map((i: any) => i.code || "").join(",     ")}
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell>{item?.workContent || ""}</TableCell>
                  <TableCell></TableCell>
                  <TableCell>
                    <div
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight:
                          item?.safetyMeasure || item?.safetyMeasureSpecific
                            ? "unset"
                            : "1.5em",
                      }}
                    >
                      {item?.risk || ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight:
                          item?.safetyMeasure || item?.safetyMeasureSpecific
                            ? "unset"
                            : "1.5em",
                      }}
                    >
                      {(item?.safetyMeasure || "") +
                        " " +
                        (item?.safetyMeasureSpecific || "")}
                    </div>
                  </TableCell>
                  <TableCell>{item?.assignedTo?.fullName || ""}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
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
