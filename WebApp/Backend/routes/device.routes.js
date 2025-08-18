const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Device = require('../models/Device');
const DeviceType = require('../models/DeviceType');
const Department = require('../models/Department');
const ExcelJS = require('exceljs')
const xlsx = require('xlsx')


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
            const order = await Order.findOne({ assignedTo: user._id, status: { $nin: ["completed", "cancel"] } })
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

router.delete('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        const result = await Device.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }

        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
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



const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const columnMapping = {
    'Id(Không sửa)': '_id',
    'Biển số': 'code',
    'Tên xe/máy': 'name',
    'Số xe/máy': 'vehicleNumber',
    'Loại xe': 'category',
    'Chủng loại': 'material',
    'Nhiên liệu': 'fuelType',
    'Trọng tải': 'capacity',
    'Công suất máy': 'power',
    'Đơn vị': 'department',
};
router.post('/importFile', upload.single('file'), verifyToken, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng chọn file' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // lấy header
        const headers = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0, raw: true })[0];
        // tạo ánh xạ vn-en
        const mappedHeaders = headers.map(header => columnMapping[header] || header);


        const data = xlsx.utils.sheet_to_json(worksheet, { header: mappedHeaders, range: 1 });
        const devicesImport = data.filter(row => row.code);

        if (devicesImport.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Không tìm thấy dữ liệu phương tiện hợp lệ trong file.' });
        }
        const uniqueDepartments = [...new Set(devicesImport.map(d => d.department).filter(Boolean))];
        const uniqueCategories = [...new Set(devicesImport.map(d => d.category).filter(Boolean))];

        const existingDepartments = await Department.find({ code: { $in: uniqueDepartments } });
        const existingCategories = await DeviceType.find({ name: { $in: uniqueCategories } });

        const departmentMap = new Map(existingDepartments.map(d => [d.code, d._id]));
        const categoryMap = new Map(existingCategories.map(c => [c.name, c._id]));

        // --- Kết thúc tối ưu hóa truy vấn ---

        const operations = [];

        for (const row of devicesImport) {
            const { _id, ...updateData } = row;
            const cleanedId = _id ? String(_id).trim().replace(/"/g, '') : null;

            if (!updateData.code) {
                return res.status(400).json({ status: 'error', message: 'Biển số (code) là bắt buộc' });
            }

            if (updateData.department) {
                const departmentId = departmentMap.get(updateData.department);
                if (departmentId) {
                    updateData.department = departmentId;
                } else {
                    return res.status(400).json({ status: 'error', message: `Mã phòng ban không hợp lệ: ${updateData.department}` });
                }
            }
            if (updateData.category) {
                const categoryId = categoryMap.get(updateData.category);
                if (categoryId) {
                    updateData.category = categoryId;
                } else {
                    return res.status(400).json({ status: 'error', message: `Loại phương tiện không hợp lệ: ${updateData.category}` });
                }
            }

            if (cleanedId) {
                operations.push({
                    updateOne: {
                        filter: { _id: cleanedId },
                        update: updateData,
                        upsert: true,
                    },
                });
            } else {
                const existingDevice = await Device.findOne({ code: updateData.code });
                if (existingDevice) {
                    return res.status(400).json({ status: 'error', message: `Biển số (code) đã tồn tại: ${updateData.code}` });
                }
                operations.push({
                    insertOne: {
                        document: updateData,
                    },
                });
            }
        }

        if (operations.length > 0) {
            await Device.bulkWrite(operations);
        }
        res.status(200).json({
            status: 'success',
            message: 'Tải thành cồng',
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Tải thất bại',
            error: error.message
        });
    }
});
router.post('/exportFile', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const data = req.body.data
        const user = req.user
        const query = {}
        if (user.role === "manager") {
            query.department = user.department._id;
        }

        const departments = await Department.find();
        const deviceTypes = await DeviceType.find();

        const workbook = new ExcelJS.Workbook();


        const worksheet = workbook.addWorksheet('DS.phuong_tien');

        // Định nghĩa tiêu đề và thuộc tính cột
        worksheet.columns = [
            { header: 'Id(Không sửa)', key: '_id', width: 20 },
            { header: 'Biển số', key: 'code', width: 25 },
            { header: 'Tên xe/máy', key: 'name', width: 15 },
            { header: 'Số xe/máy', key: 'vehicleNumber', width: 15 },
            { header: 'Loại xe', key: 'category', width: 10 },
            { header: 'Chủng loại', key: 'material', width: 15 },
            { header: 'Nhiên liệu', key: 'fuelType', width: 30 },
            { header: 'Trọng tải', key: 'capacity', width: 20 },
            { header: 'Công suất máy', key: 'power', width: 20 },
            { header: 'Đơn vị', key: 'department', width: 15 },
        ];

        // Điền dữ liệu
        const formattedDevices = (data || []).map(device => ({
            _id: device._id,
            code: device?.code || '',
            name: device?.name || '',
            vehicleNumber: device?.vehicleNumber || '',
            category: device?.category?.name || '',
            material: device?.material || '',
            fuelType: device?.fuelType || '',
            capacity: device?.capacity || '',
            power: device?.power || '',
            department: device?.department?.code || '',
        }));
        worksheet.addRows(formattedDevices);

        // Thiết lập style
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell(cell => {
                cell.font = { size: (rowNumber === 1) ? 9 : 8, bold: (rowNumber === 1) };
                cell.alignment = { vertical: 'middle', wrapText: (rowNumber === 1) };
            });
            row.height = (rowNumber === 1) ? 40 : 20;
        });

        const typeList = [...new Set(deviceTypes.map(p => p.name).filter(Boolean))];
        const deptList = [...new Set(departments.map(d => d.code).filter(Boolean))];

        worksheet.getColumn('X').values = ['devicetypes', ...typeList];
        worksheet.getColumn('Y').values = ['departments', ...deptList];
        worksheet.getColumn('X').hidden = true;
        worksheet.getColumn('Y').hidden = true;

        // Áp dụng Data Validation
        const MAX = Math.max(worksheet.rowCount + 100, 1000); // dư dòng để người dùng thêm
        worksheet.dataValidations.add(`E2:E${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: [`=$X$2:$X$${typeList.length + 1}`],
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
        });
        worksheet.dataValidations.add(`J2:J${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: [`=$Y$2:$Y$${deptList.length + 1}`], // nguồn department
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
        });

        // Ghi và gửi file
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'danh_sach_nguoi_dung.xlsx');
        res.send(buffer);

    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

module.exports = router; 