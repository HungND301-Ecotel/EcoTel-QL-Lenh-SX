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
import DeviceService from "../services/deviceService";
import { useQuery } from "@tanstack/react-query";

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

type ECOption = echarts.ComposeOption<
    BarSeriesOption | GridComponentOption | TooltipComponentOption
>;

type Row = { vehicle: string; actual: number; target: number };
const DUMMY_TARGET_MAX = 800;

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

    const { data: allDevices = [] } = useQuery({
        queryKey: ['allDevices', department],
        queryFn: () => DeviceService.getAll({ department: department }),
    });

    const mapDeviceData = (devices: any[]): Row[] => {
        // Nếu không có thiết bị, trả về mảng rỗng
        if (devices.length === 0) return [];

        // Tạo dữ liệu giả định cho biểu đồ
        return devices.map((device, index) => {
            // Định mức (Target): Ngẫu nhiên trong khoảng 100-800
            const target = Math.floor(Math.random() * 700) + 100;
            // Sản lượng thực tế (Actual): Ngẫu nhiên gần target (± 20%)
            const actual = Math.floor(target * (1 + (Math.random() * 0.4 - 0.2)));

            return {
                // Sử dụng tên thiết bị hoặc code thiết bị thực tế
                vehicle: device.code || `Thiết bị ${index + 1}`,
                actual: actual,
                target: target,
            };
        });
    }

    const chartData: Row[] = mapDeviceData(allDevices);

    const cats = chartData.map(d => d.vehicle);
    const targets = chartData.map(d => d.target);
    const actuals = chartData.map(d => d.actual);

    const maxV = Math.max(...targets, ...actuals);
    const XMAX = niceMax(maxV);


    const fmt = (v: number) => (Number.isFinite(v) ? v.toLocaleString("vi-VN") : "");

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
                        const act = chartData[i].actual, tar = chartData[i].target;
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
                <ReactECharts echarts={echarts} option={option} style={{ height: 52 * chartData.length + 40, width: "100%" }} />;
            </DialogContent>
        </Dialog>
    )
}
