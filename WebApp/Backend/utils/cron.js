const cron = require('node-cron')
const Report = require('../models/Report')
const Order = require('../models/Order')
const Shift = require('../models/Shift')


const Job = require('../models/Job')
const TravelLog = require('../models/TravelLog')
const { safeQuery, caculatorWeight } = require("./reportGrouping")
const { ROLE, JOB_TYPE, STATUS_ORDER } = require('../config/config');
const sendPushNotification = require('./sendNotification')
const { sendCombinedNotification } = require('./email')



// cron gui thong bao
function getShiftByCronTime(now) {
    const hour = now.getHours();

    if (hour >= 7 && hour < 15) return 1;
    if (hour >= 15 && hour < 23) return 2;
    if (hour >= 23) return 3;

    return null;
}
function getPreviousShiftAndDate(currentShift) {
    const now = new Date();

    if (currentShift === 1) {
        const prevDay = new Date(now);
        prevDay.setDate(prevDay.getDate() - 1);
        return {
            shift: 3,
            date: new Date(Date.UTC(prevDay.getFullYear(), prevDay.getMonth(), prevDay.getDate()))
        };
    }

    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    if (currentShift === 2) {
        return { shift: 1, date: todayUTC };
    }

    if (currentShift === 3) {
        return { shift: 2, date: todayUTC };
    }

    return null;
}

async function notifyOrders(order, type) {
    const tokens = order?.assignedTo?.deviceTokens || [];
    await Promise.all(tokens.map(t =>
        sendPushNotification(t,
            type === "pending" ? "Bạn có lệnh mới cần nhận"
                : type === "shiftReport" ? "Nhắc báo công"
                    : type === "report" ? "Nhắc báo chuyến/sản lượng"
                        : "Nhắc kết thúc ca",
            type === "pending" ? "Vui lòng kiểm tra và nhận lệnh."
                : type === "shiftReport" ? "Ca trước vẫn chưa báo công. Vui lòng hoàn thành."
                    : type === "report" ? "Ca trước vẫn chưa báo chuyến/ sản lượng. Vui lòng hoàn thành."
                        : "Ca trước vẫn còn lệnh chưa hoàn thành. Vui lòng hoàn thành.")
    ));
}

const allOrdersByCreatedBy = {};

// Hàm hỗ trợ thêm lệnh vào nhóm
const addOrderToGroup = (order, reminderType) => {
    const createdById = order.createdBy?._id?.toString();
    if (createdById && order.createdBy?.email) {
        // Sử dụng .toObject() để đảm bảo object có thể thêm property mới
        const orderData = { ...order.toObject(), reminderType: reminderType };
        if (!allOrdersByCreatedBy[createdById]) {
            allOrdersByCreatedBy[createdById] = {
                user: order.createdBy, // Lưu thông tin cán bộ
                orders: []
            };
        }
        allOrdersByCreatedBy[createdById].orders.push(orderData);
    }
};
cron.schedule('12 7,15,23 * * *', async () => {
    console.log("🔔 Bắt đầu Cron kiểm tra lệnh...");

    try {
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

        // Ca hiện tại
        const currentShift = getShiftByCronTime(now);
        if (!currentShift) return;

        const currentShiftData = await Shift.findOne({ name: currentShift });

        // --- Lệnh PENDING của ca hiện tại (nhắc nhận lệnh)
        const ordersCurrent = await Order.find({
            shift: currentShiftData._id,
            workingDate: todayUTC,
            status: STATUS_ORDER.PENDING,
            cancel: false
        })
            .populate('shiftReport')
            .populate('job', 'type name')
            .populate("createdBy", "email fullName deviceTokens")
            .populate("assignedTo", "email fullName deviceTokens salaryCode").populate('shift');
        //thong bao toi nhan vien

        for (let order of ordersCurrent) {
            await notifyOrders(order, "pending");

            addOrderToGroup(order, "pending");
        }


        // --- Lệnh PENDING của ca trước (nhắc kết thúc ca)
        const prevInfo = getPreviousShiftAndDate(currentShift);
        const prevShiftData = await Shift.findOne({ name: prevInfo.shift });

        const ordersPrev = await Order.find({
            shift: prevShiftData._id,
            workingDate: prevInfo.date,
            status: { $in: [STATUS_ORDER.PENDING, STATUS_ORDER.INPROGRESS] },
            cancel: false
        })
            .populate('job', 'type name')
            .populate("createdBy", "email fullName deviceTokens")
            .populate("assignedTo", "email fullName deviceTokens salaryCode").populate('shift');

        //thong bao toi nhan vien
        for (let order of ordersPrev) {
            let reminderType = "completed";
            if (order.status === STATUS_ORDER.INPROGRESS) {
                if ([JOB_TYPE.VAN_HANH_XE, JOB_TYPE.VAN_HANH_GAT, JOB_TYPE.VAN_HANH_KHOAN, JOB_TYPE.VAN_HANH_XE_PHUC_VU, JOB_TYPE.VAN_HANH_XUC].includes(order?.job?.type)) {
                    const countReport = await Report.countDocuments({ orderId: order._id })
                    if (countReport === 0) {
                        await notifyOrders(order, "report");
                        reminderType = "report";
                    }
                } else if (!order.shiftReport) {
                    await notifyOrders(order, "shiftReport");
                    reminderType = "shiftReport";
                } else {
                    await notifyOrders(order, "completed");
                }
            } else {
                await notifyOrders(order, "completed");
            }
            addOrderToGroup(order, reminderType);
        }

        const emailPromises = Object.values(allOrdersByCreatedBy).map(group => {
            return sendCombinedNotification(group.user, group.orders); // <-- Gửi 1 email cho 1 cán bộ
        });

        await Promise.all(emailPromises);

    } catch (error) {
        console.error("[CRON ERROR]", error);
    }

    console.log("🔔 Kết thúc Cron.");
});




