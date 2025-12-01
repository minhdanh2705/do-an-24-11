import React, { useState, useEffect, useRef } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, Button, Chip, Avatar, Divider, Alert, CircularProgress } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapComponent from '../../components/MapComponent';
import { routeService } from '../../services/api'; 

export default function StudentCard({ student, isInitiallyExpanded = false }) {
  const [expanded, setExpanded] = useState(isInitiallyExpanded);
  const [routeData, setRouteData] = useState(null); 
  const [loadingMap, setLoadingMap] = useState(false);
  // --- THÊM MỚI: State và Ref cho Animation ---
  const [busRoute, setBusRoute] = useState(null); 
  const prevStopIndexRef = useRef(student.thuTuTramHienTai || 0);

  // 1. Effect theo dõi sự thay đổi trạm để tìm đường chạy xe
  useEffect(() => {
    // Chỉ chạy khi đã có lộ trình và xe đang di chuyển (trạng thái 1)
    if (!routeData || !routeData.diemDung || student.trangThaiDiChuyen !== 1) return;

    const currentIdx = (student.thuTuTramHienTai || 1) - 1; // Index hiện tại
    const prevIdx = prevStopIndexRef.current - 1;           // Index cũ

    // Nếu thấy xe tiến lên trạm mới (current > prev)
    if (currentIdx > prevIdx && prevIdx >= 0) {
        const startStop = routeData.diemDung[prevIdx];
        const endStop = routeData.diemDung[currentIdx];

        if (startStop && endStop) {
            fetchRouteAndAnimate(startStop, endStop);
        }
    } else if (currentIdx === 0 && prevIdx !== 0) {
        // Trường hợp reset (xe quay về đầu)
        setBusRoute(null);
    }

    // Cập nhật lại trạm cũ
    prevStopIndexRef.current = student.thuTuTramHienTai;
  }, [student.thuTuTramHienTai, routeData, student.trangThaiDiChuyen]);

  // 2. Hàm gọi API OSRM để lấy tọa độ đường đi thực tế
  const fetchRouteAndAnimate = async (startNode, endNode) => {
      try {
          const url = `https://router.project-osrm.org/route/v1/driving/${startNode.kinhDo},${startNode.viDo};${endNode.kinhDo},${endNode.viDo}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();

          if (data.routes && data.routes.length > 0) {
              // Đảo ngược [lng, lat] thành [lat, lng] cho Leaflet
              const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
              setBusRoute(coords); 
          }
      } catch (e) {
          console.error("Lỗi tìm đường animation:", e);
      }
  };

  const handleAccordionChange = (event, isExpanded) => {
      setExpanded(isExpanded);
      // Chỉ fetch lộ trình nếu chưa có và bé đã được phân tuyến
      if (isExpanded && !routeData && student.idTuyenDuong) {
          fetchRouteData();
      }
  };

  const fetchRouteData = async () => {
      setLoadingMap(true);
      try {
          // Gọi API lấy chi tiết tuyến (bao gồm danh sách điểm dừng để vẽ line)
          const res = await routeService.getById(student.idTuyenDuong);
          setRouteData(res.data?.data || res.data);
      } catch (error) {
          console.error("Lỗi tải lộ trình:", error);
      } finally {
          setLoadingMap(false);
      }
  };

  const handleCallDriver = (e) => {
    e.stopPropagation();
    if (student.sdtTaiXe) window.location.href = `tel:${student.sdtTaiXe}`;
    else alert("Chưa có số điện thoại tài xế");
  };

  // --- LOGIC TRẠNG THÁI ---
  let statusLabel = "Chưa có lịch";
  let statusColor = "default";
  let busStatusText = "Xe chưa khởi hành";

  const trangThaiDiemDanh = parseInt(student.trangThaiDiemDanh || 0);
  const trangThaiDiChuyen = parseInt(student.trangThaiDiChuyen || 0);

  if (student.idLichTrinh) {
      if (trangThaiDiemDanh === 1) {
          statusLabel = "Đã lên xe";
          statusColor = "success"; // Xanh lá
      } else if (trangThaiDiemDanh === 2) {
          statusLabel = "Đã trả";
          statusColor = "info";    // Xanh dương
      } else if (trangThaiDiemDanh === 3) {
          statusLabel = "Vắng / Trễ";
          statusColor = "error";   // Đỏ (MỚI THÊM)
      } else if (trangThaiDiemDanh === 0) {
          statusLabel = "Đang chờ";
          statusColor = "warning"; // Vàng cam
      }

      if (trangThaiDiChuyen === 2) busStatusText = "Chuyến xe đã kết thúc";
      else if (trangThaiDiChuyen === 1) busStatusText = `Xe đang ở trạm số ${student.thuTuTramHienTai || '?'}`;
      else busStatusText = "Xe chưa khởi hành";
  }

  // Cảnh báo nếu xe sắp tới (cách 1 trạm)
  const isBusNear = trangThaiDiChuyen === 1 && 
                    trangThaiDiemDanh === 0 &&
                    student.thuTuTramHienTai >= (student.thuTuDiemDon - 1) && 
                    student.thuTuTramHienTai < student.thuTuDiemDon;

  // --- CHUẨN BỊ DỮ LIỆU MAP ---
  const lat = Number(student.latDon);
  const lng = Number(student.lngDon);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0;

  // Vị trí xe
  let busLocation = [];
  if (trangThaiDiChuyen === 1) {
      if (routeData && routeData.diemDung) {
          const currentStopIdx = (student.thuTuTramHienTai || 1) - 1;
          const currentStop = routeData.diemDung[currentStopIdx];
          if (currentStop) {
              busLocation = [{ latitude: currentStop.viDo, longitude: currentStop.kinhDo }];
          }
      } else {
          // Fallback vị trí tạm nếu chưa load lộ trình
          busLocation = [{ latitude: lat, longitude: lng }];
      }
  }

  // --- THÊM MỚI: Tính vị trí xe hiện tại để vẽ khi đứng yên ---
  let currentBusPos = null;
  if (trangThaiDiChuyen === 1 && routeData && routeData.diemDung) {
      const currentStopIdx = (student.thuTuTramHienTai || 1) - 1;
      const currentStop = routeData.diemDung[currentStopIdx];
      if (currentStop) {
          currentBusPos = [currentStop.viDo, currentStop.kinhDo];
      }
  } else if (!student.idLichTrinh) {
      currentBusPos = null; // Không có lịch -> Ẩn xe
  } else {
      // Fallback: Dùng tạm vị trí đón nếu chưa load xong lộ trình
      currentBusPos = [lat, lng];
  }

  return (
    <Accordion 
        expanded={expanded} 
        onChange={handleAccordionChange}
        sx={{ mb: 2, bgcolor: '#1e1e1e', color: '#fff', borderRadius: 2 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Avatar sx={{ bgcolor: statusColor === 'success' ? '#2e7d32' : (statusColor === 'error' ? '#c62828' : '#ed6c02') }}>
            {student.hoTen.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">{student.hoTen}</Typography>
            <Typography variant="caption" color="gray">Lớp: {student.lop}</Typography>
          </Box>
          <Chip label={statusLabel} color={statusColor} size="small" sx={{ ml: 'auto', mr: 1 }} />
        </Box>
      </AccordionSummary>
      
      <AccordionDetails>
        {isBusNear && (
            <Alert severity="warning" sx={{ mb: 2, bgcolor: '#fff3e0', color: '#e65100' }}>
                🔔 Xe đang ở trạm kế trước! Hãy chuẩn bị ra điểm đón.
            </Alert>
        )}
        
        {/* Nếu status là Vắng (3), hiện cảnh báo đỏ */}
        {trangThaiDiemDanh === 3 && (
             <Alert severity="error" sx={{ mb: 2 }}>
                ⚠️ Xe đã đi qua điểm đón mà bé chưa lên xe.
            </Alert>
        )}

        {student.idLichTrinh ? (
            <>
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <DirectionsBusIcon color="primary" />
                        <Typography>
                            Tuyến: <b>{student.tenTuyen}</b> ({student.bienSoXe})
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOnIcon color="error" />
                        <Typography>
                            Điểm đón: {student.tenDiemDon} (Trạm số {student.thuTuDiemDon})
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ml:4, color: '#4fc3f7', fontStyle: 'italic'}}>
                        Tình trạng: {busStatusText}
                    </Typography>
                </Box>

                <Divider sx={{ bgcolor: '#333', my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="disabled" />
                        <Box>
                            <Typography variant="body2" color="gray">Tài xế</Typography>
                            <Typography>{student.tenTaiXe || "Chưa phân công"}</Typography>
                        </Box>
                    </Box>
                    <Button variant="outlined" color="success" size="small" startIcon={<PhoneIcon />} onClick={handleCallDriver}>
                        Gọi
                    </Button>
                </Box>

                <Box sx={{ height: '300px', borderRadius: 2, overflow: 'hidden', border: '1px solid #333', position: 'relative' }}>
                    {hasValidCoords && expanded ? (
                        loadingMap ? (
                            <Box sx={{height: '100%', display:'flex', alignItems:'center', justifyContent:'center', bgcolor:'#2c2c2c'}}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <MapComponent 
                        key={`map-${student.idHocSinh}`} 
                        center={[lat, lng]}

                        // 1. Danh sách trạm (để vẽ đường màu xanh)
                        stops={routeData?.diemDung || [{ viDo: lat, kinhDo: lng, tenDiemDung: student.tenDiemDon, thuTu: student.thuTuDiemDon }]}
                        
                        // 2. Animation: Truyền đường đi vào (lấy từ state busRoute)
                        busRoute={busRoute} 

                        // 3. Vị trí tĩnh: Truyền tọa độ xe khi đứng yên
                        currentBusPosition={currentBusPos}

                        // 4. Callback: Khi chạy xong animation -> set busRoute về null để xe hiện lại trạng thái tĩnh
                        onBusArrived={() => setBusRoute(null)}

                        // Các props khác giữ nguyên
                        userStopId={student.idDiemDon}
                        userStatus={trangThaiDiemDanh}
                    />
                        )
                    ) : (
                        <Box sx={{height: '100%', display:'flex', alignItems:'center', justifyContent:'center', bgcolor:'#2c2c2c'}}>
                            <Typography color="gray">Đang tải bản đồ...</Typography>
                        </Box>
                    )}
                </Box>
            </>
        ) : (
            <Typography color="gray" align="center" sx={{ py: 2 }}>
                Hôm nay bé chưa có lịch trình xe đưa đón.
            </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
}