const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const Location = require('../models/Location');
const Material = require('../models/material');
const Shift = require('../models/Shift');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const ExcelJS = require('exceljs');
const xlsx = require('xlsx');
const dayjs = require('dayjs');
const { ROLE } = require('../config/config');
const { paginateQuery } = require('../utils/pagination');
const Internal = require('../models/Internal');


router.post('/', verifyToken, async (req, res, next) => {
    try {
        const { month, area, fromLevel, toLevel, distanceKm, liftHight, route, note, addedAt } = req.body
        const newInternal = new Internal({
            month, area, fromLevel, toLevel, distanceKm, liftHight, route, note, addedAt
        });
        await newInternal.save();
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

        const result = await Internal.deleteMany({ _id: { $in: ids } });
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
        const internal = await Internal.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!internal) {
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
        const match = {};

        // --- Aggregation ---
        const result = await TravelLog.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: "locations",
                    localField: "area",
                    foreignField: "_id",
                    as: "area"
                }
            },
            { $unwind: { path: "$area", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "locations",
                    localField: "route",
                    foreignField: "_id",
                    as: "route"
                }
            },
            { $unwind: { path: "$route", preserveNullAndEmptyArrays: true } },
            { $sort: { workingDate: -1 } }
        ]);

        res.status(200).send({
            status: "success",
            data: result
        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: "error", message: err.message });
    }
});


