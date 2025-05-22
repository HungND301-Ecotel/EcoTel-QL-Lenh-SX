const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const { body, validationResult } = require('express-validator');
const Shift = require('../models/Shift');
// const ProductionOrder = require('../models/ProductionOrder');
const Department = require('../models/Department');

// Lấy danh sách ca làm việc
// router.get('/', verifyToken, async (req, res) => {
//     try {
//         const { date, department } = req.query;
//         const query = {};

//         if (date) {
//             const startDate = new Date(date);
//             startDate.setHours(0, 0, 0, 0);
//             const endDate = new Date(date);
//             endDate.setHours(23, 59, 59, 999);
//             query.date = { $gte: startDate, $lte: endDate };
//         }

//         if (department) {
//             query.department = department;
//         }

//         const shifts = await Shift.find(query)
//             .populate('department', 'name code')
//             .populate('createdBy', 'username fullName')
//             .sort({ date: -1, startTime: 1 });

//         res.json(shifts);
//     } catch (err) {
//         console.error('Get shifts error:', err);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

// // Tạo ca làm việc mới
// router.post('/', [
//     verifyToken,
//     restrictTo('manager', 'admin'),
//     body('name').notEmpty().withMessage('Shift name is required'),
//     body('date').isISO8601().withMessage('Invalid date format'),
//     body('startTime').notEmpty().withMessage('Start time is required'),
//     body('endTime').notEmpty().withMessage('End time is required'),
//     body('department').isMongoId().withMessage('Invalid department ID')
// ], async (req, res) => {
//     try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() });
//         }

//         const { name, date, startTime, endTime, department, description } = req.body;

//         // Kiểm tra department tồn tại
//         const departmentExists = await Department.findById(department);
//         if (!departmentExists) {
//             return res.status(404).json({ message: 'Department not found' });
//         }

//         const shift = new Shift({
//             name,
//             date,
//             startTime,
//             endTime,
//             department,
//             description,
//             createdBy: req.userId
//         });

//         await shift.save();

//         res.status(201).json(shift);
//     } catch (err) {
//         console.error('Create shift error:', err);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

// // Cập nhật ca làm việc
// router.put('/:id', [
//     verifyToken,
//     restrictTo('manager', 'admin'),
//     body('name').optional().notEmpty().withMessage('Shift name cannot be empty'),
//     body('date').optional().isISO8601().withMessage('Invalid date format'),
//     body('startTime').optional().notEmpty().withMessage('Start time cannot be empty'),
//     body('endTime').optional().notEmpty().withMessage('End time cannot be empty'),
//     body('department').optional().isMongoId().withMessage('Invalid department ID')
// ], async (req, res) => {
//     try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() });
//         }

//         const shift = await Shift.findById(req.params.id);
//         if (!shift) {
//             return res.status(404).json({ message: 'Shift not found' });
//         }

//         const updates = req.body;
//         updates.updatedBy = req.userId;

//         Object.assign(shift, updates);
//         await shift.save();

//         res.json(shift);
//     } catch (err) {
//         console.error('Update shift error:', err);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

// // Lấy thông tin chi tiết ca làm việc
// router.get('/:id', verifyToken, async (req, res) => {
//     try {
//         const shift = await Shift.findById(req.params.id)
//             .populate('department', 'name code')
//             .populate('createdBy', 'username fullName')
//             .populate('updatedBy', 'username fullName');

//         if (!shift) {
//             return res.status(404).json({ message: 'Shift not found' });
//         }

//         // Lấy danh sách lệnh sản xuất của ca
//         const productionOrders = await ProductionOrder.find({ shift: shift._id })
//             .populate('employee', 'username fullName')
//             .populate('equipment', 'name type model')
//             .populate('createdBy', 'username fullName');

//         res.json({
//             shift,
//             productionOrders
//         });
//     } catch (err) {
//         console.error('Get shift details error:', err);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

// // Lấy báo cáo tổng hợp ca làm việc
// router.get('/:id/report', verifyToken, async (req, res) => {
//     try {
//         const shift = await Shift.findById(req.params.id)
//             .populate('department', 'name code');

//         if (!shift) {
//             return res.status(404).json({ message: 'Shift not found' });
//         }

//         // Lấy thống kê lệnh sản xuất
//         const productionOrders = await ProductionOrder.find({ shift: shift._id });
        
//         const report = {
//             shift: {
//                 id: shift._id,
//                 name: shift.name,
//                 date: shift.date,
//                 startTime: shift.startTime,
//                 endTime: shift.endTime,
//                 department: shift.department
//             },
//             statistics: {
//                 totalOrders: productionOrders.length,
//                 completedOrders: productionOrders.filter(order => order.status === 'completed').length,
//                 inProgressOrders: productionOrders.filter(order => order.status === 'in_progress').length,
//                 pendingOrders: productionOrders.filter(order => order.status === 'pending').length,
//                 cancelledOrders: productionOrders.filter(order => order.status === 'cancelled').length
//             },
//             equipment: await ProductionOrder.aggregate([
//                 { $match: { shift: shift._id } },
//                 { $group: {
//                     _id: '$equipment',
//                     totalOrders: { $sum: 1 },
//                     totalFuelConsumption: { $sum: '$fuelConsumption' }
//                 }},
//                 { $lookup: {
//                     from: 'equipment',
//                     localField: '_id',
//                     foreignField: '_id',
//                     as: 'equipmentDetails'
//                 }},
//                 { $unwind: '$equipmentDetails' }
//             ])
//         };

//         res.json(report);
//     } catch (err) {
//         console.error('Get shift report error:', err);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

module.exports = router; 