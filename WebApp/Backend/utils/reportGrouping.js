const TravelLog = require('../models/TravelLog')
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

function groupExcavator(trips) {
    const groups = {};

    trips.forEach(t => {
        const key = `${t.device}`;
        if (!groups[key]) {
            groups[key] = {
                device: t.device,
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
function groupTripsExcavator(trips) {
    const groups = {};

    trips.forEach(t => {
        const key = `${t.device}`;
        if (!groups[key]) {
            groups[key] = {
                device: t.device,
                trips: [],
                summary: {},
                totalTrips: 0
            };
        }
        const times = Array.isArray(t.quantityUpdateTimes)
            ? t.quantityUpdateTimes
            : [t.quantityUpdateTimes];
        times.forEach((time) => {
            groups[key].trips.push({
                material: t.material,
                time: time
            });
        });
        if (!groups[key].summary[t.material.name]) {
            groups[key].summary[t.material.name] = 0;
        }
        groups[key].summary[t.material.name] += times.length;

        groups[key].totalTrips += times.length;
    });

    Object.values(groups).forEach((g) => {
        g.trips.sort((a, b) => new Date(a.time) - new Date(b.time));
    });

    return Object.values(groups);
}

// nhóm báo chuyến ô tô
async function groupTripsCar(trips) {
    const groups = {};

    for (const t of trips) {
        const key = `${t.excavator}-${t.toLocation}`;
        if (!groups[key]) {
            groups[key] = {
                excavator: t.excavator,
                toLocation: t.toLocation,
                trips: [],
                summary: {},
                totalTrips: 0,
                totalDistance: 0
            };
        }
        const times = Array.isArray(t.quantityUpdateTimes)
            ? t.quantityUpdateTimes
            : [t.quantityUpdateTimes];
        for (const time of times) {
            const travelLog = await TravelLog.findOne({
                excavator: t.excavator,        // lọc theo máy xúc
                location: t.toLocation,       // lọc theo điểm đổ tải
                startTime: { $lte: time },    // bắt đầu <= time
                endTime: { $gte: time }       // kết thúc >= time
            }).lean();

            const distance = travelLog ? travelLog.distance : 0
            groups[key].trips.push({
                material: t.material,
                time,
                distance
            });
            if (!groups[key].summary[t.material.name]) {
                groups[key].summary[t.material.name] = { count: 0, distance: 0 }
            }
            groups[key].summary[t.material.name].count += 1;
            groups[key].summary[t.material.name].distance += distance;


            groups[key].totalTrips += 1;
            groups[key].totalDistance += distance;
        }

    };

    Object.values(groups).forEach((g) => {
        g.trips.sort((a, b) => new Date(a.time) - new Date(b.time));
    });

    return Object.values(groups);
}

// nhóm tổng hợp ô tô
async function groupCar(trips) {
    const groups = {};

    for (const t of trips) {
        const key = `${t.excavator}-${t.toLocation}`;
        if (!groups[key]) {
            groups[key] = {
                excavator: t.excavator,
                toLocation: t.toLocation,
                materials: {},   // thay vì trips
            };
        }

        const times = Array.isArray(t.quantityUpdateTimes)
            ? t.quantityUpdateTimes
            : [t.quantityUpdateTimes];

        for (const time of times) {
            const travelLog = await TravelLog.findOne({
                excavator: t.excavator,
                location: t.toLocation,
                startTime: { $lte: time },
                endTime: { $gte: time }
            }).lean();

            const distance = travelLog ? travelLog.distance : 0;

            if (!groups[key].materials[t.material.name]) {
                groups[key].materials[t.material.name] = {
                    material: t.material,
                    times: [],        // danh sách thời gian
                    distances: [],    // danh sách cung độ theo index
                    count: 0,
                    totalDistance: 0
                };
            }

            groups[key].materials[t.material.name].times.push(time);
            groups[key].materials[t.material.name].distances.push(distance);
            groups[key].materials[t.material.name].count += 1;
            groups[key].materials[t.material.name].totalDistance += distance;

            groups[key].totalTrips += 1;
            groups[key].totalDistance += distance;
        }
    }

    // sort times cho từng material
    Object.values(groups).forEach((g) => {
        Object.values(g.materials).forEach((m) => {
            const combined = m.times.map((time, i) => ({
                time,
                distance: m.distances[i]
            }));
            combined.sort((a, b) => new Date(a.time) - new Date(b.time));
            m.times = combined.map(c => c.time);
            m.distances = combined.map(c => c.distance);
        });
    });

    return Object.values(groups).map(g => ({
        ...g,
        materials: Object.values(g.materials) // trả về mảng cho FE
    }));
}


// nhóm người nhận, phụ máy
function getCombinedUsers(order) {
    const combined = [];

    if (order.assignedTo) {
        combined.push({
            fullName: order.assignedTo.fullName,
            salaryCode: order.assignedTo.salaryCode,
        });
    }

    if (order.assistants && order.assistants.length > 0) {
        order.assistants.forEach((ast) => {
            combined.push({
                fullName: `- ${ast.fullName}`,
                salaryCode: ast.salaryCode,
            });
        });
    }

    return combined;
}

// nhóm theo máy gạt
function groupDozer(trips) {
    const groups = {};

    trips.forEach(t => {
        const key = `${t.device}`;
        if (!groups[key]) {
            groups[key] = {
                device: t.device,
                materials: []
            };
        }
        groups[key].materials.push({
            material: t.material,
            workingMinutes: t.workingMinutes,
        });
    });

    return Object.values(groups);
}
// nhóm theo máy khoan
function groupDrill(trips) {
    const groups = {};

    trips.forEach(t => {
        const key = `${t.device}`;
        if (!groups[key]) {
            groups[key] = {
                device: t.device,
                materials: []
            };
        }
        groups[key].materials.push({
            material: t.material,
            drillDepth: t.drillDepth,
            hardnessF: t.hardnessF
        });
    });

    return Object.values(groups);
}


module.exports = {
    groupReportsByExcavator,
    groupReportsForProduct,
    groupTripsVehicle,
    getCombinedUsers,
    groupTripsExcavator,
    groupTripsCar,
    groupExcavator,
    groupDozer,
    groupDrill,
    groupCar
};
