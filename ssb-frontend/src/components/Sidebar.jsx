import { Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Box, Typography } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus'
import PersonIcon from '@mui/icons-material/Person'
import RouteIcon from '@mui/icons-material/Route'
import ScheduleIcon from '@mui/icons-material/Schedule'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AssessmentIcon from '@mui/icons-material/Assessment'
import SettingsIcon from '@mui/icons-material/Settings'
import BadgeIcon from '@mui/icons-material/Badge';
import { useAuth } from '../context/AuthContext'

const Sidebar = ({ open }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const getMenuItems = () => {
    if (user?.role === 'QUAN_LY') {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
        { text: 'Lịch Trình', icon: <ScheduleIcon />, path: '/admin/schedules' },
        { text: 'Xe Buýt', icon: <DirectionsBusIcon />, path: '/admin/buses' },
        { text: 'Tuyến xe', icon: <RouteIcon />, path: '/admin/routes' },
        { text: 'Tài xế', icon: <BadgeIcon />, path: '/admin/drivers' },
        { text: 'Học sinh', icon: <PersonIcon />, path: '/admin/students' },
        { text: 'Phụ huynh', icon: <PersonIcon />, path: '/admin/parents' },
        { text: 'Báo cáo', icon: <AssessmentIcon />, path: '/admin/reports' },
        { text: 'Profile', icon: <SettingsIcon />, path: '/admin/profile' },
      ]
    } else if (user?.role === 'TAI_XE') {
      return [
        { text: 'Lịch làm việc', icon: <ScheduleIcon />, path: '/driver' },
      ]
    } else if (user?.role === 'PHU_HUYNH') {
      return [
        { text: 'Theo dõi xe bus', icon: <DirectionsBusIcon />, path: '/parent' },
      ]
    }
    return []
  }

  const handleNavigation = (e, path) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(path)
  }

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        // --- PHẦN SỬA LỖI Ở ĐÂY ---
        width: open ? 260 : 0,  // Nếu mở: 260px, Đóng: 0px (để nội dung tràn ra)
        flexShrink: 0,
        transition: 'width 0.3s ease', // Hiệu ứng trượt mượt mà
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        
        '& .MuiDrawer-paper': {
          width: 260,
          boxSizing: 'border-box',
          mt: '70px',
          // Tôi đổi màu này thành #0f172a để khớp với admin.css của bạn (thay vì #000000)
          // Nếu muốn đen tuyền thì đổi lại thành #000000
          backgroundColor: '#0f172a', 
          color: '#ffffff', // Thêm màu chữ trắng mặc định
          borderRight: '1px solid #1e293b',
          height: 'calc(100% - 70px)', // Tránh bị đè hoặc dư scroll
        },
      }}
    >
      <Box sx={{ p: 3, borderBottom: '1px solid #1e293b' }}>
        <Typography variant="caption" color="text.secondary" fontWeight="600" letterSpacing="0.1em">
          MENU
        </Typography>
      </Box>

      <List sx={{ px: 2, py: 2 }}>
        {getMenuItems().map((item, index) => (
          <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={(e) => handleNavigation(e, item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                py: 1.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(14, 165, 233, 0.15)',
                  borderLeft: '3px solid',
                  borderColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'rgba(14, 165, 233, 0.2)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  fontSize: '0.875rem',
                  color: 'inherit' // Lấy màu từ cha
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}

export default Sidebar