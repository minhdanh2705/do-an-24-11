import { useState, useEffect } from 'react'
import { Box, Card, CardContent, CircularProgress, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { busService } from '../services/api' 
import BusDialog from '../components/BusDialog'

const BusesPage = () => {
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedBus, setSelectedBus] = useState(null)

  useEffect(() => { loadBuses() }, [])

  const loadBuses = async () => {
    setLoading(true)
    try {
      const res = await busService.getAll()
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setBuses(data) 
    } catch (error) {
      console.error("Lỗi tải danh sách xe:", error)
      setBuses([])
    } finally { setLoading(false) }
  }

  const handleSave = async (data) => {
    try {
      if (selectedBus) {
        await busService.update(selectedBus.idXeBus || selectedBus.idXe, data)
      } else {
        await busService.create(data)
      }
      setDialogOpen(false)
      loadBuses()
      alert(selectedBus ? 'Cập nhật thành công!' : 'Thêm xe thành công!')
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleAdd = () => { setSelectedBus(null); setDialogOpen(true); }
  const handleEdit = (bus) => { setSelectedBus(bus); setDialogOpen(true); }
  
  const handleDelete = async (id) => {
      if(window.confirm("Bạn có chắc muốn xóa xe này?")) {
          try {
              await busService.delete(id)
              loadBuses()
          } catch(err) { alert("Lỗi xóa: " + err.message) }
      }
  }

  // --- CẬP NHẬT HÀM HIỂN THỊ MÀU SẮC ---
  const getStatusLabel = (status) => {
    const s = Number(status); // Chuyển về số để so sánh chính xác

    // Trạng thái 1: Hoạt động (Xanh lá)
    if (s === 1) {
        return { text: 'Hoạt động', color: '#4ade80' }; 
    }
    // Trạng thái 2: Bảo trì (Vàng cam)
    if (s === 2) {
        return { text: 'Đang bảo trì', color: '#facc15' }; 
    }
    // Trạng thái 0: Ngưng hoạt động (Đỏ)
    if (s === 0) {
        return { text: 'Ngưng hoạt động', color: '#f87171' }; 
    }
    
    return { text: 'Không xác định', color: '#94a3b8' };
  }
  // --------------------------------------

  return (
    <Box sx={{ p: 3 }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Danh sách xe buýt</h1>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Quản lý phương tiện và trạng thái vận hành
          </Typography>
        </div>
        <button className="admin-btn-add" onClick={handleAdd}>
            <AddIcon sx={{ fontSize: 20 }} /> Thêm xe
        </button>
      </div>

      <Card sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{display:'flex', justifyContent:'center', py: 5}}><CircularProgress/></Box>
          ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Biển số xe</th>
                  <th style={{ textAlign: 'center' }}>Sức chứa</th>
                  <th style={{ textAlign: 'right' }}>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(buses) && buses.length > 0 ? (
                    buses.map((bus, index) => {
                    // Gọi hàm lấy trạng thái mới
                    const statusInfo = getStatusLabel(bus.trangThai);
                    return (
                    <tr key={bus.idXeBus || bus.idXe || index}> 
                        <td style={{ fontWeight: 600, fontSize: '1.05rem' }}>{bus.bienSo || 'Chưa cập nhật'}</td>
                        <td style={{ textAlign: 'center' }}>{bus.sucChua || 0}</td>
                        
                        {/* Hiển thị Text và Màu sắc */}
                        <td style={{ textAlign: 'right' }}>
                            <span style={{ color: statusInfo.color, fontWeight: 700 }}>
                                {statusInfo.text}
                            </span>
                        </td>
                        
                        <td>
                        <div className="admin-action-btns" style={{ justifyContent: 'flex-end' }}>
                            <button className="admin-btn-edit" onClick={() => handleEdit(bus)}><EditIcon sx={{ fontSize: 16 }} /> Sửa</button>
                            <button className="admin-btn-delete" onClick={() => handleDelete(bus.idXeBus || bus.idXe)}><DeleteIcon sx={{ fontSize: 16 }} /> Xóa</button>
                        </div>
                        </td>
                    </tr>
                    )})
                ) : (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Chưa có dữ liệu xe buýt.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      <BusDialog 
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        bus={selectedBus}
      />
    </Box>
  )
}

export default BusesPage