// Ưu tiên fromLocation, nếu không có thì dùng excavator làm "điểm nhận tải"
const pickFrom = (r) => r?.fromLocation || r?.excavator || null;

// Lấy _id, nếu thiếu thì tạo fallback riêng theo từng bản ghi để không gộp nhầm
const getId = (obj, fallback) => (obj && obj._id) ? obj._id : fallback;

const getProductGroupKey = (r) => {
    const deviceId = getId(r?.device, `device-unknown`);
    const from = pickFrom(r);
    const fromId = getId(from, `from-unknown`);
    const toId = getId(r?.toLocation, `to-unknown`);
    const matId = getId(r?.material, `mat-unknown`);
    return `device:${deviceId}__from:${fromId}__to:${toId}__mat:${matId}`;
};

function groupReportsForProduct(reports = []) {
    const map = new Map(); // key -> { from, to, material, quantity, workingMinutes }

    for (const r of reports) {
        const key = getProductGroupKey(r);
        if (!map.has(key)) {
            map.set(key, {
                device: r.device || null,
                from: pickFrom(r),
                to: r.toLocation || null,
                material: r.material || null,
                quantity: 0,
                workingMinutes: 0,
            });
        }
        const g = map.get(key);
        g.quantity += Number(r?.quantity || 0);
        g.workingMinutes += Number((r?.workingMinutes ?? r?.workingMinute) || 0);
    }

    return Array.from(map.values());
}

const getExcavatorGroupKey = (r) => {
    const from = pickFrom(r);
    const fromId = getId(from, `from-unknown`);
    const toId = getId(r?.toLocation, `to-unknown`);
    return `from:${fromId}__to:${toId}`;
};

function groupReportsByExcavator(reports = []) {
    const map = new Map();

    for (const r of reports) {
        const key = getExcavatorGroupKey(r);
        if (!map.has(key)) {
            map.set(key, {
                from: pickFrom(r),
                to: r.toLocation || null,
                quantity: 0,
                workingMinutes: 0,
            });
        }
        const g = map.get(key);
        g.quantity += Number(r?.quantity || 0);
        g.workingMinutes += Number((r?.workingMinutes ?? r?.workingMinute) || 0);
    }

    return Array.from(map.values());
}

function groupTripsVehicle(trips) {
    const groups = {};

    trips.forEach(t => {
        const key = `${t.excavator}-${t.toLocation}`;
        if (!groups[key]) {
            groups[key] = {
                excavator: t.excavator,
                location: t.toLocation,
                materials: []
            };
        }
        groups[key].materials.push({
            material: t.material,
            quantity: t.quantity,
            times: t.quantityUpdateTimes
        });
    });

    return Object.values(groups);
}


module.exports = {
    groupReportsByExcavator,
    groupReportsForProduct,
    groupTripsVehicle
};
