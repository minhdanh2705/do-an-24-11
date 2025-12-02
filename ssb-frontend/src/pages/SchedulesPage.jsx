import { useState, useEffect } from "react"
import { 
  Box, Card, CardContent, CircularProgress, Typography, Chip, Button, 
  Dialog, DialogTitle, DialogContent, IconButton 
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import CloseIcon from "@mui/icons-material/Close" 

import { scheduleService, routeService, busService, driverService } from "../services/api"
import ScheduleDialog from "../components/ScheduleDialog"
import ScheduleTrackingDialog from "../components/ScheduleTrackingDialog" // <--- THÊM DÒNG NÀY
import '../styles/admin.css'

const SchedulesPage = () => {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  const [auxData, setAuxData] = useState({ routes: [], buses: [], drivers: [] })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null)

  // State cho bản đồ
  // --- STATE MỚI CHO THEO DÕI LỘ TRÌNH ---
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackingScheduleId, setTrackingScheduleId] = useState(null);

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [schRes, routeRes, busRes, driverRes] = await Promise.all([
        scheduleService.getAll(),
        routeService.getAll(),
        busService.getAll(),
        driverService.getAll(),
      ])

      const schData = Array.isArray(schRes.data) ? schRes.data : schRes.data?.data || []
      const routesData = Array.isArray(routeRes.data) ? routeRes.data : routeRes.data?.data || []
      const rawBuses = Array.isArray(busRes.data) ? busRes.data : busRes.data?.data || []
      const rawDrivers = Array.isArray(driverRes.data) ? driverRes.data : driverRes.data?.data || []

      const activeBuses = rawBuses.filter(b => b.trangThai === 1 || b.trangThai === 'Hoạt động');
      const activeDrivers = rawDrivers.filter(d => d.trangThai === 1 || d.trangThai === 'Hoạt động' || d.trangThai === 'Đang hoạt động');

      setSchedules(schData)
      setAuxData({
        routes: routesData,
        buses: activeBuses,
        drivers: activeDrivers,
      })
    } catch (error) {
      console.error("Load failed", error)
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setSelectedSchedule(null)
    setDialogOpen(true)
  }

  const handleEdit = (item) => {
    setSelectedSchedule(item)
    setDialogOpen(true)
  }

const handleViewMap = (schedule) => {
    setTrackingScheduleId(schedule.idLichTrinh);
    setTrackingOpen(true);
  };


  const handleBackToList = () => {
    setViewMode("TABLE")
    setSelectedScheduleForMap(null)
    setRouteDataForMap(null)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lịch trình này?")) {
      try {
        await scheduleService.delete(id)
        loadAllData()
        alert("Xóa thành công!"); // Thêm thông báo thành công
      } catch (error) {
        // CẬP NHẬT: Ưu tiên hiển thị message từ Backend (CẢNH BÁO...)
        if (error.response && error.response.data && error.response.data.message) {
            alert(error.response.data.message);
        } else {
            alert("Lỗi khi xóa: " + error.message);
        }
      }
    }
  }

  const handleSave = async (data) => {
    try {
      if (selectedSchedule) {
        await scheduleService.update(selectedSchedule.idLichTrinh, data)
        alert("Cập nhật lịch trình thành công!")
      } else {
        await scheduleService.create(data)
        alert("Đã tạo lịch trình thành công!")
      }
      setDialogOpen(false)
      loadAllData()
    } catch (err) {
      // CẬP NHẬT: Ưu tiên hiển thị message từ Backend
      if (err.response && err.response.data && err.response.data.message) {
          alert(err.response.data.message);
      } else {
          alert("Lỗi: " + err.message);
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    try {
      const d = new Date(dateString)
      return d.toLocaleDateString("vi-VN")
    } catch (e) {
      return dateString
    }
  }

  const formatTime = (timeString) => {
    if (!timeString) return "--:--"
    if (timeString.includes("T")) {
      const date = new Date(timeString)
      return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
    }
    return timeString.substring(0, 5)
  }

  const renderStatus = (item) => {
    const status = item.trangThaiDiChuyen; 
    if (status === 2 || item.trangThai === 1) return <span className="status-badge status-completed">Đã hoàn thành</span>;
    if (status === 1) return <span className="status-badge status-running">Đang chạy</span>;
    return <span className="status-badge status-pending">Chưa khởi hành</span>;
  };

 
  

  // --- ĐÂY LÀ PHẦN RENDER GIAO DIỆN CHÍNH ---
  // Chú ý: Không có đoạn if(viewMode === 'MAP') return ... ở đây nữa
  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER: Thêm chữ (NEW) để kiểm tra code đã ăn chưa */}
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

      <Card sx={{ backgroundColor: "transparent", boxShadow: "none" }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress /></Box>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ngày chạy</th>
                    <th>Tuyến xe</th>
                    <th>Tài xế</th>
                    <th>Xe Buýt</th>
                    <th style={{ textAlign: "center" }}>Bắt đầu</th>
                    <th style={{ textAlign: "center" }}>Kết thúc</th>
                    <th style={{ textAlign: "center" }}>Trạng thái</th>
                    <th style={{ textAlign: "right" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(schedules) && schedules.length > 0 ? (
                    schedules.map((sch, index) => (
                      <tr 
                        key={sch.idLichTrinh || sch.id || index} 
                        onClick={() => handleViewMap(sch)} 
                        style={{ cursor: "pointer" }}
                      >
                        <td>{formatDate(sch.ngayChay || sch.ngayThucHien)}</td>
                        <td style={{ fontWeight: 600 }}>{sch.tenTuyen || sch.idTuyen || "Chưa cập nhật"}</td>
                        <td>{sch.tenTaiXe || sch.hoTenTaiXe || "Chưa phân công"}</td>
                        <td><Chip label={sch.bienSoXe || sch.bienSo || "N/A"} size="small" sx={{ bgcolor: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid #334155" }} /></td>
                        <td style={{ textAlign: "center" }}><span className="chip-active" style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>{formatTime(sch.thoiGianBatDau || sch.gioKhoiHanh)}</span></td>
                        <td style={{ textAlign: "center" }}><span className="chip-inactive" style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8" }}>{formatTime(sch.thoiGianKetThuc)}</span></td>
                        <td style={{ textAlign: "center" }}>{renderStatus(sch)}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="admin-action-btns">
                            <button className="admin-btn-edit" onClick={() => handleEdit(sch)}><EditIcon sx={{ fontSize: 16 }} /></button>
                            <button className="admin-btn-delete" onClick={() => handleDelete(sch.idLichTrinh)}><DeleteIcon sx={{ fontSize: 16 }} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="8" style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>Không có lịch trình nào.</td></tr>
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
        initialData={selectedSchedule}
      />

      {/* --- THAY THẾ DIALOG BẢN ĐỒ CŨ BẰNG COMPONENT MỚI --- */}
      <ScheduleTrackingDialog 
        open={trackingOpen}
        onClose={() => setTrackingOpen(false)}
        scheduleId={trackingScheduleId}
      />

    </Box>
  )
}

export default SchedulesPage