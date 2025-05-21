# Hệ thống Quản lý Lệnh Sản xuất

Hệ thống quản lý lệnh sản xuất cho công ty sản xuất than tại Cẩm Phả - Quảng Ninh.

## Tính năng chính

- Quản lý lệnh sản xuất theo ca làm việc
- Quản lý thiết bị và nhân viên
- Theo dõi tiến độ công việc
- Báo cáo tổng hợp
- Thông báo realtime
- Phân quyền người dùng

## Yêu cầu hệ thống

- Node.js >= 14.x
- Microsoft SQL Server >= 2019
- Windows Server 2019 trở lên

## Cài đặt

1. Clone repository:
```bash
git clone https://github.com/your-username/ql-lenh-sx.git
cd ql-lenh-sx
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file .env và cấu hình các biến môi trường:
```env
PORT=5000
NODE_ENV=development
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_SERVER=localhost
DB_NAME=ql_lenh_sx
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
```

4. Tạo database và chạy script khởi tạo:
```sql
CREATE DATABASE ql_lenh_sx;
USE ql_lenh_sx;
-- Chạy các script trong thư mục database/init
```

5. Khởi động server:
```bash
npm start
```

## API Documentation

API documentation có sẵn tại `/api-docs` sau khi khởi động server.

## Cấu trúc thư mục

```
ql-lenh-sx/
├── config/             # Cấu hình
├── database/           # Script database
├── middleware/         # Middleware
├── models/            # Models
├── routes/            # Routes
├── utils/             # Utilities
├── .env               # Environment variables
├── package.json       # Dependencies
└── server.js          # Entry point
```

## Phân quyền người dùng

- Admin: Quản lý toàn bộ hệ thống
- Manager: Quản lý phân xưởng
- Supervisor: Giám sát ca làm việc
- Employee: Nhân viên sản xuất

## Bảo mật

- Xác thực JWT
- Mã hóa mật khẩu
- CORS enabled
- Rate limiting
- Input validation

## Hỗ trợ

Liên hệ: support@example.com