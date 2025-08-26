const express = require('express');
const router = express.Router();
const User = require('../models/User');
const History = require('../models/History');

const bcrypt = require('bcryptjs');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const xlsx = require('xlsx');
const ExcelJS = require('exceljs');
const Position = require('../models/Position');
const Department = require('../models/Department');

// Get all users
router.get('/', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const query = {};

        if (user?.role === "manager") {
            query.department = user?.department?._id;
        }

        if (req.query.department) {
            query.department = req.query.department;
        }

        if (user?.role === "dispatcher") {
            query.role = 'manager';
        }

        if (req.query.q) {
            const regex = new RegExp(req.query.q, 'i');
            query.$or = [
                { salaryCode: regex },
                { fullName: regex },
            ];
        }

        const users = await User.find(query)
            .populate('department', 'name code')
            .populate('position', 'name')
            .collation({ locale: "vi", strength: 1 })
            .sort({ fullName: 1 });
        req.logger.info(`✅ Lấy thành công ${users.length} người dùng.`);
        res.json({
            status: 'success',
            data: users
        });
    } catch (error) {
        req.logger.error("❌ Lỗi khi lấy danh sách người dùng", error);
        res.status(500).json({
            status: 'error',
            message: 'Lấy danh sách người dùng thất bại',
            error: error.message
        });
    }
});

// Get user by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('department').populate('position', 'name');
        if (!user) {
            req.logger.warn(`⚠️ Không tìm thấy người dùng với ID: ${req.params.id}`);
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy người dùng'
            });
        }
        req.logger.info(`✅ Lấy thông tin người dùng thành công cho ID: ${req.params.id}`);
        res.json({
            status: 'success',
            data: user
        });
    } catch (error) {
        req.logger.error("❌ Lỗi khi lấy thông tin người dùng", error);
        res.status(500).json({
            status: 'error',
            message: 'Lấy thông tin người dùng thất bại',
            error: error.message
        });
    }
});

// Get user by salaryCode
router.get('/getOne/salaryCodeOrName', verifyToken, async (req, res) => {
    try {
        let query = {};
        if (req.query.q) {
            const regex = new RegExp(req.query.q, 'i');
            query.$or = [
                { salaryCode: regex },
                { fullName: regex },
            ];
        } else {
            req.logger.warn("⚠️ Yêu cầu tìm kiếm người dùng thiếu tham số.");
            return res.status(400).json({
                status: 'error',
                message: 'Thiếu tham số tìm kiếm',
            });
        }
        const user = await User.findOne(query);
        if (!user) {
            req.logger.warn("⚠️ Không tìm thấy người dùng với từ khóa đã cho.");
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy người dùng'
            });
        }
        req.logger.info(`✅ Lấy thông tin người dùng thành công: ${user.username}`);
        res.json({
            status: 'success',
            data: user
        });
    } catch (error) {
        req.logger.error("❌ Lỗi khi lấy thông tin người dùng", error);
        res.status(500).json({
            status: 'error',
            message: 'Lấy thông tin người dùng thất bại',
            error: error.message
        });
    }
});

// Update user
router.put('/update/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate("department");
        if (!user) {
            req.logger.warn(`⚠️ Cập nhật thất bại - Không tìm thấy người dùng với ID: ${req.params.id}`);
            return res.status(404).json({
                success: 'error',
                message: 'Không tìm thấy người dùng'
            });
        }

        const userUpdate = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate("department");

        if (user.department?._id.toString() !== userUpdate.department?._id.toString()) {
            const snapshot = user.toObject();
            const newHistory = new History({
                entity: user._id,
                changedBy: req.userId,
                snapshot: snapshot
            });
            await newHistory.save();
        }

        req.logger.info(`✅ Cập nhật người dùng thành công cho ID: ${req.params.id}`);
        res.json({
            status: 'success',
            data: user
        });
    } catch (error) {
        req.logger.error("❌ Lỗi khi cập nhật người dùng", error);
        res.status(500).json({
            status: 'error',
            message: 'Cập nhật người dùng thất bại',
            error: error.message
        });
    }
});

