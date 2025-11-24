import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationsIcon from '@mui/icons-material/Notifications'
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus'
import PeopleIcon from '@mui/icons-material/People'
import LogoutIcon from '@mui/icons-material/Logout'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import InfoIcon from '@mui/icons-material/Info'
import { useAuth } from '../context/AuthContext'

const DriverLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notificationAnchor, setNotificationAnchor] = useState(null)

  const notifications = [
    { id: 1, type: 'success', message: 'Chuyến đi đã bắt đầu', time: '5 phút trước', icon: CheckCircleIcon },
    { id: 2, type: 'warning', message: 'Học sinh Nguyễn Văn A chưa lên xe', time: '15 phút trước', icon: WarningIcon },
    { id: 3, type: 'info', message: 'Lịch trình hôm nay: 7:00 AM - 8:30 AM', time: '1 giờ trước', icon: InfoIcon },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
    setDrawerOpen(false)
  }

  const getIconColor = (type) => {
    switch(type) {
      case 'success': return '#00ff00'
      case 'warning': return '#ffa500'
      case 'error': return '#ff0000'
      default: return '#0ea5e9'
    }
  }

  return (
    <Box sx={{ bgcolor: '#000000', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: '#000000', borderBottom: '1px solid #1e293b' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Driver App
          </Typography>

          <IconButton 
            color="inherit"
            onClick={(e) => setNotificationAnchor(e.currentTarget)}
          >
            <Badge badgeContent={notifications.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { bgcolor: '#000000', color: '#ffffff', width: 280 }
        }}
      >
        <Box sx={{ p: 3, borderBottom: '1px solid #1e293b' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Menu
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            {user?.detail?.hoTen || 'Tài xế'}
          </Typography>
        </Box>
        
        <List>
          <ListItem button onClick={() => { setDrawerOpen(false) }}>
            <ListItemIcon sx={{ color: '#0ea5e9' }}>
              <DirectionsBusIcon />
            </ListItemIcon>
            <ListItemText primary="Lịch làm việc hôm nay" />
          </ListItem>
          
          <ListItem button onClick={() => { setDrawerOpen(false) }}>
            <ListItemIcon sx={{ color: '#0ea5e9' }}>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Danh sách học sinh" />
          </ListItem>
          
          <ListItem button onClick={handleLogout}>
            <ListItemIcon sx={{ color: '#ef4444' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Đăng xuất" />
          </ListItem>
        </List>
      </Drawer>

      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={() => setNotificationAnchor(null)}
        PaperProps={{
          sx: {
            bgcolor: '#111111',
            color: '#ffffff',
            width: 350,
            maxHeight: 400,
            border: '1px solid #1e293b'
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #1e293b' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Thông báo
          </Typography>
        </Box>
        {notifications.map((notif) => {
          const Icon = notif.icon
          return (
            <MenuItem 
              key={notif.id} 
              sx={{ 
                py: 2, 
                borderBottom: '1px solid #1e293b',
                '&:hover': { bgcolor: '#1e293b' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%' }}>
                <Icon sx={{ color: getIconColor(notif.type), fontSize: 20, mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {notif.message}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {notif.time}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          )
        })}
      </Menu>

      <Box sx={{ p: 2 }}>
        <Outlet />
      </Box>
    </Box>
  )
}

export default DriverLayout
