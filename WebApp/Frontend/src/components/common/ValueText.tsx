import { Typography } from "@mui/material";

export const ValueText: React.FC<{
  children: React.ReactNode;
  color?: string;
  italic?: boolean;
}> = ({ children, color = "#fff", italic = false }) => (
  <Typography
    variant="body2"
    sx={{
      color: color,
      fontWeight: italic ? 500 : 700,
      whiteSpace: "nowrap",
      fontStyle: italic ? "italic" : "normal",
    }}
  >
    {children || "—"}
  </Typography>
);
