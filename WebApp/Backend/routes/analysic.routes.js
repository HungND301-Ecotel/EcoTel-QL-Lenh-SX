const express = require('express');
const router = express.Router();
const Order = require('../models/Order') // Đảm bảo đã require các model
const Report = require('../models/Report')

const mongoose = require('mongoose')
const { verifyToken, restrictTo } = require('../middleware/auth.middleware')
const { ROLE, JOB_TYPE } = require('../config/config');


const getProductionReportPipeline = (jobType, departmentId, startOfMonth, selectedDate, productionField) => {

    // Đảm bảo productionField là một biến $ hợp lệ cho $sum
    const totalSumExpression = `$${productionField}`;

    const matchCondition = {
        'order.job.type': jobType,
        'order.department': new mongoose.Types.ObjectId(departmentId),
        'order.workingDate': { $gte: startOfMonth, $lte: selectedDate },
    };

    return [
        // 1. Lookup Order
        {
            $lookup: {
                from: 'orders',
                localField: 'orderId',
                foreignField: '_id',
                as: 'order',
            }
        },
        { $unwind: '$order' },

        // 2. Lookup Job (Sửa lỗi: Phải lookup Job để lấy trường 'type')
        {
            $lookup: {
                from: 'jobs',
                localField: 'order.job',
                foreignField: '_id',
                as: 'order.job',
            }
        },
        { $unwind: '$order.job' },

        // 3. Lookup Shift
        {
            $lookup: {
                from: 'shifts',
                localField: 'order.shift',
                foreignField: '_id',
                as: 'shift',
            }
        },
        { $unwind: '$shift' },

        // 4. Match
        { $match: matchCondition },

        // 5. Group theo ngày và ca (Sử dụng trường sản lượng động)
        {
            $group: {
                _id: { date: '$order.workingDate', shift: '$shift.name' },
                total: { $sum: totalSumExpression }, // <--- DYNAMIC FIELD
            }
        },

        // 6. Group theo ngày để tổng hợp các ca trong ngày
        {
            $group: {
                _id: '$_id.date',
                shifts: { $push: { shift: '$_id.shift', production: '$total' } },
                dayTotal: { $sum: '$total' },
            }
        },

        // 7. Group cuối cùng để tính tổng tháng và gom dữ liệu
        {
            $group: {
                _id: null,
                days: {
                    $push: {
                        date: '$_id',
                        shifts: '$shifts',
                        dayTotal: '$dayTotal',
                    },
                },
                monthTotal: { $sum: '$dayTotal' },
            }
        },
    ];
};

const getProductionReport = async ({ jobType, code, productionField, departmentId, startOfMonth, selectedDate }) => {

    // Lấy pipeline
    const pipeline = getProductionReportPipeline(jobType, departmentId, startOfMonth, selectedDate, productionField);

    // Chạy aggregation
    const results = await Report.aggregate(pipeline);

    // Lấy kết quả (lấy phần tử đầu tiên hoặc object rỗng)
    const data = results[0] || { days: [], monthTotal: 0 };

    // Format kết quả cuối cùng
    const productionByDay = (data.days || [])
        // Chỉ lấy những ngày có sản lượng > 0 và sắp xếp
        .filter(day => day.dayTotal > 0)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(day => ({
            ...day,
            date: day.date.toISOString().split('T')[0], // Format date thành YYYY-MM-DD
            // Nếu muốn format tiếng Việt: new Date(day.date).toLocaleDateString('vi-VN')
        }));

    return {
        jobType: code,
        productionByDay: productionByDay,
        cumulativeTotal: data.monthTotal,
    };
};


router.get('/', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { date, department } = req.query;
        const user = req.user

        let dep;
        if (department) {
            dep = await Department.findById(department).select('code')
        } else {
            dep = user?.department
        }

        // Xử lý ngày tháng
        const selected = new Date(date);
        const selectedDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 23, 59, 59, 999);
        const startOfMonth = new Date(selected.getFullYear(), selected.getMonth(), 1, 0, 0, 0, 0);

        // Cấu hình các loại công việc
        const jobTypesConfig = [
            { type: JOB_TYPE.VAN_HANH_KHOAN, field: 'drillDepth', code: 'MKS' }, // Khoan
            { type: JOB_TYPE.VAN_HANH_XE, field: 'quantity', code: 'SLD' },
        ];

        // Chạy aggregation cho tất cả các loại công việc song song (tối ưu hơn for...of tuần tự)
        const productionPromises = jobTypesConfig.map(config =>
            getProductionReport({
                jobType: config.type,
                code: config.code,
                productionField: config.field,
                departmentId: dep,
                startOfMonth: startOfMonth,
                selectedDate: selectedDate,
            })
        );

        const response = await Promise.all(productionPromises);

        res.status(200).json({
            status: 'success',
            message: 'Tính sản lượng tổng hợp thành công',
            data: response,
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});


module.exports = router;