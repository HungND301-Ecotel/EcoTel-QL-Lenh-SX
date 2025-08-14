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
        const usersToImport = data.filter(row => row.fullName);

        if (usersToImport.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Không tìm thấy dữ liệu người dùng hợp lệ trong file.' });
        }
        const processedUsers = [];
        for (const row of usersToImport) {
            const newUser = { ...row };
            if (newUser.password) {
                const salt = await bcrypt.genSalt(10);
                newUser.password = await bcrypt.hash(newUser.password.toString(), salt);
            }
            if (newUser.department) {
                const department = await Department.findOne({ code: newUser.department })
                if (department) {
                    newUser.department = department?._id
                }
            }
            if (newUser.position) {
                const position = await Position.findOne({ name: newUser.position })
                if (position) {
                    newUser.position = position?._id
                }
            }
            processedUsers.push(newUser);
            console.log(newUser)
        }

        await User.insertMany(processedUsers);
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
        const user = req.user
        const query = {}

        if (user?.role === "manager") {
            query.department = user?.department?._id;
        }

        if (req.query.department) {
            query.department = req.query.department
        }
        const users = await User.find(query).populate('department', 'name code').populate('position', 'name');
        const departments = await Department.find();
        const positions = await Position.find();

        const workbook = new ExcelJS.Workbook();


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
            { header: 'role', key: 'role', width: 20 },
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
            role: user?.role || '',
        }));
        worksheet.addRows(formattedUsers);

        // Thiết lập style
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell(cell => {
                cell.font = { size: (rowNumber === 1) ? 9 : 8, bold: (rowNumber === 1) };
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

        // Áp dụng Data Validation
        const MAX = Math.max(worksheet.rowCount + 100, 1000); // dư dòng để người dùng thêm
        worksheet.dataValidations.add(`E2:E${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: ['"Nam,Nữ"'], // phải có dấu " ... "
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
            error: 'Chỉ được chọn Nam hoặc Nữ.',
        });
        worksheet.dataValidations.add(`J2:J${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: ['"manager,employee"'], // phải có dấu " ... "
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
        });
        worksheet.dataValidations.add(`H2:H${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: [`=$X$2:$X$${posList.length + 1}`],   // nguồn position
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

    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});
module.exports = router; 