import { useState, useEffect } from 'react'
import { Box, Card, CardContent, CircularProgress, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { routeService, busService } from '../services/api' // Import thêm busService
import RouteDialog from '../components/RouteDialog'

const RoutesPage = () => {
  const [routes, setRoutes] = useState([])
  const [buses, setBuses] = useState([]) // State lưu danh sách xe
  const [filteredRoutes, setFilteredRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState(null)

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (Array.isArray(routes)) {
        if (searchTerm) {
            const filtered = routes.filter(route => route.tenTuyen?.toLowerCase().includes(searchTerm.toLowerCase()))
            setFilteredRoutes(filtered)
        } else { setFilteredRoutes(routes) }
    } else { setFilteredRoutes([]) }
  }, [searchTerm, routes])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load cả Routes và Buses
      const [routeRes, busRes] = await Promise.all([
        routeService.getAll(),
        busService.getAll()
      ])
      const rData = Array.isArray(routeRes.data) ? routeRes.data : (routeRes.data?.data || [])
      const bData = Array.isArray(busRes.data) ? busRes.data : (busRes.data?.data || [])
      
      setRoutes(rData)
      setFilteredRoutes(rData)
      setBuses(bData)
    } catch (error) { 
      console.error(error)
      setRoutes([])
      setFilteredRoutes([])
    } finally { setLoading(false) }
  }

  const handleSave = async (data) => {
    try {
      if (selectedRoute) {
        await routeService.update(selectedRoute.idTuyen, data)
      } else {
        await routeService.create(data)
      }
      setDialogOpen(false)
      loadData()
      alert(selectedRoute ? 'Cập nhật thành công!' : 'Thêm mới thành công!')
    } catch (err) { 
        alert('Lỗi: ' + (err.response?.data?.message || err.message)) 
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa tuyến đường này?')) {
      try {
        await routeService.delete(id)
        loadData()
      } catch (error) {
        alert('Không thể xóa: ' + (error.response?.data?.message || error.message))
      }
    }
  }

  const handleAdd = () => { setSelectedRoute(null); setDialogOpen(true); }
  const handleEdit = (r) => { setSelectedRoute(r); setDialogOpen(true); }

  return (
    <Box sx={{ p: 3 }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý tuyến đường</h1>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Thiết lập lộ trình và thời gian di chuyển
          </Typography>
        </div>
        <button className="admin-btn-add" onClick={handleAdd}>
          <AddIcon sx={{ fontSize: 20 }} /> Thêm tuyến
        </button>
      </div>

      <Card sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          <input type="text" className="admin-search-input" placeholder="Tìm kiếm tuyến đường..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ marginBottom: '20px' }} />
        
        {loading ? (
            <Box sx={{display:'flex', justifyContent:'center', py: 5}}><CircularProgress/></Box>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên tuyến</th>
                  <th>Xe Bus</th>
                  <th>Thời gian bắt đầu</th>
                  <th>Thời gian kết thúc</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(filteredRoutes) && filteredRoutes.length > 0 ? (
                    filteredRoutes.map((route, index) => (
                    <tr key={route.idTuyen || route.id || index}>
                        <td>{route.idTuyen || route.id}</td>
                        <td style={{ fontWeight: 600 }}>{route.tenTuyen || 'Chưa cập nhật'}</td>
                        <td>{route.bienSo || 'Chưa gán'}</td>
                        <td>{route.gioBatDau || '--:--'}</td>
                        <td>{route.gioKetThuc || '--:--'}</td>
                        <td>
                        <div className="admin-action-btns">
                            <button className="admin-btn-edit" onClick={() => handleEdit(route)}><EditIcon sx={{ fontSize: 16 }} /> Sửa</button>
                            <button className="admin-btn-delete" onClick={() => handleDelete(route.idTuyen || route.id)}><DeleteIcon sx={{ fontSize: 16 }} /> Xóa</button>
                        </div>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Không tìm thấy tuyến đường nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        </CardContent>
      </Card>

      <RouteDialog 
        open={dialogOpen}
        route={selectedRoute}
        buses={buses}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  )
}

export default RoutesPage