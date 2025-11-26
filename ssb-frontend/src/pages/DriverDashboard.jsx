import { useState, useEffect } from "react"
import { Box, Card, CardContent, Typography, Button, Chip, CircularProgress, Grid, Paper } from "@mui/material"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import SkipNextIcon from "@mui/icons-material/SkipNext"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus"
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; 

import MapComponent from "../components/MapComponent"
import api from "../services/api"
import { scheduleService, routeService } from "../services/api"
import { useAuth } from "../context/AuthContext" 

const DriverDashboard = () => {
  const { user } = useAuth() 
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState("LIST") 

  const [mySchedules, setMySchedules] = useState([])
  const [activeSchedule, setActiveSchedule] = useState(null)

  const [stops, setStops] = useState([])
  const [currentStopIndex, setCurrentStopIndex] = useState(0)
  const [busPosition, setBusPosition] = useState([10.762, 106.66])
  const [isStarted, setIsStarted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // --- HÀM KIỂM TRA NGÀY (So sánh chuỗi DD/MM/YYYY) ---
  const isToday = (dateString) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      const today = new Date();
      return date.toLocaleDateString('vi-VN') === today.toLocaleDateString('vi-VN');
  };

  useEffect(() => {
    if (user) {
        loadSchedules()
    }
  }, [user])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const res = await scheduleService.getAll()
      let data = res.data?.data || res.data || []

      // --- SỬA LỖI Ở ĐÂY: Lấy ID từ user.detail.idTaiXe ---
      // Ưu tiên lấy trong user.detail trước, nếu không có mới tìm ở ngoài
      const currentDriverId = Number(user?.detail?.idTaiXe || user?.idTaiXe || user?.id);

      console.log("=== DEBUG ID TÀI XẾ ===");
      console.log("User Object:", user);
      console.log("ID Tài xế trích xuất được:", currentDriverId);

      // --- LỌC DỮ LIỆU ---
      data = data.filter(item => {
          const scheduleDriverId = Number(item.idTaiXe);

          // 1. So sánh ID
          const isMyDriver = scheduleDriverId === currentDriverId;
          
          // 2. Check Ngày
          const isDateToday = isToday(item.ngayChay);
          
          return isMyDriver && isDateToday;
      });

      // Sắp xếp
      data.sort((a, b) => {
        if (a.trangThaiDiChuyen === 1 && b.trangThaiDiChuyen !== 1) return -1
        if (a.trangThaiDiChuyen !== 1 && b.trangThaiDiChuyen === 1) return 1
        return a.thoiGianBatDau.localeCompare(b.thoiGianBatDau)
      })

      setMySchedules(data)
    } catch (error) {
      console.error("Lỗi load lịch trình:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTrip = async (schedule) => {
    setLoading(true)
    try {
      const detailRes = await scheduleService.getById(schedule.idLichTrinh)
      const tripDetail = detailRes.data?.data || detailRes.data

      setActiveSchedule(tripDetail)

      const running = tripDetail.trangThaiDiChuyen === 1
      const finished = tripDetail.trangThai === 1 || tripDetail.trangThaiDiChuyen === 2

      setIsStarted(running)
      setIsCompleted(finished)

      if (tripDetail.idTuyenDuong || tripDetail.idTuyen) {
        const routeRes = await routeService.getById(tripDetail.idTuyenDuong || tripDetail.idTuyen)
        const routeData = routeRes.data?.data || routeRes.data

        if (routeData && routeData.diemDung) {
          setStops(routeData.diemDung)
          const currentIdx = finished ? routeData.diemDung.length - 1 : (tripDetail.thuTuTramHienTai || 1) - 1
          setCurrentStopIndex(currentIdx)

          if (routeData.diemDung[currentIdx]) {
            const s = routeData.diemDung[currentIdx]
            setBusPosition([s.viDo, s.kinhDo])
          }
        }
      }
      setView("MAP")
    } catch (error) {
      alert("Lỗi tải dữ liệu chuyến đi")
    } finally {
      setLoading(false)
    }
  }

  const handleStartTrip = async () => {
    if (!confirm("Bắt đầu khởi hành?")) return
    try {
      await scheduleService.updateStatus(activeSchedule.idLichTrinh, { status: 1 })
      setIsStarted(true)
      loadSchedules() 
    } catch (error) {
      alert("Lỗi: " + error.message)
    }
  }

  const handleNextStop = async () => {
    const nextIdx = currentStopIndex + 1

    if (nextIdx < stops.length) {
      const nextStop = stops[nextIdx]

      setCurrentStopIndex(nextIdx)
      setBusPosition([nextStop.viDo, nextStop.kinhDo])

      try {
        await api.put(`/schedules/${activeSchedule.idLichTrinh}/current-stop`, {
          stopIndex: nextIdx + 1,
          stopName: nextStop.tenDiemDung,
        })
      } catch (err) {
        console.error("Lỗi cập nhật trạm:", err)
      }
    } else {
      if (confirm("Đã đến trạm cuối. Hoàn thành chuyến đi?")) {
        try {
          await scheduleService.updateStatus(activeSchedule.idLichTrinh, { status: 2 })
          setIsCompleted(true)
          setIsStarted(false)

          const detailRes = await scheduleService.getById(activeSchedule.idLichTrinh)
          setActiveSchedule(detailRes.data?.data || detailRes.data)
          
          loadSchedules() 
          alert("Chuyến đi kết thúc.")
        } catch (err) {
          alert("Lỗi: " + err.message)
        }
      }
    }
  }

  const handleBackToList = () => {
    setView("LIST")
    setActiveSchedule(null)
    loadSchedules()
  }

  if (view === "LIST") {
    return (
      <Box sx={{ p: 2, bgcolor: "#121212", minHeight: "100vh", color: "#fff" }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
          <DirectionsBusIcon color="primary" /> Lịch chạy hôm nay
        </Typography>

        {loading ? (
          <Box sx={{ display:'flex', justifyContent:'center', mt: 5 }}><CircularProgress sx={{ color: "white" }} /></Box>
        ) : (
          <Grid container spacing={2}>
            {mySchedules.length === 0 ? (
               <Grid item xs={12}>
                   <Box 
                    sx={{ 
                        textAlign: 'center', 
                        mt: 8, 
                        p: 4, 
                        bgcolor: 'rgba(255,255,255,0.05)', 
                        borderRadius: 4,
                        border: '1px dashed #333'
                    }}
                >
                    <CalendarTodayIcon sx={{ fontSize: 60, color: '#555', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>
                        Hôm nay không có lịch trình
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                        Tài khoản: {user?.detail?.hoTen || user?.username} (ID: {user?.detail?.idTaiXe})
                        <br/>
                        Bạn không có chuyến xe nào trong ngày {new Date().toLocaleDateString('vi-VN')}.
                    </Typography>
                </Box>
               </Grid>
            ) : (
                mySchedules.map((sch) => {
                let statusColor = "default"
                let statusLabel = "Chưa khởi hành"
                let borderColor = "#333"

                if (sch.trangThai === 1 || sch.trangThaiDiChuyen === 2) {
                    statusLabel = "Đã hoàn thành"
                    statusColor = "success"
                    borderColor = "#1b5e20"
                } else if (sch.trangThaiDiChuyen === 1) {
                    statusLabel = "Đang chạy"
                    statusColor = "warning"
                    borderColor = "#e65100" 
                }

                return (
                    <Grid item xs={12} key={sch.idLichTrinh}>
                    <Card
                        sx={{
                        cursor: "pointer",
                        bgcolor: "#1e1e1e",
                        color: "#fff",
                        borderLeft: `5px solid ${borderColor}`,
                        "&:hover": { bgcolor: "#2d2d2d" },
                        }}
                        onClick={() => handleSelectTrip(sch)}
                    >
                        <CardContent sx={{ pb: "16px !important" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            {sch.tenTuyen || `Tuyến #${sch.idTuyen}`}
                            </Typography>
                            <Chip
                            label={statusLabel}
                            color={statusColor}
                            size="small"
                            variant={sch.trangThai === 1 ? "filled" : "filled"}
                            />
                        </Box>
                        <Typography variant="body2" sx={{ color: "#aaa", mt: 1 }}>
                            🕒 Giờ: {sch.thoiGianBatDau} - {sch.thoiGianKetThuc}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#aaa" }}>
                            🚌 Xe: {sch.bienSoXe}
                        </Typography>
                        
                        {sch.trangThaiDiChuyen === 1 && (
                            <Typography variant="caption" sx={{ color: '#4fc3f7', mt: 1, display: 'block', fontStyle:'italic' }}>
                                ▶ Đang chạy - Nhấn để mở bản đồ
                            </Typography>
                        )}
                        </CardContent>
                    </Card>
                    </Grid>
                )
                })
            )}
          </Grid>
        )}
      </Box>
    )
  }

  // --- GIAO DIỆN 2: MAP (Dark Mode) ---
  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "#121212" }}>
      <Box sx={{ p: 1.5, bgcolor: "#1e1e1e", color: "#fff", display: "flex", alignItems: "center", boxShadow: 3, zIndex: 10 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBackToList} sx={{ color: "#fff" }}>Trở về</Button>
        <Typography variant="subtitle1" sx={{ ml: 2, fontWeight: "bold" }}>
          {activeSchedule?.tenTuyen} {isCompleted && "(Xem lại)"}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, position: "relative" }}>
        <MapComponent center={busPosition} stops={stops} buses={[{ latitude: busPosition[0], longitude: busPosition[1] }]} />
      </Box>

      <Paper elevation={10} sx={{ p: 2, borderTopLeftRadius: 16, borderTopRightRadius: 16, bgcolor: "#1e1e1e", color: "#fff" }}>
        {isCompleted ? (
          <Box sx={{ p: 2, bgcolor: "rgba(27, 94, 32, 0.3)", border: "1px solid #2e7d32", borderRadius: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="body1" sx={{ color: "#81c784", fontWeight: "bold" }}>Chuyến đi đã hoàn thành.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: "bold", color: "#90caf9" }}>📍 {stops[currentStopIndex]?.tenDiemDung}</Typography>
              <Typography variant="body2" sx={{ color: "#aaa" }}>Trạm {currentStopIndex + 1} / {stops.length}</Typography>
            </Box>
            {!isStarted ? (
              <Button variant="contained" color="success" size="large" startIcon={<PlayArrowIcon />} onClick={handleStartTrip}>BẮT ĐẦU</Button>
            ) : (
              <Button variant="contained" color="primary" size="large" endIcon={<SkipNextIcon />} onClick={handleNextStop}>
                {currentStopIndex === stops.length - 1 ? "HOÀN THÀNH" : "TRẠM KẾ"}
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default DriverDashboard