const columnMapping = {
    'Tháng': 'month',
    'Khu vực': 'area',
    'Từ mức': 'fromLevel',
    'Đến mức': 'toLevel',
    'Cung độ (km)': 'distanceKm',
    'Chiều cao N.tải (m)': 'liftHight',
    'Tuyến đường': 'route',
    'GHi chú': 'note',
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

        // 👉 Giới hạn phạm vi đọc chỉ đến cột N (bỏ X,Y,Z,W dropdown)
        const range = xlsx.utils.decode_range(worksheet['!ref']);
        range.e.c = 13; // Cột N = index 13 (A=0,...,N=13)
        worksheet['!ref'] = xlsx.utils.encode_range(range);

        // 👉 Đọc 2 dòng header để gộp
        const rawHeaderRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0 });
        const headerRow1 = rawHeaderRows[0];
        const headerRow2 = rawHeaderRows[1];

        // Tìm vị trí "Toàn tuyến" và "Trong đó cục bộ"
        const indexToanTuyen = headerRow1.indexOf("Toàn tuyến");
        const indexCucBo = headerRow1.indexOf("Trong đó cục bộ");

        // Lấy phần trước "Toàn tuyến"
        const headerPart1 = headerRow1.slice(0, indexToanTuyen);

        // Lấy phần sau phần cục bộ (bao gồm các cột cuối như Điểm đổ, Ca, Vật liệu)
        const headerPart3 = headerRow1.slice(indexCucBo + 4); // tuỳ bạn xem offset

        // Lấy phần của "Toàn tuyến" và "Cục bộ" trong dòng 2
        const headerPart2 = headerRow2.filter(Boolean);

        // Gộp tất cả
        const combinedHeaders = [...headerPart1, ...headerPart2, ...headerPart3];
        const mappedHeaders = combinedHeaders.map(h => columnMapping[h?.trim()] || h);

        // 👉 Đọc dữ liệu thực (bỏ 2 dòng đầu header)
        const data = xlsx.utils.sheet_to_json(worksheet, {
            header: mappedHeaders,
            range: 2,
            raw: true,
            cellDates: true,
            defval: null,
        });


        // 👉 Lọc bỏ dòng trống hoặc dòng dropdown
        const dataImport = data.filter(row => row.excavator && row.workingDate && row.shift);

        if (dataImport.length === 0) {
            req.logger.warn("⚠️ Import file thất bại - Không tìm thấy dữ liệu hợp lệ.");
            return res.status(400).json({ status: 'error', message: 'Không tìm thấy dữ liệu hợp lệ trong file.' });
        }

        // 👉 Chuẩn hóa ngày (Excel -> Date -> 00:00:00)
        dataImport.forEach(row => {
            if (typeof row.workingDate === 'number') {
                // Excel serial number → JS Date
                const excelEpoch = new Date(1899, 11, 30);
                const date = new Date(excelEpoch.getTime() + row.workingDate * 86400000);

                // 👇 reset hoàn toàn về 00:00:00.000 local
                date.setHours(0, 0, 0, 0);

                // 👇 cộng ngược offset để khi lưu UTC không bị lệch (ví dụ VN +7)
                const offset = date.getTimezoneOffset();
                const fixedDate = new Date(date.getTime() - offset * 60000);

                row.workingDate = fixedDate;
            }
            else if (row.workingDate instanceof Date) {
                row.workingDate.setHours(0, 0, 0, 0);
                const offset = row.workingDate.getTimezoneOffset();
                row.workingDate = new Date(row.workingDate.getTime() - offset * 60000);
            }
        })


        // 👉 Lấy danh sách unique để map ID
        const uniqueDevices = [...new Set(dataImport.map(d => d.excavator).filter(Boolean))];
        const uniqueLocations = [...new Set(dataImport.map(d => d.location).filter(Boolean))];
        const uniqueShifts = [...new Set(dataImport.map(d => d.shift).filter(Boolean))];
        const uniqueMaterials = [...new Set(dataImport.map(d => d.material).filter(Boolean))];

        const [existingDevices, existingLocations, existingShifts, existingMaterials] = await Promise.all([
            Device.find({ code: { $in: uniqueDevices } }).lean(),
            Location.find({ name: { $in: uniqueLocations } }).lean(),
            Shift.find({ name: { $in: uniqueShifts } }).lean(),
            Material.find({ name: { $in: uniqueMaterials } }).lean(),
        ]);

        const deviceMap = new Map(existingDevices.map(d => [d.code, d._id]));
        const locationMap = new Map(existingLocations.map(c => [c.name, c._id]));
        const shiftMap = new Map(existingShifts.map(c => [c.name, c._id]));
        const materialMap = new Map(existingMaterials.map(c => [c.name, c._id]));

        const operations = [];
        const invalidRows = [];

        for (const row of dataImport) {
            const { excavator, location, workingDate, shift, material, ...updateData } = row;

            // Gán ID máy xúc
            const deviceId = deviceMap.get(excavator);
            if (!deviceId) {
                invalidRows.push({ row, error: `Máy xúc không hợp lệ: ${excavator}` });
                continue;
            }
            updateData.excavator = deviceId;

            // Gán ID ca
            const shiftId = shiftMap.get(shift);
            if (!shiftId) {
                invalidRows.push({ row, error: `Ca không hợp lệ: ${shift}` });
                continue;
            }
            updateData.shift = shiftId;

            // Gán ID điểm đổ
            const locationId = locationMap.get(location);
            if (!locationId) {
                invalidRows.push({ row, error: `Điểm đổ tải không hợp lệ: ${location}` });
                continue;
            }
            updateData.location = locationId;

            // Gán ID vật liệu
            const materialId = materialMap.get(material);
            if (!materialId) {
                invalidRows.push({ row, error: `Vật liệu không hợp lệ: ${material}` });
                continue;
            }
            updateData.material = materialId;

            // Gán ngày
            if (!workingDate) {
                invalidRows.push({ row, error: 'Thiếu ngày làm việc (workingDate)' });
                continue;
            }
            updateData.workingDate = workingDate;

            // Thêm vào batch upsert
            operations.push({
                updateOne: {
                    filter: {
                        excavator: updateData.excavator,
                        workingDate: updateData.workingDate,
                        shift: updateData.shift,
                        location: updateData.location,
                        material: updateData.material,
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

        req.logger.info(`✅ ${user?.username} Import file thành công. ${dataImport.length} bản ghi xử lý.`);
        res.status(200).json({
            status: 'success',
            message: 'Import dữ liệu hoàn tất.',
            summary: {
                totalProcessed: dataImport.length,
                insertedCount: bulkResult ? bulkResult.upsertedCount : 0,
                updatedCount: bulkResult ? bulkResult.modifiedCount : 0,
                invalidCount: invalidRows.length,
            },
            invalidRows,
        });

    } catch (error) {
        req.logger.error("❌ Lỗi khi import file cung độ", error);
        res.status(500).json({
            status: 'error',
            message: 'Tải thất bại',
            error: error.message,
        });
    }
});


router.post('/exportFile', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const match = {};
        if (req.body.type) {
            match["material.acceptedProduct"] = req.body.type;
        }
        const data = await TravelLog.aggregate([
            {
                $lookup: {
                    from: "materials",
                    localField: "material",
                    foreignField: "_id",
                    as: "material"
                }
            },
            { $unwind: "$material" },
            { $match: match },
            {
                $lookup: {
                    from: "devices",
                    localField: "excavator",
                    foreignField: "_id",
                    as: "excavator"
                }
            },
            { $unwind: { path: "$excavator", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "shifts",
                    localField: "shift",
                    foreignField: "_id",
                    as: "shift"
                }
            },
            { $unwind: { path: "$shift", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "locations",
                    localField: "location",
                    foreignField: "_id",
                    as: "location"
                }
            },
            { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },
            { $sort: { workingDate: -1 } }
        ]);
        const devices = await Device.find().populate('category', 'name');
        const excavators = devices.filter(i => i.category?.name.toLowerCase().includes("máy xúc"))
        const locations = await Location.find();
        const materials = await Material.find();
        const shifts = await Shift.find();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('DS_CUNG_DO');

        // 1️⃣ Ghi header tầng 1
        worksheet.addRow([
            'Máy xúc', 'Ngày', 'Khu vực',
            'Tầng xúc', 'Độ cao thực tế nơi đổ',
            'Toàn tuyến', '',
            'Trong đó cục bộ', '', '', '',
            'Điểm đổ tải', 'Vật liệu', 'Ca'
        ]);

        // 2️⃣ Ghi header tầng 2
        worksheet.addRow([
            '', '', '', '', '',
            'C.độ (km)_1', 'Chiều cao N.tải (m)_1',
            'H min', 'H max', 'C. độ (km)_2', 'Chiều cao N.tải (m)_2', '', '', ''
        ]);

        // 3️⃣ Merge các cột tầng 1
        worksheet.mergeCells('A1:A2'); // Máy xúc
        worksheet.mergeCells('B1:B2'); //Ngày
        worksheet.mergeCells('C1:C2'); // Khu vực
        worksheet.mergeCells('D1:D2'); // Tâng xúc
        worksheet.mergeCells('E1:E2'); // Độ cao thực tế nơi đổ
        worksheet.mergeCells('F1:G1'); // Toàn tuyến
        worksheet.mergeCells('H1:K1'); // Trong đó cục bộ
        worksheet.mergeCells('L1:L2'); // Điểm đổ tải
        worksheet.mergeCells('M1:M2'); // Vật liệu
        worksheet.mergeCells('N1:N2'); // ca


        // 4️⃣ Đặt style cho header
        worksheet.getRow(1).font = { bold: true, size: 10 };
        worksheet.getRow(2).font = { bold: true, size: 10 };
        worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getRow(2).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getRow(1).height = 40;
        worksheet.getRow(2).height = 40;

        data.forEach(item => {
            worksheet.addRow([
                item.excavator?.code || '',
                item.workingDate ? new Date(item.workingDate) : '',
                item.area || '',
                item.excavationLevel || '',
                item.dumpHeightActual || '',
                item.fullDistanceKm || '',
                item.fullLiftHeightM || '',
                item.localMinHeightM || '',
                item.localMaxHeightM || '',
                item.localDistanceKm || '',
                item.localLiftHeightM || '',
                item.location?.name || '',
                item.material?.name || '',
                item.shift?.name || '',
            ]);
        });

        worksheet.columns = [
            { key: 'excavator', width: 12 },
            { key: 'workingDate', width: 12 },
            { key: 'area', width: 10 },
            { key: 'excavationLevel', width: 10 },
            { key: 'dumpHeightActual', width: 15 },
            { key: 'fullDistanceKm', width: 10 },
            { key: 'fullLiftHeightM', width: 15 },
            { key: 'localMinHeightM', width: 10 },
            { key: 'localMaxHeightM', width: 10 },
            { key: 'localDistanceKm', width: 12 },
            { key: 'localLiftHeightM', width: 15 },
            { key: 'location', width: 15 },
            { key: 'material', width: 12 },
            { key: 'shift', width: 5 },
        ];

        const dateCol = worksheet.getColumn('B'); // giả sử cột C là Ngày
        dateCol.numFmt = 'dd/mm/yyyy';

        const deviceList = [...new Set(excavators.map(p => p.code).filter(Boolean))];
        const locationList = [...new Set(locations.map(d => d.name).filter(Boolean))];
        const materialList = [...new Set(materials.map(d => d.name).filter(Boolean))];
        const shiftList = [...new Set(shifts.map(d => d.name).filter(Boolean))];

        worksheet.getColumn('X').values = ['excavators', ...deviceList];
        worksheet.getColumn('Y').values = ['locations', ...locationList];
        worksheet.getColumn('Z').values = ['materials', ...materialList];
        worksheet.getColumn('W').values = ['shifts', ...shiftList];
        worksheet.getColumn('X').hidden = true;
        worksheet.getColumn('Y').hidden = true;
        worksheet.getColumn('Z').hidden = true;
        worksheet.getColumn('W').hidden = true;

        const MAX = Math.max(worksheet.rowCount + 100, 1000);

        worksheet.dataValidations.add(`A2:A${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: [`=$X$2:$X$${deviceList.length + 1}`],
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
        });
        worksheet.dataValidations.add(`L2:L${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: [`=$Y$2:$Y$${locationList.length + 1}`],
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
        });
        worksheet.dataValidations.add(`M2:M${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: [`=$Z$2:$Z$${materialList.length + 1}`],
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
        });
        worksheet.dataValidations.add(`N2:N${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: [`=$W$2:$W$${shiftList.length + 1}`],
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