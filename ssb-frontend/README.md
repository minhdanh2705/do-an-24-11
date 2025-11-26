# SSB Frontend - Smart School Bus Tracking System

Frontend application cho hệ thống quản lý xe đưa đón học sinh.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool (nhanh hơn CRA)
- **Material-UI (MUI)** - Component library
- **React Router v6** - Routing
- **React Leaflet** - Map tracking
- **Axios** - HTTP client
- **Context API** - State management

## Cài Đặt

\`\`\`bash
# Di chuyển vào thư mục frontend
cd ssb-frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
\`\`\`

Frontend sẽ chạy tại: http://localhost:3000

## Cấu Trúc Thư Mục

\`\`\`
ssb-frontend/
├── src/
│   ├── components/       # Shared components
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Layout.jsx
│   │   └── MapComponent.jsx
│   ├── pages/           # Page components
│   │   ├── Login.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── DriverDashboard.jsx
│   │   └── ParentDashboard.jsx
│   ├── context/         # Context API
│   │   └── AuthContext.jsx
│   ├── services/        # API services
│   │   └── api.js
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
\`\`\`

## Tính Năng

### 1. Admin Dashboard
- Xem tổng quan hệ thống
- Quản lý xe bus, học sinh, tuyến đường
- Xem bản đồ real-time tất cả xe

### 2. Driver Dashboard
- Xem lịch làm việc hàng ngày
- Danh sách học sinh cần đón
- Báo cáo điểm danh

### 3. Parent Dashboard
- Theo dõi vị trí xe bus real-time
- Thông tin con em
- Nhận thông báo khi xe đến gần

## Demo Accounts

\`\`\`
Admin:
- Username: admin
- Password: admin123

Tài xế:
- Username: taixe1
- Password: taixe123

Phụ huynh:
- Username: phuhuynh1
- Password: ph123
\`\`\`

## API Proxy

Vite đã được config để proxy requests từ `/api` sang backend `http://localhost:5000`

## Build Production

\`\`\`bash
npm run build
\`\`\`

Build output sẽ ở thư mục `dist/`
