import React, { ChangeEvent } from "react";
import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

interface AssetEbookCoverProps {
  asset: any;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
}

const CoverWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: "transparent",
});

const A4Paper = styled(Box)({
  width: "100%",
  maxWidth: "210mm",
  minHeight: "297mm",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#d46f9e", // Khôi phục màu gốc theo ý user
  padding: "15px",
  boxSizing: "border-box",
  fontFamily: '"Times New Roman", Times, serif',
  color: "#0e0e0e",
  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  position: "relative",
  margin: "0 auto",
});

const OuterBorder = styled(Box)({
  border: "3px solid #1a1a1a", // Viền ngoài đậm
  padding: "5px",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
});

const InnerBorder = styled(Box)({
  border: "1px solid #1a1a1a",
  flex: 1,
  boxSizing: "border-box",
  padding: "40px 20px",
  display: "flex",
  flexDirection: "column",
});

const HeaderText = styled(Typography)({
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: "18px",
  textAlign: "center",
  fontWeight: "bold",
  lineHeight: 1.5,
});

const TitleText = styled(Typography)({
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: "32px",
  fontWeight: "bold",
  textAlign: "center",
  marginTop: "80px",
  letterSpacing: "2px",
});

const SubTitleText = styled(Typography)({
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: "17px",
  fontStyle: "italic",
  textAlign: "center",
  marginTop: "15px",
  fontWeight: 500,
  color: "#026e42",
});

const ContentWrapper = styled(Box)({
  marginTop: "70px",
  marginBottom: "auto",
  display: "flex",
  flexDirection: "column",
  width: "100%",
  padding: "0 20px",
  boxSizing: "border-box",
});

const FieldRow = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  marginBottom: "20px",
  width: "100%",
});

const FieldLabel = styled(Typography)({
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: "17px",
  fontWeight: "bold",
  marginRight: "10px",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  minWidth: "190px", // Đảm bảo độ rộng cố định để căn đều các dòng chấm
});

const FieldValueWrapper = styled(Box)({
  flexGrow: 1,
  minHeight: "28px",
  marginLeft: "10px",
  position: "relative",
  backgroundImage:
    "linear-gradient(to right, #1a1a1a 30%, rgba(255,255,255,0) 0%)",
  backgroundPosition: "bottom",
  backgroundSize: "5px 2px",
  backgroundRepeat: "repeat-x",
  display: "flex",
  alignItems: "center",
  paddingBottom: "2px", // cách viền một xíu
});

// Giả lập màu mực bút bi xanh khi nhập tay

const ValueText = styled(Typography)({
  fontFamily: '"Times New Roman", Times, serif',
  fontStyle: "italic",
  fontSize: "17px",
  lineHeight: 1.5,
  wordBreak: "break-word",
  width: "100%",
});

const FooterText = styled(Typography)({
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: "16px",
  fontStyle: "italic",
  textAlign: "center",
  marginTop: "60px",
  marginBottom: "15px",
});

export default function AssetEbookCover({
  asset,
  onPageChange,
  currentPage = 1,
  totalPages = 4,
}: AssetEbookCoverProps) {
  return (
    <CoverWrapper>
      <A4Paper>
        <OuterBorder>
          <InnerBorder>
            {/* Phần Header */}
            <Box>
              <HeaderText>
                TẬP ĐOÀN CÔNG NGHIỆP THAN - KHOÁNG SẢN VIỆT NAM
              </HeaderText>
              <HeaderText>CÔNG TY CP THAN CAO SƠN - KTV</HeaderText>
            </Box>

            {/* Tiêu đề chính */}
            <Box>
              <TitleText>LÝ LỊCH PHƯƠNG TIỆN</TitleText>
            </Box>

            {/* Thông tin thiết bị */}
            <ContentWrapper>
              <FieldRow>
                <FieldLabel>Tên phương tiện :</FieldLabel>
                <FieldValueWrapper>
                  <ValueText>{asset?.name}</ValueText>
                </FieldValueWrapper>
              </FieldRow>

              <FieldRow>
                <FieldLabel>Biển số :</FieldLabel>
                <FieldValueWrapper>
                  <ValueText>{asset?.code}</ValueText>
                </FieldValueWrapper>
              </FieldRow>

              <FieldRow>
                <FieldLabel>Chủng loại :</FieldLabel>
                <FieldValueWrapper>
                  <ValueText>{asset?.material?.name}</ValueText>
                </FieldValueWrapper>
              </FieldRow>
            </ContentWrapper>

            {/* Footer */}
            <FooterText>Tháng ..... năm 201.....</FooterText>
          </InnerBorder>
        </OuterBorder>
      </A4Paper>
    </CoverWrapper>
  );
}
