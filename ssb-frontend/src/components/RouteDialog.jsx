import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, InputAdornment } from '@mui/material'

const RouteDialog = ({ open, onClose, onSave, route }) => {
  // 1. Khởi tạo state khớp với DB mới: tenTuyen, moTa, khoangCach, thoiGianDuKien
  const initialData = { 
      tenTuyen: '', 
      moTa: '', 
      khoangCach: '', 
      thoiGianDuKien: '' 
  }
  const [formData, setFormData] = useState(initialData)

  useEffect(() => {
    if (open) {
        if (route) {
            // Map dữ liệu khi sửa
            setFormData({ 
                tenTuyen: route.tenTuyen || '',
                moTa: route.moTa || '',
                khoangCach: route.khoangCach || '',
                thoiGianDuKien: route.thoiGianDuKien || '' 
            })
        } else {
            // Reset khi thêm mới
            setFormData(initialData)
        }
    }
  }, [route, open])

  const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{route ? 'Cập nhật thông tin tuyến' : 'Thêm tuyến đường mới'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {/* Tên tuyến */}
        <TextField 
            label="Tên tuyến" 
            name="tenTuyen" 
            fullWidth 
            value={formData.tenTuyen} 
            onChange={handleChange} 
            placeholder="Ví dụ: Tuyến 01: Q8 - ĐH Sài Gòn"
        />
        
        {/* Mô tả */}
        <TextField 
            label="Mô tả lộ trình" 
            name="moTa" 
            fullWidth 
            multiline
            rows={3}
            value={formData.moTa} 
            onChange={handleChange} 
            placeholder="Mô tả chi tiết về lộ trình đi qua..."
        />

        <div style={{ display: 'flex', gap: 16 }}>
            {/* Khoảng cách */}
            <TextField 
                label="Khoảng cách" 
                name="khoangCach" 
                type="number"
                fullWidth 
                value={formData.khoangCach} 
                onChange={handleChange} 
                InputProps={{
                    endAdornment: <InputAdornment position="end">km</InputAdornment>,
                }}
            />
            
            {/* Thời gian dự kiến */}
            <TextField 
                label="Thời gian dự kiến" 
                name="thoiGianDuKien" 
                type="number"
                fullWidth 
                value={formData.thoiGianDuKien} 
                onChange={handleChange} 
                InputProps={{
                    endAdornment: <InputAdornment position="end">phút</InputAdornment>,
                }}
                helperText="Dùng để tính giờ đến trạm cuối"
            />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={() => onSave(formData)} variant="contained" color="primary">
            {route ? 'Lưu thay đổi' : 'Thêm tuyến'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
export default RouteDialog