import { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, Button, List, ListItem, Chip, CircularProgress, Grid, Paper } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus'
import MapComponent from '../components/MapComponent'
import { scheduleService, routeService } from '../services/api' 

const DriverDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('LIST'); // 'LIST' hoặc 'MAP'
  
  const [mySchedules, setMySchedules] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  
  const [stops, setStops] = useState([]); 
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [studentsAtStop, setStudentsAtStop] = useState([]);
  const [busPosition, setBusPosition] = useState([10.762, 106.660]); 
  const [isStarted, setIsStarted] = useState(false); 
  const [isCompleted, setIsCompleted] = useState(false); 

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    try {
        const res = await scheduleService.getAll();
        let data = res.data?.data || res.data || [];
        
        data.sort((a, b) => {
            if (a.trangThaiDiChuyen === 1 && b.trangThaiDiChuyen !== 1) return -1;
            if (a.trangThaiDiChuyen !== 1 && b.trangThaiDiChuyen === 1) return 1;
            if (a.trangThai === 0 && b.trangThai === 1) return -1;
            if (a.trangThai === 1 && b.trangThai === 0) return 1;
            return 0;
        });

        setMySchedules(data);
    } catch (error) {
        console.error("Lỗi load lịch trình:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleSelectTrip = async (schedule) => {
    setLoading(true);
    try {
        const detailRes = await scheduleService.getById(schedule.idLichTrinh);
        const tripDetail = detailRes.data?.data || detailRes.data;
        
        setActiveSchedule(tripDetail);
        
        const running = tripDetail.trangThaiDiChuyen === 1;
        const finished = tripDetail.trangThai === 1; 
        
        setIsStarted(running);
        setIsCompleted(finished);

        if (tripDetail.idTuyenDuong || tripDetail.idTuyen) {
            const routeRes = await routeService.getById(tripDetail.idTuyenDuong || tripDetail.idTuyen);
            const routeData = routeRes.data?.data || routeRes.data;
            
            if (routeData && routeData.diemDung) {
                setStops(routeData.diemDung);
                const currentIdx = finished ? (routeData.diemDung.length - 1) : ((tripDetail.thuTuTramHienTai || 1) - 1);
                setCurrentStopIndex(currentIdx);
                
                if (routeData.diemDung[currentIdx]) {
                    const s = routeData.diemDung[currentIdx];
                    setBusPosition([s.viDo, s.kinhDo]);
                }
            }
        }
        setView('MAP');
    } catch (error) {
        alert("Lỗi tải dữ liệu chuyến đi");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSchedule && activeSchedule.danhSachDiemDanh && stops.length > 0) {
        const currentStop = stops[currentStopIndex];
        if (currentStop) {
            if (isCompleted) {
                setStudentsAtStop(activeSchedule.danhSachDiemDanh);
            } else {
                const list = activeSchedule.danhSachDiemDanh.filter(hs => hs.idDiemDung === currentStop.idDiemDung);
                setStudentsAtStop(list);
            }
        }
    }
  }, [activeSchedule, stops, currentStopIndex, isCompleted]);

  const handleStartTrip = async () => {
      if (!confirm("Bắt đầu khởi hành?")) return;
      try {
          await scheduleService.updateStatus(activeSchedule.idLichTrinh, { status: 1 });
          setIsStarted(true);
      } catch (error) { alert("Lỗi: " + error.message); }
  };

  const handlePickUp = async (studentId) => {
      try {
          await scheduleService.updateStudentAttendance(activeSchedule.idLichTrinh, studentId, { status: 1 });
          const updatedList = activeSchedule.danhSachDiemDanh.map(hs => 
              hs.idHocSinh === studentId ? { ...hs, trangThai: 1 } : hs
          );
          setActiveSchedule({ ...activeSchedule, danhSachDiemDanh: updatedList });
      } catch (error) { alert("Lỗi: " + error.message); }
  };

  const handleNextStop = async () => {
     const nextIdx = currentStopIndex + 1;
     
     if (nextIdx < stops.length) {
         const nextStop = stops[nextIdx];
         
         // 1. Cập nhật UI ngay lập tức cho mượt
         setCurrentStopIndex(nextIdx);
         setBusPosition([nextStop.viDo, nextStop.kinhDo]);

         // 2. GỌI API CẬP NHẬT DB & GỬI SOCKET
         try {
             // Lưu ý: index mảng bắt đầu từ 0, nhưng thứ tự trạm trong DB thường bắt đầu từ 1
             // Bạn cần kiểm tra xem DB của bạn thuTu lưu 0 hay 1. 
             // Nếu script SQL trước đó lưu 1, 2, 3... thì gửi nextIdx + 1
             await api.put(`/schedules/${activeSchedule.idLichTrinh}/current-stop`, {
                 stopIndex: nextIdx + 1, 
                 stopName: nextStop.tenDiemDung
             });
         } catch (err) {
             console.error("Lỗi cập nhật trạm:", err);
         }

     } else {
         if (confirm("Đã đến trạm cuối. Hoàn thành chuyến đi?")) {
             try {
                 // Gọi API Kết thúc (Backend sẽ tự động update status học sinh thành Đã trả)
                 await scheduleService.updateStatus(activeSchedule.idLichTrinh, { status: 2 });
                 setIsCompleted(true);
                 setIsStarted(false);
                 
                 // Refresh lại danh sách học sinh để thấy trạng thái "Đã trả"
                 const detailRes = await scheduleService.getById(activeSchedule.idLichTrinh);
                 setActiveSchedule(detailRes.data?.data || detailRes.data);
                 
                 alert("Chuyến đi kết thúc. Tất cả học sinh trên xe đã được cập nhật trạng thái 'Đã trả'.");
             } catch (err) {
                 alert("Lỗi: " + err.message);
             }
         }
     }
  };

  const handleBackToList = () => {
      setView('LIST');
      setActiveSchedule(null);
      loadSchedules(); 
  };

  // --- GIAO DIỆN 1: DANH SÁCH (Dark Mode) ---
  if (view === 'LIST') {
      return (
          <Box sx={{ p: 2, bgcolor: '#121212', minHeight: '100vh', color: '#fff' }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', display:'flex', alignItems:'center', gap: 1 }}>
                 <DirectionsBusIcon color="primary"/> Lịch chạy hôm nay
              </Typography>

              {loading ? <CircularProgress sx={{color:'white'}} /> : (
                  <Grid container spacing={2}>
                      {mySchedules.length === 0 ? <Typography sx={{ml:2, color:'gray'}}>Chưa có lịch phân công.</Typography> : null}
                      
                      {mySchedules.map(sch => {
                          let statusColor = "default";
                          let statusLabel = "Chưa khởi hành";
                          let borderColor = "#333";

                          if (sch.trangThai === 1) { 
                              statusLabel = "Đã hoàn thành";
                              statusColor = "success";
                              borderColor = "#1b5e20"; 
                          } else if (sch.trangThaiDiChuyen === 1) { 
                              statusLabel = "Đang chạy";
                              statusColor = "warning";
                              borderColor = "#e65100"; 
                          }

                          return (
                              <Grid item xs={12} key={sch.idLichTrinh}>
                                  <Card 
                                    sx={{ 
                                        cursor: 'pointer', 
                                        bgcolor: '#1e1e1e', 
                                        color: '#fff',      
                                        borderLeft: `5px solid ${borderColor}`,
                                        '&:hover': { bgcolor: '#2d2d2d' }
                                    }}
                                    onClick={() => handleSelectTrip(sch)}
                                  >
                                      <CardContent sx={{ pb: '16px !important' }}>
                                          <Box sx={{display:'flex', justifyContent:'space-between'}}>
                                              <Typography variant="h6" sx={{fontWeight:'bold'}}>
                                                {sch.tenTuyen || `Tuyến #${sch.idTuyen}`}
                                              </Typography>
                                              <Chip 
                                                label={statusLabel} 
                                                color={statusColor} 
                                                size="small" 
                                                variant={sch.trangThai === 1 ? "filled" : "outlined"}
                                              />
                                          </Box>
                                          <Typography variant="body2" sx={{color:'#aaa', mt: 1}}>
                                              🕒 Giờ: {sch.thoiGianBatDau} - {sch.thoiGianKetThuc}
                                          </Typography>
                                          <Typography variant="body2" sx={{color:'#aaa'}}>
                                              🚌 Xe: {sch.bienSoXe}
                                          </Typography>
                                      </CardContent>
                                  </Card>
                              </Grid>
                          )
                      })}
                  </Grid>
              )}
          </Box>
      );
  }

  // --- GIAO DIỆN 2: MAP (Dark Mode Updated) ---
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#121212' }}>
      {/* Header */}
      <Box sx={{ p: 1.5, bgcolor: '#1e1e1e', color:'#fff', display: 'flex', alignItems: 'center', boxShadow: 3, zIndex: 10 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToList} sx={{color:'#fff'}}>
            Trở về
          </Button>
          <Typography variant="subtitle1" sx={{ ml: 2, fontWeight: 'bold' }}>
              {activeSchedule?.tenTuyen} {isCompleted && "(Xem lại)"}
          </Typography>
      </Box>

      {/* Map */}
      <Box sx={{ flex: 1, position: 'relative' }}>
         <MapComponent 
            center={busPosition} 
            stops={stops}
            buses={[{ latitude: busPosition[0], longitude: busPosition[1] }]} 
         />
      </Box>

      {/* Control Panel - ĐÃ CHUYỂN SANG DARK MODE */}
      <Paper elevation={10} sx={{ p: 2, borderTopLeftRadius: 16, borderTopRightRadius: 16, bgcolor: '#1e1e1e', color: '#fff' }}>
         
         {/* Thông báo hoàn thành */}
         {isCompleted ? (
             <Box sx={{ 
                 mb: 2, p: 2, 
                 bgcolor: 'rgba(27, 94, 32, 0.3)', // Xanh rêu trong suốt
                 border: '1px solid #2e7d32',
                 borderRadius: 2, 
                 display:'flex', alignItems:'center', gap: 1 
             }}>
                 <CheckCircleIcon color="success" />
                 <Typography variant="body1" sx={{ color: '#81c784', fontWeight: 'bold' }}>
                     Chuyến đi đã hoàn thành.
                 </Typography>
             </Box>
         ) : (
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', color: '#90caf9' }}>
                        📍 {stops[currentStopIndex]?.tenDiemDung}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                        Trạm {currentStopIndex + 1} / {stops.length}
                    </Typography>
                </Box>

                {!isStarted ? (
                    <Button variant="contained" color="success" size="large" startIcon={<PlayArrowIcon />} onClick={handleStartTrip}>
                        BẮT ĐẦU
                    </Button>
                ) : (
                    <Button variant="contained" color="primary" size="large" endIcon={<SkipNextIcon />} onClick={handleNextStop}>
                        {currentStopIndex === stops.length - 1 ? "HOÀN THÀNH" : "TRẠM KẾ"}
                    </Button>
                )}
             </Box>
         )}

         {/* Tiêu đề danh sách */}
         <Typography variant="subtitle2" sx={{ mb: 1, fontWeight:'bold', color: '#e0e0e0' }}>
            {isCompleted ? "Tổng kết danh sách học sinh:" : `Học sinh cần đón (${studentsAtStop.length}):`}
         </Typography>
         
         {/* Danh sách học sinh - Dark Mode */}
         <List dense sx={{ maxHeight: '250px', overflow: 'auto', bgcolor: '#121212', borderRadius: 2, border: '1px solid #333' }}>
            {studentsAtStop.length === 0 ? (
                <ListItem><Typography variant="body2" sx={{ color: '#777', fontStyle: 'italic' }}>Không có học sinh.</Typography></ListItem>
            ) : null}
            
            {studentsAtStop.map(hs => (
                <ListItem 
                    key={hs.idHocSinh} 
                    divider
                    sx={{ borderBottom: '1px solid #333' }} // Đường kẻ mờ
                    secondaryAction={
                        isCompleted ? (
                            <Chip 
                                label={hs.trangThai === 1 ? "Đã đón" : "Vắng"} 
                                color={hs.trangThai === 1 ? "success" : "error"} 
                                size="small" 
                                variant="outlined"
                                sx={{ borderColor: hs.trangThai === 1 ? '#66bb6a' : '#ef5350', color: hs.trangThai === 1 ? '#66bb6a' : '#ef5350' }}
                            />
                        ) : (
                            isStarted && (
                                hs.trangThai === 1 ? (
                                    <Chip icon={<CheckCircleIcon />} label="Đã lên xe" color="success" size="small" />
                                ) : (
                                    <Button variant="contained" size="small" onClick={() => handlePickUp(hs.idHocSinh)}>
                                        Đón
                                    </Button>
                                )
                            )
                        )
                    }
                >
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#fff' }}>{hs.hoTen}</Typography>
                        <Box sx={{display:'flex', gap:1}}>
                            <Typography variant="caption" sx={{ color: '#aaa' }}>{hs.lop}</Typography>
                            {isCompleted && hs.tenDiemDung && (
                                <Typography variant="caption" sx={{ color: '#777' }}> {hs.tenDiemDung}</Typography>
                            )}
                        </Box>
                    </Box>
                </ListItem>
            ))}
         </List>
      </Paper>
    </Box>
  )
}

export default DriverDashboard