# DIEU-PHOI-MM — Context (cập nhật 2026-08-24)

## Trạng thái pipeline (xem `.factory/pipeline.json` để có bản chính thức)
REQUIREMENT → PROVISION → ARCHITECTURE → CODE → BUILD đều `PASSED`.
TEST = `FAILED` (đúng hiện trạng: 0 file test thật ở cả Backend và Frontend, không phải lỗi cần sửa trong onboarding).
PREVIEW = `PENDING` — **chưa từng chạy `docker compose up` thật cho project này**.
GIT_PUSH = `PENDING` — đang ở nhánh local `dev-dieuphoi-mm` (base từ `origin/main` @ 4653203), chưa push remote.
APPROVAL = `PENDING`.

## Đã build (còn trên máy, xem `docker images`)
- `ktv_ecotel_backend_img:latest` (2.29GB)
- `ktv_ecotel_frontend_img:latest` (144MB)
- `ktv_reverse_proxy_img:latest` (238MB)
- `dieuphoimm-backend-baseline:latest` (2.29GB, dùng cho bước BUILD/TEST trong pipeline)

Build 3 image đầu thành công ngay trước khi gặp sự cố hết đĩa (xem mục dưới) — dùng cho bước PREVIEW (`docker compose -f WebApp/docker-compose.yaml up`), nhưng **PREVIEW chưa chạy thật**.

## Sự cố 2026-08-24: ổ C: hết sạch dung lượng (0 byte trống)
Phát hiện giữa lúc chuẩn bị chạy PREVIEW (`docker compose up`). Đã dừng lại đúng lúc — **không** chạy compose up, không đụng tới volume/DB nào của project này. Nguyên nhân do cache/image Docker tích luỹ nhiều (xem `docker system df`: build cache 16.5GB, 7.1GB reclaimable; images 17.68GB, 3.4GB reclaimable) cộng dồn từ nhiều project khác nhau trên máy, không riêng DIEU-PHOI-MM.

## Quyết định của user: nâng cấp ổ cứng
User sẽ nâng cấp ổ đĩa, phải cài lại Docker Desktop và phần mềm liên quan. Sẽ ra lệnh "backup" sau — xem memory `project_disk_upgrade_backup_2026_08` để biết checklist cụ thể cần backup trước khi wipe/cài lại (danh sách docker volume có dữ liệu thật của nhiều project, không chỉ DIEU-PHOI-MM).

**Việc cần làm cho riêng DIEU-PHOI-MM sau khi máy mới/Docker mới sẵn sàng:**
1. Rebuild 3 image trên từ `WebApp/Backend`, `WebApp/Frontend`, `WebApp/reverse_proxy` (không cần backup vì rebuild được từ source, source nằm trong git tại `projects/DIEU-PHOI-MM/`).
2. Tạo `WebApp/Backend/.env`, `WebApp/Frontend/.env`, `serviceAccountKey.json` (Firebase) — **các file này chưa từng tồn tại trên máy này** (đã xác nhận trong `docs/ARCHITECTURE_CURRENT.md` mục 5), không phải việc "khôi phục", phải xin/tạo mới. Danh sách biến cần: xem `docs/ARCHITECTURE_CURRENT.md` mục 5.
3. Chưa có volume MongoDB thật nào của DIEU-PHOI-MM (`ktv_db`) trên máy — vì PREVIEW chưa chạy lần nào — nên không có dữ liệu DB riêng của project này cần backup.
4. Sau khi PREVIEW chạy được thật, tiếp tục GIT_PUSH (push nhánh `dev-dieuphoi-mm` lên remote) rồi APPROVAL.

## Lưu ý khác đang có hiệu lực (không đổi so với lúc onboarding)
- `automation.allow_apply_code` đang TẮT trong `project.yaml` — chưa có test baseline thật để làm lưới an toàn, không tự bật.
- Không bao giờ push `main`/`develop` của repo `EcoTel-QL-Lenh-SX` — có CI/CD thật tự deploy VPS.
- Bug `ROLES` trong `config.js`, thiếu auth ở `upload.routes.js`, 2 bug logic ở `device.routes.js` đều mới **ghi nhận**, chưa sửa (xem `docs/TECHNICAL_DEBT.md`).
