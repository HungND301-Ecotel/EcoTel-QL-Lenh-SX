import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Typography } from "@mui/material";

const RealTimeClock: React.FC = () => {
  const [time, setTime] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(dayjs());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Typography
      variant="h5"
      sx={{
        fontVariantNumeric: "tabular-nums",
        minWidth: 200,
      }}
    >
      {time.format("DD/MM/YYYY HH:mm:ss")}
    </Typography>
  );
};

export default RealTimeClock;
