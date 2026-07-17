import { SxProps, Theme, Typography } from "@mui/material";

export const Label: React.FC<{
  children: React.ReactNode;
  width?: number;
  align?: "left" | "right" | "center";
  sx?: SxProps<Theme>;
  white?: boolean;
}> = ({ children, width, align = "left", sx, white }) => (
  <Typography
    variant="body2"
    sx={{
      color: white ? "#fff" : "text.primary",
      fontWeight: 600,
      whiteSpace: "nowrap",
      width: width,
      minWidth: width,
      textAlign: align,
      mr: 1,
      ...sx,
    }}
  >
    {children}
  </Typography>
);
