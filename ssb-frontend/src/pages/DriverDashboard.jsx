import { useState, useEffect } from "react"
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
import WarningIcon from '@mui/icons-material/Warning'; 

import MapComponent from "../components/MapComponent"
import api from "../services/api"
import { scheduleService, routeService, incidentService } from "../services/api" 
import { useAuth } from "../context/AuthContext" 
import ReportDialog from "../components/ReportDialog" 

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
  const [reportOpen, setReportOpen] = useState(false);

  const isToday = (dateString) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      const today = new Date();
      return date.toLocaleDateString('vi-VN') === today.toLocaleDateString('vi-VN');
  };

  useEffect(() => {
    if (user) { loadSchedules() }
  }, [user])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const res = await scheduleService.getAll()
      let data = res.data?.data || res.data || []
      const currentDriverId = Number(user?.detail?.idTaiXe || user?.idTaiXe || user?.id);

      data = data.filter(item => {
          const scheduleDriverId = Number(item.idTaiXe);
          return scheduleDriverId === currentDriverId && isToday(item.ngayChay);
      });

      data.sort((a, b) => a.thoiGianBatDau.localeCompare(b.thoiGianBatDau))
      setMySchedules(data)
    } catch (error) { console.error("Lỗi load lịch trình:", error) } finally { setLoading(false) }
  }

  const handleReport = async (data) => {
      try {
          const currentDriverId = Number(user?.detail?.idTaiXe || user?.idTaiXe || user?.id);
          await incidentService.create({ ...data, idTaiXe: currentDriverId });
          setReportOpen(false);
          alert("✅ Đã gửi báo cáo sự cố thành công!");
      } catch (error) { alert("Lỗi: " + error.message); }
  };

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
          
          // Logic xác định vị trí hiện tại
          // Nếu mới bắt đầu (chưa chạy) -> Đứng ở trạm 0
          // Nếu đang chạy -> Đứng ở trạm hiện tại (Backend trả về index 1-based nên phải trừ 1)
          let currentIdx = 0;
          if (running) {
              currentIdx = (tripDetail.thuTuTramHienTai || 1) - 1;
          } else if (finished) {
              currentIdx = routeData.diemDung.length - 1;
          }

          setCurrentStopIndex(currentIdx)
          if (routeData.diemDung[currentIdx]) {
            const s = routeData.diemDung[currentIdx]
            setBusPosition([s.viDo, s.kinhDo])
          }
        }
      }
      setView("MAP")
    } catch (error) { alert("Lỗi tải dữ liệu chuyến đi") } finally { setLoading(false) }
  }

  const handleAttendance = async (studentId, status) => {
      try {
          await scheduleService.updateStudentAttendance(activeSchedule.idLichTrinh, studentId, { status });
          setActiveSchedule(prev => ({
              ...prev,
              danhSachDiemDanh: prev.danhSachDiemDanh.map(st => st.idHocSinh === studentId ? { ...st, trangThai: status } : st)
          }));
      } catch (error) { alert("Lỗi điểm danh: " + error.message); }
  };

  const fetchRouteAndRun = async (startNode, endNode) => {
      try {
          // 1. Tạo timeout: Nếu sau 3 giây API chưa trả về thì hủy
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const url = `https://router.project-osrm.org/route/v1/driving/${startNode.kinhDo},${startNode.viDo};${endNode.kinhDo},${endNode.viDo}?overview=full&geometries=geojson`;
          
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId); // Xóa timeout nếu thành công

          const data = await response.json();

          if (data.routes && data.routes.length > 0) {
              const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
              setBusRouteData(coords); // Có đường -> Chạy animation
          } else {
              // Không tìm thấy đường -> Nhảy cóc
              throw new Error("Không tìm thấy đường đi");
          }
      } catch (error) {
          console.warn("Lỗi API bản đồ hoặc Timeout, chuyển sang chế độ nhảy cóc:", error);
          
          // --- FALLBACK AN TOÀN ---
          // Nếu lỗi, cập nhật vị trí ngay lập tức (Nhảy cóc)
          setBusPosition([endNode.viDo, endNode.kinhDo]);
          setBusRouteData(null); // Đảm bảo không bị treo trạng thái "Đang chạy"
          
          // Cập nhật luôn index trạm để đồng bộ
          setCurrentStopIndex(prev => prev + 1);
      }
  };

  // --- SỬA LẠI HÀM BẮT ĐẦU: CHỈ UPDATE TRẠNG THÁI, KHÔNG CHẠY NGAY ---
  const handleStartTrip = async () => {
    if (!confirm("Bắt đầu khởi hành? (Hãy đón học sinh tại điểm đầu tiên)")) return
    try {
      // 1. Cập nhật trạng thái chuyến là ĐANG CHẠY
      await scheduleService.updateStatus(activeSchedule.idLichTrinh, { status: 1 })
      setIsStarted(true)
      
      // 2. Đặt vị trí xe về Trạm đầu tiên (index 0)
      if (stops.length > 0) {
          setCurrentStopIndex(0);
          setBusPosition([stops[0].viDo, stops[0].kinhDo]);
          
          // Cập nhật backend: Xe đang ở trạm số 1
          await api.put(`/schedules/${activeSchedule.idLichTrinh}/current-stop`, {
            stopIndex: 1, 
            stopName: stops[0].tenDiemDung,
          })
      }
      
      // Không gọi fetchRouteAndRun() ở đây -> Xe đứng yên để đón khách
      loadSchedules() 
    } catch (error) { alert("Lỗi: " + error.message) }
  }

  // --- HÀM QUA TRẠM KẾ ---
  const handleNextStop = async () => {
    const nextIdx = currentStopIndex + 1
    if (nextIdx < stops.length) {
      const currentStop = stops[currentStopIndex]; // Trạm hiện tại
      const nextStop = stops[nextIdx];             // Trạm đích đến

      // Bắt đầu chạy xe từ Trạm hiện tại -> Trạm đích
      await fetchRouteAndRun(currentStop, nextStop);

      try {
        console.log("Đang cập nhật trạm lên server...", nextIdx + 1);
        // Cập nhật DB (Chuẩn bị tới trạm kế)
        await api.put(`/schedules/${activeSchedule.idLichTrinh}/current-stop`, {
          stopIndex: nextIdx + 1, 
          stopName: nextStop.tenDiemDung,
        });
      } catch (err) { console.error(err) }
    } else {
      // Logic kết thúc
      if (confirm("Đã đến trạm cuối. Hoàn thành chuyến đi?")) {
        try {
          await scheduleService.updateStatus(activeSchedule.idLichTrinh, { status: 2 })
          setIsCompleted(true); setIsStarted(false); setBusRouteData(null); 
          const detailRes = await scheduleService.getById(activeSchedule.idLichTrinh)
          setActiveSchedule(detailRes.data?.data || detailRes.data)
          loadSchedules(); alert("Chuyến đi kết thúc.")
        } catch (err) { alert("Lỗi: " + err.message) }
      }
    }
  }

  const handleBusArrived = () => {
      const nextIdx = currentStopIndex + 1;
      if (nextIdx < stops.length) {
          setCurrentStopIndex(nextIdx); // Cập nhật index lên trạm mới
          const nextStop = stops[nextIdx];
          setBusPosition([nextStop.viDo, nextStop.kinhDo]); // Đặt xe vào vị trí mới
      }
      setBusRouteData(null); // Dừng animation
  };

  const handleBackToList = () => { setView("LIST"); setActiveSchedule(null); setBusRouteData(null); loadSchedules(); }
  
  const getStudentsAtCurrentStop = () => {
      if (!activeSchedule || !stops[currentStopIndex]) return [];
      const currentStopId = stops[currentStopIndex].idDiemDung;
      return activeSchedule.danhSachDiemDanh.filter(st => st.idDiemDon === currentStopId);
  };

  if (view === "LIST") {
    return (
      <Box sx={{ p: 2, bgcolor: "#121212", minHeight: "100vh", color: "#fff" }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
                <DirectionsBusIcon color="primary" /> Lịch chạy hôm nay
            </Typography>
            <Button variant="outlined" color="error" size="small" startIcon={<WarningIcon />} onClick={() => setReportOpen(true)}>Báo sự cố</Button>
        </Box>
        {loading ? ( <Box sx={{ display:'flex', justifyContent:'center', mt: 5 }}><CircularProgress sx={{ color: "white" }} /></Box> ) : (
          <Grid container spacing={2}>
            {mySchedules.length === 0 ? (
               <Grid item xs={12}>
                   <Box sx={{ textAlign: 'center', mt: 8, p: 4, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 4, border: '1px dashed #333' }}>
                    <CalendarTodayIcon sx={{ fontSize: 60, color: '#555', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>Hôm nay không có lịch trình</Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>Tài khoản: {user?.detail?.hoTen || user?.username} (ID: {user?.detail?.idTaiXe})</Typography>
                </Box>
               </Grid>
            ) : (
                mySchedules.map((sch) => (
                    <Grid item xs={12} key={sch.idLichTrinh}>
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
        <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} onSave={handleReport} schedules={mySchedules} />
      </Box>
    )
  }

  const studentsAtStop = getStudentsAtCurrentStop();

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "#121212" }}>
      <Box sx={{ p: 1.5, bgcolor: "#1e1e1e", color: "#fff", display: "flex", alignItems: "center", boxShadow: 3, zIndex: 10 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBackToList} sx={{ color: "#fff" }}>Trở về</Button>
        <Typography variant="subtitle1" sx={{ ml: 2, fontWeight: "bold" }}>{activeSchedule?.tenTuyen}</Typography>
      </Box>
      <Box sx={{ flex: 1, position: "relative" }}>
        <MapComponent center={busPosition} stops={stops} busRoute={busRouteData} onBusArrived={handleBusArrived} />
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
                <Button variant="contained" color="primary" size="large" endIcon={<SkipNextIcon />} onClick={handleNextStop} disabled={busRouteData !== null}>
                    {busRouteData ? "ĐANG CHẠY..." : (currentStopIndex === stops.length - 1 ? "HOÀN THÀNH" : "TRẠM KẾ")}
                </Button>
                )}
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
            {isStarted && (
                <Box>
                    <Typography variant="subtitle2" sx={{ color: '#aaa', mb: 1 }}>DANH SÁCH ĐÓN ({studentsAtStop.length})</Typography>
                    {studentsAtStop.length === 0 ? (<Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>Không có học sinh tại trạm này.</Typography>) : (
                        <List dense>
                            {studentsAtStop.map((st) => (
                                <ListItem key={st.idHocSinh} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 1, borderRadius: 2, borderLeft: st.trangThai === 1 ? '4px solid #4caf50' : (st.trangThai === 3 ? '4px solid #f44336' : '4px solid #757575') }}
                                    secondaryAction={st.trangThai === 0 && (
                                        <Box><IconButton color="success" onClick={() => handleAttendance(st.idHocSinh, 1)}><CheckCircleIcon /></IconButton><IconButton color="error" onClick={() => handleAttendance(st.idHocSinh, 3)}><CancelIcon /></IconButton></Box>
                                    )}>
                                    <ListItemAvatar><Avatar sx={{ bgcolor: '#333' }}><PersonIcon /></Avatar></ListItemAvatar>
                                    <ListItemText primary={st.hoTen} secondary={st.trangThai === 1 ? "✅ Đã lên xe" : (st.trangThai === 3 ? "❌ Vắng" : "⏳ Đang chờ")} primaryTypographyProps={{ color: 'white', fontWeight: 'bold' }} secondaryTypographyProps={{ color: st.trangThai === 1 ? '#81c784' : '#aaa' }} />
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