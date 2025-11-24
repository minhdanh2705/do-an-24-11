import { AppBar, Toolbar, Typography, IconButton, Box, Button, Avatar, TextField, InputAdornment, Badge } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SearchIcon from '@mui/icons-material/Search'
import { useAuth } from '../context/AuthContext'

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const getRoleDisplay = () => {
    switch (user?.role) {
      case 'QUAN_LY': return 'Quản lý'
      case 'TAI_XE': return 'Tài xế'
      case 'PHU_HUYNH': return 'Phụ huynh'
      default: return ''
    }
  }

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#000000',
        borderBottom: '1px solid #1e293b',
        boxShadow: 'none',
      }}
    >
      <Toolbar sx={{ height: 70 }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'primary.main',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.25rem',
            }}
          >
            SSB
          </Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            SmartBus Admin
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
            sx={{
              width: 250,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#0a0a0a',
                borderRadius: 2,
                '& fieldset': {
                  borderColor: '#1e293b',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8' }} />
                </InputAdornment>
              ),
            }}
          />
          
          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}>
            <Avatar 
              sx={{ 
                width: 36, 
                height: 36, 
                bgcolor: 'primary.main',
                fontWeight: 'bold'
              }}
            >
              {(user?.hoTen || user?.tenDangNhap)?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="600">
                {user?.hoTen || user?.tenDangNhap}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getRoleDisplay()}
              </Typography>
            </Box>
          </Box>
          
          <IconButton
            color="inherit"
            onClick={handleLogout}
            sx={{ 
              ml: 1,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.05)',
              }
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
