import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Typography } from "@mui/material";

const RealTimeClock: React.FC = () => {
    const [time, setTime] = useState(dayjs());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(dayjs());
        }, 1000); // update mỗi giây

        return () => clearInterval(timer); // clear khi unmount
    }, []);

    return (
        <Typography
            variant="h5"
        >
            {time.format("DD/MM/YYYY HH:mm:ss")}
        </Typography>
    );
};

export default RealTimeClock;
