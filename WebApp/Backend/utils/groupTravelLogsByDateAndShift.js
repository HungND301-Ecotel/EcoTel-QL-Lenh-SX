export const groupTravelLogsByDateAndShift = (travelLogs = []) => {
    const grouped = {};

    for (const log of travelLogs) {
        // 🛡️ kiểm tra workingDate hợp lệ
        let dateKey = 'Không xác định ngày';
        if (log.workingDate) {
            const d = new Date(log.workingDate);
            if (!isNaN(d)) {
                dateKey = d.toISOString().split('T')[0]; // YYYY-MM-DD
            }
        }

        const shiftKey = log.shift?.name || log.shift || 'Chưa rõ ca';

        if (!grouped[dateKey]) grouped[dateKey] = {};
        if (!grouped[dateKey][shiftKey]) grouped[dateKey][shiftKey] = [];

        grouped[dateKey][shiftKey].push(log);
    }

    // Chuyển object → array cho dễ dùng ở frontend
    const result = Object.entries(grouped).map(([date, shifts]) => ({
        workingDate: date,
        shifts: Object.entries(shifts).map(([shift, items]) => ({
            shift,
            records: items,
        })),
    }));

    return result;
};
