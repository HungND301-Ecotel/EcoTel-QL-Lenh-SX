const TravelLog = require('../models/TravelLog')
const Model = require('../models/Model');
const { ACCEPTED_PRODUCTS, ACCEPTED_PRODUCT } = require('../config/config');

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

// lenh sx vh xe
async function groupTripsVehicle(trips, date) {
    // Sử dụng Promise.all với map để xử lý bất đồng bộ song song (tăng tốc độ)
    const formattedTrips = await Promise.all(trips.map(async (t) => {

        // Chuyển quantityUpdateTimes thành mảng để lặp
        const timesArray = Array.isArray(t.quantityUpdateTimes)
            ? t.quantityUpdateTimes
            : [t.quantityUpdateTimes];

        // 1. TÍNH TOÁN VÀ GOM timeLogs
        // Sử dụng Promise.all để tìm TravelLog song song cho mỗi mốc thời gian
        let totalDistance = 0;
        const timeLogPromises = timesArray.map(async (time) => {
            const travelLog = await TravelLog.findOne({
                excavator: t.excavator,
                location: t.toLocation,
                startTime: { $lte: time },
                endTime: { $gte: time }
            }).lean();

            const distance = travelLog ? (travelLog.distance || 0) : 0;

            return {
                time: time,
                distance: distance
            };
        });

        const timeLogs = await Promise.all(timeLogPromises);

        totalDistance = timeLogs.reduce((sum, log) => sum + log.distance, 0);

        // 2. TÍNH TOÁN KHỐI LƯỢNG VÀ TẤN
        const value = await caculatorWeight(t.material?._id, t.device?.material, t.quantity, totalDistance, date);

        // 3. TRẢ VỀ ĐỐI TƯỢNG CHUYẾN ĐI MỚI (PHẲNG)
        return {
            device: t.device,
            excavator: t.excavator,
            location: t.toLocation,
            material: t.material,
            quantity: t.quantity,
            workingDate: t.workingDate,
            shift: t.shift || 1,
            // Thông tin đã tính toán
            totalCubicMeter: value.cubicMeter, // Đổi tên thành totalCubicMeter để nhất quán, nhưng nó là của chuyến đi này
            totalTon: value.ton,
            production: value.production,
            timeLogs: timeLogs                 // Mảng chứa {time, distance}
        };
    }));

    return formattedTrips;
}

async function groupExcavator(trips, date) {
    const groups = {};

    for (const t of trips) {
        const key = `${t.device}`;
        if (!groups[key]) {
            groups[key] = {
                device: t.device,
                materials: [],
                workingDate: t.workingDate,
                shift: t.shift || 1,
                totalCubicMeter: 0,
                totalTon: 0
            };
        }
        const value = await caculatorWeight(t.material?._id, t.device?.material, t.quantity, 0, date)
        groups[key].totalCubicMeter += value.cubicMeter;
        groups[key].totalTon += value.ton;

        groups[key].materials.push({
            material: t.material,
            quantity: t.quantity,
            cubicMeter: value.cubicMeter,
            ton: value.ton,
            times: t.quantityUpdateTimes
        });
    };

    return Object.values(groups);
}
async function groupProduction(trips, date) {
    const groups = {};

    for (const t of trips) {
        if (!t.workingDate) continue;

        const dayKey = new Date(t.workingDate).toISOString().slice(0, 10);
        const shift = t.shift || 1;

        // ✅ KHÓA CHUẨN — gồm thiết bị, ngày, ca
        const key = `${t.device}_${dayKey}_${shift}`;

        if (!groups[key]) {
            groups[key] = {
                device: t.device,
                materials: [],
                workingDate: t.workingDate,
                shift,
                totalCubicMeter: 0,
                totalTon: 0
            };
        }

        const value = await caculatorWeight(
            t.material?._id,
            t.device?.material,
            t.quantity,
            0,
            date
        );

        groups[key].totalCubicMeter += value.cubicMeter;
        groups[key].totalTon += value.ton;

        groups[key].materials.push({
            material: t.material,
            quantity: t.quantity,
            cubicMeter: value.cubicMeter,
            ton: value.ton,
            times: t.quantityUpdateTimes
        });
    }

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
        const key = `${t.device}-${t.excavator}-${t.toLocation}`;
        if (!groups[key]) {
            groups[key] = {
                device: t.device,
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

// khoi luong, trong luong tam tinh

async function caculatorWeight(materialId, deviceModel, quantity, totalDistance, date) {
    let cubicMeter = 0
    let ton = 0
    let production = 0

    const data = await Model.findOne({ material: materialId, deviceModel: deviceModel })
        .populate('material', 'name dryDensity acceptedProduct dryDensityHistory');

    if (!data || !data.material) return { cubicMeter, ton, production };
    const material = data?.material;

    // 🧠 Tính tỷ trọng tại thời điểm `date`
    const dryDensity = getTyTrongAtDate(material, normalizeDateToUTC(date))

    if (data && data.material?.acceptedProduct === ACCEPTED_PRODUCT.COAL) {
        ton = (data.value || 0) * (quantity || 0) * dryDensity
        production = (data.value || 0) * (totalDistance || 0) * dryDensity
    } else if (data && data.material?.acceptedProduct === ACCEPTED_PRODUCT.LAND) {
        cubicMeter = (data.value || 0) * (quantity || 0)
        production = (totalDistance || 0) * (data.value || 0) * dryDensity
    }
    return { cubicMeter, ton, production }
}

function getTyTrongAtDate(material, date) {

    if (!material) return 0;

    const histories = Array.isArray(material.dryDensityHistory)
        ? material.dryDensityHistory
        : [];

    // Nếu không có lịch sử thì lấy current
    if (histories.length === 0) return material.dryDensity || 0;

    const target = new Date(date);

    // sắp xếp tăng dần theo ngày hiệu lực
    const sorted = histories.sort((a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate));

    // nếu ngày cần tính < mốc đầu tiên -> dùng giá trị đầu tiên
    if (target < new Date(sorted[0].effectiveDate)) {
        return sorted[0].value;
    }

    // duyệt qua các mốc để tìm giá trị phù hợp
    for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        // Nếu không có mốc tiếp theo → bản cuối cùng trước currentTyTrong
        if (!next) {
            return material.dryDensity || current.value;
        }

        // Nếu date nằm giữa current và next
        if (target >= new Date(current.effectiveDate) && target < new Date(next.effectiveDate)) {
            return next.value; // giá trị mới bắt đầu có hiệu lực tại next.effectiveDate
        }
    }

    // nếu sau tất cả -> currentTyTrong
    return material.dryDensity || 0;
}

function normalizeDateToUTC(date) {
    const d = new Date(date);
    // bỏ phần giờ/phút/giây để chỉ so sánh theo ngày
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
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
    groupCar,
    groupProduction
};
