const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const Material = require('../models/material');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const Order = require('../models/Order');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const ExcelJS = require('exceljs');
const xlsx = require('xlsx');


router.post('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { name, density, mass } = req.body
        const existingMaterial = await Material.findOne({ name });
        if (existingMaterial) {
            req.logger.error("❌ Tên vật liệu đã tồn tại");
            return res.status(400).send({ status: 'error', message: 'Tên hàng hóa đã tồn tại' });
        }
        const newMaterial = new Material({
            name: name,
            density: density,
            mass: mass,

        });
        await newMaterial.save();
        req.logger.info(`🔥 Tạo thành công`);

        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        req.logger.error("❌ Lỗi khi tạo", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

router.delete('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const user = req.user
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            req.logger.error("❌ Vui lòng chọn bản ghi cần xóa");
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        const result = await Material.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            req.logger.error("❌ không tìm thấy bản ghi cần xóa");

            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }
        req.logger.info(`🔥 ${user?.username}  Đã xóa ${result.deletedCount} bản ghi`);

        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi xóa", err);

        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.put('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const user = req.user
        const material = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!material) {
            req.logger.error("❌ Sửa thất bại");

            return res.status(404).send({ status: 'error', message: 'Sửa thất bại ' });
        }
        req.logger.info(`🔥 ${user?.username} Sửa vật liệu thành công`);

        res.status(200).json({
            status: 'success',
            message: 'Sửa thành công'
        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
// Get device usage history
router.get('/', verifyToken, async (req, res) => {
    try {
        const query = {}

        if (req.query.name) {
            const regex = new RegExp(req.query.name, 'i');
            query.name = regex;
        }

        const materials = await Material.find(query).collation({ locale: "vi", strength: 1 })
            .sort({ name: 1 });
        req.logger.info(`🔥 Load thành công`);
        res.status(200).send({ status: 'success', data: materials });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const material = await Material.findById(req.params.id)
        if (!material) {
            req.logger.error("❌ không tìm thấy bản ghi ");

            return res.status(200).send({ status: 'error', message: 'No material found with that ID' });
        }
        req.logger.info(`🔥 Load thành công`);

        res.status(200).json({
            status: 'success',
            data: material
        });
    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

const columnMapping = {
    'Tên vật liệu': 'name',
    'Tỉ trọng': 'density',
    'Khối lượng': 'mass',
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
        const dataImport = data.filter(row => row.name);

        if (dataImport.length === 0) {
            req.logger.warn("⚠️ Import file thất bại - Không tìm thấy dữ liệu hợp lệ.");
            return res.status(400).json({ status: 'error', message: 'Không tìm thấy dữ liệu hợp lệ trong file.' });
        }

        const operations = dataImport.map(item => {
            const { name, ...updateData } = item;

            if (name) { // Kiểm tra nếu có trường 'name'
                return {
                    updateOne: {
                        filter: { name: name }, // Sửa từ 'cleanedId' thành 'name'
                        update: { $set: updateData }, // Sử dụng $set để cập nhật dữ liệu
                        upsert: true
                    }
                };
            } else {
                return {
                    insertOne: {
                        document: item
                    }
                };
            }
        });

        await Material.bulkWrite(operations);
        req.logger.info(`✅ ${user?.username}  Import file thành công. Đã xử lý ${dataImport.length} bản ghi.`);
        res.status(200).json({
            status: 'success',
            message: `Import file thành công. Đã xử lý ${dataImport.length} bản ghi.`,
        });
    } catch (error) {
        req.logger.error("❌ Lỗi khi import file biện pháp an toàn", error);
        res.status(500).json({
            status: 'error',
            message: 'Tải thất bại',
            error: error.message
        });
    }
});

router.post('/exportFile', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const data = await Material.find();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('DS.vat_lieu');

        worksheet.columns = [
            { header: 'Tên vật liệu', key: 'name', width: 20 },
            { header: 'Tỉ trọng', key: 'density', width: 20 },
            { header: 'Khối lượng', key: 'mass', width: 20 },
        ];

        const formattedDevices = (data || []).map(item => ({
            name: item?.name || '',
            density: item?.density || '',
            mass: item?.mass || '',
        }));
        worksheet.addRows(formattedDevices);

        worksheet.eachRow((row, rowNumber) => {
            row.eachCell(cell => {
                cell.font = { size: 9, bold: (rowNumber === 1) };
                cell.alignment = { vertical: 'middle', wrapText: true, };
            });
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