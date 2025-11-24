import { useState, useEffect } from 'react'
import { Box, Card, CardContent, CircularProgress, Typography, Chip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { scheduleService, routeService, busService, driverService } from '../services/api' 
import ScheduleDialog from '../components/ScheduleDialog'

const SchedulesPage = () => {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Dữ liệu cho Dialog (Tuyến, Xe, Tài xế)
  const [auxData, setAuxData] = useState({ routes: [], buses: [], drivers: [] })
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => { loadAllData() }, [])

  const loadAllData = async () => {
    setLoading(true) 
    try {
      const [schRes, routeRes, busRes, driverRes] = await Promise.all([
        scheduleService.getAll(),
        routeService.getAll(),
        busService.getAll(),
        driverService.getAll()
      ])
      
      // --- PHẦN SỬA LỖI QUAN TRỌNG ---
      // Cần kiểm tra kỹ cả 2 trường hợp: trả về mảng trực tiếp HOẶC trả về object { data: [...] }
      
      const schData = Array.isArray(schRes.data) ? schRes.data : (schRes.data?.data || [])
      
      const routesData = Array.isArray(routeRes.data) ? routeRes.data : (routeRes.data?.data || [])
      const busesData = Array.isArray(busRes.data) ? busRes.data : (busRes.data?.data || [])
      const driversData = Array.isArray(driverRes.data) ? driverRes.data : (driverRes.data?.data || [])

      setSchedules(schData)
      
      setAuxData({
        routes: routesData,
        buses: busesData,
        drivers: driversData
      })

    } catch (error) {
      console.error("Load failed", error)
      setSchedules([])
    } finally { setLoading(false) }
  }

  const handleSave = async (data) => {
      try {
          await scheduleService.create(data)
          setDialogOpen(false)
          loadAllData()
          alert("Đã tạo lịch trình thành công!")
      } catch (err) {
          alert("Lỗi: " + (err.response?.data?.message || err.message))
      }
  }

  const formatDate = (dateString) => {
    if(!dateString) return '';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('vi-VN');
    } catch (e) { return dateString; }
  }

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    try {
        if (timeString.includes('T')) {
            const date = new Date(timeString);
            const hh = date.getUTCHours().toString().padStart(2, '0');
            const mm = date.getUTCMinutes().toString().padStart(2, '0');
            return `${hh}:${mm}`;
        }
        return timeString.substring(0, 5);
    } catch (e) {
        return timeString;
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Danh sách lịch trình</h1>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Điều phối thời gian và lộ trình xe chạy
          </Typography>
        </div>
        <button className="admin-btn-add" onClick={() => setDialogOpen(true)}>
            <AddIcon sx={{ fontSize: 20 }} /> Thêm lịch trình
        </button>
      </div>

      <Card sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
        {loading ? (
            <Box sx={{display:'flex', justifyContent:'center', py: 5}}><CircularProgress/></Box>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Tuyến xe</th>
                  <th>Xe Buýt</th>
                  <th>Tài xế</th>
                  <th style={{ textAlign: 'center' }}>Giờ khởi hành</th>
                  <th style={{ textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(schedules) && schedules.length > 0 ? (
                    schedules.map((sch, index) => (
                    <tr key={sch.idLichTrinh || sch.id || index}>
                        <td>{formatDate(sch.ngayThucHien)}</td>
                        <td style={{fontWeight: 600}}>
                            {sch.TenTuyen || sch.tenTuyen || sch.idTuyen || 'Chưa cập nhật'}
                        </td> 
                        <td>
                            <Chip 
                                label={sch.BienSoXe || sch.bienSo || sch.idXe || 'N/A'} 
                                size="small" 
                                sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #334155' }} 
                            />
                        </td>
                        <td>{sch.HoTenTaiXe || sch.tenTaiXe || sch.idTaiXe || 'Chưa phân công'}</td>
                        <td style={{ textAlign: 'center' }}>
                            <span className="chip-active">
                                {formatTime(sch.gioBatDau || sch.gioKhoiHanh)}
                            </span>
                        </td>
                        <td>
                        <div className="admin-action-btns">
                            <button className="admin-btn-edit"><EditIcon sx={{ fontSize: 16 }} /> Sửa</button>
                            <button className="admin-btn-delete"><DeleteIcon sx={{ fontSize: 16 }} /> Xóa</button>
                        </div>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Không có lịch trình nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      <ScheduleDialog 
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        data={auxData}
      />
    </Box>
  )
}

export default SchedulesPage