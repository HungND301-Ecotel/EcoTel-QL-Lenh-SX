import { IconButton } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

export default function BlinkButton({ color }: { color: string }) {
    return (
        <IconButton
            sx={{
                animation: "pulseScale 1s infinite",
                color: color,
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
    );
}
