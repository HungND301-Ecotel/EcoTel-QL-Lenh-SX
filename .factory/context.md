# DIEU-PHOI-MM — Context (cập nhật 2026-08-24)

## Trạng thái pipeline (xem `.factory/pipeline.json` để có bản chính thức)
REQUIREMENT → PROVISION → ARCHITECTURE → CODE → BUILD → TEST đều `PASSED` (cập nhật 2026-08-24, xem mục "CODE/TEST đã cập nhật" bên dưới để hiểu vì sao khác bản ghi cũ).
PREVIEW = `PENDING` — **chưa từng chạy `docker compose up` thật cho project này** (thiếu `.env`/`serviceAccountKey.json`, không liên quan tới CODE/TEST).
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

## Quyết định của user: nâng cấp ổ cứng — ĐÃ XONG (2026-08-24)
Backup + nâng cấp ổ đĩa + cài lại Docker Desktop + restore đã hoàn tất trong cùng ngày — xem memory `project_disk_upgrade_backup_2026_08` và `docs/PROJECT_STATE.md` mục 2 ở gốc factory. Core factory + GIAO-CA + TK-HATU đã verify sống lại đúng. Riêng DIEU-PHOI-MM: không có volume MongoDB nào cần restore (PREVIEW chưa từng chạy, xem mục dưới), 3 image build trước sự cố đã mất theo Docker Desktop cũ — cần rebuild lại (không cần backup vì rebuild được từ source).

**Việc cần làm cho riêng DIEU-PHOI-MM sau khi máy mới/Docker mới sẵn sàng:**
1. Rebuild 3 image trên từ `WebApp/Backend`, `WebApp/Frontend`, `WebApp/reverse_proxy` (không cần backup vì rebuild được từ source, source nằm trong git tại `projects/DIEU-PHOI-MM/`).
2. Tạo `WebApp/Backend/.env`, `WebApp/Frontend/.env`, `serviceAccountKey.json` (Firebase) — **các file này chưa từng tồn tại trên máy này** (đã xác nhận trong `docs/ARCHITECTURE_CURRENT.md` mục 5), không phải việc "khôi phục", phải xin/tạo mới. Danh sách biến cần: xem `docs/ARCHITECTURE_CURRENT.md` mục 5.
3. Chưa có volume MongoDB thật nào của DIEU-PHOI-MM (`ktv_db`) trên máy — vì PREVIEW chưa chạy lần nào — nên không có dữ liệu DB riêng của project này cần backup.
4. Sau khi PREVIEW chạy được thật, tiếp tục GIT_PUSH (push nhánh `dev-dieuphoi-mm` lên remote) rồi APPROVAL.

## CODE/TEST đã cập nhật (2026-08-24) — bản ghi cũ ở trên từng lệch với DB thật

Trước đoạn này, file từng ghi CODE = PASSED (chỉ đúng ở bước onboarding, phát hiện lỗi nhưng không sửa) và TEST = FAILED (0 test file). Giữa 2 lần đó đã xảy ra thêm nhiều việc, **đã ghi đầy đủ trong `docs/TECHNICAL_DEBT.md`** (mục 1/5/7 + "Bài học thật khi dùng apply_code"):

- **3/3 lần thử `apply_code` qua MiMO đều KHÔNG dùng được nguyên trạng**: task #135 (sửa 1 dòng `ROLES`) viết lại toàn bộ `config.js`, phá huỷ nhiều export đang dùng thật — đã `revert` (`ae4fa70`); task #136 (thêm `verifyToken` vào `upload.routes.js`) tự ý đổi sai 1 đường dẫn `require()`, sẽ crash server thật lúc boot — build/test không bắt được, chỉ phát hiện bằng `require()` trực tiếp; task #137 (2 fix 1 dòng `device.routes.js`) từ chối vì cơ chế `apply_code` bắt buộc ghi lại TOÀN BỘ 1174 dòng file gốc.
- Cả 3 bug đã phát hiện (ROLES sai, thiếu auth `upload.routes.js`, 2 bug logic `device.routes.js`) **đã được sửa TAY trực tiếp** (không qua `apply_code`), verify độc lập bằng `require()` module trong container — không chỉ tin build/test PASS. Commit: `623ab24`/`d7091e2`/`ca9b31e`.
- Commit `623ab24` kèm luôn **test baseline đầu tiên của dự án** (`WebApp/Backend/tests/config.test.js`) — re-verify thật 2026-08-24 (sau khi cài lại Docker Desktop, xem sự cố đĩa bên dưới): `npm test` PASS 2/2. Đây là lý do TEST đổi từ FAILED sang PASSED.
- **Phát hiện thêm, đã sửa 2026-08-24 (không phải lỗi DIEU-PHOI-MM, mà bug thật của chính pipeline-worker):** task #137 fail vì `pipeline-worker` trích `@path` bằng regex nuốt luôn dấu phẩy ngay sau path (`@WebApp/Backend/routes/device.routes.js,` → không khớp file thật), khiến model nhận `file_context` rỗng. Đã sửa + deploy vào `pipeline-worker` (xem `docs/INCIDENTS.md` mục 19 ở gốc factory) — nhưng **không cần dùng lại `apply_code` cho 2 bug `device.routes.js` này** vì đã sửa tay xong từ trước rồi (commit `ca9b31e`).
- `automation.allow_apply_code` hiện **ĐANG BẬT** trong `project.yaml` (bật 2026-08-24 sau khi có test baseline đầu tiên) — khác với ghi chú "TẮT" cũ ở mục dưới, đã sửa lại.

**Bài học cho project này:** nguồn đáng tin cho trạng thái pipeline luôn là `GET /api/projects/{id}` (DB thật), không phải file `.factory/pipeline.json`/`context.md` cục bộ — 2 file này chỉ đáng tin nếu được cập nhật đều sau MỌI task agent chạy trên project, không chỉ sau bước onboarding thủ công. Với file lớn/nhiều export không liên quan tới chỗ cần sửa, cân nhắc sửa tay trực tiếp ngay từ đầu nếu fix chỉ 1-2 dòng và đã biết rõ nội dung — nhanh hơn chờ `apply_code` thất bại rồi mới sửa tay (xem thêm `docs/TECHNICAL_DEBT.md`).

## Lưu ý khác đang có hiệu lực
- `automation.allow_apply_code` đang **BẬT** trong `project.yaml` (từ 2026-08-24, sau khi có test baseline đầu tiên) — xem mục "CODE/TEST đã cập nhật" ở trên.
- Không bao giờ push `main`/`develop` của repo `EcoTel-QL-Lenh-SX` — có CI/CD thật tự deploy VPS.
- Bug `ROLES` trong `config.js`, thiếu auth ở `upload.routes.js`, 2 bug logic ở `device.routes.js` — cả 3 **đã sửa xong** (commit `623ab24`/`d7091e2`/`ca9b31e`, xem `docs/TECHNICAL_DEBT.md`).
