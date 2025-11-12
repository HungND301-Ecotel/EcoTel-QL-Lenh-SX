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

export default function CarProductLandReport({
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
          totalM3: 0,
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
    ).map(([mainGroup, mainItems]) => {
      const subGroups = Object.entries(_.groupBy(mainItems, "subGroup")).map(
        ([subGroup, subItems]) => {
          const groupedByExcavator = _.groupBy(subItems, "excavator");

          const excavators = Object.entries(groupedByExcavator).map(
            ([code, items]) => {
              const row: any = {
                excavator: code,
                // tổng số (I+II+III…) của máy này cho nhóm hiện tại
                totalTrips: _.sumBy(items, "totalTrips"),
                totalM3: _.sumBy(items, "totalM3"),
                totalTkm: _.sumBy(items, "totalTkm"),
                // chi tiết theo material của device
                materials: {} as Record<string, any>,
              };

              items.forEach((i: any) => {
                row.materials[i.deviceMaterial] = {
                  totalTrips: i.totalTrips,
                  totalM3: i.totalM3,
                  totalTkm: i.totalTkm,
                };
              });

              return row;
            }
          );

          // --- Tổng cho SubGroup (Nhóm Máy xúc) ---
          const subGroupTotals = {
            totalTrips: _.sumBy(excavators, "totalTrips"),
            totalM3: _.sumBy(excavators, "totalM3"),
            totalTkm: _.sumBy(excavators, "totalTkm"),
            materials: headerColumns.reduce((acc, col) => {
              acc[col] = {
                totalTrips: _.sumBy(excavators, (e) => e.materials[col]?.totalTrips || 0),
                totalM3: _.sumBy(excavators, (e) => e.materials[col]?.totalM3 || 0),
                totalTkm: _.sumBy(excavators, (e) => e.materials[col]?.totalTkm || 0),
              };
              return acc;
            }, {} as Record<string, any>),
          };


          return { subGroup, excavators, subGroupTotals };
        }
      );

      // --- Tổng cho MainGroup (Nhóm Vật liệu) ---
      const mainGroupTotals = {
        totalTrips: _.sumBy(subGroups, (sg) => sg.subGroupTotals.totalTrips),
        totalM3: _.sumBy(subGroups, (sg) => sg.subGroupTotals.totalM3),
        totalTkm: _.sumBy(subGroups, (sg) => sg.subGroupTotals.totalTkm),
        materials: headerColumns.reduce((acc, col) => {
          acc[col] = {
            totalTrips: _.sumBy(subGroups, (sg) => sg.subGroupTotals.materials[col]?.totalTrips || 0),
            totalM3: _.sumBy(subGroups, (sg) => sg.subGroupTotals.materials[col]?.totalM3 || 0),
            totalTkm: _.sumBy(subGroups, (sg) => sg.subGroupTotals.materials[col]?.totalTkm || 0),
          };
          return acc;
        }, {} as Record<string, any>),
      };


      return { mainGroup, subGroups, mainGroupTotals };
    });

    // 🧩 tổng toàn bảng + tổng từng deviceMaterial (Giữ nguyên)
    const overallTotals = {
      totalTrips: _.sumBy(data, "totalTrips"),
      totalM3: _.sumBy(data, "totalM3"),
      totalTkm: _.sumBy(data, "totalTkm"),
      materialTotals: data.reduce((acc, group) => {
        acc[group.deviceMaterial] = {
          totalTrips: group.totalTrips,
          totalM3: group.totalM3,
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
        <Typography textAlign={'center'} mb={2} variant='h3' fontWeight={'bold'}>Báo cáo sản lượng vận chuyển đất đá</Typography>
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
                {["Chuyến", "M³", "Tkm"].map((l, i) => (
                  <TableCell key={i} sx={borderStyle}>
                    {l}
                  </TableCell>
                ))}
                {headerColumns.flatMap((col) =>
                  ["Chuyến", "M³", "Tkm"].map((l, i) => (
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
                <TableCell colSpan={2} sx={{...borderStyle,fontWeight:'bold'}}>
                  Tổng số
                </TableCell>
                <TableCell sx={{...borderStyle,fontWeight:'bold'}}>
                  {formatNumber(overallTotals.totalTrips)}
                </TableCell>
                <TableCell sx={{...borderStyle,fontWeight:'bold'}}>
                  {formatNumber(overallTotals.totalM3)}
                </TableCell>
                <TableCell sx={{...borderStyle,fontWeight:'bold'}}>
                  {formatNumber(overallTotals.totalTkm)}
                </TableCell>
                {headerColumns.flatMap((col) => {
                  const totals = overallTotals.materialTotals[col] || {};
                  return [
                    <TableCell key={`${col}-t1`} sx={{...borderStyle,fontWeight:'bold'}}>
                      {formatNumber(totals.totalTrips)}
                    </TableCell>,
                    <TableCell key={`${col}-t2`} sx={{...borderStyle,fontWeight:'bold'}}>
                      {formatNumber(totals.totalM3)}
                    </TableCell>,
                    <TableCell key={`${col}-t3`} sx={{...borderStyle,fontWeight:'bold'}}>
                      {formatNumber(totals.totalTkm)}
                    </TableCell>,
                  ];
                })}
              </TableRow>

              {/* Nhóm theo mainGroup (vật liệu) -> subGroup (material của excavator) */}
              {hierarchy.map((main, mainIdx) => (
                <React.Fragment key={mainIdx}>
                  {/* dòng I, II, III... (Tiêu đề nhóm vật liệu) */}
                  <TableRow>
                    <TableCell colSpan={2} sx={{ ...borderStyle, textAlign: "left", fontWeight: "bold", }}>
                      {main.mainGroup}
                    </TableCell>

                    <TableCell sx={{...borderStyle,fontWeight:'bold'}}>
                      {formatNumber(main.mainGroupTotals.totalTrips)}
                    </TableCell>
                    <TableCell sx={{...borderStyle,fontWeight:'bold'}}>
                      {formatNumber(main.mainGroupTotals.totalM3)}
                    </TableCell>
                    <TableCell sx={{...borderStyle,fontWeight:'bold'}}>
                      {formatNumber(main.mainGroupTotals.totalTkm)}
                    </TableCell>
                    {headerColumns.flatMap((col) => {
                      const totals = main.mainGroupTotals.materials[col] || {};
                      return [
                        <TableCell key={`${col}-t1`} sx={{...borderStyle,fontWeight:'bold'}}>
                          {formatNumber(totals.totalTrips)}
                        </TableCell>,
                        <TableCell key={`${col}-t2`} sx={{...borderStyle,fontWeight:'bold'}}>
                          {formatNumber(totals.totalM3)}
                        </TableCell>,
                        <TableCell key={`${col}-t3`} sx={{...borderStyle,fontWeight:'bold'}}>
                          {formatNumber(totals.totalTkm)}
                        </TableCell>,
                      ];
                    })}
                  </TableRow>

                  {main.subGroups.map((sub, subIdx) => (
                    <React.Fragment key={subIdx}>
                      {/* dòng 1, 2, 3... (Tiêu đề nhóm máy xúc) */}
                      <TableRow>
                        <TableCell sx={borderStyle}>{subIdx + 1}</TableCell>
                        <TableCell
                          sx={{ ...borderStyle, textAlign: "left", fontStyle: "italic", fontWeight: "bold" }}
                        >
                          Máy xúc {sub.subGroup}
                        </TableCell>
                        <TableCell sx={{...borderStyle,fontWeight:'bold'}}>
                          {formatNumber(sub.subGroupTotals.totalTrips)}
                        </TableCell>
                        <TableCell sx={{...borderStyle,fontWeight:'bold'}}>
                          {formatNumber(sub.subGroupTotals.totalM3)}
                        </TableCell>
                        <TableCell sx={{...borderStyle,fontWeight:'bold'}}>
                          {formatNumber(sub.subGroupTotals.totalTkm)}
                        </TableCell>
                        {headerColumns.flatMap((col) => {
                          const totals = sub.subGroupTotals.materials[col] || {};
                          return [
                            <TableCell key={`${col}-t1`} sx={{...borderStyle,fontWeight:'bold'}}>
                              {formatNumber(totals.totalTrips)}
                            </TableCell>,
                            <TableCell key={`${col}-t2`} sx={{...borderStyle,fontWeight:'bold'}}>
                              {formatNumber(totals.totalM3)}
                            </TableCell>,
                            <TableCell key={`${col}-t3`} sx={{...borderStyle,fontWeight:'bold'}}>
                              {formatNumber(totals.totalTkm)}
                            </TableCell>,
                          ];
                        })}
                      </TableRow>

                      {/* chi tiết từng máy xúc trong nhóm đó (Giữ nguyên) */}
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
                              {formatNumber(row.totalM3)}
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
                                  {formatNumber(materialData.totalM3)}
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
