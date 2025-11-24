import { useState, useEffect } from 'react'
import io from 'socket.io-client'
import { Box, Typography, CircularProgress, Alert, Snackbar } from '@mui/material'
import { parentService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StudentCard from "../parent/components/StudentCard"
import '../styles/parent.css'

const SOCKET_URL = 'http://localhost:5000'; 

const ParentDashboard = () => {
  const { user } = useAuth()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' })

  useEffect(() => {
    loadData()

    let socket = null;
    if (user?.detail?.idPhuHuynh) {
        socket = io(SOCKET_URL);
        const eventName = `notification:parent:${user.detail.idPhuHuynh}`;
        console.log("Listening socket:", eventName);
        
        socket.on(eventName, (data) => {
            setNotification({
                open: true,
                message: `${data.title}: ${data.message}`,
                severity: data.type === 'KHAN_CAP' ? 'error' : 'success'
            });
            loadData(); 
        });
    }
    return () => { if (socket) socket.disconnect(); }
  }, [user])

  const loadData = async () => {
    if (children.length === 0) setLoading(true)
    setError(null)

    try {
      if (user && user.detail?.idPhuHuynh) {
        const response = await parentService.getStudents(user.detail.idPhuHuynh)
        const childrenData = response.data?.data || response.data || []

        const normalized = childrenData.map(child => ({
          id: child.idHocSinh,
          hoTen: child.hoTen,
          lop: child.lop,
          
          // --- MAP ĐÚNG TRƯỜNG DỮ LIỆU TỪ SQL ---
          idLichTrinh: child.idLichTrinh,
          trangThaiDiemDanh: child.trangThaiDiemDanh, // 0: Vắng/Chưa đón, 1: Đã đón, 2: Đã trả
          trangThaiDiChuyen: child.trangThaiDiChuyen, // 0: Chưa đi, 1: Đang đi
          
          tenTuyen: child.tenTuyen || 'Chưa phân tuyến',
          tenDiemDon: child.tenDiemDon || 'Chưa có điểm đón',
          thuTuDiemDon: child.thuTuDiemDon,
          thuTuTramHienTai: child.thuTuTramHienTai,
          
          tenTaiXe: child.tenTaiXe,
          sdtTaiXe: child.sdtTaiXe,
          bienSoXe: child.bienSoXe,
          
          latDon: child.latDon,
          lngDon: child.lngDon,
          
          // fix lỗi: truyền trangThaiDiemDanh vào mapStatus
          status: mapStatus(child.trangThaiDiemDanh)
        }))

        setChildren(normalized)
      }
    } catch (err) {
      console.error('[ParentDashboard] Load error:', err)
      setError('Không thể tải dữ liệu. Vui lòng kiểm tra Server.')
    } finally {
      setLoading(false)
    }
  }

  const mapStatus = (statusInt) => {
    switch (statusInt) {
      case 1: return 'onboard';      // Đã đón
      case 2: return 'arrived';      // Đã trả
      default: return 'waiting';     // 0 hoặc null
    }
  }

  return (
    <div className="parent-app">
      <Box sx={{ maxWidth: '650px', margin: '0 auto', p: 2 }}>
        <p className="greeting">Xin chào, {user?.detail?.hoTen}</p>
        <Typography sx={{ fontSize: '16px', fontWeight: 600, mb: 3, color: '#fff' }}>
          Con của bạn
        </Typography>

        {loading && <Box textAlign="center" py={6}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!loading && children.length === 0 && (
          <Box className="card" textAlign="center" py={6}>
            <Typography color="#94a3b8">Chưa có thông tin học sinh.</Typography>
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

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={() => setNotification(prev => ({...prev, open: false}))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={notification.severity} variant="filled" sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default ParentDashboard