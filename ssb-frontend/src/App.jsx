import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// --- 1. LAYOUT & AUTH ---
import Layout from './components/Layout';
import Login from './pages/Login';

// --- 2. CÁC DASHBOARD CHÍNH (Đã import file thật của bạn) ---
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import ParentDashboard from './pages/ParentDashboard';

// --- 3. CÁC TRANG CON CỦA ADMIN ---
import StudentsPage from './pages/StudentsPage';
import RoutesPage from './pages/RoutesPage';
import DriversPage from './pages/DriversPage';
import ParentsPage from './pages/ParentsPage';
import BusesPage from './pages/BusesPage';
import SchedulesPage from './pages/SchedulesPage';
import ProfilePage from './pages/ProfilePage';

// --- COMPONENT BẢO VỆ ROUTE ---
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra quyền (nếu allowedRoles được truyền vào)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Nếu role không khớp, đẩy về trang dashboard mặc định của role đó
    if (user.role === 'QUAN_LY') return <Navigate to="/admin" replace />;
    if (user.role === 'TAI_XE') return <Navigate to="/driver" replace />;
    if (user.role === 'PHU_HUYNH') return <Navigate to="/parent" replace />;
  }
  
  return children;
};

function App() {
  const { user } = useAuth();

  // Hàm điều hướng mặc định sau khi login
  const getDashboardRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'QUAN_LY': return '/admin';
      case 'TAI_XE': return '/driver';
      case 'PHU_HUYNH': return '/parent';
      default: return '/login';
    }
  };

  return (
    <Routes>
      {/* 1. Route Login */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={getDashboardRoute()} replace />} />

      {/* 2. Main Layout (Bọc tất cả các trang nội bộ) */}
      <Route path="/" element={<Layout />}>
        
        {/* --- KHU VỰC ADMIN --- */}
        <Route path="admin">
            <Route index element={
                <ProtectedRoute allowedRoles={['QUAN_LY']}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            <Route path="students" element={<ProtectedRoute allowedRoles={['QUAN_LY']}><StudentsPage /></ProtectedRoute>} />
            <Route path="routes" element={<ProtectedRoute allowedRoles={['QUAN_LY']}><RoutesPage /></ProtectedRoute>} />
            <Route path="drivers" element={<ProtectedRoute allowedRoles={['QUAN_LY']}><DriversPage /></ProtectedRoute>} />
            <Route path="parents" element={<ProtectedRoute allowedRoles={['QUAN_LY']}><ParentsPage /></ProtectedRoute>} />
            <Route path="buses" element={<ProtectedRoute allowedRoles={['QUAN_LY']}><BusesPage /></ProtectedRoute>} />
            <Route path="schedules" element={<ProtectedRoute allowedRoles={['QUAN_LY']}><SchedulesPage /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute allowedRoles={['QUAN_LY']}><ProfilePage /></ProtectedRoute>} />
        </Route>

        {/* --- KHU VỰC TÀI XẾ --- */}
        <Route path="driver">
            <Route index element={
                <ProtectedRoute allowedRoles={['TAI_XE']}>
                    <DriverDashboard />
                </ProtectedRoute>
            } />
            {/* Các trang con của tài xế nếu có (ví dụ: lịch sử chuyến đi) */}
            {/* <Route path="history" element={...} /> */}
        </Route>

        {/* --- KHU VỰC PHỤ HUYNH --- */}
        <Route path="parent">
            <Route index element={
                <ProtectedRoute allowedRoles={['PHU_HUYNH']}>
                    <ParentDashboard />
                </ProtectedRoute>
            } />
            {/* Các trang con của phụ huynh */}
        </Route>

        {/* Redirect mặc định về Dashboard nếu gõ mỗi domain */}
        <Route index element={<Navigate to={getDashboardRoute()} replace />} />
      </Route>

      {/* Catch-all: Nếu nhập link bậy thì về trang chủ */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;