import React, { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { parentService } from '../services/api'
import ParentDialog from '../components/ParentDialog'
import '../styles/admin.css'

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

  const validateInputs = (data) => {
    const { hoTen, soDienThoai, email, tenDangNhap, matKhau } = data;
    if (!hoTen || !soDienThoai || !email || !tenDangNhap) {
        alert("Thông báo thiếu thông tin bắt buộc");
        return false;
    }
    if (!selectedParent && !matKhau) {
        alert("Thông báo thiếu thông tin bắt buộc (Mật khẩu)");
        return false;
    }
    return true;
  }

  const handleSave = async (formData) => {
    if (!validateInputs(formData)) return; // Dừng nếu thiếu thông tin

    try {
      if (selectedParent) {
        await parentService.update(selectedParent.idPhuHuynh, formData)
        alert('Cập nhật thành công!')
      } else {
        await parentService.create(formData)
        alert('Thêm mới thành công!')
      }
      setDialogOpen(false)
      loadData()
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert('Lỗi: ' + error.message);
      }
    }
  }

  const handleAddClick = () => { setSelectedParent(null); setDialogOpen(true); }
  const handleEditClick = (parent) => { setSelectedParent(parent); setDialogOpen(true); }

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản phụ huynh này không?")) return;
    try {
        await parentService.delete(id);
        setParents((prev) => prev.filter((p) => p.idPhuHuynh !== id));
        alert("Đã xóa phụ huynh thành công!");
    } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
            alert(error.response.data.message);
        } else {
            alert("Có lỗi xảy ra: " + error.message);
        }
    }
  }

  const filteredParents = Array.isArray(parents) 
    ? parents.filter(p => (p.hoTen || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : []

  return (
    <Box sx={{ p: 3 }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Danh sách phụ huynh</h1>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Quản lý thông tin liên lạc</Typography>
        </div>
        <button className="admin-btn-add" onClick={handleAddClick}><AddIcon sx={{ fontSize: 20 }} /> Thêm phụ huynh</button>
      </div>

      <Card sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          <input type="text" className="admin-search-input" placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ marginBottom: '20px' }} />
          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr><th>Họ Tên</th><th>Số điện thoại</th><th>Email</th><th style={{ textAlign: 'center' }}>Trạng thái</th><th style={{ textAlign: 'right' }}>Hành động</th></tr>
                </thead>
                <tbody>
                  {filteredParents.map((parent, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 600 }}>{parent.hoTen}</td>
                      <td>{parent.soDienThoai}</td>
                      <td>{parent.email}</td>
                      <td style={{ textAlign: 'center' }}><span className="chip-active">Hoạt động</span></td>
                      <td>
                        <div className="admin-action-btns">
                          <button className="admin-btn-edit" onClick={() => handleEditClick(parent)}><EditIcon sx={{ fontSize: 16 }} /> Sửa</button>
                          <button className="admin-btn-delete" onClick={() => handleDelete(parent.idPhuHuynh)}><DeleteIcon sx={{ fontSize: 16 }} /> Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <ParentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} parent={selectedParent} />
    </Box>
  )
}
export default ParentsPage