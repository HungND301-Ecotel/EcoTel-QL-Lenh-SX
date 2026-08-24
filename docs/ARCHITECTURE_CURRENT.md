# Kiến trúc hiện trạng — DIEU-PHOI-MM

Ghi lại đúng những gì đọc được trực tiếp từ code ngày 2026-08-24. Không suy đoán.

## 1. Sơ đồ triển khai

**Local dev** (`WebApp/docker-compose.yaml`): `ktv_reverse_proxy_service` (nginx, publish `6868:8888`) → `ktv_Frontend_service` (static build, không publish port host) + `ktv_Backend_service` (Express, không publish port host, mount `serviceAccountKey.json` read-only) → `ktv_db` (MongoDB chính thức, publish `27017:27017` ra host — **không có auth network-level, chỉ có user/pass Mongo**). Song song: `ktv_backup` (Python cron, backup MongoDB → S3 THẬT, 7 lần/ngày), và stack giám sát `ktv_grafana`/`ktv_loki`/`ktv_promtail` (Grafana publish `4000:3000`, mật khẩu admin **hardcode `admin`/`admin`** trong chính `docker-compose.yaml`).

**Staging/Release (THẬT, tự động)**: GitHub Actions (`deploy-staging.yml`/`deploy-release.yml`) build image bằng `WebApp/docker-compose-build.yaml`, đẩy lên Docker Hub (`ecoteldev/...`), SSH vào server đích (`STAGING_HOST`/`RELEASE_HOST`, bí mật lưu trong GitHub Secrets), chạy `deployment/{staging,release}/start-app.sh` → `docker compose -f {staging,release}-docker-compose.yaml up -d`. Trigger là **push trực tiếp lên `develop` (staging) hoặc `main` (release)** — không có bước duyệt thủ công nào ở giữa.

## 2. Luồng xác thực & phân quyền

- JWT (`jsonwebtoken`), token gửi qua header `Authorization: Bearer <token>`, lưu ở Frontend trong `localStorage` (`api.config.ts` interceptor tự gắn header, tự xoá token + redirect `/login` khi gặp 401).
- `middleware/auth.middleware.js`: `verifyToken` decode JWT, load lại `User` từ DB (kèm `populate('department')`/`populate('position')`), kiểm tra `passwordChangedAt` để invalidate token cũ sau khi đổi mật khẩu. `restrictTo(...roles)` kiểm tra `req.user.role` nằm trong danh sách cho phép.
- **Khác với TK-HATU**: ở đây `verifyToken`/`restrictTo` được gọi **explicit trên từng route** (`router.get('/', verifyToken, ...)`), không dùng `router.use(verifyToken)` một lần cho cả file. Điều này khiến việc thiếu auth ở 1 route cụ thể (như `upload.routes.js`, xem TECHNICAL_DEBT mục 5) khó phát hiện hơn bằng mắt thường vì phải đọc từng route thay vì nhìn 1 dòng đầu file.
- 4 role: `admin`, `dispatcher`, `manager`, `employee` — định nghĩa đúng ở `config.js` biến `ROLE` (biến `ROLES` bị bug, xem TECHNICAL_DEBT mục 1).

## 3. Vòng đời 1 request điển hình

`nginx (reverse_proxy)` → `/api/*` proxy tới `ktv_Backend_service:8080` → `cors()` → `helmet()` → `express.json({limit:'50mb'})` → rate-limit (`1000 req/phút/IP` cho toàn bộ `/api`) → gắn `req.logger` (Winston, có context `api`/`method`/`ip`) → route tương ứng (tự áp `verifyToken`/`restrictTo` nếu có) → **404 handler chung** nếu không khớp route nào → **error handler inline trong `server.js`** (không phải `utils/errorHandler.js`, xem mục 4).

## 4. `errorHandler.js` tồn tại nhưng không được dùng

