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
import _ from "lodash";
import { Department } from "../../types";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import { userAtom } from "../../atoms/userAtoms";

const formatNumber = (num?: number) =>
  num ? num.toFixed(2).replace(/\.00$/, "") : "";

export default function CarProductCoalReport({
  data,
  signatureUrl,
  department,
  startDate,
  endDate,
  date,
}: {
  data: any[];
  signatureUrl: string | null;
  department: Department | null;
  startDate: dayjs.Dayjs | null,
  endDate: dayjs.Dayjs | null,
  date: dayjs.Dayjs | null;
}) {
  const [user] = useAtom(userAtom);
  const { headerColumns, hierarchy, overallTotals } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        headerColumns: [],
        hierarchy: [],
        overallTotals: {
          totalTrips: 0,
          totalTon: 0,
          totalTkm: 0,
          materialTotals: {},
        },
      };
    }

    // 🧩 header: material của device (deviceMaterial)
    const headerColumns = _.uniq(data.map((group) => group.deviceMaterial));

    // gom toàn bộ bản ghi máy xúc (từ tất cả deviceMaterial)
    const allExcavatorRecords = data.flatMap((group) =>
      (group.excavators || []).map((item: any) => ({
        ...item,
        deviceMaterial: group.deviceMaterial ?? item.deviceMaterial,
      }))
    );

    // 🧩 hierarchy: mainGroup (vật liệu) -> subGroup (material của excavator) -> excavator
    const hierarchy = Object.entries(
      _.groupBy(allExcavatorRecords, "mainGroup")
    ).map(([mainGroup, mainItems]) => ({
      mainGroup,
      subGroups: Object.entries(_.groupBy(mainItems, "subGroup")).map(
        ([subGroup, subItems]) => {
          const groupedByExcavator = _.groupBy(subItems, "excavator");

          const excavators = Object.entries(groupedByExcavator).map(
            ([code, items]) => {
              const row: any = {
                excavator: code,
                // tổng số (I+II+III…) của máy này cho nhóm hiện tại
                totalTrips: _.sumBy(items, "totalTrips"),
                totalTon: _.sumBy(items, "totalTon"),
                totalTkm: _.sumBy(items, "totalTkm"),
                // chi tiết theo material của device
                materials: {} as Record<string, any>,
              };

              items.forEach((i: any) => {
                row.materials[i.deviceMaterial] = {
                  totalTrips: i.totalTrips,
                  totalTon: i.totalTon,
                  totalTkm: i.totalTkm,
                };
              });

              return row;
            }
          );

          return { subGroup, excavators };
        }
      ),
    }));

    // 🧩 tổng toàn bảng + tổng từng deviceMaterial
    const overallTotals = {
      totalTrips: _.sumBy(data, "totalTrips"),
      totalTon: _.sumBy(data, "totalTon"),
      totalTkm: _.sumBy(data, "totalTkm"),
      materialTotals: data.reduce((acc, group) => {
        acc[group.deviceMaterial] = {
          totalTrips: group.totalTrips,
          totalTon: group.totalTon,
          totalTkm: group.totalTkm,
        };
        return acc;
      }, {} as Record<string, any>),
    };

    return { headerColumns, hierarchy, overallTotals };
  }, [data]);

  const borderStyle = {
    border: "1px solid #000",
    fontSize: 13,
    padding: 4,
    textAlign: "center",
  };

  const totalColSpan = 2 + 3 + headerColumns.length * 3; // TT + Máy xúc + 3 cột tổng + 3*cột vật liệu

  return (
    <Grid item xs={12}>
      <Paper sx={{ p: 1 }}>
        <i style={{ fontSize: 20 }}>CÔNG TY CỔ PHẦN THAN CAO SƠN-TKV</i>
        <Typography textAlign={'center'} mb={2} variant='h3' fontWeight={'bold'}>Báo cáo sản lượng vận chuyển than</Typography>
        <Typography>Đơn vị: {department ? department.code : user?.department?.code}</Typography>
        <Typography>Từ ngày: {startDate?.format('DD-MM-YYYY')}</Typography>
        <Typography>Đến ngày: {endDate?.format('DD-MM-YYYY')}</Typography>
        <TableContainer>
          <Table size="small" sx={{
            border: '1px solid black',
            '& td, & th': {
              border: '1px solid black',
              fontSize: 13,
              padding: '4px 8px',
            },
            '& td': {
              verticalAlign: 'middle',
            },
          }}>
            {/* ===== HEADER ===== */}
            <TableHead>
              <TableRow>
                <TableCell rowSpan={2} sx={borderStyle}>
                  TT
                </TableCell>
                <TableCell rowSpan={2} sx={borderStyle}>
                  Máy xúc
                </TableCell>
                <TableCell colSpan={3} sx={borderStyle}>
                  Tổng số
                </TableCell>
                {headerColumns.map((col) => (
                  <TableCell key={col} colSpan={3} sx={borderStyle}>
                    Loại xe {col /* material của device */}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                {["Chuyến", "Tấn", "Tkm"].map((l, i) => (
                  <TableCell key={i} sx={borderStyle}>
                    {l}
                  </TableCell>
                ))}
                {headerColumns.flatMap((col) =>
                  ["Chuyến", "Tấn", "Tkm"].map((l, i) => (
                    <TableCell key={`${col}-${i}`} sx={borderStyle}>
                      {l}
                    </TableCell>
                  ))
                )}
              </TableRow>
            </TableHead>

            {/* ===== BODY ===== */}
            <TableBody>
              {/* dòng tổng trên cùng */}
              <TableRow>
                <TableCell colSpan={2} sx={borderStyle}>
                  Tổng số
                </TableCell>
                <TableCell sx={borderStyle}>
                  {formatNumber(overallTotals.totalTrips)}
                </TableCell>
                <TableCell sx={borderStyle}>
                  {formatNumber(overallTotals.totalTon)}
                </TableCell>
                <TableCell sx={borderStyle}>
                  {formatNumber(overallTotals.totalTkm)}
                </TableCell>
                {headerColumns.flatMap((col) => {
                  const totals = overallTotals.materialTotals[col] || {};
                  return [
                    <TableCell key={`${col}-t1`} sx={borderStyle}>
                      {formatNumber(totals.totalTrips)}
                    </TableCell>,
                    <TableCell key={`${col}-t2`} sx={borderStyle}>
                      {formatNumber(totals.totalTon)}
                    </TableCell>,
                    <TableCell key={`${col}-t3`} sx={borderStyle}>
                      {formatNumber(totals.totalTkm)}
                    </TableCell>,
                  ];
                })}
              </TableRow>

              {/* Nhóm theo mainGroup (vật liệu) -> subGroup (material của excavator) */}
              {hierarchy.map((main, mainIdx) => (
                <React.Fragment key={mainIdx}>
                  {/* dòng I, II, III... */}
                  <TableRow>
                    <TableCell colSpan={totalColSpan} sx={{ ...borderStyle, textAlign: "left", fontWeight: "bold" }}>
                      {main.mainGroup}
                    </TableCell>
                  </TableRow>

                  {main.subGroups.map((sub, subIdx) => (
                    <React.Fragment key={subIdx}>
                      {/* dòng 1, 2, 3... (nhóm máy xúc) */}
                      <TableRow>
                        <TableCell sx={borderStyle}>{subIdx + 1}</TableCell>
                        <TableCell
                          colSpan={totalColSpan - 1}
                          sx={{ ...borderStyle, textAlign: "left", fontStyle: "italic" }}
                        >
                          Máy xúc {sub.subGroup}
                        </TableCell>
                      </TableRow>

                      {/* chi tiết từng máy xúc trong nhóm đó */}
                      {
                        sub.excavators.map((row, idx) => (
                          <TableRow key={`${sub.subGroup}-${row.excavator}`}>
                            <TableCell sx={borderStyle}></TableCell>
                            <TableCell sx={{ ...borderStyle, textAlign: "left" }}>
                              {row.excavator}
                            </TableCell>
                            <TableCell sx={borderStyle}>
                              {formatNumber(row.totalTrips)}
                            </TableCell>
                            <TableCell sx={borderStyle}>
                              {formatNumber(row.totalTon)}
                            </TableCell>
                            <TableCell sx={borderStyle}>
                              {formatNumber(row.totalTkm)}
                            </TableCell>
                            {headerColumns.flatMap((col) => {
                              const materialData = row.materials[col] || {};
                              return [
                                <TableCell key={`${col}-1`} sx={borderStyle}>
                                  {formatNumber(materialData.totalTrips)}
                                </TableCell>,
                                <TableCell key={`${col}-2`} sx={borderStyle}>
                                  {formatNumber(materialData.totalTon)}
                                </TableCell>,
                                <TableCell key={`${col}-3`} sx={borderStyle}>
                                  {formatNumber(materialData.totalTkm)}
                                </TableCell>,
                              ];
                            })}
                          </TableRow>
                        ))
                      }
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
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
      </Paper>
    </Grid>
  );
}
