import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, CssBaseline } from '@mui/material'
import Header from './Header'   // Import file Header của bạn
import Sidebar from './Sidebar' // Import file Sidebar của bạn

const Layout = () => {
  // Trạng thái đóng/mở sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const sidebarWidth = 260; 
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
          // Logic tính toán lề để tạo hiệu ứng trượt
          marginLeft: isSidebarOpen ? `${sidebarWidth}px` : 0,
          marginTop: `${headerHeight}px`, 
          width: `calc(100% - ${isSidebarOpen ? sidebarWidth : 0}px)`,
          transition: 'margin 0.3s ease, width 0.3s ease', // Hiệu ứng mượt
          overflowX: 'hidden'
        }}
      >
        {/* Đây là nơi các trang con (Dashboard, Student...) sẽ hiển thị */}
        <Outlet />
      </Box>
    </Box>
  )
}

export default Layout