`server.js` tự viết 1 middleware lỗi riêng ở cuối file (log qua Winston + trả `500` kèm `err.message`), **không** `require`/mount `utils/errorHandler.js` — file đó (có `AppError`, phân biệt dev/production, xử lý riêng CastError/ValidationError/JWT error) là dead code hiện tại. Nếu sau này có ai mount nó vào, cần biết trước: hàm `errorHandler` trong file đó **chỉ xử lý đúng 2 case `NODE_ENV === 'development'` và `=== 'production'`, không có nhánh `else`** — nếu `NODE_ENV` là giá trị khác (rỗng, `test`, `staging`...) thì không gọi `res.json()` nào cả, request sẽ **treo vô thời hạn** (đã gặp và fix chính xác lỗi này ở TK-HATU).

## 5. Tích hợp bên ngoài & biến môi trường thật dùng trong code

Quét `process.env.*` trong `WebApp/Backend` (không suy đoán, liệt kê đúng những gì code có `require`):

| Biến | Dùng cho |
|---|---|
| `PORT` | Cổng Express lắng nghe (mặc định 8080) |
| `NODE_ENV` | development / production (ảnh hưởng `utils/errorHandler.js`, dù chưa được mount) |
| `MONGODB_URI` | Kết nối MongoDB (`config/db.config.js`, tự retry 5 lần) |
| `JWT_SECRET` | Ký/verify JWT |
| `JWT_EXPIRES_IN` | Thời hạn JWT |
| `CLIENT_URL`, `FRONTEND_URL` | CORS / link trong email |
| `FIREBASE_KEY_PATH` | Firebase Admin SDK (push notification, `config/firebase.js`) |
| `EMAIL_HOST`/`PORT`/`USERNAME`/`PASSWORD`/`FROM` | SMTP gửi email (reset mật khẩu...) |
| `AWS_REGION`/`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`S3_BUCKET_NAME` | Upload ảnh/file (`utils/uploadImage.js`) |
| `API_URL` | Xuất hiện trong code nhưng chưa xác định rõ mục đích cụ thể — cần đọc kỹ hơn nếu động vào phần liên quan trước khi giả định |

**Frontend** (Create React App — các biến này thật sự hoạt động, KHÔNG chết như ở TK-HATU vì đây build bằng `react-scripts`/webpack, không phải Vite): `REACT_APP_BASE_API` (axios baseURL), `REACT_APP_SOCKET_API` (Socket.IO client), `REACT_APP_MAP_API_KEY` (Google Maps — thấy trong `deploy-*.yml`, chưa xác định file dùng cụ thể).

**CI/CD thật** (`.github/workflows/*.yml`) cần thêm các secret: `DOCKER_HUB_USERNAME`, `DOCKER_HUB_ACCESS_TOKEN`, `RELEASE_HOST`/`RELEASE_USER`/`RELEASE_SSH_KEY`, `STAGING_HOST`/`STAGING_USER`/`STAGING_SSH_KEY`/`STAGING_PORT`, `REACT_APP_BASE_API`, `REACT_APP_SOCKET_API`/`REACT_APP_SOCKET_API_RELEASE`, `REACT_APP_MAP_API_KEY` — không xác minh được giá trị (đúng như yêu cầu, chỉ dùng qua GitHub Secrets, không có ở máy này).

**Không có `.env`/`serviceAccountKey.json` nào tồn tại trên máy này** (đã quét, không thấy) — khớp với `.gitignore` loại trừ đúng cả 2.

## 6. Realtime & tích hợp khác

- Socket.IO: server tạo qua `createServer(app)` + `new Server(...)` trong `server.js` — cần đọc thêm phần join-room/emit thật nếu phát triển tiếp (chưa đọc chi tiết handler phía server trong đợt onboarding này, chỉ xác nhận có khởi tạo).
- Firebase Cloud Messaging: `config/firebase.js`, dùng cho push notification tới mobile app.
- MobileApp (Flutter) gọi cùng Backend API — chưa đọc chi tiết cách MobileApp cấu hình endpoint (nằm ngoài phạm vi "WebApp" mà factory quản lý ở bước onboarding này).
