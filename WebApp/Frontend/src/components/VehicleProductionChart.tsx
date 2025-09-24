import React, { useState } from "react";
import ReactECharts from "echarts-for-react";

// ECharts (modular + type an toàn)
import * as echarts from "echarts/core";
import { BarChart, type BarSeriesOption } from "echarts/charts";
import {
    GridComponent,
    TooltipComponent,
    type GridComponentOption,
    type TooltipComponentOption,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { Autocomplete, Box, Dialog, DialogContent, DialogTitle, IconButton, TextField, Typography } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useAtom } from "jotai";
import { userAtom } from "../atoms/userAtoms";

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

type ECOption = echarts.ComposeOption<
    BarSeriesOption | GridComponentOption | TooltipComponentOption
>;

type Row = { vehicle: string; actual: number; target: number };

const data: Row[] = [
    { vehicle: "Xe 01", actual: 300, target: 200 },
    { vehicle: "Xe 02", actual: 700, target: 770 },
    { vehicle: "Xe 03", actual: 150, target: 140 },
    { vehicle: "Xe 04", actual: 400, target: 320 },
    { vehicle: "Xe 05", actual: 650, target: 720 },
    { vehicle: "Xe 06", actual: 450, target: 520 },

];

const niceMax = (n: number) => {
    if (n <= 10) return 10;
    const p = Math.pow(10, Math.floor(Math.log10(n)));
    for (const k of [1, 2, 5, 10]) if (n <= k * p) return k * p;
    return 10 * p;
};

export default function VehicleBulletVariance({
    open,
    setOpen,
    departments
}: {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    departments: any[]
}) {
    const [user] = useAtom(userAtom)
    const [department, setDepartment] = useState('');
    const [date, setDate] = useState<Dayjs | null>(dayjs());

    const cats = data.map(d => d.vehicle);
    const targets = data.map(d => d.target);
    const actuals = data.map(d => d.actual);

    const maxV = Math.max(...targets, ...actuals);
    const XMAX = niceMax(maxV);

    // Precompute delta & %
    const deltas = data.map(d => d.actual - d.target);
    const pcts = data.map(d => (d.target ? (d.actual - d.target) / d.target * 100 : 0));

    const fmt = (v: number) => (Number.isFinite(v) ? v.toLocaleString("vi-VN") : "");
    const fmtPct = (v: number) => (Number.isFinite(v) ? `${v >= 0 ? "+" : ""}${v.toFixed(1)}%` : "");

    const option: ECOption = {
        grid: { left: 110, right: 20, top: 16, bottom: 16 },
        tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            valueFormatter: (val) => `${fmt(Number(val))}`,
        },
        yAxis: {
            type: "category",
            inverse: true,
            data: cats,
            axisTick: { show: false },
            axisLine: { show: false },
        },
        xAxis: {
            type: "value",
            min: 0,
            max: XMAX,
            axisLabel: { show: false },
            splitLine: { show: true },
        },
        series: [
            // Nền Target (to hơn, màu xám)
            {
                name: "Target",
                type: "bar",
                data: targets,
                barWidth: 18,
                itemStyle: { color: "#e0e0e0" },
                emphasis: { disabled: true },
                // để Actual đè lên chính xác
                barGap: "-100%",
                z: 1,
                label: {
                    show: false,
                },
            },
            // Actual (mảnh hơn, tô màu theo over/under), kèm nhãn ±Delta (±%)
            {
                name: "Actual",
                type: "bar",
                data: actuals,
                barWidth: 12,
                z: 2,
                itemStyle: {
                    color: (p) => (actuals[p.dataIndex] >= targets[p.dataIndex] ? "#4caf50" : "#f44336"),
                },
                label: {
                    show: true,
                    position: "right",
                    distance: 6,
                    rich: {
                        pos: { color: "#2e7d32", fontWeight: 600 },
                        neg: { color: "#c62828", fontWeight: 600 },
                    },
                    formatter: (p: any) => {
                        const i = p.dataIndex;
                        const act = data[i].actual, tar = data[i].target;
                        const delta = act - tar;
                        const pct = tar ? (delta / tar) * 100 : 0;
                        const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
                        const abs = Math.abs(delta);
                        const text = `${act.toLocaleString("vi-VN")} | ${sign}${abs.toLocaleString("vi-VN")} (${(pct >= 0 ? "+" : "")}${pct.toFixed(1)}%)`;
                        return delta >= 0 ? `{pos|${text}}` : `{neg|${text}}`;
                    },
                }
            },
        ],
    };

    const handleClose = () => {
        setOpen(false)
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                        p: 2
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {(user?.role === "admin" || user?.role === "dispatcher") && <Autocomplete
                            size="small"
                            options={departments}
                            getOptionLabel={(option: any) =>
                                option.code || ''
                            }
                            value={departments.find((p: any) => p._id === department) || null}
                            onChange={(event, newValue) => {
                                setDepartment(newValue?._id || '');
                            }}
                            sx={{ width: 200 }}
                            renderInput={(params) => <TextField {...params} label="Đơn vị" />}
                        />}
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                inputFormat="DD/MM/YYYY"
                                label="Ngày"
                                value={date}
                                onChange={(newValue) => setDate(newValue)}
                                renderInput={(params) => <TextField {...params} size="small" sx={{ width: 200 }} />}
                            />
                        </LocalizationProvider>
                    </Box>
                </Box>
                <Typography align="center">Thống kê sản lượng & định mức theo thiết bị</Typography>
            </DialogTitle>
            <DialogContent>
                <ReactECharts echarts={echarts} option={option} style={{ height: 52 * data.length + 40, width: "100%" }} />;
            </DialogContent>
        </Dialog>
    )
}
