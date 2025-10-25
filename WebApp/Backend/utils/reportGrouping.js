const TravelLog = require('../models/TravelLog')
const Model = require('../models/Model');
const { ACCEPTED_PRODUCTS, ACCEPTED_PRODUCT } = require('../config/config');
let pLimit = require('p-limit');
if (pLimit.default) pLimit = pLimit.default;

async function safeQuery(fn, retries = 3, delay = 300) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (err.code === 18 && i < retries - 1) {
                await new Promise(r => setTimeout(r, delay));
            } else throw err;
        }
    }
}

// giới hạn 100 query song song
const limit = pLimit(20);

// lenh sx vh xe
async function groupTripsVehicle(trips, date, shift) {
    // Sử dụng Promise.all với map để xử lý bất đồng bộ song song (tăng tốc độ)
    const formattedTrips = await Promise.all(trips.map(async (t) => {

        // Chuyển quantityUpdateTimes thành mảng để lặp
        const timesArray = Array.isArray(t.quantityUpdateTimes)
            ? t.quantityUpdateTimes
            : [t.quantityUpdateTimes];

        // 1. TÍNH TOÁN VÀ GOM timeLogs
        // Sử dụng Promise.all để tìm TravelLog song song cho mỗi mốc thời gian
        let totalDistance = 0;
        const travelLog = await TravelLog.findOne({
            excavator: t.excavator?._id,
            workingDate: date,
            shift: shift?._id
        }).lean();

        let routeMatched = null;

        if (travelLog?.routes?.length > 0 && t.toLocation) {
            // 🔍 Tìm route khớp location
            routeMatched = travelLog.routes.find(r => {
                const routeLocId = typeof r.location === 'object' ? r.location._id?.toString() : r.location?.toString();
                const tripLocId = typeof t.toLocation === 'object' ? t.toLocation._id?.toString() : t.toLocation?.toString();
                return routeLocId === tripLocId;
            });

        }

        const timeLogPromises = timesArray.map(async (time) => {

            const distance = routeMatched ? (routeMatched.fullDistanceKm || 0) : 0;

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
            shift: t.shift?.name || 1,
            // Thông tin đã tính toán
            totalCubicMeter: value.cubicMeter, // Đổi tên thành totalCubicMeter để nhất quán, nhưng nó là của chuyến đi này
            totalTon: value.ton,
            production: value.production,
            timeLogs: timeLogs                 // Mảng chứa {time, distance}
        };
    }));

    return formattedTrips;
}

// san luong tkm
async function groupTripsVehicleProduction(trips) {
    return Promise.all(
        trips.map(t =>
            limit(async () => {
                const travelLog = await safeQuery(() =>
                    TravelLog.findOne({
                        excavator: t.excavator?._id,
                        workingDate: t.workingDate,
                        shift: t.shift?._id
                    }).lean()
                );

                let totalDistance = 0;
                let routeMatched = null;

                if (travelLog?.routes?.length && t.toLocation) {
                    const tripLocId =
                        typeof t.toLocation === 'object'
                            ? t.toLocation._id?.toString()
                            : t.toLocation?.toString();
                    routeMatched = travelLog.routes.find(r => {
                        const routeLocId =
                            typeof r.location === 'object'
                                ? r.location._id?.toString()
                                : r.location?.toString();
                        return routeLocId === tripLocId;
                    });
                }

                const distance = routeMatched ? routeMatched.fullDistanceKm || 0 : 0;
                totalDistance = distance * (Array.isArray(t.quantityUpdateTimes) ? t.quantityUpdateTimes.length : 1);

                const value = await safeQuery(() =>
                    caculatorWeight(
                        t.material?._id,
                        t.device?.material,
                        t.quantity,
                        totalDistance,
                        t.workingDate
                    )
                );

                return {
                    device: t.device,
                    excavator: t.excavator,
                    location: t.toLocation,
                    material: t.material,
                    quantity: t.quantity,
                    workingDate: t.workingDate,
                    shift: t.shift?.name || 1,
                    production: value.production,
                };
            })
        )
    );
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
    const valueModel = getMohinhAtDate(data, normalizeDateToUTC(date))


    if (data && data.material?.acceptedProduct === ACCEPTED_PRODUCT.COAL) {
        ton = valueModel * (quantity || 0) * dryDensity
        production = valueModel * (totalDistance || 0) * dryDensity
    } else if (data && data.material?.acceptedProduct === ACCEPTED_PRODUCT.LAND) {
        cubicMeter = valueModel * (quantity || 0)
        production = (totalDistance || 0) * valueModel * dryDensity
    }
    return {
        cubicMeter: Number(cubicMeter.toFixed(1)),
        ton: Number(ton.toFixed(1)),
        production: Number(production.toFixed(1)),
    };
}

function getTyTrongAtDate(material, date) {

    if (!material) return 0;

    const histories = Array.isArray(material.dryDensityHistory)
        ? material.dryDensityHistory
        : [];

    // Nếu không có lịch sử thì lấy current
    if (histories.length === 0) return material?.dryDensity || 0;

    const target = new Date(date);

    // sắp xếp tăng dần theo ngày hiệu lực
    const sorted = histories.sort((a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate));

    // nếu ngày cần tính < mốc đầu tiên -> dùng giá trị đầu tiên
    if (target < new Date(sorted[0].effectiveDate)) {
        return sorted[0]?.value || 0;
    }

    // duyệt qua các mốc để tìm giá trị phù hợp
    for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        // Nếu không có mốc tiếp theo → bản cuối cùng trước currentTyTrong
        if (!next) {
            return material?.dryDensity || current?.value || 0;
        }

        // Nếu date nằm giữa current và next
        if (target >= new Date(current.effectiveDate) && target < new Date(next.effectiveDate)) {
            return next?.value || 0; // giá trị mới bắt đầu có hiệu lực tại next.effectiveDate
        }
    }

    // nếu sau tất cả -> currentTyTrong
    return material?.dryDensity || 0;
}
function getMohinhAtDate(model, date) {

    if (!model) return 0;

    const histories = Array.isArray(model.valueHistory)
        ? model.valueHistory
        : [];

    // Nếu không có lịch sử thì lấy current
    if (histories.length === 0) return model?.value || 0;

    const target = new Date(date);

    // sắp xếp tăng dần theo ngày hiệu lực
    const sorted = histories.sort((a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate));

    // nếu ngày cần tính < mốc đầu tiên -> dùng giá trị đầu tiên
    if (target < new Date(sorted[0].effectiveDate)) {
        return sorted[0]?.value || 0;
    }

    // duyệt qua các mốc để tìm giá trị phù hợp
    for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        // Nếu không có mốc tiếp theo → bản cuối cùng trước currentTyTrong
        if (!next) {
            return model?.value || current?.value || 0;
        }

        // Nếu date nằm giữa current và next
        if (target >= new Date(current.effectiveDate) && target < new Date(next.effectiveDate)) {
            return next?.value || 0; // giá trị mới bắt đầu có hiệu lực tại next.effectiveDate
        }
    }

    // nếu sau tất cả -> currentTyTrong
    return model?.value || 0;
}

function normalizeDateToUTC(date) {
    const d = new Date(date);
    // bỏ phần giờ/phút/giây để chỉ so sánh theo ngày
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}



module.exports = {
    groupTripsVehicle,
    getCombinedUsers,
    groupTripsExcavator,
    groupTripsCar,
    groupExcavator,
    groupDozer,
    groupDrill,
    groupCar,
    groupProduction,
    groupTripsVehicleProduction,
    safeQuery,
    caculatorWeight
};
