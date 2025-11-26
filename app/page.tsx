export default function Page() {
  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#1976d2', marginBottom: '20px' }}>
        🚌 Smart School Bus Tracking System - SSB 1.0
      </h1>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2>📁 Cấu Trúc Project</h2>
        <p>Project này được chia thành 2 phần riêng biệt:</p>
        <ul>
          <li><strong>Backend (Node.js + Express + SQL Server)</strong> - Root folder</li>
          <li><strong>Frontend (React + Vite + Material-UI)</strong> - ssb-frontend folder</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ border: '2px solid #1976d2', padding: '20px', borderRadius: '8px' }}>
          <h3>🔧 Backend Setup</h3>
          <pre style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
{`# Cài đặt dependencies
npm install

# Cấu hình database (SQL Server)
# Tạo file .env với nội dung:
DB_SERVER=localhost
DB_DATABASE=SSB_DB
DB_USER=sa
DB_PASSWORD=your_password
SESSION_SECRET=your_secret_key

# Chạy SQL script để tạo database
# File: database.sql

# Khởi động server
npm start
# Server chạy tại: http://localhost:5000`}
          </pre>
        </div>

        <div style={{ border: '2px solid #dc004e', padding: '20px', borderRadius: '8px' }}>
          <h3>🎨 Frontend Setup</h3>
          <pre style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
{`# Di chuyển vào folder frontend
cd ssb-frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
# Frontend chạy tại: http://localhost:3000`}
          </pre>
        </div>
      </div>

      <div style={{ backgroundColor: '#fff3cd', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3>⚠️ Lưu Ý Quan Trọng</h3>
        <ul>
          <li>Backend phải chạy trước (port 5000)</li>
          <li>Frontend sẽ tự động proxy API requests tới backend</li>
          <li>Đảm bảo SQL Server đang chạy và database đã được tạo</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3>👥 Demo Accounts</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
          <div>
            <strong>Admin:</strong><br />
            Username: <code>admin</code><br />
            Password: <code>admin123</code>
          </div>
          <div>
            <strong>Tài xế:</strong><br />
            Username: <code>taixe1</code><br />
            Password: <code>taixe123</code>
          </div>
          <div>
            <strong>Phụ huynh:</strong><br />
            Username: <code>phuhuynh1</code><br />
            Password: <code>ph123</code>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#e8f5e9', padding: '20px', borderRadius: '8px' }}>
        <h3>✅ Hoàn Thành Tuần 4</h3>
        <ul>
          <li>✅ Setup React project với Vite</li>
          <li>✅ Components cơ bản: Header, Sidebar, Layout</li>
          <li>✅ Tích hợp React Leaflet cho map</li>
          <li>✅ Dashboard cho Admin (quản lý xe bus, học sinh, tuyến đường)</li>
          <li>✅ Giao diện cho Driver (lịch làm việc, danh sách học sinh)</li>
          <li>✅ Giao diện cho Parent (theo dõi xe bus real-time)</li>
          <li>✅ Styling với Material-UI (responsive)</li>
        </ul>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>📋 Tech Stack</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <strong>Backend:</strong>
            <ul>
              <li>Node.js + Express.js</li>
              <li>SQL Server (mssql)</li>
              <li>Express Session (Authentication)</li>
              <li>CORS enabled</li>
            </ul>
          </div>
          <div>
            <strong>Frontend:</strong>
            <ul>
              <li>React 18 + Vite</li>
              <li>Material-UI (MUI)</li>
              <li>React Router v6</li>
              <li>React Leaflet (Map)</li>
              <li>Axios (HTTP client)</li>
              <li>Context API (State management)</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center', padding: '20px', backgroundColor: '#1976d2', color: 'white', borderRadius: '8px' }}>
        <h3>🚀 Sẵn sàng cho Tuần 5: Integration & Implementation</h3>
        <p>Backend và Frontend đã hoàn thành. Tiếp theo sẽ tích hợp và thêm tính năng CRUD operations.</p>
      </div>
    </div>
  )
}
