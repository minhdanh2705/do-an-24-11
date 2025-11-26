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
import MapComponent from "../components/MapComponent"
import '../styles/admin.css'

const SchedulesPage = () => {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  const [auxData, setAuxData] = useState({ routes: [], buses: [], drivers: [] })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null)

  // State cho bản đồ
  const [viewMode, setViewMode] = useState("TABLE") 
  const [selectedScheduleForMap, setSelectedScheduleForMap] = useState(null)
  const [routeDataForMap, setRouteDataForMap] = useState(null)
  const [loadingMap, setLoadingMap] = useState(false)

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

  const handleViewMap = async (schedule) => {
    setLoadingMap(true)
    setSelectedScheduleForMap(schedule)
    setViewMode("MAP") 

    try {
      if (schedule.idTuyenDuong || schedule.idTuyen) {
        const routeRes = await routeService.getById(schedule.idTuyenDuong || schedule.idTuyen)
        const routeData = routeRes.data?.data || routeRes.data
        setRouteDataForMap(routeData)
      }
    } catch (error) {
      console.error("Error loading map data:", error)
    } finally {
      setLoadingMap(false)
    }
  }

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
      } catch (error) {
        alert("Lỗi khi xóa: " + (error.response?.data?.message || error.message))
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
      alert("Lỗi: " + (err.response?.data?.message || err.message))
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

  // Dữ liệu map
  let mapProps = { center: [10.762, 106.66], stops: [], buses: [] };
  if (viewMode === "MAP" && selectedScheduleForMap && routeDataForMap) {
      const stops = routeDataForMap.diemDung || [];
      const currentStopIdx = (selectedScheduleForMap.thuTuTramHienTai || 1) - 1;
      const currentStop = stops[currentStopIdx];
      const centerPosition = currentStop ? [currentStop.viDo, currentStop.kinhDo] : [10.762, 106.66];
      
      mapProps = {
          center: centerPosition,
          stops: stops,
          buses: selectedScheduleForMap.trangThaiDiChuyen === 1 
              ? [{ latitude: centerPosition[0], longitude: centerPosition[1] }] 
              : []
      };
  }

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

      {/* --- DIALOG BẢN ĐỒ (Popup) --- */}
      <Dialog 
        open={viewMode === "MAP"} 
        onClose={handleBackToList}
        maxWidth="md" // Đã chỉnh nhỏ lại thành MD để dễ phân biệt
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1e293b', color: 'white' }}>
            <Typography variant="h6">
                {selectedScheduleForMap ? `Lộ trình: ${selectedScheduleForMap.tenTuyen}` : "Chi tiết"}
            </Typography>
            <IconButton onClick={handleBackToList} sx={{ color: 'white' }}>
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 0, height: '500px', bgcolor: '#0f172a', position: 'relative' }}>
            {loadingMap ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <CircularProgress />
                </Box>
            ) : (
                <MapComponent
                    center={mapProps.center}
                    stops={mapProps.stops}
                    buses={mapProps.buses}
                />
            )}
        </DialogContent>
      </Dialog>

    </Box>
  )
}

export default SchedulesPage