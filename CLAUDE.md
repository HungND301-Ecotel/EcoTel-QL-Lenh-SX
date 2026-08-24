# DIEU-PHOI-MM — Hướng dẫn cho Claude Code

Dự án này được **đưa tay (onboard) vào AI Software Factory** ngày 2026-08-24 — source code + lịch sử Git đã có sẵn trên GitHub (`anhnt205/EcoTel-QL-Lenh-SX`), không tạo mới qua template. Đọc file này trước khi làm bất kỳ việc gì trong thư mục `projects/DIEU-PHOI-MM/`.

## Đọc gì trước

1. `docs/ARCHITECTURE_CURRENT.md` — kiến trúc thật đang chạy (auth, luồng request, CI/CD thật, tích hợp bên ngoài).
2. `docs/REQUIREMENTS_AS_IS.md` — nghiệp vụ suy từ code (chưa có tờ trình/spec chính thức).
3. `docs/TECHNICAL_DEBT.md` — các lỗi/khoảng trống đã xác minh, đặc biệt mục 1 (bug `ROLES` sai) và mục 2 (bảo mật).
4. `docs/CODEBASE_MAP.md` — bản đồ thư mục nhanh.

## Quy tắc bắt buộc cho dự án này

1. **CỰC KỲ QUAN TRỌNG — `main` và `develop` có CI/CD thật, tự deploy lên VPS khi push.** `.github/workflows/deploy-release.yml` (trigger `push: main`) và `deploy-staging.yml` (trigger `push: develop`) build Docker image, push lên Docker Hub, rồi SSH vào server thật (`RELEASE_HOST`/`STAGING_HOST`) để deploy — hoàn toàn tự động, không cần duyệt thủ công. **Không bao giờ push trực tiếp lên `main`/`develop`** dù là từ máy này hay qua factory — mọi thay đổi làm trên nhánh `dev-dieuphoi-mm` (đã tạo sẵn), merge/PR do người phụ trách quyết định.
2. **Chưa có test baseline nào thật** (Backend: `jest` cài sẵn nhưng 0 file test; Frontend: có script `react-scripts test` nhưng cũng 0 file test, kể cả `App.test.tsx` mặc định của CRA cũng đã bị xoá). Vì vậy **`automation.allow_apply_code` đang tắt** trong `project.yaml` — không có lưới an toàn để phát hiện AI sinh code sai. Không tự ý bật cờ này cho tới khi có test baseline thật.
3. **Có bug thật đã xác minh trong `config.js`**: `const ROLES = Object.values(STATUS_ORDER)` (dòng ~27) — sai, phải là `Object.values(ROLE)`. `ROLES` hiện chứa các giá trị trạng thái đơn hàng (`pending/in_progress/...`) thay vì vai trò (`admin/dispatcher/manager/employee`). CHỈ ghi nhận trong onboarding, không tự sửa trừ khi được yêu cầu rõ (xem `docs/TECHNICAL_DEBT.md` mục 1).
4. **Không có `.env` nào tồn tại trên máy này.** Mọi biến môi trường thật (MongoDB URI, JWT secret, AWS key, SMTP, Firebase...) đều thiếu — xem danh sách đầy đủ ở `docs/ARCHITECTURE_CURRENT.md` mục 5. Không tự bịa giá trị.
5. **Không commit bất kỳ file nào trông giống secret** (`.env`, `serviceAccountKey.json`...) — hiện chưa file nào trong số này tồn tại trong repo, giữ nguyên như vậy.
6. **`docker compose` nằm trong `WebApp/`, không phải gốc repo** — luôn chạy với `-f WebApp/docker-compose.yaml` hoặc `cd WebApp` trước. Repo này còn có `WebApp/docker-compose-build.yaml` (dùng để build+push Docker Hub thật trong CI, KHÁC với compose dev) — đừng nhầm 2 file.
7. **2 lớp nginx khác nhau** — đừng nhầm `WebApp/Frontend/.nginx/nginx.conf` (nếu có, chỉ serve static) với `WebApp/reverse_proxy/nginx_*.conf` (định tuyến `/api` và `/socket.io` thật). Sửa route/proxy phải sửa đúng file trong `reverse_proxy/`. **Khác với TK-HATU**: `nginx_staging.conf` ở đây đã đúng tên service (`ktv_Frontend_service`/`ktv_Backend_service`), KHÔNG có bug trỏ nhầm tên như TK-HATU từng gặp — đừng áp fix đó vào đây nếu chưa xác minh lại.
8. **`ktv_backup` (backup MongoDB → S3) là service THẬT, có build context đầy đủ** (`WebApp/backup/`) — khác TK-HATU (service đó bị xoá vì thư mục không tồn tại). Lưu ý: `backup/entrypoint.sh` dump toàn bộ biến môi trường ra file `/app/src/env.list` trong container (mục đích debug) — rủi ro lộ secret nếu file đó từng bị export/log ra ngoài, xem `docs/TECHNICAL_DEBT.md` mục 2.
9. **Không đổi chức năng nghiệp vụ khi chưa được yêu cầu rõ ràng** — các phát hiện trong `TECHNICAL_DEBT.md` (bug `ROLES`, `upload.routes.js` thiếu xác thực, `errorHandler.js` chưa được gắn...) là CHỈ GHI NHẬN, không tự ý sửa.
10. **`data-seeder/seed.js` tự chạy mỗi lần server khởi động** (seed 1 tài khoản `admin`/`123456` + 4 loại thiết bị mặc định nếu DB chưa có — giá trị này nằm sẵn trong source, không phải secret bị lộ).
11. **Cùng gốc codebase với TK-HATU** (đã xác minh: `Backend/package.json` cùng tên `production-order-system`, `Frontend/package.json` cùng tên `ecotel-ql-lenh-sx`, domain hardcode `dieuhanhquanlythietbitcs.vn` trong `nginx_release.conf` giống hệt nhau ở cả 2 repo). Khi debug 1 lỗi lạ ở đây, kiểm tra chéo xem TK-HATU có gặp/đã sửa chưa (và ngược lại) — xem `docs/INCIDENTS.md` ở gốc factory.

## Lệnh build/test thật (xem `project.yaml` để dùng qua factory)

```bash
# Build backend (context: WebApp/Backend)
docker build -t dieuphoimm-backend-baseline ./WebApp/Backend

# Test backend thật (hiện sẽ báo "no tests found" — xem TECHNICAL_DEBT mục 3)
docker run --rm --entrypoint sh dieuphoimm-backend-baseline -c "npm test"

# Frontend: có lệnh nhưng 0 test file để chạy thật (xem TECHNICAL_DEBT mục 4)
# cd WebApp/Frontend && npm test -- --watchAll=false
```

## Vai trò hệ thống (đã xác nhận trong code)

`admin`, `manager`, `dispatcher`, `employee` (định nghĩa đúng nằm ở `WebApp/Backend/config/config.js` biến `ROLE` — KHÔNG dùng biến `ROLES` vì đang bug, xem mục 3 ở trên).
