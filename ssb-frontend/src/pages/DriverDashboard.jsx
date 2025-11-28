import { useState, useEffect } from "react"
// --- SỬA LỖI: Đã thêm Card và CardContent vào dòng import dưới đây ---
import { 
  Box, Card, CardContent, Typography, Button, Chip, CircularProgress, Grid, Paper, 
  List, ListItem, ListItemText, ListItemAvatar, Avatar, IconButton, Divider 
} from "@mui/material"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import SkipNextIcon from "@mui/icons-material/SkipNext"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus"
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; 
import PersonIcon from '@mui/icons-material/Person';

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
  
  const [busRouteData, setBusRouteData] = useState(null); 
  
  const [isStarted, setIsStarted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // --- HÀM KIỂM TRA NGÀY ---
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

      const currentDriverId = Number(user?.detail?.idTaiXe || user?.idTaiXe || user?.id);

      data = data.filter(item => {
          const scheduleDriverId = Number(item.idTaiXe);
          const isMyDriver = scheduleDriverId === currentDriverId;
          const isDateToday = isToday(item.ngayChay);
          return isMyDriver && isDateToday;
      });

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

  // --- API ĐIỂM DANH HỌC SINH ---
  const handleAttendance = async (studentId, status) => {
      try {
          await scheduleService.updateStudentAttendance(activeSchedule.idLichTrinh, studentId, { status });
          
          setActiveSchedule(prev => ({
              ...prev,
              danhSachDiemDanh: prev.danhSachDiemDanh.map(st => 
                  st.idHocSinh === studentId ? { ...st, trangThai: status } : st
              )
          }));
      } catch (error) {
          console.error("Lỗi điểm danh:", error);
          alert("Lỗi điểm danh: " + error.message);
      }
  };

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

  const fetchRouteAndRun = async (startNode, endNode) => {
      try {
          const url = `https://router.project-osrm.org/route/v1/driving/${startNode.kinhDo},${startNode.viDo};${endNode.kinhDo},${endNode.viDo}?overview=full&geometries=geojson`;
          const response = await fetch(url);
          const data = await response.json();

          if (data.routes && data.routes.length > 0) {
              const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
              setBusRouteData(coords);
          } else {
              setBusPosition([endNode.viDo, endNode.kinhDo]);
          }
      } catch (error) {
          console.error("Lỗi lấy đường đi:", error);
          setBusPosition([endNode.viDo, endNode.kinhDo]);
      }
  };

  const handleNextStop = async () => {
    const nextIdx = currentStopIndex + 1

    if (nextIdx < stops.length) {
      const currentStop = stops[currentStopIndex];
      const nextStop = stops[nextIdx];

      await fetchRouteAndRun(currentStop, nextStop);

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
          setBusRouteData(null); 

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

  const handleBusArrived = () => {
      const nextIdx = currentStopIndex + 1;
      if (nextIdx < stops.length) {
          setCurrentStopIndex(nextIdx);
          const nextStop = stops[nextIdx];
          setBusPosition([nextStop.viDo, nextStop.kinhDo]);
      }
      setBusRouteData(null);
  };

  const handleBackToList = () => {
    setView("LIST")
    setActiveSchedule(null)
    setBusRouteData(null) 
    loadSchedules()
  }

  const getStudentsAtCurrentStop = () => {
      if (!activeSchedule || !stops[currentStopIndex]) return [];
      const currentStopId = stops[currentStopIndex].idDiemDung;
      return activeSchedule.danhSachDiemDanh.filter(st => st.idDiemDon === currentStopId);
  };

  // VIEW 1: LIST
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
                   <Box sx={{ textAlign: 'center', mt: 8, p: 4, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 4, border: '1px dashed #333' }}>
                    <CalendarTodayIcon sx={{ fontSize: 60, color: '#555', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>Hôm nay không có lịch trình</Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                        Tài khoản: {user?.detail?.hoTen || user?.username} (ID: {user?.detail?.idTaiXe})
                    </Typography>
                </Box>
               </Grid>
            ) : (
                mySchedules.map((sch) => (
                    <Grid item xs={12} key={sch.idLichTrinh}>
                    {/* Card đã được import đầy đủ */}
                    <Card sx={{ cursor: "pointer", bgcolor: "#1e1e1e", color: "#fff", borderLeft: `5px solid ${sch.trangThaiDiChuyen === 1 ? '#e65100' : '#333'}`, "&:hover": { bgcolor: "#2d2d2d" } }} onClick={() => handleSelectTrip(sch)}>
                        <CardContent sx={{ pb: "16px !important" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>{sch.tenTuyen}</Typography>
                            <Chip label={sch.trangThaiDiChuyen === 1 ? "Đang chạy" : (sch.trangThai === 1 ? "Đã xong" : "Chưa chạy")} color={sch.trangThaiDiChuyen === 1 ? "warning" : "default"} size="small" />
                        </Box>
                        <Typography variant="body2" sx={{ color: "#aaa", mt: 1 }}>🕒 {sch.thoiGianBatDau} - {sch.thoiGianKetThuc}</Typography>
                        <Typography variant="body2" sx={{ color: "#aaa" }}>🚌 BS: {sch.bienSoXe}</Typography>
                        </CardContent>
                    </Card>
                    </Grid>
                ))
            )}
          </Grid>
        )}
      </Box>
    )
  }

  // VIEW 2: MAP
  const studentsAtStop = getStudentsAtCurrentStop();

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "#121212" }}>
      <Box sx={{ p: 1.5, bgcolor: "#1e1e1e", color: "#fff", display: "flex", alignItems: "center", boxShadow: 3, zIndex: 10 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBackToList} sx={{ color: "#fff" }}>Trở về</Button>
        <Typography variant="subtitle1" sx={{ ml: 2, fontWeight: "bold" }}>{activeSchedule?.tenTuyen}</Typography>
      </Box>

      <Box sx={{ flex: 1, position: "relative" }}>
        <MapComponent
          center={busPosition}
          stops={stops}
          busRoute={busRouteData}
          onBusArrived={handleBusArrived}
        />
      </Box>

      <Paper elevation={10} sx={{ p: 2, borderTopLeftRadius: 16, borderTopRightRadius: 16, bgcolor: "#1e1e1e", color: "#fff", maxHeight: '40vh', overflowY: 'auto' }}>
        {isCompleted ? (
          <Box sx={{ p: 2, bgcolor: "rgba(27, 94, 32, 0.3)", border: "1px solid #2e7d32", borderRadius: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="body1" sx={{ color: "#81c784", fontWeight: "bold" }}>Chuyến đi đã hoàn thành.</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                <Typography variant="h6" color="primary" sx={{ fontWeight: "bold", color: "#90caf9" }}>📍 {stops[currentStopIndex]?.tenDiemDung}</Typography>
                <Typography variant="body2" sx={{ color: "#aaa" }}>Trạm {currentStopIndex + 1} / {stops.length}</Typography>
                </Box>
                {!isStarted ? (
                <Button variant="contained" color="success" size="large" startIcon={<PlayArrowIcon />} onClick={handleStartTrip}>BẮT ĐẦU</Button>
                ) : (
                <Button 
                    variant="contained" 
                    color="primary" 
                    size="large" 
                    endIcon={<SkipNextIcon />} 
                    onClick={handleNextStop}
                    disabled={busRouteData !== null} 
                >
                    {busRouteData ? "ĐANG CHẠY..." : (currentStopIndex === stops.length - 1 ? "HOÀN THÀNH" : "TRẠM KẾ")}
                </Button>
                )}
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

            {isStarted && (
                <Box>
                    <Typography variant="subtitle2" sx={{ color: '#aaa', mb: 1 }}>
                        DANH SÁCH ĐÓN ({studentsAtStop.length})
                    </Typography>
                    
                    {studentsAtStop.length === 0 ? (
                        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>Không có học sinh tại trạm này.</Typography>
                    ) : (
                        <List dense>
                            {studentsAtStop.map((st) => (
                                <ListItem 
                                    key={st.idHocSinh}
                                    sx={{ 
                                        bgcolor: 'rgba(255,255,255,0.05)', 
                                        mb: 1, borderRadius: 2,
                                        borderLeft: st.trangThai === 1 ? '4px solid #4caf50' : (st.trangThai === 3 ? '4px solid #f44336' : '4px solid #757575')
                                    }}
                                    secondaryAction={
                                        st.trangThai === 0 && ( 
                                            <Box>
                                                <IconButton color="success" onClick={() => handleAttendance(st.idHocSinh, 1)}>
                                                    <CheckCircleIcon />
                                                </IconButton>
                                                <IconButton color="error" onClick={() => handleAttendance(st.idHocSinh, 3)}>
                                                    <CancelIcon />
                                                </IconButton>
                                            </Box>
                                        )
                                    }
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: '#333' }}><PersonIcon /></Avatar>
                                    </ListItemAvatar>
                                    <ListItemText 
                                        primary={st.hoTen} 
                                        secondary={st.trangThai === 1 ? "✅ Đã lên xe" : (st.trangThai === 3 ? "❌ Vắng" : "⏳ Đang chờ")}
                                        primaryTypographyProps={{ color: 'white', fontWeight: 'bold' }}
                                        secondaryTypographyProps={{ color: st.trangThai === 1 ? '#81c784' : '#aaa' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  )
}

export default DriverDashboard