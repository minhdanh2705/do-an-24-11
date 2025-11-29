import { useState, useEffect } from 'react';
import { 
    AppBar, Toolbar, IconButton, Typography, Box, Badge, Menu, MenuItem, 
    List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Button 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info'; // Icon cho thông báo thường
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { incidentService, parentService } from '../services/api'; // Import thêm parentService
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // --- 1. LOAD DỮ LIỆU LẦN ĐẦU ---
  useEffect(() => {
      loadData();
  }, [user]);

  // --- 2. LẮNG NGHE SOCKET (REAL-TIME) ---
  useEffect(() => {
      let socket = null;
      if (user?.detail?.idPhuHuynh) {
          socket = io(SOCKET_URL);
          // Nghe sự kiện dành riêng cho phụ huynh này
          socket.on(`notification:parent:${user.detail.idPhuHuynh}`, (data) => {
              console.log("Có thông báo mới từ Socket:", data);
              loadData(); // Tải lại danh sách ngay lập tức
          });
      }
      return () => { if (socket) socket.disconnect(); }
  }, [user]);

  const loadData = async () => {
      if (!user) return;

      try {
          // A. NẾU LÀ ADMIN -> Lấy Sự Cố (Incidents)
          if (user.role === 'QUAN_LY') {
              const res = await incidentService.getAll();
              const data = res.data?.data || res.data || [];
              const newIncidents = data.filter(item => item.trangThai === 0);
              newIncidents.sort((a, b) => new Date(b.thoiGian) - new Date(a.thoiGian));
              setNotifications(newIncidents);
          } 
          // B. NẾU LÀ PHỤ HUYNH -> Lấy Thông Báo (Notifications)
          else if (user.role === 'PHU_HUYNH' && user.detail?.idPhuHuynh) {
              // Gọi API mới tạo ở bước 2
              // Lưu ý: Bạn cần thêm hàm getNotifications vào parentService trong file services/api.js nếu chưa có
              // Cấu trúc tạm thời gọi trực tiếp axios hoặc thêm vào service
              const res = await parentService.getNotifications(user.detail.idPhuHuynh); 
              const data = res.data?.data || res.data || [];
              setNotifications(data);
          }
      } catch (error) {
          console.error("Lỗi tải thông báo:", error);
      }
  };

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  
  const handleNotificationClick = () => { 
      handleMenuClose(); 
      if (user?.role === 'QUAN_LY') navigate('/admin/incidents');
      // Phụ huynh thì chỉ xem thôi, không cần chuyển trang (hoặc chuyển đến trang lịch sử nếu có)
  };

  // Hàm render nội dung từng dòng thông báo
  const renderItem = (item) => {
      const isParent = user?.role === 'PHU_HUYNH';
      
      // Admin xem sự cố
      if (!isParent) {
          return {
              title: item.tieuDe || "Sự cố từ tài xế",
              desc: `${item.tenTaiXe} - ${(item.moTa || "").substring(0, 30)}...`,
              icon: <WarningIcon fontSize="small" />,
              color: 'rgba(248, 113, 113, 0.2)', 
              iconColor: '#f87171'
          };
      }

      // Phụ huynh xem thông báo
      return {
          title: item.tieuDe,
          desc: item.noiDung,
          icon: item.loai === 'SUCCESS' ? <CheckCircleIcon fontSize="small" /> : <InfoIcon fontSize="small" />,
          color: item.loai === 'SUCCESS' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(96, 165, 250, 0.2)',
          iconColor: item.loai === 'SUCCESS' ? '#4ade80' : '#60a5fa'
      };
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#1e293b', boxShadow: 'none', borderBottom: '1px solid #334155' }}>
      <Toolbar>
        <IconButton color="inherit" onClick={toggleSidebar} sx={{ mr: 2 }}><MenuIcon /></IconButton>
        
        <img src="/logo.png" alt="SSB" style={{ height: 32, marginRight: 10, borderRadius: 6 }} onError={(e) => e.target.style.display = 'none'} />
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>Smart School Bus</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit" onClick={handleMenuClick}>
                <Badge badgeContent={notifications.length} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                PaperProps={{ sx: { bgcolor: '#1e293b', color: 'white', width: 340, maxHeight: 400, border: '1px solid #334155', mt: 1.5 } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ p: 2, pb: 1 }}><Typography variant="subtitle1" fontWeight="bold">Thông báo</Typography></Box>
                <Divider sx={{ borderColor: '#334155' }} />
                
                {notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}><Typography variant="body2">Không có thông báo mới.</Typography></Box>
                ) : (
                    <List disablePadding>
                        {notifications.slice(0, 5).map((item, index) => {
                            const info = renderItem(item);
                            return (
                                <ListItem key={index} alignItems="flex-start" button onClick={handleNotificationClick}>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: info.color, color: info.iconColor }}>{info.icon}</Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={info.title}
                                        secondary={
                                            <>
                                                <Typography component="span" variant="body2" sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.85rem' }}>
                                                    {info.desc}
                                                </Typography>
                                                <Typography component="span" variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                    {new Date(item.thoiGian).toLocaleString('vi-VN')}
                                                </Typography>
                                            </>
                                        }
                                        primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }}
                                    />
                                </ListItem>
                            )
                        })}
                    </List>
                )}
            </Menu>

            <Box sx={{ textAlign: 'right', mr: 2, display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.hoTen || user?.username || 'User'}</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    {user?.role === 'QUAN_LY' ? 'Quản lý' : (user?.role === 'TAI_XE' ? 'Tài xế' : 'Phụ huynh')}
                </Typography>
            </Box>
            
            <Avatar sx={{ bgcolor: '#3b82f6', width: 36, height: 36 }}>{user?.username?.charAt(0).toUpperCase()}</Avatar>
            <IconButton color="inherit" onClick={logout} title="Đăng xuất"><LogoutIcon /></IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;