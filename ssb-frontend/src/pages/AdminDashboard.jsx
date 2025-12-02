"use client"

import React, { useState, useEffect } from "react"
import { Box, Grid, CircularProgress, Typography } from "@mui/material"
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus"
import PersonIcon from "@mui/icons-material/Person"
import RouteIcon from "@mui/icons-material/Route"
import ScheduleIcon from "@mui/icons-material/Schedule"
import { busService, studentService, routeService, scheduleService } from "../services/api"
import BusDialog from "../components/BusDialog"

const AdminDashboard = () => {
  const [buses, setBuses] = useState([])
  const [students, setStudents] = useState([])
  const [routes, setRoutes] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  const [busDialogOpen, setBusDialogOpen] = useState(false)
  const [selectedBus, setSelectedBus] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [busRes, studentRes, routeRes, scheduleRes] = await Promise.all([
        busService.getAll(),
        studentService.getAll(),
        routeService.getAll(),
        scheduleService.getAll(),
      ])

      const getArrayData = (res) => {
        if (Array.isArray(res.data)) return res.data
        if (res.data?.data && Array.isArray(res.data.data)) return res.data.data
        return []
      }

      setBuses(getArrayData(busRes))
      setStudents(getArrayData(studentRes))
      setRoutes(getArrayData(routeRes))
      setSchedules(getArrayData(scheduleRes))
    } catch (error) {
      console.error("[v0] Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Cập nhật stats: Xóa hết trend, subText. Chỉ giữ lại core data.
  const stats = [
    {
      title: "Tổng số xe bus",
      value: buses.length,
      icon: <DirectionsBusIcon />,
      color: "#3b82f6",
      bgGradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)",
      shadowColor: "rgba(59, 130, 246, 0.4)",
    },
    {
      title: "Tổng số học sinh",
      value: students.length,
      icon: <PersonIcon />,
      color: "#22c55e",
      bgGradient: "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.05) 100%)",
      shadowColor: "rgba(34, 197, 94, 0.4)",
    },
    {
      title: "Tổng số tuyến",
      value: routes.length,
      icon: <RouteIcon />,
      color: "#f59e0b",
      bgGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.05) 100%)",
      shadowColor: "rgba(245, 158, 11, 0.4)",
    },
    {
      title: "Tổng lịch trình",
      value: schedules.length,
      icon: <ScheduleIcon />,
      color: "#ec4899",
      bgGradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(236, 72, 153, 0.05) 100%)",
      shadowColor: "rgba(236, 72, 153, 0.4)",
    },
  ]

  const handleAddBus = () => {
    setSelectedBus(null)
    setBusDialogOpen(true)
  }

  const handleEditBus = (bus) => {
    setSelectedBus(bus)
    setBusDialogOpen(true)
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="admin-page-header" style={{ marginBottom: '40px' }}>
        <div>
          <h1 className="admin-page-title" style={{ fontSize: '2.5rem', fontWeight: 800 }}>Tổng Quan Hệ Thống</h1>
          <Typography variant="h6" color="text.secondary" sx={{ mt: 1, fontWeight: 400 }}>
             Báo cáo nhanh tình hình hoạt động
          </Typography>
        </div>
      </div>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={12} md={6} key={index}>
              <div
                style={{
                  background: "#1e293b",
                  borderRadius: "20px",
                  padding: "30px", // Padding vừa vặn
                  display: "flex", // Layout ngang (Horizontal)
                  alignItems: "center",
                  gap: "30px", // Khoảng cách giữa Icon và Text
                  transition: "transform 0.3s ease",
                  cursor: "default",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  border: "1px solid rgba(255,255,255,0.05)"
                }}
                onMouseEnter={(e) => {
                   e.currentTarget.style.transform = "translateY(-5px)";
                   e.currentTarget.style.boxShadow = `0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)`;
                }}
                onMouseLeave={(e) => {
                   e.currentTarget.style.transform = "translateY(0)";
                   e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                }}
              >
                {/* 1. KHỐI ICON (Chiếm không gian bên trái) */}
                <div
                    style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "20px", // Bo góc mềm mại
                        background: stat.bgGradient, // Màu nền icon nhạt
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: stat.color, // Màu icon đậm
                        boxShadow: `0 10px 20px -5px ${stat.shadowColor}`, // Đổ bóng màu theo icon
                        flexShrink: 0 // Không bị co lại khi màn hình nhỏ
                    }}
                >
                    {React.cloneElement(stat.icon, { sx: { fontSize: 50 } })}
                </div>

                {/* 2. KHỐI TEXT (Bên phải) */}
                <div style={{ flex: 1 }}>
                    <Typography 
                        sx={{ 
                            color: "#94a3b8", 
                            fontSize: "1rem", 
                            fontWeight: 600, 
                            textTransform: "uppercase", 
                            letterSpacing: "1px",
                            mb: 1
                        }}
                    >
                        {stat.title}
                    </Typography>
                    
                    <Typography 
                        variant="h2" 
                        sx={{ 
                            fontWeight: 800, 
                            color: "#f8fafc", 
                            fontSize: "4rem", // Số to, rõ ràng
                            lineHeight: 1
                        }}
                    >
                        {stat.value}
                    </Typography>
                </div>
              </div>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default AdminDashboard