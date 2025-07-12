const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Device = require('../models/Device');
const DeviceType = require('../models/DeviceType');
const Department = require('../models/Department');


const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const Order = require('../models/Order');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const user = req.user
        const query = {}

        if (req.query.q) {
            const regex = new RegExp(req.query.q, 'i');
            query.$or = [
                { code: regex },
                { name: regex },
                { vehicleNumber: regex },
                { material: regex },
                { vehicleNumber: regex },
                { vehicleNumber: regex }
            ];
        }
        if (req.query.department) {
            query.department = req.query.department;
        }
        if (req.query.status) {
            query.status = req.query.status;
        }
        if (user.role === "employee") {
            const order = await Order.findOne({ assignedTo: user._id, status: { $ne: "completed" } })
            const lastDevice = order?.device[order.device.length - 1];
            const excavators = order?.excavator[order.excavator.length - 1];

            query._id = { $in: [lastDevice, excavators] };
        }

        if (user.role === "manager") {
            query.department = user.department._id;
        }
        const devices = await Device.find(query)
            .populate('department', 'name code')
            .populate('category')

        res.status(200).json({
            status: 'success',
            results: devices.length,
            data:
                devices
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});


router.get('/excavators/all', verifyToken, async (req, res, next) => {
    try {
        const allTypes = await DeviceType.find();
        const targetTypes = allTypes
            .filter(type => type.name.toLowerCase().includes("máy xúc"))
            .map(type => type._id);

        const query = {}


        if (targetTypes) {
            query.category = { $in: targetTypes };
        }

        const devices = await Device.find(query).populate('category').populate('department', 'name code')


        res.status(200).json({
            status: 'success',
            results: devices.length,
            data:
                devices
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});


router.post('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { name, code, vehicleNumber, category, material, fuelType, capacity, power, coordinates, department, status } = req.body;
        const existingDevice = await Device.findOne({ code });
        if (existingDevice) {
            return res.status(400).send({ status: 'error', message: 'Mã thiết bị đã tồn tại' });
        }
        const device = await Device.create({
            name,
            code,
            department,
            vehicleNumber,
            category,
            material,
            fuelType,
            capacity, power,
            status,
            coordinates: {
                type: 'Point',
                coordinates: [coordinates.lng, coordinates.lat],
            },
            createdBy: req.user._id
        });

        res.status(201).json({
            status: 'success',
            data:
                device

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const device = await Device.findById(req.params.id)
            .populate('category')
            .populate('department', 'name code')
            .populate('createdBy', 'username fullName')
            .populate('updatedBy', 'username fullName');

        if (!device) {
            return res.status(200).send({ status: 'error', message: 'No device found with that ID' });
        }

        res.status(200).json({
            status: 'success',
            data:
                device

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.put('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const device = await Device.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                coordinates: {
                    type: 'Point',
                    coordinates: [req.body.coordinates.lng, req.body.coordinates.lat],
                },
                updatedBy: req.user._id
            },
            {
                new: true,
                runValidators: true
            }
        )

        if (!device) {
            return res.status(404).json({ status: 'error', message: 'No device found with that ID' });
        }

        res.status(200).json({
            status: 'success',
            data:
                device

        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.delete('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const device = await Device.findByIdAndDelete(req.params.id);

        if (!device) {
            return res.status(404).json({ status: 'error', message: 'No device found with that ID' });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.get('/count/status', verifyToken, restrictTo('admin', 'manager', 'dispatcher'), async (req, res, next) => {
    try {
        const user = req.user
        const query = {}
        const query2 = {}

        if (user.role === "manager") {
            query.department = user?.department._id
            query2._id = user?.department._id
        }
        const departments = await Department.find(query2);
        const devices = await Device.find(query).populate("department")
        const deviceTypes = await DeviceType.find()

        const statusList = ['available', 'in_use', 'maintenance', 'retired']

        let data = [];

        for (let type of deviceTypes) {
            // Lọc thiết bị theo loại
            const devicesByType = devices.filter(d => d?.category?.toString() === type._id.toString());

            const organizations = [];

            for (let dept of departments) {
                const deptId = dept._id.toString();

                // Lọc các thiết bị thuộc đơn vị này
                const devicesInDept = devicesByType.filter(d => d.department?._id?.toString() === deptId);

                // Tính số lượng theo trạng thái
                const statusCounts = {
                    available: 0,
                    in_use: 0,
                    maintenance: 0,
                    retired: 0
                };

                for (let device of devicesInDept) {
                    if (statusList.includes(device.status)) {
                        statusCounts[device.status]++;
                    }
                }

                organizations.push({
                    departmentName: dept.code,
                    statusCounts
                });
            }

            data.push({
                typeName: type.name,
                organizations
            });
        }

        res.status(200).json({ status: 'success', data: data })


    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
})


module.exports = router; 