// Change password
router.put('/changepass', verifyToken, async (req, res) => {
    try {
        const { old_pass, newpass, repass } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            req.logger.warn("⚠️ Đổi mật khẩu thất bại - Không tìm thấy người dùng.");
            return res.status(404).send({ status: 'error', message: "Không tìm thấy người dùng" });
        }

        const IsPassword = await bcrypt.compare(old_pass, user.password);
        if (!IsPassword) {
            req.logger.warn("⚠️ Đổi mật khẩu thất bại - Mật khẩu cũ không chính xác.");
            return res.status(400).send({ status: 'error', message: "Mật khẩu cũ không chính xác" });
        }
        if (!newpass) {
            req.logger.warn("⚠️ Đổi mật khẩu thất bại - Thiếu mật khẩu mới.");
            return res.status(400).send({ status: 'error', message: "Nhập mật khẩu mới" });
        }
        if (newpass !== repass) {
            req.logger.warn("⚠️ Đổi mật khẩu thất bại - Mật khẩu nhập lại không khớp.");
            return res.status(404).send({ status: 'error', message: "Mật khẩu nhập lại không khớp" });
        }

        const hashedPassword = await bcrypt.hash(newpass, 10);
        user.password = hashedPassword;
        await user.save();
        req.logger.info(`✅ Đổi mật khẩu thành công cho người dùng: ${user.username}`);
        res.status(200).send({
            status: 'success',
            message: "Đổi mật khẩu thành công",
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi đổi mật khẩu", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});
// reset pass
router.get('/resetpass/:id', verifyToken, async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("123456", salt);
        const user = await User.findByIdAndUpdate(req.params.id, { password: hashedPassword })
        
        req.logger.info(`✅ Đổi mật khẩu thành công cho người dùng: ${user.username}`);
        res.status(200).send({
            status: 'success',
            message: "Reset mật khẩu thành công",
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi đổi mật khẩu", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});
// add phone
router.put('/addphone', verifyToken, async (req, res) => {
    try {
        const body = req.body;
        const userUpdate = await User.findByIdAndUpdate(req.user._id, body, {
            new: true,
            runValidators: true
        }).populate("position");
        if (!userUpdate) {
            req.logger.warn("⚠️ Thêm số điện thoại thất bại - Không tìm thấy người dùng.");
            return res.status(404).send({ status: 'error', message: "Thêm số điện thoại không thành công" });
        }
        const userData = userUpdate.toObject();
        delete userData.password;
        req.logger.info(`✅ Thêm số điện thoại thành công cho người dùng: ${userUpdate.username}`);
        res.status(200).send({
            status: 'success',
            message: "Thêm số điện thoại thành công",
            data: userData
        });
    } catch (err) {
        req.logger.error("❌ Lỗi khi thêm số điện thoại", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

// Delete user
router.delete('/', verifyToken, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            req.logger.warn("⚠️ Yêu cầu xóa không có IDs hợp lệ.");
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        const result = await User.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            req.logger.info("ℹ️ Không tìm thấy bản ghi để xóa.");
            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }

        req.logger.info(`✅ Đã xóa thành công ${result.deletedCount} người dùng.`);
        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
        });
    } catch (error) {
        req.logger.error("❌ Lỗi khi xóa người dùng", error);
        res.status(500).json({
            status: 'error',
            message: 'Xóa người dùng thất bại',
            error: error.message
        });
    }
});

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const columnMapping = {
    'Họ tên': 'fullName',
    'Tài khoản': 'username',
    'Thẻ lương': 'salaryCode',
    'GIới tính': 'gender',
    'Số điện thoại': 'phone',
    'email': 'email',
    'Chức danh': 'position',
    'Đơn vị': 'department',
    'Quyền': 'role',
};
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
        const usersToImport = data.filter(row => row.username);

        if (usersToImport.length === 0) {
            req.logger.warn("⚠️ Import file thất bại - Không tìm thấy dữ liệu hợp lệ.");
            return res.status(400).json({ status: 'error', message: 'Không tìm thấy dữ liệu người dùng hợp lệ trong file.' });
        }

        const uniqueDepartments = [...new Set(usersToImport.map(d => d.department).filter(Boolean))];
        const uniquePositions = [...new Set(usersToImport.map(d => d.position).filter(Boolean))];

        const [existingDepartments, existingPositions] = await Promise.all([
            Department.find({ code: { $in: uniqueDepartments } }).lean(),
            Position.find({ name: { $in: uniquePositions } }).lean(),
        ]);

        const departmentMap = new Map(existingDepartments.map(d => [d.code, d._id]));
        const positionMap = new Map(existingPositions.map(p => [p.name, p._id]));

        const operations = [];
        const invalidRows = [];

        for (const row of usersToImport) {
            const { username, department, position, ...updateData } = row;

            if (!username || !row.fullName) {
                invalidRows.push({ row, error: 'Tài khoản và Họ tên là bắt buộc.' });
                continue;
            }

            let departmentId = null;
            if (department) {
                departmentId = departmentMap.get(department);
                if (!departmentId) {
                    invalidRows.push({ row, error: `Mã phòng ban không hợp lệ: ${department}` });
                    continue;
                }
            }
            if (departmentId) {
                updateData.department = departmentId;
            }

            let positionId = null;
            if (position) {
                positionId = positionMap.get(position);
                if (!positionId) {
                    invalidRows.push({ row, error: `Tên chức danh không hợp lệ: ${position}` });
                    continue;
                }
            }
            if (positionId) {
                updateData.position = positionId;
            }

            // Xử lý mật khẩu chỉ khi bản ghi là mới
            const existingUser = await User.findOne({ username: username }).lean();
            if (!existingUser) {
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash('123456', salt);
            }

            // Sử dụng updateOne với upsert: true cho tất cả các bản ghi
            operations.push({
                updateOne: {
                    filter: { username: username },
                    update: updateData,
                    upsert: true,
                },
            });
        }

        let bulkResult = null;
        if (operations.length > 0) {
            bulkResult = await User.bulkWrite(operations);
        }

        req.logger.info(`✅ Import file hoàn tất. Đã xử lý ${usersToImport.length} bản ghi.`);
        req.logger.info(`📊 Thống kê: Thêm mới: ${bulkResult?.upsertedCount || 0}, Cập nhật: ${bulkResult?.modifiedCount || 0}, Lỗi: ${invalidRows.length}`);

        res.status(200).json({
            status: 'success',
            message: 'Import dữ liệu hoàn tất.',
            summary: {
                totalProcessed: usersToImport.length,
                insertedCount: bulkResult?.upsertedCount || 0,
                updatedCount: bulkResult?.modifiedCount || 0,
                invalidCount: invalidRows.length,
            },
            invalidRows: invalidRows,
        });

    } catch (error) {
        req.logger.error("❌ Lỗi khi import file người dùng", error);
        res.status(500).json({
            status: 'error',
            message: 'Tải thất bại',
            error: error.message,
        });
    }
});

router.post('/exportFile', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const user = req.user;
        const query = {};

        if (user?.role === "manager") {
            query.department = user?.department?._id;
        }

        if (req.query.department) {
            query.department = req.query.department;
        }

        const users = await User.find(query).populate('department', 'name code').populate('position', 'name');
        const departments = await Department.find();
        const positions = await Position.find();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('DS.nguoi_dung');

        worksheet.columns = [
            { header: 'Họ tên', key: 'fullName', width: 25 },
            { header: 'Tài khoản', key: 'username', width: 15 },
            { header: 'Thẻ lương', key: 'salaryCode', width: 15 },
            { header: 'GIới tính', key: 'gender', width: 10 },
            { header: 'Số điện thoại', key: 'phone', width: 15 },
            { header: 'email', key: 'email', width: 30 },
            { header: 'Chức danh', key: 'position', width: 20 },
            { header: 'Đơn vị', key: 'department', width: 20 },
            { header: 'Quyền', key: 'role', width: 20 },
        ];

        const formattedUsers = users.map(user => ({
            fullName: user?.fullName || '',
            username: user?.username || '',
            salaryCode: user?.salaryCode || '',
            gender: user?.gender || '',
            phone: user?.phone || '',
            email: user?.email || '',
            position: user?.position?.name || '',
            department: user?.department?.code || '',
            role: user?.role || '',
        }));
        worksheet.addRows(formattedUsers);

        worksheet.eachRow((row, rowNumber) => {
            row.eachCell(cell => {
                cell.font = { size: (rowNumber === 1) ? 8 : 7, bold: (rowNumber === 1) };
                cell.alignment = { vertical: 'middle', wrapText: (rowNumber === 1) };
            });
            row.height = (rowNumber === 1) ? 40 : 20;
        });

        const posList = [...new Set(positions.map(p => p.name).filter(Boolean))];
        const deptList = [...new Set(departments.map(d => d.code).filter(Boolean))];

        worksheet.getColumn('X').values = ['positions', ...posList];
        worksheet.getColumn('Y').values = ['departments', ...deptList];
        worksheet.getColumn('X').hidden = true;
        worksheet.getColumn('Y').hidden = true;

        const MAX = Math.max(worksheet.rowCount + 100, 1000);
        worksheet.dataValidations.add(`D2:D${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: ['"Nam,Nữ"'],
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
            error: 'Chỉ được chọn Nam hoặc Nữ.',
        });
        worksheet.dataValidations.add(`I2:I${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: ['"manager,employee"'],
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
        });
        worksheet.dataValidations.add(`G2:G${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: [`=$X$2:$X$${posList.length + 1}`],
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
        });
        worksheet.dataValidations.add(`H2:H${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: [`=$Y$2:$Y$${deptList.length + 1}`],
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
        });

        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'danh_sach_nguoi_dung.xlsx');
        res.send(buffer);
        req.logger.info("✅ Xuất file người dùng thành công.");

    } catch (err) {
        req.logger.error("❌ Lỗi khi xuất file người dùng", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

module.exports = router;