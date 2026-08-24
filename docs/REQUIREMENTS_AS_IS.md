# Nghiệp vụ hiện trạng (as-is) — DIEU-PHOI-MM

Suy ra từ model/route/UI thật (`WebApp/Backend/models`, `routes`, `WebApp/Frontend/src/pages`) ngày 2026-08-24. Chưa có tờ trình/spec nghiệp vụ chính thức nào được cung cấp — tài liệu này là điểm khởi đầu để đối chiếu, không phải yêu cầu đã được xác nhận với người phụ trách nghiệp vụ.

## Miền nghiệp vụ chính: Điều phối máy móc/phương tiện + Lệnh sản xuất

### Quản lý tổ chức
- **Department** (phòng ban/phân xưởng), **Position** (chức vụ), **User** (nhân viên, có role + phòng ban + chức vụ).

### Danh mục thiết bị
- **Device** (thiết bị/phương tiện: mã, biển số, năng lực chở, toạ độ GPS, trạng thái `available/in_use/maintenance/retired`, file đính kèm).
- **DeviceType** (loại thiết bị, có `group` — vd "Xe" vs "Máy" — dùng để lọc máy xúc/xe vận tải).
- **DeviceModel**, **Model**, **material** — phân loại chi tiết hơn theo mẫu/vật liệu.

### Lệnh sản xuất & điều phối
- **Order** (lệnh sản xuất — gán thiết bị + người vận hành cho 1 **Job**, có trạng thái `pending/in_progress/completed/warning/cancel`, ca làm việc, ngày làm việc).
- **Job** (loại công việc: vận hành xe/khoan/gạt/xúc/sàng/bơm, sửa chữa bảo dưỡng, điều hành sản xuất...).
- Trang UI `dispatcherOrder` — vai trò `dispatcher` chuyên trách điều phối lệnh cho thiết bị/người vận hành.
- `POST /api/devices/update_status` — job định kỳ tự động cập nhật trạng thái thiết bị (`available`/`in_use`/`maintenance`) dựa trên lệnh đang chạy trong ca hiện tại (xác định ca theo giờ: 7-15h ca 1, 15-23h ca 2, 23-7h ca 3).

### Báo cáo ca & theo dõi vận hành
- **ShiftReport** (báo cáo ca — có `vehicleSummaries` theo từng thiết bị, `vehicleRepair` thiết bị đang sửa chữa, dùng để tính "cung độ"/giờ hoạt động luỹ kế của thiết bị).
- **Shift** (định nghĩa ca làm việc theo `name` 1/2/3).
- **ReportHistory**, **History**, **CheckIn** (chấm công/điểm danh).
- **TravelLog** (nhật ký di chuyển/cung độ vận chuyển).

### An toàn lao động
- **SafetyMeasures** — biện pháp an toàn, trang UI `safetyMeasures`.

### Báo cáo tổng hợp & xuất dữ liệu
- **Report** model + module `reports`, `analysics` (thống kê/phân tích).
- Xuất/nhập Excel qua `exceljs`/`xlsx` (thấy rõ trong `device.routes.js`: `importFile`/`exportFile`, có data-validation dropdown, bảo vệ sheet bằng mật khẩu `ktv-protect` hardcode trong code — không phải secret nhạy cảm nhưng là mật khẩu cố định public).

### Thông báo
- **Notification** model + Firebase Cloud Messaging — thông báo đẩy tới MobileApp.
- Socket.IO — thông báo realtime tới WebApp (client `socketService.ts` lắng nghe event `notification`, join room theo `userId`).

### Khác
- **Internal** model — chưa xác định rõ mục đích cụ thể (chưa đọc route/UI liên quan trong đợt onboarding này).
- `PrivacyPolicy` — trang chính sách riêng tư (không phải nghiệp vụ vận hành).

## Vai trò & phân quyền (suy từ `restrictTo(...)` trong routes)

- `admin`: toàn quyền (thấy trong hầu hết `restrictTo(ROLE.MANAGER, ROLE.ADMIN)`).
- `manager`: quản lý phòng ban mình phụ trách (nhiều route lọc theo `user.department._id` khi role là manager).
- `dispatcher`: điều phối lệnh, có quyền riêng ở 1 số route thống kê (`count/status` cho phép cả `dispatcher`).
- `employee`: vai trò mặc định, quyền hạn hẹp nhất (nhiều route ghi rõ `[ROLE.MANAGER, ROLE.EMPLOYEE]` lọc dữ liệu theo phòng ban của chính mình, không phải toàn quyền xem hết).

## MobileApp (Flutter)

Ứng dụng di động riêng ("job_manager"/package "soft"), gọi chung Backend API — chưa đọc chi tiết use-case cụ thể trong đợt onboarding này (nằm ngoài phạm vi "WebApp" mà factory quản lý qua `project.yaml`). Nếu cần onboard MobileApp vào factory sau này, nên coi là 1 phân tích riêng.
