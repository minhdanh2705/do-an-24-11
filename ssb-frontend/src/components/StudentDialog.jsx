import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, FormControl, InputLabel, Select
} from '@mui/material'
import api from '../services/api' // Import api để gọi endpoint stops

const StudentDialog = ({ open, student, routes, parents, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    hoTen: '', lop: '', idTuyen: '', idDiemDon: '', idPhuHuynh: ''
  })
  const [routeStops, setRouteStops] = useState([]) // Danh sách điểm đón theo tuyến

  useEffect(() => {
    if (student) {
      setFormData({
        hoTen: student.hoTen || '',
        lop: student.lop || '',
        idTuyen: student.idTuyen || '',
        idDiemDon: student.idDiemDon || '', // ID điểm đón
        idPhuHuynh: student.idPhuHuynh || '',
      })
      // Nếu đang sửa, load luôn điểm dừng của tuyến đó
      if (student.idTuyen) fetchStops(student.idTuyen);
    } else {
      // Mặc định thêm mới
      setFormData({ hoTen: '', lop: '', idTuyen: '', idDiemDon: '', idPhuHuynh: '' })
      setRouteStops([])
    }
  }, [student, open])

  // Hàm lấy danh sách điểm dừng khi chọn tuyến
  const fetchStops = async (routeId) => {
    try {
        const res = await api.get(`/routes/${routeId}/stops`);
        setRouteStops(res.data?.data || []);
    } catch (error) {
        console.error("Lỗi tải điểm dừng:", error);
        setRouteStops([]);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Nếu thay đổi tuyến -> Load lại điểm dừng & Reset điểm đón cũ
    if (name === 'idTuyen') {
        setFormData(prev => ({ ...prev, idDiemDon: '' })); // Reset điểm đón
        fetchStops(value);
    }
  }

  const handleSubmit = () => {
    onSave({
        ...formData,
        idTuyen: formData.idTuyen ? parseInt(formData.idTuyen) : null,
        idDiemDon: formData.idDiemDon ? parseInt(formData.idDiemDon) : null,
        idPhuHuynh: formData.idPhuHuynh ? parseInt(formData.idPhuHuynh) : null,
        trangThai: 1 // Mặc định luôn là Hoạt động (1)
    });
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{student ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới'}</DialogTitle>
      <DialogContent>
        <TextField name="hoTen" label="Họ tên" fullWidth margin="normal" value={formData.hoTen} onChange={handleChange} required />
        <TextField name="lop" label="Lớp" fullWidth margin="normal" value={formData.lop} onChange={handleChange} required />
        
        {/* Chọn Tuyến */}
        <TextField select name="idTuyen" label="Tuyến xe" fullWidth margin="normal" value={formData.idTuyen} onChange={handleChange}>
          {routes.map(r => <MenuItem key={r.idTuyenDuong} value={r.idTuyenDuong}>{r.tenTuyen}</MenuItem>)}
        </TextField>

        {/* Chọn Điểm đón (Chỉ hiện khi đã chọn tuyến) */}
        <TextField select name="idDiemDon" label="Điểm đón (Theo tuyến đã chọn)" fullWidth margin="normal" value={formData.idDiemDon} onChange={handleChange} disabled={!formData.idTuyen}>
          {routeStops.length === 0 && <MenuItem value=""><em>Không có điểm dừng nào</em></MenuItem>}
          {routeStops.map(s => (
            <MenuItem key={s.idDiemDung} value={s.idDiemDung}>
              {s.thuTu}. {s.tenDiemDung}
            </MenuItem>
          ))}
        </TextField>
        
        {/* Chọn Phụ Huynh */}
        <TextField select name="idPhuHuynh" label="Phụ huynh" fullWidth margin="normal" value={formData.idPhuHuynh} onChange={handleChange}>
            {parents.map(p => <MenuItem key={p.idPhuHuynh} value={p.idPhuHuynh}>{p.hoTen} - {p.soDienThoai}</MenuItem>)}
        </TextField>

        {/* Bỏ chọn trạng thái - Mặc định hoạt động */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={handleSubmit} variant="contained">Lưu</Button>
      </DialogActions>
    </Dialog>
  )
}
export default StudentDialog