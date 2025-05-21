const express = require('express');
const router = express.Router();
const { pool } = require('../config/db.config');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

// Tạo lệnh sản xuất mới
router.post('/', verifyToken, checkRole(['manager', 'supervisor']), async (req, res) => {
    try {
        const {
            shiftId,
            employeeId,
            equipmentId,
            location,
            workContent,
            safetyMeasures,
            startTime,
            endTime
        } = req.body;

        const result = await pool.request()
            .input('shiftId', shiftId)
            .input('employeeId', employeeId)
            .input('equipmentId', equipmentId)
            .input('location', location)
            .input('workContent', workContent)
            .input('safetyMeasures', safetyMeasures)
            .input('startTime', startTime)
            .input('endTime', endTime)
            .input('createdBy', req.user.id)
            .input('status', 'pending')
            .query(`
                INSERT INTO ProductionOrders (
                    shiftId, employeeId, equipmentId, location, 
                    workContent, safetyMeasures, startTime, endTime,
                    createdBy, status, createdAt
                )
                VALUES (
                    @shiftId, @employeeId, @equipmentId, @location,
                    @workContent, @safetyMeasures, @startTime, @endTime,
                    @createdBy, @status, GETDATE()
                );
                SELECT SCOPE_IDENTITY() AS id;
            `);

        const orderId = result.recordset[0].id;

        res.status(201).json({
            success: true,
            message: 'Production order created successfully',
            orderId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Lấy danh sách lệnh sản xuất
router.get('/', verifyToken, async (req, res) => {
    try {
        const { status, shiftId, employeeId, startDate, endDate } = req.query;
        let query = `
            SELECT 
                po.*,
                e.fullName as employeeName,
                eq.name as equipmentName,
                s.name as shiftName,
                u.fullName as createdByName
            FROM ProductionOrders po
            JOIN Employees e ON po.employeeId = e.id
            JOIN Equipment eq ON po.equipmentId = eq.id
            JOIN Shifts s ON po.shiftId = s.id
            JOIN Users u ON po.createdBy = u.id
            WHERE 1=1
        `;

        const request = pool.request();

        if (status) {
            query += ' AND po.status = @status';
            request.input('status', status);
        }
        if (shiftId) {
            query += ' AND po.shiftId = @shiftId';
            request.input('shiftId', shiftId);
        }
        if (employeeId) {
            query += ' AND po.employeeId = @employeeId';
            request.input('employeeId', employeeId);
        }
        if (startDate) {
            query += ' AND po.startTime >= @startDate';
            request.input('startDate', startDate);
        }
        if (endDate) {
            query += ' AND po.endTime <= @endDate';
            request.input('endDate', endDate);
        }

        // Nếu là nhân viên, chỉ xem lệnh của mình
        if (req.user.role === 'employee') {
            query += ' AND po.employeeId = @currentUserId';
            request.input('currentUserId', req.user.id);
        }

        query += ' ORDER BY po.createdAt DESC';

        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Cập nhật trạng thái lệnh sản xuất
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, workResult, fuelConsumption } = req.body;

        // Kiểm tra quyền cập nhật
        const orderResult = await pool.request()
            .input('orderId', id)
            .query('SELECT * FROM ProductionOrders WHERE id = @orderId');

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Production order not found'
            });
        }

        const order = orderResult.recordset[0];

        // Chỉ cho phép nhân viên được giao việc cập nhật trạng thái
        if (req.user.role === 'employee' && order.employeeId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this order'
            });
        }

        // Cập nhật trạng thái và kết quả công việc
        await pool.request()
            .input('orderId', id)
            .input('status', status)
            .input('workResult', workResult)
            .input('fuelConsumption', fuelConsumption)
            .input('updatedAt', new Date())
            .query(`
                UPDATE ProductionOrders 
                SET status = @status,
                    workResult = @workResult,
                    fuelConsumption = @fuelConsumption,
                    updatedAt = @updatedAt
                WHERE id = @orderId
            `);

        res.json({
            success: true,
            message: 'Production order updated successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Lập biên bản bàn giao ca
router.post('/:id/handover', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { equipmentStatus, notes, nextShiftId } = req.body;

        // Kiểm tra lệnh sản xuất tồn tại
        const orderResult = await pool.request()
            .input('orderId', id)
            .query('SELECT * FROM ProductionOrders WHERE id = @orderId');

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Production order not found'
            });
        }

        // Tạo biên bản bàn giao
        await pool.request()
            .input('orderId', id)
            .input('equipmentStatus', equipmentStatus)
            .input('notes', notes)
            .input('nextShiftId', nextShiftId)
            .input('createdBy', req.user.id)
            .query(`
                INSERT INTO HandoverReports (
                    orderId, equipmentStatus, notes, nextShiftId,
                    createdBy, createdAt
                )
                VALUES (
                    @orderId, @equipmentStatus, @notes, @nextShiftId,
                    @createdBy, GETDATE()
                )
            `);

        res.status(201).json({
            success: true,
            message: 'Handover report created successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router; 