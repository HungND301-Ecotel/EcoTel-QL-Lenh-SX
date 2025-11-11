const TravelLog = require('../models/TravelLog')
const Model = require('../models/Model');
const { ACCEPTED_PRODUCT } = require('../config/config');
const dayjs = require('dayjs');
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
        const timesArray = (t.quantityUpdateTimes || []).map(i => i?.time)

        // 1. TÍNH TOÁN VÀ GOM timeLogs
        // Sử dụng Promise.all để tìm TravelLog song song cho mỗi mốc thời gian
        let totalDistance = 0;
        const travelLog = await TravelLog.findOne({
            excavator: t.excavator?._id,
            location: t.toLocation?._id,
            workingDate: date,
            shift: shift?._id
        }).lean();

        const timeLogPromises = timesArray.map(async (time) => {

            const distance = travelLog ? (travelLog.fullDistanceKm || 0) : 0;

            return {
                time: time,
                distance: distance
            };
        });

        const timeLogs = await Promise.all(timeLogPromises);

        totalDistance = timeLogs.reduce((sum, log) => sum + log.distance, 0);

        // 2. TÍNH TOÁN KHỐI LƯỢNG VÀ TẤN
        // const value = await caculatorWeight(t.material?._id, t.device?.material, t.quantity, totalDistance, date);

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
            totalCubicMeter: t?.totalCubicMeter || 0, // Đổi tên thành totalCubicMeter để nhất quán, nhưng nó là của chuyến đi này
            totalTon: t?.totalTon || 0,
            production: t?.totalProduction || 0,
            timeLogs: timeLogs                 // Mảng chứa {time, distance}
        };
    }));

    return formattedTrips;
}

// san luong tkm
async function groupTripsVehicleProduction(trips) {
    const enrichedTrips = await Promise.all(
        trips.map(t =>
            limit(async () => {
                const travelLog = await safeQuery(() =>
                    TravelLog.findOne({
                        excavator: t.excavator?._id,
                        location: t.toLocation?._id,
                        workingDate: t.workingDate,
                        shift: t.shift?._id
                    }).lean()
                );

                return {
                    device: t.device, //xe
                    excavator: t.excavator, // máy xúc
                    location: t.toLocation, //đổ tải
                    distance: travelLog?.fullDistanceKm || '', // cung độ
                    excavationLevel: travelLog?.excavationLevel || '', // tầng xúc
                    fullLiftHeightM: travelLog?.fullLiftHeightM || '', // độ cao nâng tải
                    material: t.material, // vật liệu
                    quantity: t.quantity,// số chuyến
                    workingDate: t.workingDate,// ngày
                    shift: t.shift?.name || 1, // ca
                    production: t.totalProduction, // tkm
                    totalCubicMeter: t.totalCubicMeter, // khối lượng(m3)
                    totalTon: t?.totalTon // trọng lượng(tấn)
                };
            })
        )
    );
    enrichedTrips.sort((a, b) => {
        const shiftA = a.shift || 1;
        const shiftB = b.shift || 1;

        return shiftA - shiftB;
    });

    return enrichedTrips;
}

// bao cao san luong van chuyen dat da
const _ = require('lodash');

async function groupProductionLand(trips) {
    // Lưu ý: Giả định hàm 'limit' đã được định nghĩa trong môi trường của bạn.
    const enrichedTrips = await Promise.all(
        trips.map(t =>
        // Sử dụng limit nếu cần, nếu không thì bỏ qua async/limit
        // limit(async () => ({ 
        ({
            deviceMaterial: t.device?.material?.name || "Khác", // Vật liệu gắn với xe (Header)
            excavatorCode: t.excavator?.code || "Không rõ",      // Mã máy xúc (Dòng chi tiết)

            // --- NHÓM CẤP CAO (I, II) ---
            mainGroup: t.material?.name?.trim() || "Vật liệu khác",   // Vật liệu thực tế (Cấp I/II)

            // --- NHÓM CẤP CON (1, 2, 3) ---
            subGroup: t.excavator?.material?.name?.trim() || "Máy xúc khác", // Chủng loại máy xúc

            quantity: t.quantity,
            totalCubicMeter: t.totalCubicMeter,
            production: t.totalProduction, // Tkm
            totalTon: t.totalTon || 0
        })
            // )) // Đóng limit
        )
    );

    // 1. Nhóm ngoài cùng: theo deviceMaterial (Tạo cột Header)
    const groupedByDeviceMaterial = _.groupBy(enrichedTrips, 'deviceMaterial');

    const result = Object.entries(groupedByDeviceMaterial).map(([deviceMaterial, items]) => {

        // Nhóm tất cả các mục theo mã máy xúc để tính tổng chuyến/M3/Tkm cho từng máy
        const groupedByExcavatorCode = _.groupBy(items, 'excavatorCode');

        const allExcavators = Object.entries(groupedByExcavatorCode).map(([excavatorCode, list]) => {
            // Lấy thông tin nhóm cấp I/II và cấp con từ item đầu tiên
            const firstItem = list[0];

            return {
                excavator: excavatorCode,
                deviceMaterial,

                // Thêm thông tin nhóm cấp I/II và cấp con vào dữ liệu chi tiết
                mainGroup: firstItem.mainGroup,
                subGroup: firstItem.subGroup,

                totalTrips: _.sumBy(list, "quantity"),
                totalM3: _.sumBy(list, "totalCubicMeter"),
                totalTkm: _.sumBy(list, "production"),
                totalTon: _.sumBy(list, "totalTon"),
            };
        });

        // 🧩 Tổng toàn nhóm vật liệu (Cấp ngoài cùng)
        const totalTrips = _.sumBy(items, "quantity");
        const totalM3 = _.sumBy(items, "totalCubicMeter");
        const totalTkm = _.sumBy(items, "production");
        const totalTon = _.sumBy(items, "totalTon");

        return {
            deviceMaterial,
            totalTrips,
            totalM3,
            totalTkm,
            totalTon,
            // Trả về danh sách máy xúc chi tiết đã được tính tổng và gắn nhóm
            excavators: allExcavators,
        };
    });

    return result;
}


