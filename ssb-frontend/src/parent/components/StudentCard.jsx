import React, { useState, useEffect } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, Button, Chip, Avatar, Divider, Alert, CircularProgress } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapComponent from '../../components/MapComponent';
import { routeService } from '../../services/api'; // Import service để lấy lộ trình

export default function StudentCard({ student, isInitiallyExpanded = false }) {
  const [expanded, setExpanded] = useState(isInitiallyExpanded);
  const [routeData, setRouteData] = useState(null); // Lưu thông tin lộ trình đầy đủ
  const [loadingMap, setLoadingMap] = useState(false);

  const handleAccordionChange = (event, isExpanded) => {
      setExpanded(isExpanded);
      // Khi mở ra thì mới tải map để tiết kiệm tài nguyên
      if (isExpanded && !routeData && student.tenTuyen) {
          fetchRouteData();
      }
  };

  // Hàm lấy dữ liệu tuyến đường đầy đủ (để vẽ line và các trạm)
  const fetchRouteData = async () => {
      setLoadingMap(true);
      try {
          // Cần tìm idTuyenDuong. Nếu student object chưa có, bạn có thể cần sửa backend parent-model để trả về idTuyenDuong
          // Tạm thời giả định backend đã trả về idTuyenDuong hoặc ta tìm qua API routes
          // Nếu student.idLichTrinh có chứa idTuyen, ta dùng nó
          
          // Cách tốt nhất: Backend parent-model.js nên trả về thêm cột 't.idTuyenDuong'
          // Nếu chưa có, ta sẽ query tạm bằng list routes (hơi chậm) hoặc giả định bạn đã thêm vào model
          
          // Giả sử bạn đã thêm t.idTuyenDuong vào câu SELECT trong parent-model.js
          // Nếu chưa, hãy sửa parent-model.js: SELECT ..., t.idTuyenDuong, ...
          
          if (student.idTuyenDuong) {
              const res = await routeService.getById(student.idTuyenDuong);
              setRouteData(res.data?.data || res.data);
          }
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
          statusColor = "success"; 
      } else if (trangThaiDiemDanh === 2) {
          statusLabel = "Đã trả";
          statusColor = "info";
      } else if (trangThaiDiemDanh === 0) {
          statusLabel = "Đang chờ";
          statusColor = "warning";
      }

      if (trangThaiDiChuyen === 2) busStatusText = "Chuyến xe đã kết thúc";
      else if (trangThaiDiChuyen === 1) busStatusText = `Xe đang ở trạm số ${student.thuTuTramHienTai || '?'}`;
      else busStatusText = "Xe chưa khởi hành";
  }

  const isBusNear = trangThaiDiChuyen === 1 && 
                    trangThaiDiemDanh === 0 &&
                    student.thuTuTramHienTai >= (student.thuTuDiemDon - 1) && 
                    student.thuTuTramHienTai < student.thuTuDiemDon;

  // --- CHUẨN BỊ DỮ LIỆU MAP ---
  const lat = Number(student.latDon);
  const lng = Number(student.lngDon);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0;

  // Xác định vị trí xe để vẽ
  let busLocation = [];
  if (trangThaiDiChuyen === 1) {
      // Nếu xe đang chạy, ta cần vị trí xe. 
      // Nếu có routeData (danh sách trạm), ta lấy tọa độ trạm hiện tại xe đang dừng
      if (routeData && routeData.diemDung) {
          const currentStopIdx = (student.thuTuTramHienTai || 1) - 1;
          const currentStop = routeData.diemDung[currentStopIdx];
          if (currentStop) {
              busLocation = [{ latitude: currentStop.viDo, longitude: currentStop.kinhDo }];
          }
      } else {
          // Fallback: Hiển thị xe tại điểm đón nếu chưa load được lộ trình
          busLocation = [{ latitude: lat, longitude: lng }];
      }
  }

  return (
    <Accordion 
        expanded={expanded} 
        onChange={handleAccordionChange}
        sx={{ mb: 2, bgcolor: '#1e1e1e', color: '#fff', borderRadius: 2 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Avatar sx={{ bgcolor: statusColor === 'success' ? '#2e7d32' : (statusColor === 'info' ? '#0288d1' : '#ed6c02') }}>
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

                {/* --- MAP MINI --- */}
                <Box sx={{ height: '300px', borderRadius: 2, overflow: 'hidden', border: '1px solid #333', position: 'relative' }}>
                    {hasValidCoords && expanded ? (
                        loadingMap ? (
                            <Box sx={{height: '100%', display:'flex', alignItems:'center', justifyContent:'center', bgcolor:'#2c2c2c'}}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <MapComponent 
                                key={`map-${student.idHocSinh}-${busLocation[0]?.latitude}`} 
                                center={[lat, lng]}
                                // QUAN TRỌNG: Truyền toàn bộ điểm dừng của tuyến (nếu có) để vẽ line
                                // Nếu routeData chưa load xong, dùng tạm điểm đón
                                stops={routeData?.diemDung || [{ 
                                    viDo: lat, 
                                    kinhDo: lng, 
                                    tenDiemDung: student.tenDiemDon, 
                                    thuTu: student.thuTuDiemDon 
                                }]}
                                buses={busLocation}
                            />
                        )
                    ) : (
                        <Box sx={{height: '100%', display:'flex', alignItems:'center', justifyContent:'center', bgcolor:'#2c2c2c'}}>
                            <Typography color="gray">
                                {!hasValidCoords ? "Chưa có tọa độ" : "Đang tải bản đồ..."}
                            </Typography>
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