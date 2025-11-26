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
  
  // Dữ liệu phụ trợ cho Dialog
  const [auxData, setAuxData] = useState({ routes: [], buses: [], drivers: [] })
  
  // State quản lý Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null) // Để biết đang Sửa hay Thêm mới

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
      
      // Kiểm tra dữ liệu trả về (Array hoặc Object wrapping)
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

  const handleAdd = () => {
    setSelectedSchedule(null)
    setDialogOpen(true)
  }

  const handleEdit = (item) => {
    setSelectedSchedule(item)
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch trình này?')) {
        try {
            await scheduleService.delete(id)
            loadAllData() // Reload lại sau khi xóa
        } catch (error) {
            alert("Lỗi khi xóa: " + (error.response?.data?.message || error.message))
        }
    }
  }

  const handleSave = async (data) => {
      try {
          if (selectedSchedule) {
              // Logic Cập nhật (Update)
              await scheduleService.update(selectedSchedule.idLichTrinh, data)
              alert("Cập nhật lịch trình thành công!")
          } else {
              // Logic Thêm mới (Create)
              await scheduleService.create(data)
              alert("Đã tạo lịch trình thành công!")
          }
          setDialogOpen(false)
          loadAllData()
      } catch (err) {
          alert("Lỗi: " + (err.response?.data?.message || err.message))
      }
  }

  const formatDate = (dateString) => {
    if(!dateString) return '';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('vi-VN'); // DD/MM/YYYY
    } catch (e) { return dateString; }
  }

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    // Xử lý nếu timeString là ISO Date (2025-11-24T06:00:00)
    if (timeString.includes('T')) {
        const date = new Date(timeString);
        const hh = date.getHours().toString().padStart(2, '0');
        const mm = date.getMinutes().toString().padStart(2, '0');
        return `${hh}:${mm}`;
    }
    // Xử lý nếu timeString là dạng '06:00:00' (SQL Time)
    return timeString.substring(0, 5); 
  }

  return (
    <Box sx={{ p: 3 }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý lịch trình</h1>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Điều phối thời gian, xe bus và tài xế cho từng ngày
          </Typography>
        </div>
        <button className="admin-btn-add" onClick={handleAdd}>
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
                  <th>Ngày chạy</th>
                  <th>Tuyến xe</th>
                  <th>Tài xế</th>
                  <th>Xe Buýt</th>
                  <th style={{ textAlign: 'center' }}>Bắt đầu</th>
                  <th style={{ textAlign: 'center' }}>Kết thúc</th>
                  <th style={{ textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(schedules) && schedules.length > 0 ? (
                    schedules.map((sch, index) => (
                    <tr key={sch.idLichTrinh || sch.id || index}>
                        {/* Cột Ngày */}
                        <td>{formatDate(sch.ngayChay || sch.ngayThucHien)}</td>
                        
                        {/* Cột Tuyến */}
                        <td style={{fontWeight: 600}}>
                            {sch.tenTuyen || sch.idTuyen || 'Chưa cập nhật'}
                        </td> 

                        {/* Cột Tài xế */}
                        <td>{sch.tenTaiXe || sch.hoTenTaiXe || 'Chưa phân công'}</td>

                        {/* Cột Xe Bus (Dùng Chip cho đẹp) */}
                        <td>
                            <Chip 
                                label={sch.bienSoXe || sch.bienSo || 'N/A'} 
                                size="small" 
                                sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #334155' }} 
                            />
                        </td>
                        
                        {/* Cột Giờ Bắt đầu */}
                        <td style={{ textAlign: 'center' }}>
                            <span className="chip-active" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                                {formatTime(sch.thoiGianBatDau || sch.gioKhoiHanh)}
                            </span>
                        </td>

                        {/* Cột Giờ Kết thúc */}
                        <td style={{ textAlign: 'center' }}>
                            <span className="chip-inactive" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#94a3b8' }}>
                                {formatTime(sch.thoiGianKetThuc)}
                            </span>
                        </td>

                        {/* Cột Hành động */}
                        <td>
                        <div className="admin-action-btns">
                            <button className="admin-btn-edit" onClick={() => handleEdit(sch)}>
                                <EditIcon sx={{ fontSize: 16 }} /> Sửa
                            </button>
                            <button className="admin-btn-delete" onClick={() => handleDelete(sch.idLichTrinh)}>
                                <DeleteIcon sx={{ fontSize: 16 }} /> Xóa
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Không có lịch trình nào.</td></tr>
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
        initialData={selectedSchedule} // Truyền dữ liệu cần sửa vào Dialog
      />
    </Box>
  )
}

export default SchedulesPage