// nang suat dau xe
async function groupTripsVehicleProductivity(trips) {
    const result = {};

    for (const t of trips) {
        // Lấy thông tin cơ bản
        const modelName = t.device?.material?.name || "Không rõ loại xe";
        const carCode = t.device?.code || "Không rõ xe";
        const productType = t.material?.acceptedProduct; // LAND / COAL
        const workingDate = dayjs(t.workingDate).format("YYYY-MM-DD");
        const shift = t.shift?.name || 1;
        const key = `${carCode}_${workingDate}_${shift}`;

        // Lấy sản lượng TKM (t.totalProduction)
        const cubic = t.totalCubicMeter || 0;
        const ton = t.totalTon || 0;
        const tkm = t.totalProduction || 0;


        // --- Khởi tạo nhóm theo loại xe (Model) ---
        if (!result[modelName]) {
            result[modelName] = {
                modelName,
                vehicles: {},
                summary: {
                    land: { trips: 0, m3: 0, tkm: 0 },
                    coal: { trips: 0, ton: 0, tkm: 0 },
                    totalTkm: 0, // Tổng TKM của tất cả các xe thuộc model này
                },
            };
        }
        const modelGroup = result[modelName];

        // --- Khởi tạo dòng tổng hợp của xe/ngày/ca ---
        if (!modelGroup.vehicles[key]) {
            modelGroup.vehicles[key] = {
                carCode,
                workingDate,
                shift,
                land: { trips: 0, m3: 0, tkm: 0 },
                coal: { trips: 0, ton: 0, tkm: 0 },
                totalTkm: 0, // Tổng TKM của riêng xe/ngày/ca này
            };
        }

        const record = modelGroup.vehicles[key];

        // --- Cộng dồn dữ liệu ---
        if (productType === ACCEPTED_PRODUCT.LAND) {
            record.land.trips += 1;
            record.land.m3 += cubic;
            record.land.tkm += tkm; // <--- TKM cho Đất

            modelGroup.summary.land.trips += 1;
            modelGroup.summary.land.m3 += cubic;
            modelGroup.summary.land.tkm += tkm; // <--- TKM Summary cho Đất
        } else if (productType === ACCEPTED_PRODUCT.COAL) {
            record.coal.trips += 1;
            record.coal.ton += ton;
            record.coal.tkm += tkm; // <--- TKM cho Than

            modelGroup.summary.coal.trips += 1;
            modelGroup.summary.coal.ton += ton;
            modelGroup.summary.coal.tkm += tkm; // <--- TKM Summary cho Than
        }

        // Tính toán tổng TKM
        record.totalTkm = record.land.tkm + record.coal.tkm;
        modelGroup.summary.totalTkm =
            modelGroup.summary.land.tkm + modelGroup.summary.coal.tkm;
    }

    // --- Chuẩn hóa ra mảng ---
    return Object.values(result).map((m) => ({
        modelName: m.modelName,
        summary: m.summary, // Chứa { land: {..., tkm}, coal: {..., tkm}, totalTkm }
        vehicles: Object.values(m.vehicles).sort((a, b) => {
            // 1. Sắp xếp chính: workingDate (chuỗi YYYY-MM-DD so sánh được)
            const dateComparison = a.workingDate.localeCompare(b.workingDate);
            if (dateComparison !== 0) return dateComparison;
            return (a.shift || 0) - (b.shift || 0);
        }),
    }));
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
        // const value = await caculatorWeight(t.material?._id, t.device?.material, t.quantity, 0, date)
        groups[key].totalCubicMeter += t?.totalCubicMeter || 0;
        groups[key].totalTon += t?.totalTon || 0;

        groups[key].materials.push({
            material: t.material,
            quantity: t.quantity,
            cubicMeter: t?.totalCubicMeter || 0,
            ton: t?.totalTon || 0,
            times: (t.quantityUpdateTimes || []).map(i => i?.time)
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

        // const value = await caculatorWeight(
        //     t.material?._id,
        //     t.device?.material,
        //     t.quantity,
        //     0,
        //     date
        // );

        groups[key].totalCubicMeter += t?.totalCubicMeter || 0;
        groups[key].totalTon += t?.totalTon || 0;

        groups[key].materials.push({
            material: t.material,
            quantity: t.quantity,
            cubicMeter: t?.totalCubicMeter || 0,
            ton: t?.totalTon || 0,
            times: (t.quantityUpdateTimes || []).map(i => i?.time)
        });
    }

    return Object.values(groups);
}

function groupTripsExcavator(trips) {
    const groups = {};

    trips.forEach((t) => {
        const key = `${t.device?._id || t.device?.code}_${t.material?._id}`;

        if (!groups[key]) {
            groups[key] = {
                device: t.device,
                trips: [],
                summary: {},
                totalTrips: 0,
            };
        }

        const timesArray = (t?.quantityUpdateTimes || []).map((i) => i?.time);
        timesArray.forEach((time) => {
            // 🔹 Chỉ thêm nếu chưa có cùng material + time trong trips
            const alreadyExists = groups[key].trips.some(
                (trip) =>
                    trip.material?._id?.toString() === t.material?._id?.toString() &&
                    new Date(trip.time).getTime() === new Date(time).getTime()
            );

            if (!alreadyExists) {
                groups[key].trips.push({
                    material: t.material,
                    time,
                });
            }
        });

        const materialName =
            typeof t.material === "string"
                ? t.material
                : t.material?.name || "Không rõ";

        if (!groups[key].summary[materialName]) {
            groups[key].summary[materialName] = 0;
        }
        groups[key].summary[materialName] += t.quantity;
        groups[key].totalTrips += t.quantity;
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
        const timesArray = (t.quantityUpdateTimes || [])
        for (const time of timesArray) {
            const travelLog = await TravelLog.findOne({
                excavator: t.excavator,        // lọc theo máy xúc
                location: t.toLocation,       // lọc theo điểm đổ tải
                startTime: { $lte: time },    // bắt đầu <= time
                endTime: { $gte: time }       // kết thúc >= time
            }).lean();

            const distance = travelLog ? travelLog.fullDistanceKm : 0
            groups[key].trips.push({
                material: t.material,
                time: time?.time,
                distance
            });
            if (!groups[key].summary[t.material.name]) {
                groups[key].summary[t.material.name] = { count: 0, distance: 0 }
            }
            groups[key].summary[t.material.name].count += time?.quantity;
            groups[key].summary[t.material.name].distance += distance;


            groups[key].totalTrips += time?.quantity;
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

        const timesArray = (t.quantityUpdateTimes || [])

        for (const time of timesArray) {
            const travelLog = await TravelLog.findOne({
                excavator: t.excavator,
                location: t.toLocation,
                startTime: { $lte: time },
                endTime: { $gte: time }
            }).lean();

            const distance = travelLog ? travelLog.fullDistanceKm : 0;

            if (!groups[key].materials[t.material.name]) {
                groups[key].materials[t.material.name] = {
                    material: t.material,
                    times: [],        // danh sách thời gian
                    distances: [],    // danh sách cung độ theo index
                    count: 0,
                    totalDistance: 0
                };
            }

            groups[key].materials[t.material.name].times.push(time?.time);
            groups[key].materials[t.material.name].distances.push(distance);
            groups[key].materials[t.material.name].count += time?.quantity;
            groups[key].materials[t.material.name].totalDistance += distance;

            groups[key].totalTrips += time?.quantity;
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
        .populate('material', 'name acceptedProduct valueHistory');

    if (!data || !data.material) return { cubicMeter, ton, production };
    const material = data?.material;

    // 🧠 Tính tỷ trọng tại thời điểm `date`
    const dryDensity = getTyTrongAtDate(material, normalizeDateToUTC(date))
    const valueModel = getMohinhAtDate(data, normalizeDateToUTC(date))

    console.log(dryDensity, valueModel)


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

    const histories = Array.isArray(material.valueHistory) ? material.valueHistory : [];
    const target = new Date(date);

    if (histories.length === 0) return 0;

    // sắp xếp theo thời gian bắt đầu tăng dần
    const sorted = histories.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // duyệt để tìm mốc chứa ngày target
    for (const h of sorted) {
        const start = new Date(h.startTime);
        const end = new Date(h.endTime);

        if (target >= start && target <= end) {
            console.log("a", h.dryDensity)
            return h.dryDensity ?? 0;
        }
    }

    return 0;
}
function getMohinhAtDate(model, date) {
    if (!model) return 0;

    const histories = Array.isArray(model.valueHistory) ? model.valueHistory : [];
    const target = new Date(date);

    if (histories.length === 0) return 0;

    // sắp xếp theo thời gian bắt đầu tăng dần
    const sorted = histories.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // duyệt để tìm mốc chứa ngày target
    for (const h of sorted) {
        const start = new Date(h.startTime);
        const end = new Date(h.endTime);

        if (target >= start && target <= end) {
            return h.value ?? 0;
        }
    }

    return 0;
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
    caculatorWeight,
    groupTripsVehicleProductivity,
    groupProductionLand
};
