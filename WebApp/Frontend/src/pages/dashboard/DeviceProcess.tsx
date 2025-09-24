import { Box, LinearProgress, Typography } from "@mui/material";

export default function Deviceprocess({ value, total, color }: { value: number; total: number; color: string }) {
    const percent = total > 0 ? (value / total) * 100 : 0;
    return (
        <Box sx={{ width: "100%", display: 'flex', justifyContent: 'center', position: "relative" }}>
            <LinearProgress
                variant="determinate"
                value={percent}
                sx={{
                    height: 28,
                    width: 100,
                    borderRadius: 1,
                    border: `1px solid ${color}`,
                    backgroundColor: 'white',
                    [`& .MuiLinearProgress-bar`]: {
                        backgroundColor: color,
                    },
                }}
            />
            <Typography
                variant="body2"
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    textAlign: "center",
                    lineHeight: "28px",
                    fontWeight: "bold",
                }}
            >
                {value.toLocaleString()}
            </Typography>
        </Box>
    );
}
