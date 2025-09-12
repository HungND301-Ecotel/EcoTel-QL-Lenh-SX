# 🌐 EcoTel Lenh_sx

Hệ thống đa dịch vụ gồm:

- **Frontend**: React + TypeScript  
- **Backend**: Node.js + Express + MongoDB  
- **Storage**: Upload ảnh / Backup db lên Amazon S3  
- **Deployment**: Docker + Nginx Reverse Proxy  
- **Mobile App**: Flutter  
- **Notification**: Firebase Cloud Messaging (FCM)  

---

## 📂 Cấu trúc dự án
.
├── Mobile/ # Flutter app
├── WebApp/ # Toàn bộ hệ thống web
│ ├── Backend/ # Node.js + Express + MongoDB
│ ├── Backup/ # Script / dữ liệu backup MongoDB
│ ├── Frontend/ # React + TypeScript
│ ├── reverse-proxy/ # Nginx reverse proxy config
│ ├── docker-compose.yml # Docker orchestration
└── README.md # Tài liệu chính (tổng quan hệ thống)

---

## 🖥️ Frontend (React + TypeScript)

- Framework: React + TypeScript
- UI: Material-UI
- State management: React Query, Jotai
- Excel: ExcelJS
- Auth: JWT

### 🚀 Chạy local
- cd WebApp/Frontend
- npm install
- npm start

## ⚙️ Backend (Node.js + Express + MongoDB)
- Framework: Express.js
- Database: MongoDB + Mongoose
- Auth: JWT
- Upload file: Multer + AWS SDK (S3)
- Logging: Winston + Loki

### 🚀 Chạy local
- cd WebApp/Backend
- npm install
- npm run dev

## ☁️ Upload ảnh 
- Upload ảnh bằng Multer → S3
## ☁️ Backup db (python)
- Tự động backup -> S3
- Restore db

## 🐳 Docker & Reverse Proxy

- Docker Compose quản lý toàn bộ service:
- frontend - React build
- backend - Node.js + Express
- mongo - MongoDB
- reverse-proxy - Nginx
- grafana + loki + promtail - Monitoring

## 🚀 Chạy toàn hệ thống
- docker-compose up -d --build

## 🔀 Reverse Proxy (Nginx)
- Proxy frontend & backend
- SSL với Let’s Encrypt
- Hỗ trợ CORS

## 🚀 Chạy app
- cd MobileApp
- flutter pub get
- flutter run

## 🔔 Push Notification (Firebase)

- Firebase Cloud Messaging (FCM)
1. Hỗ trợ:
- Nhận thông báo foreground / background
- Lưu token FCM trong MongoDB
2. Cấu hình:
- Tạo project Firebase
- Tải ServiceAccountKey.json(Nodejs), google-services.json (Android) hoặc - - - GoogleService-Info.plist (iOS)

## 📖 Tài liệu tham khảo

- React (https://react.dev/)
- Express.js (https://expressjs.com/)
- MongoDB (https://www.mongodb.com/docs/)
- Amazon S3 (https://docs.aws.amazon.com/s3/)
- Docker (https://docs.docker.com/)
- Flutter (https://docs.flutter.dev/)
- Firebase Cloud Messaging (https://firebase.google.com/docs/cloud-messaging?hl=vi)