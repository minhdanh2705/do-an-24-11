import { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, Button, Stepper, Step, StepLabel, List, ListItem, Chip } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import MapComponent from '../components/MapComponent'
import { scheduleService, studentService, attendanceService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import useRealTimeTracking from '../hooks/useRealTimeTracking'
import api from '../services/api' // Import axios instance

const DriverDashboard = () => {
  const { user } = useAuth();
  const { updateLocation } = useRealTimeTracking();
  
  const [tripStatus, setTripStatus] = useState('IDLE'); 
  const [stops, setStops] = useState([]); // Danh sách trạm của tuyến
  const [currentStopIdx, setCurrentStopIdx] = useState(-1);
  const [students, setStudents] = useState([]); // Tất cả học sinh trong tuyến
  const [studentsAtCurrentStop, setStudentsAtCurrentStop] = useState([]); // HS tại trạm hiện tại
  const [busPosition, setBusPosition] = useState([10.762, 106.660]); 

  // 1. Load dữ liệu Lịch trình & Tuyến khi vào trang
  useEffect(() => {
    loadTripData();
  }, []);

  const loadTripData = async () => {
    try {
        // Giả sử API lấy lịch trình hôm nay của tài xế (hoặc hardcode ID tuyến = 1 để demo)
        const routeId = 1; // Tuyến BX Q8 - ĐH Sài Gòn
        
        // 1. Lấy các điểm dừng
        const stopsRes = await api.get(`/routes/${routeId}/stops`);
        const stopsData = stopsRes.data?.data || [];
        setStops(stopsData);
        if(stopsData.length > 0) setBusPosition([stopsData[0].kinhDo, stopsData[0].viDo]);

        // 2. Lấy danh sách học sinh của tuyến này
        const studentsRes = await studentService.getAll(); // Cần API filter theo idTuyen, ở đây lấy all rồi lọc tạm
        const allStudents = studentsRes.data?.data || [];
        // Lọc học sinh thuộc tuyến số 1
        setStudents(allStudents.filter(s => s.idTuyen === routeId)); 

    } catch (error) { console.error("Lỗi load dữ liệu chuyến:", error); }
  }

  // 2. Khi trạm hiện tại thay đổi -> Lọc học sinh cần đón tại trạm đó
  useEffect(() => {
    if (currentStopIdx >= 0 && currentStopIdx < stops.length) {
        const currentStopId = stops[currentStopIdx].idDiemDung;
        // Lọc học sinh có idDiemDon trùng với trạm hiện tại
        const pickupList = students.filter(s => s.idDiemDon === currentStopId); // Hoặc s.tenDiemDon nếu API trả về tên
        setStudentsAtCurrentStop(pickupList);
        
        // Cập nhật vị trí xe trên map
        const stop = stops[currentStopIdx];
        setBusPosition([stop.kinhDo, stop.viDo]);
        updateLocation(1, stop.kinhDo, stop.viDo, 0, 0); // Gửi socket
    }
  }, [currentStopIdx, stops, students]);

  const handleStartTrip = () => {
    setTripStatus('RUNNING');
    setCurrentStopIdx(0); // Bắt đầu từ trạm 1
  };

  const handleNextStop = () => {
    const next = currentStopIdx + 1;
    if (next >= stops.length) {
        alert("Đã đến điểm cuối: " + stops[stops.length-1].tenDiemDung + ". Kết thúc chuyến!");
        setTripStatus('FINISHED');
        // Ở điểm cuối, có thể hiển thị danh sách trả (tất cả học sinh trên xe)
    } else {
        setCurrentStopIdx(next);
    }
  };

  // Hàm điểm danh (Code cũ của bạn, giữ nguyên logic gọi API)
  const handleMarkAttendance = async (studentId, status) => {
     // ... (Giữ nguyên logic gọi attendanceService)
     // Sau khi đón xong, update UI (đổi màu nút)
  }

  return (
    <Box sx={{ p: 2, color: '#fff' }}>
      <Typography variant="h5" sx={{fontWeight:'bold', mb:2}}>Lộ trình: Tuyến 01 (Q8 - ĐH Sài Gòn)</Typography>

      {/* BẢN ĐỒ */}
      <Card sx={{ mb: 2, height: 400 }}>
        <MapComponent 
            center={busPosition} 
            // Tạo mảng tọa độ [ [lat,lng], [lat,lng] ] để vẽ đường
            routePath={stops.map(s => [s.kinhDo, s.viDo])} 
            stops={stops.map(s => ({lat: s.kinhDo, lng: s.viDo, name: s.tenDiemDung}))}
            buses={[{idXe: 1, bienSo: '59B-000.01', position: busPosition}]}
        />
      </Card>

      {/* THANH TIẾN TRÌNH TRẠM */}
      <Card sx={{ mb: 2, p: 1, overflowX: 'auto' }}>
        <Stepper activeStep={currentStopIdx}>
            {stops.map((label) => (
                <Step key={label.idDiemDung}>
                    <StepLabel>{label.tenDiemDung}</StepLabel>
                </Step>
            ))}
        </Stepper>
      </Card>

      {/* NÚT ĐIỀU KHIỂN & DANH SÁCH ĐÓN */}
      <Box sx={{mb: 10}}>
        {tripStatus === 'IDLE' && (
            <Button variant="contained" color="success" fullWidth size="large" onClick={handleStartTrip} startIcon={<PlayArrowIcon />}>
                BẮT ĐẦU TỪ BẾN XE QUẬN 8
            </Button>
        )}

        {tripStatus === 'RUNNING' && (
            <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Tại trạm: <span style={{color:'#4ade80'}}>{stops[currentStopIdx]?.tenDiemDung}</span>
                    </Typography>
                    <Button variant="contained" onClick={handleNextStop} endIcon={<SkipNextIcon />}>
                        Đi tiếp đến trạm sau
                    </Button>
                </Box>

                {/* DANH SÁCH HỌC SINH CẦN ĐÓN TẠI TRẠM NÀY */}
                <Card sx={{bgcolor:'#1e1e1e'}}>
                    <CardContent>
                        <Typography color="gray" gutterBottom>Danh sách đón tại đây ({studentsAtCurrentStop.length} em):</Typography>
                        <List>
                            {studentsAtCurrentStop.length === 0 ? <Typography color="#fff">Không có học sinh đón tại trạm này.</Typography> : null}
                            {studentsAtCurrentStop.map(st => (
                                <ListItem key={st.idHocSinh} sx={{borderBottom: '1px solid #333'}}>
                                    <Box sx={{flexGrow:1}}>
                                        <Typography sx={{color:'#fff', fontWeight:'bold'}}>{st.hoTen}</Typography>
                                        <Typography sx={{color:'gray', fontSize:'0.85rem'}}>Lớp: {st.lop}</Typography>
                                    </Box>
                                    <Button size="small" variant="contained" color="success" onClick={() => handleMarkAttendance(st.idHocSinh, 'DA_DON')}>ĐÓN</Button>
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            </>
        )}
      </Box>
    </Box>
  )
}
export default DriverDashboard