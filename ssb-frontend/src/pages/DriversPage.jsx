import { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { driverService } from '../services/api' 
import DriverDialog from '../components/DriverDialog'

const DriversPage = () => {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // State cho Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)

  useEffect(() => { loadDrivers() }, [])

  const loadDrivers = async () => {
    setLoading(true)
    try {
      const res = await driverService.getAll()
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setDrivers(data)
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error)
      setDrivers([])
    } finally { setLoading(false) }
  }

  // Xử lý lưu (Thêm/Sửa)
  const handleSave = async (driverData) => {
    try {
      if (selectedDriver) {
        await driverService.update(selectedDriver.idTaiXe, driverData)
      } else {
        await driverService.create(driverData)
      }
      setDialogOpen(false)
      loadDrivers() // Refresh danh sách
      alert(selectedDriver ? 'Cập nhật thành công!' : 'Thêm mới thành công!')
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleAdd = () => {
    setSelectedDriver(null)
    setDialogOpen(true)
  }

  const handleEdit = (driver) => {
    setSelectedDriver(driver)
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa tài xế này?')) {
      try {
        await driverService.delete(id)
        loadDrivers() 
      } catch (error) {
        console.error("Lỗi khi xóa:", error)
        alert("Không thể xóa: " + (error.response?.data?.message || error.message))
      }
    }
  }

  const filteredDrivers = Array.isArray(drivers) 
    ? drivers.filter(driver => (driver.hoTen || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : []

  return (
    <Box sx={{ p: 3 }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Danh sách tài xế</h1>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Quản lý đội ngũ tài xế và phân công
          </Typography>
        </div>
        <button className="admin-btn-add" onClick={handleAdd}>
          <AddIcon sx={{ fontSize: 20 }} /> Thêm tài xế
        </button>
      </div>

      <Card sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          <input type="text" className="admin-search-input" placeholder="Tìm kiếm tài xế..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ marginBottom: '20px' }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Họ Tên</th>
                    <th>Số điện thoại</th>
                    <th>Email</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.length > 0 ? (
                    filteredDrivers.map((driver, index) => (
                        <tr key={driver.id || driver.idTaiXe || index}>
                          <td style={{ fontWeight: 600 }}>{driver.hoTen || 'Chưa cập nhật'}</td>
                          <td>{driver.soDienThoai || '---'}</td>
                          <td>{driver.email || '---'}</td>
                          <td>
                            <span className={(driver.trangThai === 'Đang hoạt động' || driver.trangThai === 1) ? 'chip-active' : 'chip-inactive'}>
                              {(driver.trangThai === 'Đang hoạt động' || driver.trangThai === 1) ? 'Hoạt động' : 'Tạm ngưng'}
                            </span>
                          </td>
                          <td>
                            <div className="admin-action-btns">
                              <button className="admin-btn-edit" onClick={() => handleEdit(driver)}><EditIcon sx={{ fontSize: 16 }} /> Sửa</button>
                              <button className="admin-btn-delete" onClick={() => handleDelete(driver.id || driver.idTaiXe)}><DeleteIcon sx={{ fontSize: 16 }} /> Xóa</button>
                            </div>
                          </td>
                        </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Không tìm thấy tài xế nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <DriverDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        onSave={handleSave} 
        driver={selectedDriver} 
      />
    </Box>
  )
}
export default DriversPage