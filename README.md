# SSB Backend - Smart School Bus Tracking System 1.0

Backend API cho hệ thống quản lý và theo dõi xe đưa đón học sinh.

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: SQL Server (mssql)
- **Session**: express-session
- **Development**: nodemon

## Cấu trúc thư mục

\`\`\`
ssb-backend/
├── config/
│   └── database.js          # Cấu hình kết nối SQL Server
├── controllers/             # Business logic
│   ├── auth-controller.js
│   ├── bus-controller.js
│   ├── student-controller.js
│   ├── driver-controller.js
│   ├── parent-controller.js
│   ├── route-controller.js
│   ├── schedule-controller.js
│   └── stop-controller.js
├── models/                  # Database models
│   ├── bus-model.js
│   ├── student-model.js
│   ├── driver-model.js
│   ├── parent-model.js
│   ├── route-model.js
│   ├── schedule-model.js
│   └── stop-model.js
├── router/                  # API routes
│   ├── auth-router.js
│   ├── bus-router.js
│   ├── student-router.js
│   ├── driver-router.js
│   ├── parent-router.js
│   ├── route-router.js
│   ├── schedule-router.js
│   ├── stop-router.js
│   └── index.js
├── middleware/
│   └── auth.js             # Authentication middleware
├── data/                   # Hardcode data (Week 3)
│   ├── buses.js
│   ├── students.js
│   ├── routes.js
│   ├── drivers.js
│   ├── parents.js
│   ├── stops.js
│   └── schedules.js
├── views/                  # EJS templates (nếu cần)
├── app.js                  # Main Express server
├── database.sql            # Database schema
├── package.json
└── README.md
\`\`\`

## Cài đặt và chạy

### 1. Cài đặt dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Cấu hình Database

Cập nhật thông tin kết nối SQL Server trong `config/database.js`:

\`\`\`javascript
const config = {
    user: 'your_username',
    password: 'your_password',
    server: 'localhost',
    database: 'CNPM',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};
\`\`\`

### 3. Tạo Database

Chạy file `database.sql` trong SQL Server Management Studio để tạo database và tables.

### 4. Chạy server

**Development mode (với nodemon):**
\`\`\`bash
npm run dev
\`\`\`

**Production mode:**
\`\`\`bash
node app.js
\`\`\`

Server sẽ chạy tại: `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất

### Buses (Xe buýt)
- `GET /api/buses` - Lấy danh sách xe buýt
- `GET /api/buses/:id` - Lấy thông tin xe buýt theo ID
- `POST /api/buses` - Tạo xe buýt mới
- `PUT /api/buses/:id` - Cập nhật xe buýt
- `DELETE /api/buses/:id` - Xóa xe buýt

### Students (Học sinh)
- `GET /api/students` - Lấy danh sách học sinh
- `GET /api/students/:id` - Lấy thông tin học sinh theo ID
- `GET /api/students/:id/parents` - Lấy danh sách phụ huynh của học sinh
- `POST /api/students` - Tạo học sinh mới
- `PUT /api/students/:id` - Cập nhật học sinh
- `DELETE /api/students/:id` - Xóa học sinh

### Routes (Tuyến đường)
- `GET /api/routes` - Lấy danh sách tuyến đường
- `GET /api/routes/:id` - Lấy thông tin tuyến đường theo ID
- `GET /api/routes/:id/stops` - Lấy danh sách điểm dừng của tuyến
- `POST /api/routes` - Tạo tuyến đường mới
- `PUT /api/routes/:id` - Cập nhật tuyến đường
- `DELETE /api/routes/:id` - Xóa tuyến đường

### Drivers (Tài xế)
- `GET /api/drivers` - Lấy danh sách tài xế
- `GET /api/drivers/:id` - Lấy thông tin tài xế theo ID
- `GET /api/drivers/:id/schedules` - Lấy lịch làm việc của tài xế
- `POST /api/drivers` - Tạo tài xế mới
- `PUT /api/drivers/:id` - Cập nhật tài xế
- `DELETE /api/drivers/:id` - Xóa tài xế

### Parents (Phụ huynh)
- `GET /api/parents` - Lấy danh sách phụ huynh
- `GET /api/parents/:id` - Lấy thông tin phụ huynh theo ID
- `GET /api/parents/:id/students` - Lấy danh sách học sinh của phụ huynh
- `POST /api/parents` - Tạo phụ huynh mới
- `PUT /api/parents/:id` - Cập nhật phụ huynh
- `DELETE /api/parents/:id` - Xóa phụ huynh
- `POST /api/parents/:id/link-student` - Liên kết phụ huynh với học sinh
- `DELETE /api/parents/:id/unlink-student/:studentId` - Hủy liên kết

