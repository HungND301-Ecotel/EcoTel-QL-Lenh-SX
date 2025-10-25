const cron = require('node-cron')
const Report = require('../models/Report')
const Order = require('../models/Order')
const Job = require('../models/Job')
const TravelLog = require('../models/TravelLog')
const { safeQuery, caculatorWeight } = require("./reportGrouping")
const { ROLE, JOB_TYPE } = require('../config/config');


// cron

cron.schedule('20 17 * * *', async () => {
    console.log('Bắt đầu tiến hành tính sản lượng...')

    try {
        const orders = await getOrders()
        let bulkOperations = [];

        for (let order of orders) {
            const reports = await getReports(order);
            const reportPromises = reports.map(async (report) => {
                let totalProduction = 0;
                let totalCubicMeter = 0;
                let totalTon = 0;

                if (order.job?.type === JOB_TYPE.VAN_HANH_KHOAN) {
                    totalProduction = report.drillDepth || 0;
                }
                else if (order.job?.type === JOB_TYPE.VAN_HANH_XE) {
                    // Gọi hàm tính toán ASYNC, việc này sẽ chạy song song
                    // với các report khác trong cùng một Order
                    totalProduction = await production_van_hanh_xe(report);
                } else if (order.job?.type === JOB_TYPE.VAN_HANH_XUC) {
                    // Gọi hàm tính toán ASYNC, việc này sẽ chạy song song
                    // với các report khác trong cùng một Order
                    const value = await production_van_hanh_xuc(report);
                    totalCubicMeter = value.cubicMeter
                    totalTon = value.ton
                }

                if (totalProduction > 0 || totalCubicMeter > 0 || totalTon > 0) {
                    return {
                        updateOne: {
                            filter: { _id: report._id },
                            update: {
                                $set: {
                                    totalProduction: totalProduction,
                                    totalCubicMeter: totalCubicMeter,
                                    totalTon: totalTon,
                                }
                            }
                        }
                    };
                }
                return null; // Trả về null nếu không cần cập nhật
            });

            // 2. Chờ tất cả Promise hoàn thành (chạy song song)
            const results = await Promise.all(reportPromises);

            // 3. Gộp các thao tác update (không null) vào mảng chung
            bulkOperations.push(...results.filter(op => op !== null));
        }
        if (bulkOperations.length > 0) {
            console.log(`[CRON] Tổng cộng ${bulkOperations.length} Report cần được cập nhật.`);
            const result = await Report.bulkWrite(bulkOperations);
            console.log(`[CRON] Bulk Write hoàn tất. Updated: ${result.nModified || result.modifiedCount}`);
        } else {
            console.log('[CRON] Không có Report nào cần cập nhật.');
        }
    } catch (error) {
        console.error('[CRON ERROR] Lỗi trong quá trình Cron Job:', error);
    }
    console.log('Kết thúc tính sản lượng...')
})


async function getOrders() {
    const selected = new Date();
    // Các logic về ngày tháng giữ nguyên
    const selectedDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(selected.getFullYear(), selected.getMonth(), 1, 0, 0, 0, 0);
    let query = { workingDate: { $gte: startOfMonth, $lte: selectedDate } };

    // 1. Lấy ra ID của các Job cần quan tâm
    const jobsVehicle = await Job.find({
        type: {
            $in: [
                JOB_TYPE.VAN_HANH_XE,
                JOB_TYPE.VAN_HANH_XUC,
                JOB_TYPE.VAN_HANH_KHOAN,
            ]
        }
    }).select('_id type'); // ⚠️ Chọn luôn trường 'type'

    const jobIdVehicle = jobsVehicle.map(j => j._id);
    const vehicleOrders = await Order.aggregate([
        {
            $match: {
                ...query,
                job: { $in: jobIdVehicle },
            },
        },
        // 2. Lookup Job (Mới/Quan trọng)
        {
            $lookup: {
                from: 'jobs', // Tên collection Job
                localField: 'job',
                foreignField: '_id',
                as: 'jobDetails',
            },
        },
        { $unwind: '$jobDetails' }, // Giải nén Job

        // 3. Lookup Shift (Giữ nguyên)
        {
            $lookup: {
                from: 'shifts',
                localField: 'shift',
                foreignField: '_id',
                as: 'shiftDetails',
            },
        },
        {
            $unwind: {
                path: '$shiftDetails',
                preserveNullAndEmptyArrays: true,
            },
        },

        // 4. Project (Chọn và Định hình lại dữ liệu)
        {
            $project: {
                _id: 1,
                workingDate: 1,
                shift: '$shiftDetails',
                job: '$jobDetails', // ⚠️ Đưa thông tin Job đã lookup vào trường 'job'
            },
        }
    ]);

    return vehicleOrders;
}

// ... Hàm getReports giữ nguyên ...
async function getReports(order) {
    const allReports = await safeQuery(() =>
        Report.find({ orderId: order._id })
            .populate({
                path: "device",
                select: "code material",
            })
            .populate("material", "name")
            .populate("excavator", "code")
            .populate("fromLocation", "name")
            .populate("toLocation", "name")
    )
    // 🔹 3. Gán thông tin Order vào Report
    const allVehicleReports = allReports.map(r => {
        return {
            ...r.toObject(),
            shift: order?.shift,
            workingDate: order?.workingDate,
        };
    });
    return allVehicleReports
}
async function production_van_hanh_xe(t) {
    // Chuyển quantityUpdateTimes thành mảng để lặp
    const timesArray = Array.isArray(t.quantityUpdateTimes)
        ? t.quantityUpdateTimes
        : [t.quantityUpdateTimes];

    // 1. TÍNH TOÁN VÀ GOM timeLogs
    // Sử dụng Promise.all để tìm TravelLog song song cho mỗi mốc thời gian
    let totalDistance = 0;
    const travelLog = await TravelLog.findOne({
        excavator: t.excavator?._id,
        workingDate: t.workingDate,
        shift: t.shift?._id
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
    const value = await caculatorWeight(t.material?._id, t.device?.material, t.quantity, totalDistance, t.workingDate);

    return value.production
}
async function production_van_hanh_xuc(t) {

    const value = await caculatorWeight(
        t.material?._id,
        t.device?.material,
        t.quantity,
        0,
        t.workingDate
    );

    return value;
}


module.exports = {
    production_van_hanh_xe,
    production_van_hanh_xuc
}