
import { useState, useEffect } from "react"
import { Box, Card, CardContent, CircularProgress, Typography, Chip, Button } from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { scheduleService, routeService, busService, driverService } from "../services/api"
import ScheduleDialog from "../components/ScheduleDialog"
import MapComponent from "../components/MapComponent"

const SchedulesPage = () => {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  const [auxData, setAuxData] = useState({ routes: [], buses: [], drivers: [] })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null)

  const [viewMode, setViewMode] = useState("TABLE") // 'TABLE' or 'MAP'
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
      const busesData = Array.isArray(busRes.data) ? busRes.data : busRes.data?.data || []
      const driversData = Array.isArray(driverRes.data) ? driverRes.data : driverRes.data?.data || []

      setSchedules(schData)
      setAuxData({
        routes: routesData,
        buses: busesData,
        drivers: driversData,
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
      const hh = date.getHours().toString().padStart(2, "0")
      const mm = date.getMinutes().toString().padStart(2, "0")
      return `${hh}:${mm}`
    }
    return timeString.substring(0, 5)
  }

  if (viewMode === "MAP" && selectedScheduleForMap) {
    const stops = routeDataForMap?.diemDung || []
    const currentStopIdx = (selectedScheduleForMap.thuTuTramHienTai || 1) - 1
    const currentStop = stops[currentStopIdx]
    const busPosition = currentStop ? [currentStop.viDo, currentStop.kinhDo] : [10.762, 106.66]

    return (
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "#000000" }}>
        <Box
          sx={{
            p: 1.5,
            bgcolor: "#1e1e1e",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            boxShadow: 3,
            zIndex: 10,
          }}
        >
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToList} sx={{ color: "#fff" }}>
            Trở về
          </Button>
          <Typography variant="subtitle1" sx={{ ml: 2, fontWeight: "bold" }}>
            {selectedScheduleForMap.tenTuyen} - {formatDate(selectedScheduleForMap.ngayChay)}
          </Typography>
        </Box>

        <Box sx={{ flex: 1, position: "relative" }}>
          {loadingMap ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                bgcolor: "#121212",
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <MapComponent
              center={busPosition}
              stops={stops}
              buses={
                selectedScheduleForMap.trangThaiDiChuyen === 1
                  ? [{ latitude: busPosition[0], longitude: busPosition[1] }]
                  : []
              }
            />
          )}
        </Box>
      </Box>
    )
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

      <Card sx={{ backgroundColor: "transparent", boxShadow: "none" }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
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

                        <td>
                          <Chip
                            label={sch.bienSoXe || sch.bienSo || "N/A"}
                            size="small"
                            sx={{ bgcolor: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid #334155" }}
                          />
                        </td>

                        <td style={{ textAlign: "center" }}>
                          <span
                            className="chip-active"
                            style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}
                          >
                            {formatTime(sch.thoiGianBatDau || sch.gioKhoiHanh)}
                          </span>
                        </td>

                        <td style={{ textAlign: "center" }}>
                          <span
                            className="chip-inactive"
                            style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8" }}
                          >
                            {formatTime(sch.thoiGianKetThuc)}
                          </span>
                        </td>

                        <td onClick={(e) => e.stopPropagation()}>
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
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
                        Không có lịch trình nào.
                      </td>
                    </tr>
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
    </Box>
  )
}

export default SchedulesPage
