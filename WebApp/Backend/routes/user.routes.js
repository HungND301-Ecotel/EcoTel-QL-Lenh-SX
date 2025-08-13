const express = require('express');
const router = express.Router();
const User = require('../models/User');
const History = require('../models/History');

const bcrypt = require('bcryptjs')
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const xlsx = require('xlsx');
const ExcelJS = require('exceljs');
const Position = require('../models/Position')
const Department = require('../models/Department')


// Get all users
router.get('/', verifyToken, async (req, res) => {
    try {
        const user = req.user
        const query = {}

        if (user?.role === "manager") {
            query.department = user?.department?._id;
        }

        if (req.query.department) {
            query.department = req.query.department
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
            .sort('-createdAt')
        res.json({
            status: 'success',
            data: users
        });
    } catch (error) {
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
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy người dùng'
            });
        }
        res.json({
            status: 'success',
            data: user
        });
    } catch (error) {
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
        let query = {}
        if (req.query.q) {
            const regex = new RegExp(req.query.q, 'i');
            query.$or = [
                { salaryCode: regex },
                { fullName: regex },
            ];
        } else {
            return res.status(400).json({
                status: 'error',
                message: 'Thiếu tham số tìm kiếm',
            });
        }
        const user = await User.findOne(query);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy người dùng'
            });
        }
        res.json({
            status: 'success',
            data: user
        });
    } catch (error) {
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
        const user = await User.findById(req.params.id).populate("department")
        if (!user) {
            return res.status(404).json({
                success: 'error',
                message: 'Không tìm thấy người dùng'
            });
        }
        const userUpdate = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        )
            .populate("department")


        if (user.department?._id.toString() !== userUpdate.department?._id.toString()) {
            const snapshot = user.toObject();

            // Gán endTime bằng resumeTime
            const newHistory = new History({
                entity: user._id,
                changedBy: req.userId,
                snapshot: snapshot
            })
            await newHistory.save();
        }

        res.json({
            status: 'success',
            data: user
        });
    } catch (error) {
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
        const { old_pass, newpass, repass } = req.body
        const user = await User.findById(req.user._id)
        if (!user) {
            return res.status(404).send({ status: 'error', message: "Không tìm thấy người dùng" })
        }

        const IsPassword = await bcrypt.compare(old_pass, user.password)
        if (!IsPassword) {
            return res.status(400).send({ status: 'error', message: "Mật khẩu cũ không chính xác" })
        }
        if (!newpass) {
            return res.status(400).send({ status: 'error', message: "Nhập mật khẩu mới" })
        }
        if (newpass !== repass) {
            return res.status(404).send({ status: 'error', message: "Mật khẩu nhập lại không khớp" })
        }
        const hashedPassword = await bcrypt.hash(newpass, 10);
        user.password = hashedPassword;
        await user.save();
        res.status(200).send({
            status: 'success',
            message: "Đổi mật khẩu thành công",
        })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
// add phone
router.put('/addphone', verifyToken, async (req, res) => {
    try {
        const body = req.body
        const userUpdate = await User.findByIdAndUpdate(req.user._id, body, {
            new: true,
            runValidators: true
        }).populate("position")
        if (!userUpdate) {
            return res.status(404).send({ status: 'error', message: "Thêm số điện thoại không thành công" })
        };
        const userData = userUpdate.toObject()
        delete userData.password
        res.status(200).send({
            status: 'success',
            message: "Thêm số điện thoại thành công",
            data: userData
        })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

// Delete user
router.delete('/', verifyToken, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).send({ status: 'error', message: 'Vui lòng chọn bản ghi cần xóa' });
        }

        const result = await User.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            return res.status(200).send({ status: 'error', message: 'Không tìm thấy bản ghi để xóa' });
        }

        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} bản ghi`
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Xóa người dùng thất bại',
            error: error.message
        });
    }
});

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
// Delete user
router.post('/importFile', upload.single('file'), verifyToken, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng chọn file' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet]);
        if (req.user.role === 'manager' && req.user.department) {
            for (const row of data) {
                row.department = req.user.department?._id;
            }
        }

        await User.insertMany(data);
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
        const users = await User.find()
            .populate('department', 'name code')
            .populate('position', 'name');
        const departments = await Department.find();
        const positions = await Position.find();

        const workbook = new ExcelJS.Workbook();
        const refSheet = workbook.addWorksheet('_refs', { state: 'hidden' });

        // Ghi danh sách vào cột A (dept), B (pos) từ dòng 1
        refSheet.getColumn('A').values = ['departments', ...departments.map(d => d.code)];
        refSheet.getColumn('B').values = ['positions', ...positions.map(p => p.name)];

        // Tạo named ranges cho 2 danh sách
        const deptLen = departments.length;
        const posLen = positions.length;

        // Định nghĩa lại phạm vi tên
        // Sử dụng $A$2:$A${deptLen + 1}
        workbook.definedNames.add('DeptList', `_refs!$A$2:$A$${deptLen + 1}`);
        workbook.definedNames.add('PosList', `_refs!$B$2:$B$${posLen + 1}`);

        const worksheet = workbook.addWorksheet('DS.nguoi_dung');

        // Định nghĩa tiêu đề và thuộc tính cột
        worksheet.columns = [
            { header: 'fullName', key: 'fullName', width: 25 },
            { header: 'username', key: 'username', width: 15 },
            { header: 'password', key: 'password', width: 15 },
            { header: 'salaryCode', key: 'salaryCode', width: 15 },
            { header: 'gender', key: 'gender', width: 10 },
            { header: 'phone', key: 'phone', width: 15 },
            { header: 'email', key: 'email', width: 30 },
            { header: 'position', key: 'position', width: 20 },
            { header: 'department', key: 'department', width: 20 },
        ];

        // Điền dữ liệu
        const formattedUsers = users.map(user => ({
            fullName: user?.fullName || '',
            username: user?.username || '',
            password: '',
            salaryCode: user?.salaryCode || '',
            gender: user?.gender || '',
            phone: user?.phone || '',
            email: user?.email || '',
            position: user?.position?.name || '',
            department: user?.department?.code || '',
        }));
        worksheet.addRows(formattedUsers);

        // Thiết lập style
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell(cell => {
                cell.font = { size: (rowNumber === 1) ? 9 : 8, bold: (rowNumber === 1) };
                cell.alignment = {
                    vertical: 'middle',
                    wrapText: (rowNumber === 1),
                };
            });
            row.height = (rowNumber === 1) ? 40 : 20;
        });

        // Áp dụng Data Validation
        const MAX_ROWS = Math.max(formattedUsers.length + 100, 1000);
        for (let r = 2; r <= MAX_ROWS; r++) {
            worksheet.getCell(`H${r}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['PosList'],
                showErrorMessage: true,
                errorTitle: 'Invalid',
                error: 'Vui lòng chọn từ danh sách Position.',
            };
            worksheet.getCell(`I${r}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['DeptList'],
                showErrorMessage: true,
                errorTitle: 'Invalid',
                error: 'Vui lòng chọn từ danh sách Department.',
            };
        }

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