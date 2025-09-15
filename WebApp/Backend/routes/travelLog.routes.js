const express = require('express');
const router = express.Router();
const TravelLog = require('../models/TravelLog');
const Device = require('../models/Device');
const Location = require('../models/Location');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const ExcelJS = require('exceljs');
const xlsx = require('xlsx');


router.post('/', verifyToken, async (req, res, next) => {
    try {
        const { excavator, distance, location, startTime, endTime } = req.body
        const newTravelLog = new TravelLog({
            excavator, distance, location, startTime, endTime
        });
        await newTravelLog.save();
        req.logger.info(`🔥 Tạo thành công cung độ`);

        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        req.logger.error("❌ Lỗi khi tạo", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.delete('/', verifyToken, async (req, res, next) => {
    try {
        const user = req.user
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            req.logger.error("❌ Vui lòng chọn cung độ cần xóa");
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        const result = await TravelLog.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            req.logger.error("❌ không tìm thấy bản ghi cần xóa");

            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }
        req.logger.info(`🔥 ${user?.username}  Đã xóa ${result.deletedCount} bản ghi cung độ`);

        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi xóa", err);

        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const user = req.user
        const travellog = await TravelLog.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!travellog) {
            req.logger.error("❌ Sửa thất bại");

            return res.status(404).send({ status: 'error', message: 'Sửa thất bại ' });
        }
        req.logger.info(`🔥 ${user?.username} Sửa cung độ thành công`);

        res.status(200).json({
            status: 'success',
            message: 'Sửa thành công'
        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.get('/', verifyToken, async (req, res) => {
    try {
        const query = {}

        if (req.query.startTime && req.query.endTime) {
            const startTime = new Date(req.query.startTime);
            startTime.setHours(0, 0, 0, 0);  // từ 00:00:00

            const endTime = new Date(req.query.endTime);
            endTime.setHours(23, 59, 59, 999); // tới 23:59:59.999

            query.startTime = { $gte: startTime };
            query.endTime = { $lte: endTime };

        } else if (req.query.startTime) {
            const startTime = new Date(req.query.startTime);
            startTime.setHours(0, 0, 0, 0);
            query.startTime = { $gte: startTime };

        } else if (req.query.endTime) {
            const endTime = new Date(req.query.endTime);
            endTime.setHours(23, 59, 59, 999);
            query.endTime = { $lte: endTime };
        }
        const travellogs = await TravelLog.find(query).populate('location', 'name').populate('excavator', 'code')
            .sort({ startTime: -1 });
        req.logger.info(`🔥 Load thành công`);
        res.status(200).send({ status: 'success', data: travellogs });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

const columnMapping = {
    'Máy xúc': 'excavator',
    'Điểm đổ tải': 'location',
    'Cung độ (km)': 'distance',
    'Bắt đầu': 'startTime',
    'Kết thúc': 'endTime',
};
router.post('/importFile', upload.single('file'), verifyToken, async (req, res) => {
    try {
        const user = req.user;
        if (!req.file) {
            req.logger.warn("⚠️ Import file thất bại - Không có file được chọn.");
            return res.status(400).json({ status: 'error', message: 'Vui lòng chọn file' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const headers = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0, raw: true })[0];
        const mappedHeaders = headers.map(header => columnMapping[header] || header);
        const data = xlsx.utils.sheet_to_json(worksheet, { header: mappedHeaders, range: 1 });
        const dataImport = data.filter(row => row.excavator);

        if (dataImport.length === 0) {
            req.logger.warn("⚠️ Import file thất bại - Không tìm thấy dữ liệu hợp lệ.");
            return res.status(400).json({ status: 'error', message: 'Không tìm thấy dữ liệu hợp lệ trong file.' });
        }

        const uniqueDevices = [...new Set(dataImport.map(d => d.department).filter(Boolean))];
        const uniqueLocations = [...new Set(dataImport.map(d => d.location).filter(Boolean))];

        const [existingDepartments, existingCategories] = await Promise.all([
            Device.find({ code: { $in: uniqueDevices } }).lean(),
            Location.find({ name: { $in: uniqueLocations } }).lean(),
        ]);

        const deviceMap = new Map(existingDepartments.map(d => [d.code, d._id]));
        const locationMap = new Map(existingCategories.map(c => [c.name, c._id]));

        const operations = [];
        const invalidRows = [];


        for (const row of dataImport) {
            const { excavator, location, ...updateData } = row;

            // Gán ID cho department
            let deviceId = null;
            if (excavator) {
                deviceId = deviceMap.get(excavator);
                if (!deviceId) {
                    invalidRows.push({ row: row, error: `Mã phòng ban không hợp lệ: ${excavator}` });
                    continue;
                }
            }
            if (deviceId) {
                updateData.excavator = deviceId;
            }

            // Gán ID cho category
            let locationId = null;
            if (location) {
                locationId = locationMap.get(location);
                if (!locationId) {
                    invalidRows.push({ row: row, error: `Loại phương tiện không hợp lệ: ${location}` });
                    continue;
                }
            }
            if (locationId) {
                updateData.location = locationId;
            }

            // Thêm thao tác updateOne với upsert
            operations.push({
                updateOne: {
                    filter: {
                        excavator: updateData.excavator,
                        startTime: updateData.startTime
                    },
                    update: updateData,
                    upsert: true,
                },
            });
        }

        let bulkResult = null;
        if (operations.length > 0) {
            bulkResult = await TravelLog.bulkWrite(operations);
        }
        req.logger.info(`✅ ${user?.username}  Import file thành công. Đã xử lý ${dataImport.length} bản ghi.`);
        res.status(200).json({
            status: 'success',
            message: 'Import dữ liệu hoàn tất.',
            summary: {
                totalProcessed: dataImport.length,
                insertedCount: bulkResult ? bulkResult.upsertedCount : 0,
                updatedCount: bulkResult ? bulkResult.modifiedCount : 0,
                invalidCount: invalidRows.length,
            },
            invalidRows: invalidRows,
        });
    } catch (error) {
        req.logger.error("❌ Lỗi khi import file cung độ", error);
        res.status(500).json({
            status: 'error',
            message: 'Tải thất bại',
            error: error.message
        });
    }
});

router.post('/exportFile', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const data = await TravelLog.find().populate('excavator', 'code').populate('location', 'name');
        const devices = await Device.find().populate('category', 'name');
        const excavators = devices.filter(i => i.category?.name.toLowerCase().includes("máy xúc"))
        const locations = await Location.find();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('DS.cung_do');

        worksheet.columns = [
            { header: 'Máy xúc', key: 'excavator', width: 20 },
            { header: 'Điểm đổ tải', key: 'location', width: 20 },
            { header: 'Cung độ (km)', key: 'distance', width: 20 },
            { header: 'Bắt đầu', key: 'startTime', width: 20 },
            { header: 'Kết thúc', key: 'endTime', width: 20 },
        ];

        const formattedTravelLogs = (data || []).map(item => ({
            excavator: item?.excavator?.code || '',
            location: item?.location?.name || '',
            distance: item?.distance || '',
            startTime: item?.startTime || '',
            endTime: item?.endTime || '',
        }));
        worksheet.addRows(formattedTravelLogs);

        worksheet.eachRow((row, rowNumber) => {
            row.eachCell(cell => {
                cell.font = { size: 9, bold: (rowNumber === 1) };
                cell.alignment = { vertical: 'middle', wrapText: true, };
            });
        });

        const deviceList = [...new Set(excavators.map(p => p.code).filter(Boolean))];
        const locationList = [...new Set(locations.map(d => d.name).filter(Boolean))];

        worksheet.getColumn('X').values = ['excavators', ...deviceList];
        worksheet.getColumn('Y').values = ['locations', ...locationList];
        worksheet.getColumn('X').hidden = true;
        worksheet.getColumn('Y').hidden = true;

        const MAX = Math.max(worksheet.rowCount + 100, 1000);

        worksheet.dataValidations.add(`A2:A${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: [`=$X$2:$X$${deviceList.length + 1}`],
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
        });
        worksheet.dataValidations.add(`B2:B${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: [`=$Y$2:$Y$${locationList.length + 1}`],
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
        });

        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'danh_sach_nguoi_dung.xlsx');
        res.send(buffer);
        req.logger.info("✅ Xuất file thành công.");

    } catch (err) {
        req.logger.error("❌ Lỗi khi xuất file vật liệu", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});
module.exports = router; 