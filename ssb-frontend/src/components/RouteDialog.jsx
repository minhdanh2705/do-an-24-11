import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem } from '@mui/material'

const RouteDialog = ({ open, onClose, onSave, route, buses = [] }) => {
  const initialData = { tenTuyen: '', gioBatDau: '', gioKetThuc: '', idXeBus: '' }
  const [formData, setFormData] = useState(initialData)

  useEffect(() => {
    if (route) {
        setFormData({ 
            tenTuyen: route.tenTuyen || '',
            gioBatDau: route.gioBatDau || '',
            gioKetThuc: route.gioKetThuc || '',
            idXeBus: route.idXeBus || '' // Đảm bảo không bị null
        })
    } else {
        setFormData(initialData)
    }
  }, [route, open])

  const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{route ? 'Sửa tuyến xe' : 'Thêm tuyến xe mới'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField 
            label="Tên tuyến" 
            name="tenTuyen" 
            fullWidth 
            value={formData.tenTuyen} 
            onChange={handleChange} 
        />
        
        <TextField 
            select 
            label="Xe Bus phụ trách" 
            name="idXeBus" 
            fullWidth 
            value={formData.idXeBus} 
            onChange={handleChange}
        >
            <MenuItem value=""><em>Chưa chọn xe</em></MenuItem>
            {/* Kiểm tra mảng buses trước khi map */}
            {Array.isArray(buses) && buses.map((bus) => (
                <MenuItem key={bus.idXeBus} value={bus.idXeBus}>
                    {bus.bienSo} ({bus.sucChua} chỗ)
                </MenuItem>
            ))}
        </TextField>

        <div style={{ display: 'flex', gap: 16 }}>
            <TextField 
                label="Giờ bắt đầu (HH:mm)" 
                name="gioBatDau" 
                fullWidth 
                value={formData.gioBatDau} 
                onChange={handleChange} 
                placeholder="06:00" 
            />
            <TextField 
                label="Giờ kết thúc (HH:mm)" 
                name="gioKetThuc" 
                fullWidth 
                value={formData.gioKetThuc} 
                onChange={handleChange} 
                placeholder="18:00" 
            />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={() => onSave(formData)} variant="contained" color="primary">Lưu</Button>
      </DialogActions>
    </Dialog>
  )
}
export default RouteDialog