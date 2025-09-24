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

const rawData = [
    { date: "2025-09-01", SLD: 100, SLT: 200, MKS: 50, KLD: 120, KLT: 300, TTK: 90, CD: 70 },
    { date: "2025-09-02", SLD: 80, SLT: 220, MKS: 60, KLD: 110, KLT: 280, TTK: 100, CD: 60 },
    { date: "2025-09-03", SLD: 120, SLT: 210, MKS: 55, KLD: 130, KLT: 320, TTK: 95, CD: 65 },
];

const productions = [
    { key: "SLD", name: "Sản lượng đất thực hiện (m³)" },
    { key: "SLT", name: "Sản lượng than nguyên khai (m³)" },
    { key: "MKS", name: "Mét khoan sâu (m³)" },
    { key: "KLD", name: "Khối lượng vận chuyển đất (Tkm)" },
    { key: "KLT", name: "Khối lượng vận chuyển than" },
    { key: "TTK", name: "Thể tích khối thực hiện" },
    { key: "CD", name: "Cung độ thực hiện" },
];

function transformData(data: any[]) {
    const keys = productions.map(p => p.key);
    return data.map((row, idx) => {
        const newRow: any = { ...row };
        keys.forEach(k => {
            const prev = idx > 0 ? data.slice(0, idx + 1).reduce((s, r) => s + (r[k] || 0), 0) : row[k];
            newRow[`${k}_cum`] = prev;
        });
        return newRow;
    });
}

const dataset = transformData(rawData);

export default function ResponsiveLineChartProduction() {
    const [selectedKey, setSelectedKey] = React.useState("SLD");
    const selectedName = productions.find(p => p.key === selectedKey)?.name || selectedKey;

    return (
        <Box sx={{ width: "100%", height: '100%' }}>
            {/* Chọn loại sản lượng */}
            <RadioGroup
                row
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                sx={{ mb: 2 }}
            >
                {productions.map((p) => (
                    <FormControlLabel key={p.key} value={p.key} control={<Radio />} label={p.name} />
                ))}
            </RadioGroup>

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
                            color: "rgba(196, 63, 63, 0.2", // Làm mờ màu xanh dương
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
