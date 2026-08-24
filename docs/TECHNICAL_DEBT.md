# Nợ kỹ thuật đã xác minh — DIEU-PHOI-MM

Chỉ ghi những gì đã đọc trực tiếp trong code ngày 2026-08-24 (nhánh `dev-dieuphoi-mm`). Không suy đoán, không tự sửa (đúng nguyên tắc onboarding — chỉ phát hiện, sửa phải được yêu cầu rõ ràng riêng).

## 1. Bug thật: `ROLES` trong `config.js` tính sai (mức độ: cao)

`WebApp/Backend/config/config.js`:
```js
const ROLE = { ADMIN: 'admin', DISPATCHER: 'dispatcher', MANAGER: 'manager', EMPLOYEE: 'employee' };
const ROLES = Object.values(STATUS_ORDER);   // ❌ phải là Object.values(ROLE)
```
`ROLES` hiện chứa `['pending', 'in_progress', 'completed', 'warning', 'cancel']` (giá trị của `STATUS_ORDER`) thay vì 4 vai trò thật. Bất kỳ chỗ nào dùng `ROLES` (validate giá trị role hợp lệ, populate dropdown chọn role...) sẽ sai. Chưa grep hết toàn bộ nơi `ROLES` (số nhiều) được import để đánh giá blast radius đầy đủ — cần làm trước khi sửa.

## 2. Rủi ro bảo mật: `backup/entrypoint.sh` dump toàn bộ env ra file trong container (mức độ: trung bình-cao)

```bash
printenv > /app/src/env.list
```
Ghi TOÀN BỘ biến môi trường (bao gồm `MONGODB_URI` có mật khẩu, `AWS_SECRET_ACCESS_KEY`, `JWT_SECRET`...) ra file plaintext `/app/src/env.list` trong container `ktv_backup`, mục đích debug. Rủi ro: nếu file này từng bị bind-mount ra ngoài, đưa vào log tập trung, hoặc image bị `docker save`/inspect layer, secret sẽ lộ. Không tự sửa (thay đổi hành vi container backup đang chạy thật ngoài production), chỉ ghi nhận.

## 3. Backend: 0 test file, dù `jest`/`supertest` đã cài (mức độ: cao)

`package.json` có `"test": "jest"` + devDependencies `jest`, `supertest`, nhưng không có bất kỳ file `*.test.js`/`*.spec.js` nào trong repo. `commands.test` trong `project.yaml` sẽ báo lỗi "no tests found" khi chạy — đây là hiện trạng thật, không phải lỗi cấu hình của factory.

## 4. Frontend: 0 test file (mức độ: trung bình)

`react-scripts test` (Create React App mặc định) có sẵn nhưng ngay cả `App.test.tsx` mặc định của CRA (thường tự sinh khi tạo project) cũng đã bị xoá — xác nhận 0 test thật. Khác TK-HATU (Frontend TK-HATU không có script test nào cả) — ở đây có SCRIPT nhưng không có TEST.

## 5. `upload.routes.js` không có xác thực (mức độ: cao — giống hệt lỗi đã sửa ở TK-HATU)

```js
router.get('/put', handleUpload.getPresignedUrl);
router.get('/get', handleUpload.getDownloadUrl);
```
Không có `verifyToken` trên cả 2 route — bất kỳ ai (không cần đăng nhập) đều lấy được presigned URL để upload/download file lên S3 của hệ thống. Toàn bộ 23 route file khác đều có `verifyToken` explicit trên từng handler (xem `docs/ARCHITECTURE_CURRENT.md` mục 2) — đây là ngoại lệ duy nhất đã xác minh.

## 6. `errorHandler.js` tồn tại nhưng không được mount + có bug tiềm ẩn nếu mount sau này (mức độ: trung bình, hiện tại chưa phát tác)

Xem chi tiết ở `docs/ARCHITECTURE_CURRENT.md` mục 4. Tóm tắt: `server.js` dùng error handler inline riêng (không phải file `utils/errorHandler.js`); nếu sau này ai mount `utils/errorHandler.js` vào mà không sửa, request sẽ treo vô thời hạn khi `NODE_ENV` không đúng 2 giá trị `development`/`production` — đúng lỗi đã gặp và fix ở TK-HATU (`errorHandler.js` gốc TK-HATU trước khi sửa).

## 7. 2 bug logic trong `device.routes.js` (mức độ: trung bình, không crash toàn app vì có try/catch)

