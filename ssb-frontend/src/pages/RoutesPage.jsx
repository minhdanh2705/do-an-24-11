
import { useState, useEffect } from "react"
import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material"
import { routeService } from "../services/api"
import '../styles/admin.css'
const RoutesPage = () => {
  const [routes, setRoutes] = useState([])
  const [filteredRoutes, setFilteredRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (Array.isArray(routes)) {
      if (searchTerm) {
        const filtered = routes.filter((route) => route.tenTuyen?.toLowerCase().includes(searchTerm.toLowerCase()))
        setFilteredRoutes(filtered)
      } else {
        setFilteredRoutes(routes)
      }
    } else {
      setFilteredRoutes([])
    }
  }, [searchTerm, routes])

  const loadData = async () => {
    setLoading(true)
    try {
      const routeRes = await routeService.getAll()
      const rData = Array.isArray(routeRes.data) ? routeRes.data : routeRes.data?.data || []
      setRoutes(rData)
      setFilteredRoutes(rData)
    } catch (error) {
      console.error(error)
      setRoutes([])
      setFilteredRoutes([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý tuyến đường</h1>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Thiết lập lộ trình, khoảng cách và thời gian dự kiến
          </Typography>
        </div>
      </div>

      <Card sx={{ backgroundColor: "transparent", boxShadow: "none" }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: "200px" }}>Tên tuyến</th>
                    <th>Mô tả</th>
                    <th style={{ width: "150px" }}>Khoảng cách</th>
                    <th style={{ width: "150px" }}>TG Dự kiến</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(filteredRoutes) && filteredRoutes.length > 0 ? (
                    filteredRoutes.map((route, index) => (
                      <tr key={route.idTuyenDuong || index}>
                        <td style={{ fontWeight: 600 }}>{route.tenTuyen || "Chưa đặt tên"}</td>

                        <td
                          style={{
                            maxWidth: "300px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {route.moTa || "Không có mô tả"}
                        </td>

                        <td>{route.khoangCach ? `${route.khoangCach} km` : "--"}</td>

                        <td>{route.thoiGianDuKien ? `${route.thoiGianDuKien} phút` : "--"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
                        Không tìm thấy tuyến đường nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default RoutesPage
