const mongoose = require('mongoose');
const Department = require('../models/department.model');

const departments = [
    {
        name: 'Phòng Kỹ Thuật',
        code: 'KT',
        description: 'Phòng Kỹ Thuật - Chịu trách nhiệm về kỹ thuật và công nghệ'
    },
    {
        name: 'Phòng Sản Xuất',
        code: 'SX',
        description: 'Phòng Sản Xuất - Quản lý và điều hành sản xuất'
    },
    {
        name: 'Phòng Kế Hoạch',
        code: 'KH',
        description: 'Phòng Kế Hoạch - Lập kế hoạch sản xuất và quản lý đơn hàng'
    },
    {
        name: 'Phòng Chất Lượng',
        code: 'CL',
        description: 'Phòng Chất Lượng - Kiểm soát và đảm bảo chất lượng sản phẩm'
    },
    {
        name: 'Phòng Kho',
        code: 'KHO',
        description: 'Phòng Kho - Quản lý nguyên vật liệu và thành phẩm'
    }
];

const seedDepartments = async () => {
    try {
        // Kết nối MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/production-order-management');
        console.log('Connected to MongoDB');

        // Xóa dữ liệu cũ
        await Department.deleteMany({});
        console.log('Deleted old departments');

        // Thêm dữ liệu mới
        await Department.insertMany(departments);
        console.log('Added new departments');

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedDepartments(); 