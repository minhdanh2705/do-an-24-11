import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, CssBaseline } from '@mui/material'
import Header from './Header'   
import Sidebar from './Sidebar' 

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const headerHeight = 70;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0f172a' }}>
      <CssBaseline />
      
      <Header toggleSidebar={toggleSidebar} />
      
      <Sidebar open={isSidebarOpen} />

      <Box
        component="main"
        sx={{
          flexGrow: 1, 
          p: 3,
          marginLeft: 0, 
          
          // Đẩy nội dung xuống dưới Header
          marginTop: `${headerHeight}px`, 
          
          width: '100%', 
          
          transition: 'all 0.3s ease',
          overflowX: 'hidden'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default Layout