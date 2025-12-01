import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog, DialogContent, DialogTitle, IconButton, Box, Typography,
  List, ListItem, ListItemAvatar, Avatar, ListItemText, Chip, CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HelpIcon from "@mui/icons-material/Help";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import LocationOnIcon from "@mui/icons-material/LocationOn";

import MapComponent from "./MapComponent";
import { scheduleService, routeService } from "../services/api";

const ScheduleTrackingDialog = ({ open, onClose, scheduleId }) => {
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [stops, setStops] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Map State
  const [busPosition, setBusPosition] = useState([10.762, 106.66]);
  const [busRouteData, setBusRouteData] = useState(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  // Ref lưu trạng thái cũ
  const prevStopIndexRef = useRef(-1); 
  const isFirstLoad = useRef(true);

  // 1. Reset trạng thái khi đóng/mở dialog
  useEffect(() => {
    if (open && scheduleId) {
      // Reset toàn bộ biến tạm
      isFirstLoad.current = true;
      prevStopIndexRef.current = -1;
      setBusRouteData(null);
      setStops([]); // Reset stops để tránh dùng lại stops của chuyến cũ
      setBusPosition([10.762, 106.66]); 
      
      // Gọi load lần đầu
      loadScheduleDetail();
    }
    return () => {
      setScheduleData(null);
    }
  }, [open, scheduleId]);

  // 2. Logic tải chi tiết (Dùng useCallback để tránh tạo hàm mới liên tục)
  const loadScheduleDetail = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await scheduleService.getById(scheduleId);
      const data = res.data?.data || res.data;
      
      setScheduleData(data);
      setStudents(data.danhSachDiemDanh || []);

      // Lấy index trạm từ Server (Backend trả về 1-based -> chuyển thành 0-based)
      let serverStopIndex = (data.thuTuTramHienTai || 1) - 1;
      
      // Nếu trạng thái chưa chạy (0) -> Xe luôn ở trạm 0
      if (data.trangThaiDiChuyen === 0) serverStopIndex = 0;

      // --- LOGIC LOAD TUYẾN ĐƯỜNG & TRẠM (CHỈ CHẠY KHI CHƯA CÓ STOPS) ---
      let currentStops = stops;
      if (currentStops.length === 0 && (data.idTuyenDuong || data.idTuyen)) {
         const routeRes = await routeService.getById(data.idTuyenDuong || data.idTuyen);
         const routeData = routeRes.data?.data || routeRes.data;
         if (routeData && routeData.diemDung) {
            setStops(routeData.diemDung);
            currentStops = routeData.diemDung; // Cập nhật biến tạm để dùng ngay bên dưới
         }
      }

      // --- LOGIC ĐỒNG BỘ CHUYỂN ĐỘNG ---
      // Chỉ chạy khi đã có danh sách trạm
      if (currentStops.length > 0) {
          
          // A. Xử lý lần load đầu tiên (Set vị trí ngay lập tức, không animation)
          if (isFirstLoad.current) {
              if (currentStops[serverStopIndex]) {
                  const s = currentStops[serverStopIndex];
                  setBusPosition([s.viDo, s.kinhDo]);
                  prevStopIndexRef.current = serverStopIndex;
                  setCurrentStopIndex(serverStopIndex);
              }
              isFirstLoad.current = false;
          } 
          // B. Xử lý các lần sau (So sánh để chạy animation)
          else {
              // Nếu Server báo trạm mới > trạm cũ mà Admin đang lưu
              // VÀ xe đang ở trạng thái chạy (1) hoặc vừa hoàn thành (2)
              if (serverStopIndex > prevStopIndexRef.current) {
                  const startNode = currentStops[prevStopIndexRef.current]; // Trạm cũ
                  const endNode = currentStops[serverStopIndex];            // Trạm mới

                  if (startNode && endNode) {
                      console.log(`Xe di chuyển: ${startNode.tenDiemDung} -> ${endNode.tenDiemDung}`);
                      // Gọi hàm tìm đường
                      fetchRouteAndAnimate(startNode, endNode);
                  }
                  
                  // Cập nhật tham chiếu
                  prevStopIndexRef.current = serverStopIndex;
                  setCurrentStopIndex(serverStopIndex);
              }
          }
      }

    } catch (error) {
      console.error("Lỗi polling:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [scheduleId, stops]); // Dependencies quan trọng: Khi stops thay đổi, hàm này được tạo lại

  // 3. Polling: Tự động cập nhật mỗi 3 giây
  useEffect(() => {
    if (!open || !scheduleId) return;

    const interval = setInterval(() => {
        loadScheduleDetail(true); // true = silent load
    }, 3000);

    return () => clearInterval(interval);
  }, [loadScheduleDetail, open, scheduleId]); // Thêm loadScheduleDetail vào dependency để reset interval khi hàm update

  // Hàm gọi API OSRM
  const fetchRouteAndAnimate = async (startNode, endNode) => {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${startNode.kinhDo},${startNode.viDo};${endNode.kinhDo},${endNode.viDo}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            setBusRouteData(coords); // Kích hoạt Animation
        }
    } catch (error) {
        // Fallback
        setBusPosition([endNode.viDo, endNode.kinhDo]);
    }
  };

  const handleAnimationComplete = () => {
      setBusRouteData(null); 
      if (stops[currentStopIndex]) {
          const s = stops[currentStopIndex];
          setBusPosition([s.viDo, s.kinhDo]);
      }
  };

  // Render trạng thái học sinh
  const renderStudentStatus = (status) => {
      switch(status) {
          case 1: return <Chip icon={<CheckCircleIcon/>} label="Đã đón" color="success" size="small" />;
          case 2: return <Chip icon={<CheckCircleIcon/>} label="Đã trả" color="primary" size="small" />;
          case 3: return <Chip icon={<CancelIcon/>} label="Vắng" color="error" size="small" />;
          default: return <Chip icon={<HelpIcon/>} label="Chưa đón" variant="outlined" size="small" sx={{ borderColor: '#94a3b8', color: '#64748b' }} />;
      }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1e293b', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={1}>
            <DirectionsBusIcon color="warning" />
            <Typography variant="h6">
                Lộ trình: {scheduleData?.tenTuyen} 
                {scheduleData?.trangThaiDiChuyen === 1 && " (Đang chạy)"}
            </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, height: '80vh', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Cột trái: Học sinh */}
        <Box sx={{ width: { xs: '100%', md: '350px' }, borderRight: '1px solid #ddd', overflowY: 'auto', bgcolor: '#f8fafc' }}>
             <Box p={2} bgcolor="white" borderBottom="1px solid #eee">
                <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                    Vị trí hiện tại
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <LocationOnIcon color="error" />
                    <Typography variant="body1" fontWeight="bold" color="#0f172a">
                        {stops[currentStopIndex]?.tenDiemDung || "Đang tải..."}
                    </Typography>
                </Box>
            </Box>

            <Box p={2}>
                <List dense>
                    {students.map((st) => (
                        <ListItem key={st.idHocSinh} sx={{ bgcolor: 'white', mb: 1, borderRadius: 2, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                            <ListItemAvatar>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#e2e8f0', color: '#475569' }}>
                                    <PersonIcon fontSize="small" />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                                primary={st.hoTen} 
                                secondary={st.diaChiDon}
                                primaryTypographyProps={{fontWeight: '700', fontSize: '0.9rem', color: '#0f172a'}}
                                secondaryTypographyProps={{fontSize: '0.75rem', color: '#64748b'}}
                            />
                            <Box>{renderStudentStatus(st.trangThai)}</Box>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Box>

        {/* Cột phải: Bản đồ */}
        <Box sx={{ flex: 1, position: 'relative' }}>
             <MapComponent 
                center={busPosition} 
                stops={stops} 
                busRoute={busRouteData} 
                onBusArrived={handleAnimationComplete}
                currentBusPosition={busRouteData ? null : busPosition} 
            />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleTrackingDialog;