import { useState, useEffect } from 'react'
import io from 'socket.io-client'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material'
import { parentService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StudentCard from "../parent/components/StudentCard"
import '../styles/parent.css'

// URL Backend của bạn
const SOCKET_URL = 'http://localhost:5000'; 

const ParentDashboard = () => {
  const { user } = useAuth()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // State quản lý thông báo
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  })

  useEffect(() => {
    loadData()

    // --- LOGIC SOCKET BẮT ĐẦU TẠI ĐÂY ---
    let socket = null;
    if (user?.detail?.idPhuHuynh) {
        // 1. Kết nối tới server
        socket = io(SOCKET_URL);

        // 2. Định nghĩa tên kênh lắng nghe (phải khớp với Backend)
        const eventName = `notification:parent:${user.detail.idPhuHuynh}`;
        console.log('[Parent] Bắt đầu nghe sự kiện:', eventName);

        // 3. Xử lý khi nhận được tin nhắn từ Server
        socket.on(eventName, (data) => {
            console.log('[Parent] Nhận thông báo:', data);
            
            // Hiển thị thông báo lên màn hình
            setNotification({
                open: true,
                message: `${data.title}: ${data.message}`,
                severity: data.type === 'KHAN_CAP' ? 'error' : 'success'
            });

            // Tải lại dữ liệu để cập nhật trạng thái (ví dụ: từ "Đang chờ" -> "Trên xe")
            loadData(); 
        });
    }

    // Cleanup khi thoát trang
    return () => {
        if (socket) socket.disconnect();
    }
    // --- KẾT THÚC LOGIC SOCKET ---

  }, [user])

  const loadData = async () => {
    try {
      // Logic giữ nguyên như cũ để không bị nháy loading liên tục khi nhận socket
      // Chỉ hiện loading lần đầu tiên
      if (children.length === 0) setLoading(true) 
      
      setError(null)

      if (user && user.detail?.idPhuHuynh) {
        const response = await parentService.getStudents(user.detail.idPhuHuynh)
        const childrenData = Array.isArray(response.data)
          ? response.data
          : (response.data?.data || [])

        const normalized = childrenData.map(child => ({
          id: child.idHocSinh,
          name: child.hoTen,
          className: child.lop,
          status: mapStatus(child.status), // Hàm mapStatus ở dưới
          busName: child.xeBus || 'Chưa phân công xe',
          pickupPoint: child.tenDiemDon || 'Chưa có',
          pickupTime: child.gioBatDau?.substring(0, 5) || '07:15',
          driver: child.tenTaiXe || 'Chưa có',
          driverPhone: child.sdtTaiXe || '0901234567',
          routeName: child.tenTuyen || 'Chưa có tuyến',
          lat: 10.762622,
          lng: 106.660172,
        }))

        setChildren(normalized)
      } else {
        setError('Không tìm thấy thông tin phụ huynh')
      }
    } catch (err) {
      console.error('[ParentDashboard] Load error:', err)
      setError('Không thể tải dữ liệu. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const mapStatus = (backendStatus) => {
    // Map trạng thái từ Backend sang Frontend
    // Backend: 'DA_DON', 'DA_TRA', 'VANG'
    switch (backendStatus) {
      case 'DA_DON': return 'onboard'; // Trên xe
      case 'DA_TRA': return 'arrived'; // Đã về
      case 'VANG': return 'missing_bus'; // Vắng/Lỡ xe
      default: return 'waiting'; // Đang chờ
    }
  }

  return (
    <div className="parent-app">
      <Box sx={{ maxWidth: '650px', margin: '0 auto', p: 2 }}>
        <p className="greeting">
          Xin chào, {user?.detail?.hoTen || 'Phụ huynh'}
        </p>

        <Typography sx={{ fontSize: '16px', fontWeight: 600, mb: 3, color: '#fff' }}>
          Con của bạn
        </Typography>

        {loading && (
          <Box textAlign="center" py={6}>
            <CircularProgress size={36} sx={{ color: '#666' }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && children.length === 0 && (
          <Box className="card" textAlign="center" py={6}>
            <Typography color="#94a3b8">
              Chưa có thông tin học sinh được liên kết
            </Typography>
          </Box>
        )}

        {children.map((child, index) => (
          <StudentCard
            key={child.id}
            student={child}
            isInitiallyExpanded={index === 0}
          />
        ))}
      </Box>

      {/* UI THÔNG BÁO NỔI (SNACKBAR) */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={() => setNotification(prev => ({...prev, open: false}))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }} // Hiện ở trên cùng giữa
      >
        <Alert 
          onClose={() => setNotification(prev => ({...prev, open: false}))} 
          severity={notification.severity} 
          sx={{ width: '100%', boxShadow: 3, fontSize: '1.1rem' }}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default ParentDashboard