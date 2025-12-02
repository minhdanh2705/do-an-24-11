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
  
  // State quản lý Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState(null)

  // 1. Load dữ liệu khi vào trang
  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await parentService.getAll()
      // Xử lý dữ liệu trả về tùy theo cấu trúc API (res.data hoặc res.data.data)
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setParents(data)
    } catch (error) { 
        console.error("Lỗi tải phụ huynh:", error) 
        setParents([])
    } finally { setLoading(false) }
  }

  // 2. Hàm Validate dữ liệu (Frontend check)
  const validateInputs = (data) => {
    const { hoTen, soDienThoai, email, tenDangNhap, matKhau } = data;

    // Kiểm tra trường bắt buộc
    if (!hoTen || !soDienThoai || !email || !tenDangNhap) {
        alert("Vui lòng điền đầy đủ thông tin (Họ tên, SĐT, Email, Tên đăng nhập)!");
        return false;
    }

    // Nếu là thêm mới thì bắt buộc có mật khẩu, nếu là sửa thì mật khẩu có thể để trống (giữ cũ)
    if (!selectedParent && !matKhau) {
        alert("Vui lòng nhập mật khẩu!");
        return false;
    }

    // Regex số điện thoại Việt Nam (10 số, bắt đầu bằng 0)
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
    if (!phoneRegex.test(soDienThoai)) {
        alert("Số điện thoại không hợp lệ (Phải là số VN 10 số)!");
        return false;
    }

    // Regex Email chuẩn
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Địa chỉ Email không hợp lệ!");
        return false;
    }

    // Kiểm tra độ dài mật khẩu (chỉ check khi có nhập mật khẩu)
    if (matKhau && matKhau.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự!");
        return false;
    }

    return true;
  }

  // 3. Xử lý Lưu (Thêm mới HOẶC Cập nhật)
  const handleSave = async (formData) => {
    // Gọi Validate trước khi gửi
    if (!validateInputs(formData)) return;

    try {
      if (selectedParent) {
        // --- LOGIC CẬP NHẬT ---
        await parentService.update(selectedParent.id || selectedParent.idPhuHuynh, formData)
        alert('Cập nhật thành công!')
      } else {
        // --- LOGIC THÊM MỚI ---
        await parentService.create(formData)
        alert('Thêm mới thành công!')
      }
      
      // Thành công thì đóng dialog và load lại bảng
      setDialogOpen(false)
      loadData()

    } catch (error) {
      console.error("Lỗi lưu:", error);
      // Hiển thị thông báo lỗi từ Backend (ví dụ: Trùng Email, Trùng SĐT...)
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert('Lỗi: ' + error.message);
      }
    }
  }

  // 4. Mở Dialog để Thêm mới
  const handleAddClick = () => {
    setSelectedParent(null) // Reset parent để Dialog hiểu là thêm mới
    setDialogOpen(true)
  }

  // 5. Mở Dialog để Sửa
  const handleEditClick = (parent) => {
    setSelectedParent(parent) // Truyền data cũ vào để Dialog fill lên form
    setDialogOpen(true)
  }

  // 6. Xử lý Xóa
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản phụ huynh này không?")) return;

    try {
        await parentService.delete(id);

        // Cập nhật giao diện ngay lập tức
        setParents((prevParents) => prevParents.filter((p) => (p.id || p.idPhuHuynh) !== id));
        alert("Đã xóa phụ huynh thành công!");

    } catch (error) {
        console.error("Lỗi khi xóa:", error);

        // Hiển thị thông báo CẢNH BÁO từ Backend (Ràng buộc dữ liệu)
        if (error.response && error.response.data && error.response.data.message) {
            alert(error.response.data.message);
        } else {
            alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
        }
    }
  }

  // Lọc tìm kiếm
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
        <button className="admin-btn-add" onClick={handleAddClick}>
            <AddIcon sx={{ fontSize: 20 }} /> Thêm phụ huynh
        </button>
      </div>

      <Card sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          <input 
            type="text" 
            className="admin-search-input" 
            placeholder="Tìm kiếm theo tên hoặc email..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ marginBottom: '20px' }} 
          />

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
                            <button className="admin-btn-edit" onClick={() => handleEditClick(parent)}>
                                <EditIcon sx={{ fontSize: 16 }} /> Sửa
                            </button>
                            <button className="admin-btn-delete" onClick={() => handleDelete(parent.id || parent.idPhuHuynh)}>
                                <DeleteIcon sx={{ fontSize: 16 }} /> Xóa
                            </button>
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

      {/* Dialog Component - Chịu trách nhiệm hiển thị Form */}
      <ParentDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        onSave={handleSave} // Truyền hàm handleSave xuống Dialog
        parent={selectedParent} // Truyền data cũ (nếu có)
      />
    </Box>
  )
}

export default ParentsPage