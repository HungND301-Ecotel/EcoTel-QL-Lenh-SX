const express = require('express');
const router = express.Router();
const { AppError } = require('../utils/errorHandler');
const SafetyMeasure = require('../models/SafetyMeasures');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const ExcelJS = require('exceljs');
const xlsx = require('xlsx');

const columnMapping = {
    'Id(Không sửa)': '_id',
    'Nội dung': 'content',
    'Nội dung chung': 'master_content',
    'Loại công việc': 'jobType',
};

router.post('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { content, master_content, jobType } = req.body;
        const newSafetyMeasure = new SafetyMeasure({
            content,
            master_content,
            jobType
        });
        await newSafetyMeasure.save();
        req.logger.info(`✅ Tạo biện pháp an toàn thành công: ${content}`);
        res.status(200).send({ status: 'success', message: "Tạo thành công" });
    } catch (err) {
        req.logger.error("❌ Lỗi khi tạo biện pháp an toàn", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

router.delete('/', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            req.logger.warn("⚠️ Yêu cầu xóa không có IDs hợp lệ.");
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        const result = await SafetyMeasure.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            req.logger.info("ℹ️ Không tìm thấy bản ghi để xóa.");
            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }

        req.logger.info(`✅ Đã xóa thành công ${result.deletedCount} bản ghi biện pháp an toàn.`);
        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi xóa biện pháp an toàn", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

router.put('/:id', verifyToken, restrictTo('admin', 'manager'), async (req, res, next) => {
    try {
        const safetyMeasure = await SafetyMeasure.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!safetyMeasure) {
            req.logger.warn(`⚠️ Cập nhật thất bại - Không tìm thấy biện pháp an toàn với ID: ${req.params.id}`);
            return res.status(404).send({ status: 'error', message: 'Sửa thất bại ' });
        }

        req.logger.info(`✅ Cập nhật biện pháp an toàn thành công cho ID: ${req.params.id}`);
        res.status(200).json({
            status: 'success',
            message: 'Sửa thành công'
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi cập nhật biện pháp an toàn", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

router.get('/', verifyToken, async (req, res) => {
    try {
        const SafetyMeasures = await SafetyMeasure.find();
        res.status(200).send({ status: 'success', data: SafetyMeasures });
    } catch (err) {
        req.logger.error("❌ Lỗi khi lấy danh sách biện pháp an toàn", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

router.post('/importFile', upload.single('file'), verifyToken, async (req, res) => {
    try {
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
        const dataImport = data.filter(row => row.content);

        if (dataImport.length === 0) {
            req.logger.warn("⚠️ Import file thất bại - Không tìm thấy dữ liệu hợp lệ.");
            return res.status(400).json({ status: 'error', message: 'Không tìm thấy dữ liệu hợp lệ trong file.' });
        }

        const operations = dataImport.map(item => {
            const cleanedId = item._id ? String(item._id).trim().replace(/"/g, '') : null;
            const { _id, ...updateData } = item;

            if (cleanedId) {
                return {
                    updateOne: {
                        filter: { _id: cleanedId },
                        update: updateData,
                        upsert: true
                    }
                };
            } else {
                return {
                    insertOne: {
                        document: updateData
                    }
                };
            }
        });

        await SafetyMeasure.bulkWrite(operations);
        req.logger.info(`✅ Import file thành công. Đã xử lý ${dataImport.length} bản ghi.`);
        res.status(200).json({
            status: 'success',
            message: 'Tải thành cồng',
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
        const data = await SafetyMeasure.find();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('DS.bien_phap');

        worksheet.columns = [
            { header: 'Id(Không sửa)', key: '_id', width: 20 },
            { header: 'Nội dung', key: 'content', width: 50 },
            { header: 'Nội dung chung', key: 'master_content', width: 50 },
            { header: 'Loại công việc', key: 'jobType', width: 20 },
        ];

        const formattedDevices = (data || []).map(item => ({
            _id: item._id,
            content: item?.content || '',
            master_content: item?.master_content || '',
            jobType: item?.jobType || '',
        }));
        worksheet.addRows(formattedDevices);

        worksheet.eachRow((row, rowNumber) => {
            row.eachCell(cell => {
                cell.font = { size: 9, bold: (rowNumber === 1) };
                cell.alignment = { vertical: 'middle', wrapText: true, };
            });
        });

        const MAX = Math.max(worksheet.rowCount + 100, 1000);
        worksheet.dataValidations.add(`D2:D${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: ['"Vận hành xe,Vận hành gạt,Vận hành khoan,Vận hành xúc,Vận hành xe phục vụ, Khác"'],
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
        });
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'danh_sach_nguoi_dung.xlsx');
        res.send(buffer);
        req.logger.info("✅ Xuất file thành công.");

    } catch (err) {
        req.logger.error("❌ Lỗi khi xuất file biện pháp an toàn", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

module.exports = router;
