const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const DeviceType = require('../models/DeviceType'); // cần thêm model này
const { connectDB } = require('../config/db.config');

const adminUser = {
    username: 'admin',
    password: '123456',
    role: 'admin',
    fullName: 'admin',
};

const deviceTypes = [
    { name: 'Vận tải', group: 'Xe' },
    { name: 'Máy xúc', group: 'Máy' },
    { name: 'Máy khoan', group: 'Máy' },
    { name: 'Máy gạt', group: 'Máy' },
];

const seedAdmin = async () => {
    try {

        await connectDB();// sửa lại URI nếu cần

        // Seed admin
        const existingAdmin = await User.findOne({ username: adminUser.username });
        if (!existingAdmin) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminUser.password, salt);
            await User.create({ ...adminUser, password: hashedPassword });
            console.log('✅ Admin user created');
        } else {
            console.log('ℹ️ Admin user already exists');
        }

        // Seed device types nếu bảng chưa có dữ liệu
        const deviceCount = await DeviceType.countDocuments();
        if (deviceCount === 0) {
            await DeviceType.insertMany(deviceTypes);
            console.log('✅ Device types seeded');
        } else {
            console.log('ℹ️ Device types already exist');
        }

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    }
};

seedAdmin();