- **`GET /:id`** (dòng ~359-364): dùng biến `deviceIds` trong 1 aggregation `$match`, nhưng `deviceIds` **không được định nghĩa trong scope của handler này** (chỉ tồn tại ở handler `GET /` khác) — sẽ ném `ReferenceError`, bị bắt bởi `catch` và trả về 500 kèm `err.stack`. Endpoint xem chi tiết 1 thiết bị hiện luôn lỗi 500 khi chạy tới đoạn tính `travelHoursAgg`.
- **Cùng handler, dòng ~382-383**: đọc `travelHoursAgg[0].totalTravelHours` nhưng field thật trong kết quả aggregation (theo `$group`) là `latestTravelHours`, không phải `totalTravelHours` — sẽ luôn ra `undefined` → `cumulativeHours` luôn bằng `0`, sai âm thầm (không crash, chỉ sai dữ liệu hiển thị).

## 8. MongoDB expose thẳng port 27017 ra host, Grafana dùng mật khẩu mặc định (mức độ: trung bình, chỉ áp dụng khi chạy compose dev)

`WebApp/docker-compose.yaml`: `ktv_db` publish `27017:27017` (ai có network tới máy đều query được nếu biết user/pass), `ktv_grafana` hardcode `GF_SECURITY_ADMIN_PASSWORD=admin`. Chấp nhận được cho dev cục bộ, KHÔNG dùng nguyên trạng cho môi trường chạm được từ ngoài — khớp với ghi chú "THIS DOCKER COMPOSE IS FOR LOCAL DEVELOPMENT" ngay đầu file.

## 9. `nginx_release.conf` không dùng được nguyên trạng (mức độ: thấp, đã biết trước)

`server_name dieuhanhquanlythietbitcs.vn` + `ssl_certificate /etc/ssl/mydomain/...` — domain/cert của 1 site khác (giống hệt TK-HATU, xác nhận cả 2 dùng chung 1 file gốc chưa customize). Không phải bug cần sửa ngay — chỉ ghi nhận để không nhầm là cấu hình dành cho DIEU-PHOI-MM.

## 10. GitHub Actions in secret ra log qua `cat WebApp/.env` (mức độ: thấp)

`deploy-release.yml`/`deploy-staging.yml` có bước `cat WebApp/.env` sau khi ghi secret vào file — GitHub Actions tự động mask giá trị secret đã đăng ký trong log viewer, nên không lộ trực tiếp qua UI, nhưng vẫn là thói quen không nên (dễ lộ nếu secret value trùng 1 chuỗi phổ biến không được mask đúng, hoặc log được export ra ngoài). Không tự sửa workflow (ảnh hưởng CI/CD thật đang chạy).

## 11. Backend: 65 lỗ hổng dependency đã biết (npm audit, mức độ: cao — 4 critical)

Xác nhận thật khi build baseline (2026-08-24): `npm ci` báo **65 vulnerabilities (4 low, 35 moderate, 22 high, 4 critical)**. Chưa chạy `npm audit` chi tiết để liệt kê từng package — cần làm trước khi quyết định `npm audit fix` (có thể breaking change, không tự ý chạy `--force`).

## Chưa làm / chưa xác minh (báo cáo trước khi phát triển tiếp)

- **Chưa build/test baseline trong Docker** — sẽ chạy ngay sau khi tạo xong 7 file onboarding, kết quả cập nhật vào `.factory/pipeline.json`.
- Chưa đọc chi tiết `utils/cron.js` (nội dung job định kỳ cụ thể).
- Chưa đọc chi tiết Socket.IO server-side handler trong `server.js` (chỉ xác nhận có khởi tạo `new Server(...)`, chưa xem các event `on(...)` cụ thể).
- Chưa đọc MobileApp (Flutter) — nằm ngoài phạm vi factory quản lý ở bước onboarding này.
- Chưa xác định rõ mục đích biến `process.env.API_URL` và model `Internal`.
- Chưa grep toàn bộ nơi dùng biến `ROLES` (số nhiều, đang bug) để đánh giá đầy đủ mức độ ảnh hưởng trước khi đề xuất sửa.
- `.factory/pipeline.json` sẽ phản ánh đúng các mục PENDING/PASSED sau khi build/test baseline chạy xong — xem file đó để biết trạng thái mới nhất, đừng tin tài liệu này về trạng thái BUILD/TEST (tài liệu này chỉ ghi phát hiện code, không phải kết quả chạy).
