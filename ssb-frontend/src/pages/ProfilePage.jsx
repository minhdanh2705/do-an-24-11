import React, { useState } from 'react'
import {
  Box, Grid, Card, Typography, Button, Avatar, Switch, Divider, List, ListItem, ListItemText, ListItemIcon, Chip, TextField, IconButton
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SecurityIcon from '@mui/icons-material/Security'
import LanguageIcon from '@mui/icons-material/Language'
import HistoryIcon from '@mui/icons-material/History'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'

const ProfilePage = () => {
  const [settings, setSettings] = useState({ emailNoti: true, smsNoti: false, twoFactor: true })

  const handleToggle = (key) => setSettings({ ...settings, [key]: !settings[key] })

  const cardSx = {
    bgcolor: '#1e293b', color: 'white', borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.05)',
    height: '100%', position: 'relative', overflow: 'visible'
  }

  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ height: '200px', background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 100%)', borderRadius: '0 0 20px 20px', mb: 8 }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, pt: 4, pl: 5 }}>Hồ sơ cá nhân</Typography>
      </Box>

      <Box sx={{ px: { xs: 2, md: 5 }, mt: -12 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={cardSx}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: -6, mb: 2 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar src="https://i.pravatar.cc/300?img=11" sx={{ width: 120, height: 120, border: '4px solid #1e293b' }} />
                  <IconButton sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: '#3b82f6', color: 'white', border: '2px solid #1e293b' }} size="small">
                    <CameraAltIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="h5" sx={{ mt: 2, fontWeight: 700 }}>Adonis</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>Quản trị viên hệ thống</Typography>
                <Chip label="Hoạt động" color="success" size="small" sx={{ mt: 1, bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', fontWeight: 600 }} />
              </Box>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />
              <Box sx={{ px: 3, pb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 2, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>Thông tin liên hệ</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}><EmailIcon sx={{color:'#60a5fa', mr:2}} /><Typography>admin@smartbus.com</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}><PhoneIcon sx={{color:'#f472b6', mr:2}} /><Typography>0909 123 456</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><LocationOnIcon sx={{color:'#34d399', mr:2}} /><Typography>Quận 5, TP.HCM</Typography></Box>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={cardSx}>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Cài đặt tài khoản</Typography>
                    <Grid container spacing={4}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 2 }}>Cập nhật thông tin</Typography>
                        <TextField fullWidth label="Họ và tên" defaultValue="Adonis" variant="outlined" size="small" sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }, '& .MuiInputLabel-root': { color: '#94a3b8' } }} />
                        <TextField fullWidth label="Chức vụ" defaultValue="Admin" variant="outlined" size="small" disabled sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }, '& .MuiInputLabel-root': { color: '#94a3b8' } }} />
                        <Button variant="contained" startIcon={<EditIcon />} sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}>Lưu thay đổi</Button>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>Tuỳ chọn hệ thống</Typography>
                        <List disablePadding>
                          <ListItem disableGutters>
                            <ListItemIcon sx={{ minWidth: 40, color: '#94a3b8' }}><NotificationsIcon /></ListItemIcon>
                            <ListItemText primary="Thông báo Email" secondary="Nhận báo cáo hàng tuần" primaryTypographyProps={{fontSize: '0.9rem'}} secondaryTypographyProps={{color: '#64748b', fontSize: '0.75rem'}} />
                            <Switch checked={settings.emailNoti} onChange={() => handleToggle('emailNoti')} />
                          </ListItem>
                          <ListItem disableGutters>
                            <ListItemIcon sx={{ minWidth: 40, color: '#94a3b8' }}><SecurityIcon /></ListItemIcon>
                            <ListItemText primary="Bảo mật 2 lớp (2FA)" secondary="Tăng cường bảo mật" primaryTypographyProps={{fontSize: '0.9rem'}} secondaryTypographyProps={{color: '#64748b', fontSize: '0.75rem'}} />
                            <Switch checked={settings.twoFactor} onChange={() => handleToggle('twoFactor')} color="success" />
                          </ListItem>
                        </List>
                      </Grid>
                    </Grid>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
export default ProfilePage