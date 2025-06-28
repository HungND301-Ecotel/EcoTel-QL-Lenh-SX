const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const adminUser = {
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
    fullName: 'Administrator',
    role:'admin'
};

const seedAdmin = async () => {
    try {
        // Kết nối MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/production-order-management');
        console.log('Connected to MongoDB');

        // Kiểm tra xem admin đã tồn tại chưa
        const existingAdmin = await User.findOne({ username: adminUser.username });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminUser.password, salt);

        // Tạo admin mới
        await User.create({
            ...adminUser,
            password: hashedPassword
        });

        console.log('Admin user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

seedAdmin(); 