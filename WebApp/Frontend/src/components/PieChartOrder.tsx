import { Typography, useMediaQuery, useTheme } from '@mui/material';
import { ChartsLegend, ChartsTooltip, PieChart, PiePlot, ResponsiveChartContainer } from '@mui/x-charts'
import React from 'react'

export default function PieChartOrder({ data }: { data: any }) {

    const theme = useTheme();

    const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

    // 2. Kiểm tra màn hình nhỏ (< md, tức là < 900px)
    const isSmallToMediumScreen = useMediaQuery(theme.breakpoints.down('md'));

    let responsiveMarkerSize;

    if (isLargeScreen) {
        // >= lg (1200px): size 12
        responsiveMarkerSize = 12;
    } else if (isSmallToMediumScreen) {
        // < md (dưới 900px): size 12
        responsiveMarkerSize = 12;
    } else {
        // Trường hợp còn lại: md (900px) đến < lg (1200px): size 8
        responsiveMarkerSize = 8;
    }

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
                height={200}
                series={[{
                    type: 'pie',
                    innerRadius: 30,
                    outerRadius: 60,
                    data: chartData
                }]}
            margin={{ top: -40, left: 0, right: 0, bottom: 0 }}
            >
                <PiePlot />
                <ChartsTooltip trigger="item" />
                <ChartsLegend position={{ vertical: 'bottom', horizontal: 'middle' }}
                    slotProps={{
                        legend: {
                            labelStyle: {
                                fontSize: responsiveMarkerSize,
                            },
                            itemMarkHeight: responsiveMarkerSize,
                            itemMarkWidth: responsiveMarkerSize,
                        }
                    }} />
            </ResponsiveChartContainer>
        </div>
    )
}