### Stops (Điểm dừng)
- `GET /api/stops` - Lấy danh sách điểm dừng
- `GET /api/stops/:id` - Lấy thông tin điểm dừng theo ID
- `POST /api/stops` - Tạo điểm dừng mới
- `PUT /api/stops/:id` - Cập nhật điểm dừng
- `DELETE /api/stops/:id` - Xóa điểm dừng

### Schedules (Lịch trình)
- `GET /api/schedules` - Lấy danh sách lịch trình
- `GET /api/schedules/:id` - Lấy thông tin lịch trình theo ID
- `GET /api/schedules/:id/attendance` - Lấy điểm danh của lịch trình
- `POST /api/schedules` - Tạo lịch trình mới
- `PUT /api/schedules/:id` - Cập nhật lịch trình
- `PUT /api/schedules/:id/location` - Cập nhật vị trí xe
- `PUT /api/schedules/:id/attendance` - Cập nhật điểm danh
- `DELETE /api/schedules/:id` - Xóa lịch trình

## Test với Postman

Import file `postman-collection.json` vào Postman để test tất cả API endpoints.

## Trạng thái phát triển

**✅ TUẦN 3 - Backend Development Foundation (HOÀN THÀNH)**

- ✅ Setup Express.js server (port 5000)
- ✅ Tạo models cho Bus, Student, Route, Driver, Parent, Stop, Schedule
- ✅ API endpoints CRUD đầy đủ cho tất cả entities
- ✅ Setup CORS và middleware
- ✅ Hardcode data cho development
- ✅ Postman collection để test

**✅ TUẦN 4 - Frontend Development Foundation (HOÀN THÀNH)**

- ✅ Setup React project với Vite
- ✅ Tạo components cơ bản (Header, Sidebar, Layout)
- ✅ Tích hợp React Leaflet cho map tracking
- ✅ Dashboard cho Admin với quản lý xe bus
- ✅ Giao diện cho Driver với lịch làm việc
- ✅ Giao diện cho Parent với tracking real-time
- ✅ Styling với Material-UI responsive

**✅ TUẦN 5 - Integration & MVP2 Complete (HOÀN THÀNH)**

- ✅ Kết nối Frontend với Backend API
- ✅ Implement CRUD operations đầy đủ (buses, students, routes)
- ✅ Authentication cơ bản với 3 user types
- ✅ Route management với phân công xe bus
- ✅ Schedule management với điểm danh học sinh
- ✅ Testing integration và fix bugs
- ✅ MVP2 sẵn sàng demo

**🔄 TUẦN 6 - Real-time Tracking Implementation (TIẾP THEO)**

- ⏳ Setup Socket.IO server
- ⏳ Implement location tracking API
- ⏳ Frontend tích hợp Socket.IO client
- ⏳ GPS simulation cho testing
- ⏳ Real-time map updates
- ⏳ Geofencing alerts

**⏳ TUẦN 7 - Advanced Features & Polish**

**⏳ TUẦN 8 - Testing, Documentation & Presentation**

## Database Schema

Tham khảo file `database.sql` để xem chi tiết schema:

**Tables chính:**
- XEBUS (Xe buýt)
- HOCSINH (Học sinh)
- TUYENDUONG (Tuyến đường)
- DIEMDUNG (Điểm dừng)
- TAIXE (Tài xế)
- PHUHUYNH (Phụ huynh)
- QUANLY (Quản lý)
- LICHTRINH (Lịch trình)
- DIEMDANH (Điểm danh)
- TAIKHOAN (Tài khoản)

## Dependencies

\`\`\`json
{
  "express": "^5.1.0",
  "mssql": "^12.0.0",
  "express-session": "^1.18.2",
  "body-parser": "^2.2.0",
  "ejs": "^3.1.10",
  "nodemon": "^3.1.10"
}
\`\`\`

## Lưu ý

- Tuần 3 đang sử dụng **hardcode data** trong folder `data/`
- Tuần 5 sẽ kết nối thực với SQL Server database
- CORS đã được enable cho phép frontend connect
- Session-based authentication đã được setup

## Support

Nếu gặp vấn đề, vui lòng liên hệ team development.
