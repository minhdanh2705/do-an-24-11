import { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { parentService } from '../services/api'
import ParentDialog from '../components/ParentDialog'

const ParentsPage = () => {
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await parentService.getAll()
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setParents(data)
    } catch (error) { 
        console.error("Lỗi tải phụ huynh:", error) 
        setParents([])
    } finally { setLoading(false) }
  }

  const handleSave = async (data) => {
    try {
      if (selectedParent) {
        await parentService.update(selectedParent.idPhuHuynh, data)
      } else {
        await parentService.create(data)
      }
      setDialogOpen(false)
      loadData()
      alert(selectedParent ? 'Cập nhật thành công!' : 'Thêm mới thành công!')
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleAdd = () => {
    setSelectedParent(null)
    setDialogOpen(true)
  }

  const handleEdit = (parent) => {
    setSelectedParent(parent)
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Xóa phụ huynh này?')) {
      try {
        await parentService.delete(id)
        loadData()
      } catch (error) {
        console.error("Lỗi xóa:", error)
        alert("Không thể xóa: " + (error.response?.data?.message || error.message))
      }
    }
  }

  const filteredParents = Array.isArray(parents) 
    ? parents.filter(p => (p.hoTen || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.email || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : []

  return (
    <Box sx={{ p: 3 }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Danh sách phụ huynh</h1>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Quản lý thông tin liên lạc phụ huynh
          </Typography>
        </div>
        <button className="admin-btn-add" onClick={handleAdd}>
            <AddIcon sx={{ fontSize: 20 }} /> Thêm phụ huynh
        </button>
      </div>

      <Card sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          <input type="text" className="admin-search-input" placeholder="Tìm kiếm theo tên hoặc email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ marginBottom: '20px' }} />

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
                    <th style={{ textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParents.length > 0 ? (
                    filteredParents.map((parent, index) => (
                      <tr key={parent.id || parent.idPhuHuynh || index}>
                        <td style={{ fontWeight: 600 }}>{parent.hoTen || 'Chưa cập nhật'}</td>
                        <td>{parent.soDienThoai || '---'}</td>
                        <td>{parent.email || '---'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={(parent.trangThai === 1 || parent.trangThai === 'Hoạt động') ? 'chip-active' : 'chip-inactive'}>
                            {(parent.trangThai === 1 || parent.trangThai === 'Hoạt động') ? 'Hoạt động' : 'Bị khóa'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-action-btns">
                            <button className="admin-btn-edit" onClick={() => handleEdit(parent)}><EditIcon sx={{ fontSize: 16 }} /> Sửa</button>
                            <button className="admin-btn-delete" onClick={() => handleDelete(parent.id || parent.idPhuHuynh)}><DeleteIcon sx={{ fontSize: 16 }} /> Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Không tìm thấy phụ huynh nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ParentDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        onSave={handleSave} 
        parent={selectedParent} 
      />
    </Box>
  )
}
export default ParentsPage