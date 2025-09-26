import * as React from "react";
import { Paper, Box, Typography, RadioGroup, FormControlLabel, Radio } from "@mui/material";
import {
    ResponsiveChartContainer,
    LinePlot,
    ChartsXAxis,
    ChartsYAxis,
    ChartsLegend,
    ChartsTooltip,
    AreaPlot,
} from "@mui/x-charts";


export default function ResponsiveLineChartProduction({ dataset, selectedName, selectedKey }: { dataset: any, selectedName: string, selectedKey: string }) {

    return (
        <Box sx={{ width: "100%", height: '100%', display: 'flex', alignItems: 'center' }}>

            <ResponsiveChartContainer
                height={350}
                dataset={dataset}
                xAxis={[{ dataKey: "date", scaleType: "point" }]}
                yAxis={[{ min: 0 }]}  // 👈 luôn bắt đầu từ 0
                series={[
                    { type: "line", dataKey: `${selectedKey}_cum`, label: `${selectedName} (lũy kế)`, area: true },
                    { type: "line", dataKey: selectedKey, label: `${selectedName} (ngày)`, area: true },
                ]}
            >

                <AreaPlot // Sử dụng AreaPlot để tô màu vùng
                    series={[
                        {
                            dataKey: `${selectedKey}_cum`,
                            color: "rgba(196, 63, 63, 0.2)", // Làm mờ màu đỏ
                        },
                        {
                            dataKey: selectedKey,
                            color: "rgba(196, 63, 63, 0.2)", // Làm mờ màu xanh dương
                        },
                    ]}
                />
                <LinePlot />
                <ChartsXAxis />
                <ChartsYAxis />
                <ChartsTooltip />
                <ChartsLegend />
            </ResponsiveChartContainer>
        </Box>
    );
}
