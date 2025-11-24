import React from 'react';
import { 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Typography, 
  Box, 
  Button,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import MapComponent from '../../components/MapComponent'; // Đảm bảo đường dẫn import đúng

export default function StudentCard({ student, isInitiallyExpanded = false }) {
  
  const handleCallDriver = (e) => {
    e.stopPropagation(); // Ngăn không cho Accordion bị toggle khi bấm nút gọi
    const phone = student.driverPhone || "0901234567";
    window.location.href = `tel:${phone}`;
  };

  // Màu sắc trạng thái
  const getStatusColor = (status) => {
    if (status === 'onboard') return 'success';
    if (status === 'waiting') return 'warning';
    if (status === 'arrived') return 'info';
    return 'default';
  };

  const getStatusText = (status) => {
    if (status === 'onboard') return 'Đang trên xe';
    if (status === 'waiting') return 'Đang chờ';
    if (status === 'arrived') return 'Đã về';
    return 'Chưa rõ';
  };

  return (
    <Accordion 
      defaultExpanded={isInitiallyExpanded}
      sx={{ 
        bgcolor: '#1e293b', 
        color: '#fff', 
        mb: 2, 
        borderRadius: '8px !important', // Override mặc định của Accordion
        '&:before': { display: 'none' }, // Xóa đường kẻ border mặc định
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      {/* PHẦN HEADER (Luôn hiển thị) */}
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}
        aria-controls="panel-content"
        id="panel-header"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
          {/* Avatar Icon */}
          <Box sx={{ 
            p: 1, 
            borderRadius: '50%', 
            bgcolor: 'rgba(59, 130, 246, 0.1)',
            display: 'flex'
          }}>
            <PersonIcon sx={{ color: '#60a5fa' }} />
          </Box>

          {/* Tên và Lớp */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {student.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              {student.className}
            </Typography>
          </Box>

          {/* Badge Trạng thái */}
          <Chip 
            label={getStatusText(student.status)} 
            color={getStatusColor(student.status)} 
            size="small" 
            sx={{ mr: 1, fontWeight: 600 }}
          />
        </Box>
      </AccordionSummary>

      {/* PHẦN NỘI DUNG CHI TIẾT (Khi mở ra) */}
      <AccordionDetails sx={{ borderTop: '1px solid #334155', pt: 2 }}>
        
        {/* Thông tin cơ bản */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <DirectionsBusIcon sx={{ color: '#60a5fa', fontSize: 20 }} />
            <Typography>
              Xe buýt: <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{student.busName}</span>
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AccessTimeIcon sx={{ color: '#60a5fa', fontSize: 20 }} />
            <Typography>
              Đón lúc: <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{student.pickupTime}</span>
              {student.eta && ` - ETA: ${student.eta}`}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem', ml: 4 }}>
              Tài xế: {student.driver}
            </Typography>
          </Box>
        </Box>

        {/* Bản đồ con (Nếu cần hiển thị vị trí xe riêng cho từng em) */}
        <Box sx={{ height: '200px', width: '100%', mb: 2, borderRadius: '8px', overflow: 'hidden', border: '1px solid #475569' }}>
           <MapComponent 
              center={[student.lat || 10.762, student.lng || 106.660]}
              buses={[{
                  idXeBus: student.id, 
                  bienSo: student.busName, 
                  position: [student.lat || 10.762, student.lng || 106.660]
              }]}
           />
        </Box>

        {/* Nút hành động */}
        <Button 
          variant="contained" 
          color="error" 
          startIcon={<PhoneIcon />}
          fullWidth
          onClick={handleCallDriver}
          sx={{ mt: 1 }}
        >
          Gọi tài xế: {student.driverPhone}
        </Button>

      </AccordionDetails>
    </Accordion>
  );
}