// cron tinh san luong
cron.schedule('* 14 * * *', async () => {
    console.log('Bắt đầu tiến hành tính sản lượng...')

    try {
        const selected = new Date();
        // Các logic về ngày tháng giữ nguyên
        const selectedDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 23, 59, 59, 999);
        const startOfMonth = new Date(selected.getFullYear(), selected.getMonth(), 1, 0, 0, 0, 0);
        let query = { workingDate: { $gte: startOfMonth, $lte: selectedDate } };
        const orders = await getOrders(query)
        await update_production_report(orders);

    } catch (error) {
        console.error('[CRON ERROR] Lỗi trong quá trình Cron Job:', error);
    }
    console.log('Kết thúc tính sản lượng...')
})

// ham tinh
async function update_production_report(orders) {
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
                const value = await production_vehicle(report);
                totalProduction = value.production
                totalCubicMeter = value.cubicMeter
                totalTon = value.ton
            } else if (order.job?.type === JOB_TYPE.VAN_HANH_XUC) {
                // Gọi hàm tính toán ASYNC, việc này sẽ chạy song song
                // với các report khác trong cùng một Order
                const value = await production_excavator(report);
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
        console.log(`Tổng cộng ${bulkOperations.length} Report cần được cập nhật.`);
        const result = await Report.bulkWrite(bulkOperations);
        console.log(`Bulk Write hoàn tất. Updated: ${result.nModified || result.modifiedCount}`);
    } else {
        console.log('Không có Report nào cần cập nhật.');
    }
}


async function getOrders(query) {

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
async function production_vehicle(t) {
    // Chuyển quantityUpdateTimes thành mảng để lặp
    const timesArray = Array.isArray(t.quantityUpdateTimes)
        ? t.quantityUpdateTimes
        : [t.quantityUpdateTimes];

    // 1. TÍNH TOÁN VÀ GOM timeLogs
    // Sử dụng Promise.all để tìm TravelLog song song cho mỗi mốc thời gian
    let totalDistance = 0;
    const travelLog = await TravelLog.findOne({
        excavator: t.excavator?._id,
        location: t.toLocation?._id,
        workingDate: t.workingDate,
        shift: t.shift?._id
    }).lean();

    const distance = travelLog ? travelLog.fullDistanceKm || 0 : 0;

    const timeLogPromises = timesArray.map(async (time) => {

        return {
            time: time,
            distance: distance
        };
    });

    const timeLogs = await Promise.all(timeLogPromises);

    totalDistance = timeLogs.reduce((sum, log) => sum + log.distance, 0);

    // 2. TÍNH TOÁN KHỐI LƯỢNG VÀ TẤN
    const value = await caculatorWeight(t.material?._id, t.device?.material, t.quantity, totalDistance, t.workingDate);

    return value
}
async function production_excavator(t) {

    const value = await caculatorWeight(
        t.material?._id,
        t.device?.material,
        t.quantity,
        0,
        t.workingDate
    );

    return value;
}

async function runProductionUpdateBackground(req, query) {
    setImmediate(async () => {
        try {
            const orders = await getOrders(query);
            await update_production_report(orders);

            req?.logger?.info("✔ Background: sản lượng đã được cập nhật");
        } catch (err) {
            req?.logger?.error("❌ Background: lỗi khi cập nhật sản lượng", err);
        }
    });
}


module.exports = {
    production_vehicle,
    production_excavator,
    update_production_report,
    getOrders,
    runProductionUpdateBackground
}