import React from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";

export default function AssignmentToReport() {
  return (
    <Box display="flex" justifyContent="center" bgcolor="#f5f5f5" padding={4}>
      <Paper
        elevation={3}
        sx={{
          width: "210mm",
          minHeight: "297mm",
          p: 5,
          boxSizing: "border-box",
          fontFamily: 'Times New Roman',
          fontSize: "14px",
          lineHeight: 1.45,
        }}
      >

        {/* DATE ROW */}
        <Typography mb={1}>
          Ca {'.'.repeat(35)} ngày {'.'.repeat(35)} tháng {'.'.repeat(35)} năm {'.'.repeat(35)}
        </Typography>

        <Typography mb={1}>
          Người giao: {'.'.repeat(65)} Người nhận: {'.'.repeat(65)}
        </Typography>

        {/* SECTION I */}
        <Typography sx={{ fontWeight: 'bold', textDecoration: 'underline', fontStyle: 'italic' }} mb={1}>
          I. Hoạt động trong ca:
        </Typography>
        <Typography mb={1}>
          Tuyến hoạt động: {'.'.repeat(30)} Cung độ (km): {'.'.repeat(30)} Chở than/đất: {'.'.repeat(30)}
        </Typography>

        <Typography mb={1}>
          Số chuyến theo định mức: {'.'.repeat(25)} Số chuyến thực tế: {'.'.repeat(25)} Giờ hoạt động: {'.'.repeat(20)}
        </Typography>

        <Typography mb={1}>
          Giờ công tiếp sau KT: {'.'.repeat(40)}Giờ công tiếp sau bảo dưỡng cấp 1:{'.'.repeat(40)}
        </Typography>

        <Typography mb={1}>Những hư hỏng xảy ra trong ca:{'.'.repeat(120)}</Typography>
        <Typography mb={1}>{'.'.repeat(170)}</Typography>
        <Typography mb={2}>{'.'.repeat(170)}</Typography>

        {/* SECTION II */}
        <Typography mb={1}>
          <b style={{ textDecoration: 'underline', fontStyle: 'italic' }}>II. Những công việc đã thực hiện trong ca </b>(KT, bảo dưỡng, sửa chữa):
        </Typography>
        <Typography mb={1}>{'.'.repeat(170)}</Typography>
        <Typography mb={3}>{'.'.repeat(170)}</Typography>

        {/* SECTION III */}
        <Typography mb={1}>
          <b style={{ textDecoration: 'underline', fontStyle: 'italic' }}>III. Nhiên liệu:</b>Tồn đầu ca: {'.'.repeat(25)} Lĩnh trong ca: {'.'.repeat(25)} Tồn cuối ca: {'.'.repeat(30)}
        </Typography>

        <Typography mb={1}>
          Mức tiêu hao: Theo định mức {'.'.repeat(30)} Thực tế {'.'.repeat(30)} Quá mức {'.'.repeat(30)}
        </Typography>

        <Typography mb={3}>
          Bổ sung dầu nhờn: Loại dầu {'.'.repeat(33)} Vị trí {'.'.repeat(33)} Số lượng {'.'.repeat(33)}
        </Typography>

        {/* SECTION IV */}
        <Typography sx={{ fontWeight: 'bold', textDecoration: 'underline', fontStyle: 'italic' }} mb={1}>
          IV. Tình trạng kỹ thuật xe khi giao lại cho ca sau:
        </Typography>

        {[
          "Động cơ:",
          "Hệ thống phanh:",
          "Hệ thống lái:",
          "Gương, đèn, còi, đồng hồ:",
          "Hệ thống truyền động:",
          "Hệ thống treo:",
          "Hệ thống nâng ben:",
          "Hệ thống điện:",
          "Ca bin, sắt xi:",
          "Bánh xe và lốp:",
          "Radio, máy điều hòa:",
          "Dụng cụ đồ nghề:",
          "GPS, niêm phong, kẹp chì:",
        ].map((item) => (
          <Typography mb={1} key={item} sx={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {item} {'.'.repeat(160)}
          </Typography>
        ))}

        {/* SIGNATURE 1 */}
        <Grid container justifyContent="space-between" mt={2} mb={6}>
          <Grid item textAlign="center">
            <Typography fontWeight="bold">NGƯỜI GIAO CA</Typography>
            <Typography>(Ký, ghi rõ họ tên)</Typography>
          </Grid>

          <Grid item textAlign="center">
            <Typography fontWeight="bold">NGƯỜI NHẬN CA</Typography>
            <Typography>(Ký, ghi rõ họ tên)</Typography>
          </Grid>
        </Grid>

        {/* SECTION V */}
        <Typography mb={1}>
          <b style={{ fontWeight: 'bold', textDecoration: 'underline', fontStyle: 'italic' }}>V. Người nhận ca kiểm tra KT xe đầu ca, xin lệnh hoạt động</b> {'.'.repeat(75)}
        </Typography>

        <Typography mb={1}>{'.'.repeat(180)}</Typography>
        <Typography mb={2}>{'.'.repeat(180)}</Typography>

        {/* SIGNATURE 2 */}
        <Grid container justifyContent="space-between" mt={2} mb={4}>
          <Grid item textAlign="center">
            <Typography fontWeight="bold">NGƯỜI NHẬN CA</Typography>
            <Typography>(Ký, ghi rõ họ tên)</Typography>
          </Grid>

          <Grid item textAlign="center">
            <Typography fontWeight="bold">NGƯỜI RA LỆNH HOẠT ĐỘNG</Typography>
            <Typography fontWeight="bold">CA TIẾP THEO</Typography>
            <Typography>(Ký, ghi rõ họ tên)</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
