import { Box, IconButton } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

export default function BlinkButton({ color }: { color: string }) {
  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <IconButton
        sx={{
          animation: "pulseScale 1s infinite",
          color: color,
          padding: 0,
        }}
      >
        <FiberManualRecordIcon fontSize="small" />
        <style>
          {`
                      @keyframes pulseScale {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.3); }
                        100% { transform: scale(1); }
                      }
                    `}
        </style>
      </IconButton>
    </Box>
  );
}
