const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Device = require('../models/Device');
const { JOB_TYPE, ROLE, STATUS_ORDER, STATUS_DEVICE, STATUS_DEVICES } = require('../config/config');
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


        if (user.role === ROLE.MANAGER) {
            query.department = user.department._id;
        }

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        let lte = endOfToday;
        const orders = await Order.find({ workingDate: { $lte: lte }, status: STATUS_ORDER.INPROGRESS }).populate("assignedTo", "fullName salaryCode")
        const devices = await Device.find(query)
            .populate('department', 'name code')
            .populate('category')
            .collation({ locale: "vi", strength: 1 })
            .sort({ code: 1 });

        const deviceToOrderMap = new Map();
        for (const order of orders) {
            // Kiểm tra xem có device trong order không
            if (order.device && order.device.length > 0) {
                // Lấy device cuối cùng trong mảng
                const lastDevice = order.device[order.device.length - 1];
                deviceToOrderMap.set(lastDevice._id.toString(), order);
            }
        }
        const devicesWithAssignedInfo = devices.map(device => {
            const deviceObj = device.toObject();
            const assignedOrder = deviceToOrderMap.get(deviceObj._id.toString());

            if (assignedOrder && assignedOrder.assignedTo) {
                // Thêm thông tin người dùng được giao việc vào object device
                deviceObj.assignedTo = assignedOrder.assignedTo?.fullName + ' - ' + assignedOrder.assignedTo?.salaryCode || null;
            }
            return deviceObj;
        });
        req.logger.info(`🔥  Load phương tiện thành công`);
        res.status(200).json({
            status: 'success',
            results: devicesWithAssignedInfo.length,
            data:
                devicesWithAssignedInfo
        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
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

        req.logger.info(`🔥  Load phương tiện thành công`);
        res.status(200).json({
            status: 'success',
            results: devices.length,
            data:
                devices
        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.get('/car/all', verifyToken, async (req, res, next) => {
    try {
        const allTypes = await DeviceType.find();
        const targetTypes = allTypes
            .filter(type => type.name.toLowerCase().includes("vận tải"))
            .map(type => type._id);

        const query = {}


        if (targetTypes) {
            query.category = { $in: targetTypes };
        }

        const devices = await Device.find(query).populate('category').populate('department', 'name code')

        req.logger.info(`🔥  Load phương tiện vận tải thành công`);
        res.status(200).json({
            status: 'success',
            results: devices.length,
            data:
                devices
        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.get('/vehicle/all', verifyToken, async (req, res, next) => {
    try {
        const allTypes = await DeviceType.find();
        const targetTypes = allTypes
            .filter(type => type.group.toLowerCase().includes("xe"))
            .map(type => type._id);

        const query = {}


        if (targetTypes) {
            query.category = { $in: targetTypes };
        }

        const devices = await Device.find(query).populate('category').populate('department', 'name code')

        req.logger.info(`🔥  Load phương tiện xe thành công`);
        res.status(200).json({
            status: 'success',
            results: devices.length,
            data:
                devices
        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.post('/', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN), async (req, res, next) => {
    try {
        const { name, code, vehicleNumber, category, material, note, fuelType, capacity, power, coordinates, department, status } = req.body;
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
            note,
            coordinates: {
                type: 'Point',
                coordinates: [coordinates.lng, coordinates.lat],
            },
            createdBy: req.user._id
        });
        req.logger.info(`🔥  Tạo phương tiện thành công`);
        res.status(201).json({
            status: 'success',
            data:
                device

        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
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
            req.logger.error("❌ Không tìm thấy phương tiện");
            return res.status(200).send({ status: 'error', message: 'No device found with that ID' });
        }
        req.logger.info(`🔥 Load phương tiện thành công`);
        res.status(200).json({
            status: 'success',
            data:
                device

        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.put('/:id', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN), async (req, res, next) => {
    try {
        const user = req.user;
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
            req.logger.error("❌ không tìm thấy phương tiện");
            return res.status(404).json({ status: 'error', message: 'No device found with that ID' });
        }
        req.logger.info(`🔥${user?.username}  Sửa phương tiện thành công`);
        res.status(200).json({
            status: 'success',
            data:
                device

        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.post('/update_status', verifyToken, async (req, res, next) => {
    try {
        const user = req.user
        const now = new Date();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        const orders = await Order.find({ workingDate: { $gte: startOfToday, $lte: endOfToday } }).populate("device").populate("job").populate("shift")

        const updateDeviceStatus = async (deviceId, newStatus) => {
            if (!deviceId || !newStatus) return;
            await Device.findByIdAndUpdate(deviceId, { status: newStatus }, { new: true });
            req.logger.info(`✅ Device ${deviceId} đã cập nhật ${newStatus}`);
        };
        const isNowInShift = (shift) => {
            if (!shift?.startTime || !shift?.endTime) return false;
            const [sh, sm] = shift.startTime.split(":").map(Number);
            const [eh, em] = shift.endTime.split(":").map(Number);

            const shiftStart = new Date(now);
            shiftStart.setHours(sh, sm, 0, 0);

            const shiftEnd = new Date(now);
            shiftEnd.setHours(eh, em, 0, 0);

            console.log(shiftStart, shiftEnd, now);

            return now >= shiftStart && now <= shiftEnd;
        };
        for (const order of orders) {
            if (!isNowInShift(order.shift)) continue; // chỉ xử lý ca hiện tại

            const lastDevice = order.device?.length ? order.device[order.device.length - 1] : null;
            if (!lastDevice) continue;

            let newStatus = null;

            switch (order.status) {
                case STATUS_ORDER.INPROGRESS:
                    if (order.job?.type) {
                        const type = order.job.type.toLowerCase();

                        if (type.includes(JOB_TYPE.SUA_CHUA_BAO_DUONG.toLowerCase())) {
                            newStatus = STATUS_DEVICE.MAINTENANCE;
                        } else if (
                            [
                                JOB_TYPE.VAN_HANH_XE,
                                JOB_TYPE.VAN_HANH_XUC,
                                JOB_TYPE.VAN_HANH_XE_PHUC_VU,
                                JOB_TYPE.VAN_HANH_KHOAN,
                                JOB_TYPE.VAN_HANH_GAT,
                                JOB_TYPE.VAN_HANH_BOM,
                                JOB_TYPE.VAN_HANH_SANG,
                            ].map(j => j.toLowerCase()).includes(type)
                        ) {
                            newStatus = STATUS_DEVICE.IN_USE;
                        }
                    }
                    break;

                case STATUS_ORDER.COMPLETED:
                case STATUS_ORDER.WARNING:
                case STATUS_ORDER.CANCEL:
                    if (order.job?.type) {
                        const type = order.job.type.toLowerCase();
                        if (
                            [
                                JOB_TYPE.VAN_HANH_XE,
                                JOB_TYPE.VAN_HANH_XUC,
                                JOB_TYPE.VAN_HANH_XE_PHUC_VU,
                                JOB_TYPE.VAN_HANH_KHOAN,
                                JOB_TYPE.VAN_HANH_GAT,
                                JOB_TYPE.VAN_HANH_BOM,
                                JOB_TYPE.VAN_HANH_SANG,
                            ].map(j => j.toLowerCase()).includes(type)
                        ) {
                            newStatus = STATUS_DEVICE.AVAILABLE;
                        }
                    }
                    break;

                default:
                    break;
            }

            if (newStatus) {
                await updateDeviceStatus(lastDevice._id, newStatus);
            }
        }

        req.logger.info(`🔥${user?.username}  cập nhật trạng thái phương tiện thành công`);
        res.status(200).json({
            status: 'success',

        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});


router.delete('/', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN), async (req, res, next) => {
    try {
        const user = req.user
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            req.logger.error("❌ Chọn bản ghi cần xóa");
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        const result = await Device.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            req.logger.error("❌ không tìm thấy bản ghi cần xóa");
            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }
        req.logger.info(`🔥${user?.username}  Đã xóa ${result.deletedCount} bản ghi`);
        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.get('/count/status', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const user = req.user
        const query = {}
        const queryDept = {}

        if (user.role === ROLE.MANAGER) {
            query.department = user?.department._id
            queryDept._id = user?.department._id
        }

        const departments = await Department.find(queryDept);
        const devices = await Device.find(query)
            .populate("department")
            .populate("category"); // populate category để lấy DeviceType trực tiếp


        let data = [];

        for (let dept of departments) {
            const deptId = dept._id.toString();

            // Lọc thiết bị theo phân xưởng
            const devicesInDept = devices.filter(d => d.department?._id?.toString() === deptId);

            // Nhóm theo loại phương tiện
            const typesMap = new Map();

            for (let device of devicesInDept) {
                const typeId = device.category?._id?.toString();
                const typeName = device.category?.name || "Unknown";

                if (!typesMap.has(typeId)) {
                    typesMap.set(typeId, {
                        typeId,
                        typeName,
                        statusCounts: {
                            available: 0,
                            in_use: 0,
                            maintenance: 0,
                            retired: 0
                        }
                    });
                }

                const typeGroup = typesMap.get(typeId);
                if (STATUS_DEVICES.includes(device.status)) {
                    typeGroup.statusCounts[device.status]++;
                }
            }

            data.push({
                departmentId: dept._id,
                departmentName: dept.code,
                deviceTypes: Array.from(typesMap.values())
            });
        }

        req.logger.info(`🔥 Load thành công`);
        res.status(200).json({ status: 'success', data });

    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).json({ status: 'error', message: err.message })
    }
});



const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const columnMapping = {
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
        const user = req.user;
        if (!req.file) {
            req.logger.error("❌ Vui lòng chọn file");
            return res.status(400).json({ status: 'error', message: 'Vui lòng chọn file' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const headers = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0, raw: true })[0];
        const mappedHeaders = headers.map(header => columnMapping[header] || header);

        const data = xlsx.utils.sheet_to_json(worksheet, { header: mappedHeaders, range: 1 });
        const devicesToProcess = data.filter(row => row.code);

        if (devicesToProcess.length === 0) {
            req.logger.error("❌ không tìm thấy dữ liệu hợp lệ");
            return res.status(400).json({ status: 'error', message: 'Không tìm thấy dữ liệu phương tiện hợp lệ trong file.' });
        }

        const uniqueDepartments = [...new Set(devicesToProcess.map(d => d.department).filter(Boolean))];
        const uniqueCategories = [...new Set(devicesToProcess.map(d => d.category).filter(Boolean))];

        const [existingDepartments, existingCategories] = await Promise.all([
            Department.find({ code: { $in: uniqueDepartments } }).lean(),
            DeviceType.find({ name: { $in: uniqueCategories } }).lean(),
        ]);

        const departmentMap = new Map(existingDepartments.map(d => [d.code, d._id]));
        const categoryMap = new Map(existingCategories.map(c => [c.name, c._id]));

        const operations = [];
        const invalidRows = [];

        for (const row of devicesToProcess) {
            const { department, category, ...updateData } = row;

            // Kiểm tra các trường bắt buộc
            if (!updateData.code) {
                invalidRows.push({ row: row, error: 'Biển số (code) là bắt buộc.' });
                continue;
            }

            // Gán ID cho department
            let departmentId = null;
            if (department) {
                departmentId = departmentMap.get(department);
                if (!departmentId) {
                    invalidRows.push({ row: row, error: `Mã phòng ban không hợp lệ: ${department}` });
                    continue;
                }
            }
            if (departmentId) {
                updateData.department = departmentId;
            }

            // Gán ID cho category
            let categoryId = null;
            if (category) {
                categoryId = categoryMap.get(category);
                if (!categoryId) {
                    invalidRows.push({ row: row, error: `Loại phương tiện không hợp lệ: ${category}` });
                    continue;
                }
            }
            if (categoryId) {
                updateData.category = categoryId;
            }

            // Thêm thao tác updateOne với upsert
            operations.push({
                updateOne: {
                    filter: { code: updateData.code },
                    update: updateData,
                    upsert: true,
                },
            });
        }

        let bulkResult = null;
        if (operations.length > 0) {
            bulkResult = await Device.bulkWrite(operations);
        }
        req.logger.info(`🔥${user?.username}   Import thành công ${devicesToProcess.length} bản ghi.`);
        res.status(200).json({
            status: 'success',
            message: 'Import dữ liệu hoàn tất.',
            summary: {
                totalProcessed: devicesToProcess.length,
                insertedCount: bulkResult ? bulkResult.upsertedCount : 0,
                updatedCount: bulkResult ? bulkResult.modifiedCount : 0,
                invalidCount: invalidRows.length,
            },
            invalidRows: invalidRows,
        });

    } catch (error) {
        req.logger.error("❌ Lỗi khi import file", error);
        res.status(500).json({
            status: 'error',
            message: 'Tải thất bại',
            error: error.message
        });
    }
});
router.post('/exportFile', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const data = req.body.data
        const user = req.user
        const query = {}
        if (user.role === ROLE.MANAGER) {
            query.department = user.department._id;
        }

        const departments = await Department.find();
        const deviceTypes = await DeviceType.find();

        const workbook = new ExcelJS.Workbook();


        const worksheet = workbook.addWorksheet('DS.phuong_tien');

        // Định nghĩa tiêu đề và thuộc tính cột
        worksheet.columns = [
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
        worksheet.dataValidations.add(`D2:D${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: [`=$X$2:$X$${typeList.length + 1}`],
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
        });
        worksheet.dataValidations.add(`I2:I${MAX}`, {
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
        req.logger.info(`🔥  export file thành công`);
    } catch (err) {
        req.logger.error("❌ Lỗi import file", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

module.exports = router; 