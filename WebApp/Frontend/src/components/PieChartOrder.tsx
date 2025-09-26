import { Typography } from '@mui/material';
import { ChartsLegend, ChartsTooltip, PieChart, PiePlot, ResponsiveChartContainer } from '@mui/x-charts'
import React from 'react'

export default function PieChartOrder({ data }: { data: any }) {

    const chartData = [
        { label: 'Chưa nhận lệnh', value: data['pending']?.day || 0, color: 'grey' },
        { label: 'Đã nhận lệnh', value: data['in_progress']?.day || 0, color: 'green' },
        { label: 'Đã hoàn thành', value: data['completed']?.day || 0, color: 'red' },
        { label: 'Lỗi', value: data['warning']?.day || 0, color: 'orange' },
        { label: 'Đã hủy', value: data['cancel']?.day || 0, color: 'purple' },
    ];

    // Tính tổng giá trị của tất cả các mục dữ liệu
    const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', }}>
            {totalValue === 0 && <Typography variant="h6" style={{
                position: 'absolute',
                zIndex: 10,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
            }}>Không có dữ liệu</Typography>}
            <ResponsiveChartContainer
                series={[{
                    type: 'pie', innerRadius: 50, outerRadius: 100,
                    data: chartData
                }]}
            >
                <PiePlot />
                <ChartsTooltip trigger="item" />
                <ChartsLegend position={{ vertical: 'bottom', horizontal: 'middle' }} />
            </ResponsiveChartContainer>
        </div>
    )
}
