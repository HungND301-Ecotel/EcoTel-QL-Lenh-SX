# Bản đồ codebase — DIEU-PHOI-MM

Đọc trực tiếp từ source thật ngày 2026-08-24 (nhánh `dev-dieuphoi-mm`, base từ `main` @ `4653203`).

```
DIEU-PHOI-MM/
├── WebApp/                        # Toàn bộ hệ thống web (factory quản lý phần này)
│   ├── Backend/                   # Node.js 18 + Express + MongoDB
│   │   ├── server.js              # Entry point — mount 24 route, CORS, helmet, rate-limit, Swagger, Socket.IO
│   │   ├── config/
│   │   │   ├── config.js          # Enum: JOB_TYPE, STATUS_ORDER, ROLE, STATUS_DEVICE, STATUS_REPAIR...
│   │   │   ├── db.config.js       # connectWithRetry (5 lần, 5s/lần, exit(1) nếu vẫn fail)
│   │   │   └── firebase.js        # Firebase Admin SDK init (push notification)
│   │   ├── data-seeder/seed.js    # Tự chạy khi server start — seed admin/123456 + 4 loại thiết bị mặc định
│   │   ├── middleware/
│   │   │   └── auth.middleware.js # verifyToken (JWT) + restrictTo(...roles) — áp dụng PER-ROUTE, không phải router.use()
│   │   ├── models/                # 20 Mongoose model (xem REQUIREMENTS_AS_IS.md để map theo nghiệp vụ)
│   │   ├── routes/                # 24 route file — xem bảng bên dưới
│   │   ├── utils/
│   │   │   ├── errorHandler.js    # AppError + errorHandler — TỒN TẠI nhưng KHÔNG được mount trong server.js
│   │   │   ├── logger.js          # Winston, dùng req.logger.child() theo từng request
│   │   │   ├── cron.js            # node-cron job(s) — chưa đọc chi tiết nội dung, xem TECHNICAL_DEBT nếu cần
│   │   │   └── uploadImage.js     # Multer + S3 (getPresignedUrl / getDownloadUrl)
│   │   ├── Dockerfile              # FROM node:18, ENTRYPOINT entrypoint.sh -> exec npm run start (không nhận CMD)
│   │   └── entrypoint.sh
│   ├── Frontend/                  # React 18 + TypeScript (Create React App / react-scripts, KHÔNG phải Vite)
│   │   └── src/
│   │       ├── pages/             # 21 module UI — auth, dashboard, orders, dispatcherOrder, job, vehicles,
│   │       │                      #   machine, departments, positions, locations, materials, model,
│   │       │                      #   deviceModels, deviceTypes, safetyMeasures, shift, TravelLog,
│   │       │                      #   reports, notifications, users, PrivacyPolicy
│   │       ├── services/socketService.ts  # Socket.IO client, dùng đúng process.env.REACT_APP_SOCKET_API (CRA)
│   │       ├── config/api.config.ts       # axios baseURL = process.env.REACT_APP_BASE_API
│   │       └── hooks/, atoms/, components/, layout/, theme/, types/, utils/
│   ├── backup/                    # Python 3.11 + boto3 + mongodb-database-tools — backup/restore MongoDB → S3 THẬT
│   │   ├── src/backup.py, restore.py, common.py
│   │   └── crontab                # Chạy 7 lần/ngày (7,10,13,16,19,22,2h) qua cron trong container
│   ├── reverse_proxy/             # Nginx — 3 biến thể cấu hình
│   │   ├── nginx_staging.conf     # Dùng cho dev/staging local, port 8888, upstream ĐÚNG tên (ktv_*)
│   │   ├── nginx_release.conf     # SSL thật, server_name hardcode "dieuhanhquanlythietbitcs.vn" (domain của SITE KHÁC — không dùng được nguyên trạng cho DIEU-PHOI-MM)
│   │   └── Dockerfile             # ARG NGINX_CONF mặc định = nginx_staging.conf
│   ├── docker-compose.yaml        # Compose cho dev local: ktv_reverse_proxy/Frontend/Backend/db/grafana/loki/promtail/backup
│   ├── docker-compose-build.yaml  # Compose RIÊNG dùng để build+push image lên Docker Hub (CI thật dùng cái này)
│   ├── loki-config.yaml, promtail-config.yaml
│   └── Makefile                   # up/build (local) | staging/release (build+push Docker Hub, cần secrets CI)
├── MobileApp/                     # Flutter (package "soft", version 2.0.4+26) — KHÔNG quản lý qua factory pipeline này
├── deployment/
│   ├── staging/                   # staging-docker-compose.yaml + start-app.sh (chạy trên STAGING_HOST qua SSH)
│   ├── release/                   # release-docker-compose.yaml + start-app.sh (chạy trên RELEASE_HOST qua SSH)
│   └── terraform/                 # IaC THẬT cho hạ tầng backup S3 (bucket, IAM user, retention, alert email) — main.tf/variables.tf/outputs.tf
├── .github/workflows/
│   ├── deploy-release.yml         # Trigger: push main    → build+push Docker Hub → SSH deploy RELEASE_HOST (TỰ ĐỘNG)
│   └── deploy-staging.yml         # Trigger: push develop → build+push Docker Hub → SSH deploy STAGING_HOST (TỰ ĐỘNG)
└── README.md
```

## Danh sách route Backend (24 file, tương ứng `/api/<tên số nhiều>`)

`auth`, `users`, `departments`, `devices`, `orders`, `reports`, `notifications`, `materials`, `locations`, `jobs`, `positions`, `devicetypes`, `histories`, `shiftReports`, `checkIns`, `safetyMeasures`, `uploads` (⚠️ không có `verifyToken`), `exports`, `shifts`, `reporthistories`, `travellogs`, `devicemodels`, `models`, `analysics`.

Ngoài ra `server.js` có thêm `GET /api/system-info` (CPU/RAM/disk của chính container) mount trực tiếp, không qua route file riêng.
