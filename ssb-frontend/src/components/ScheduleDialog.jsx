import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid } from '@mui/material'

const ScheduleDialog = ({ open, onClose, onSave, initialData, data = { routes: [], buses: [], drivers: [] } }) => {
  const defaultState = { 
    idTuyen: '', 
    idXe: '', 
    idTaiXe: '', 
    ngayChay: new Date().toISOString().split('T')[0],
    thoiGianBatDau: '06:00', 
    thoiGianKetThuc: '07:00' 
  }

  const [formData, setFormData] = useState(defaultState)

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
            ...defaultState,
            ...initialData,
            idTuyen: initialData.idTuyen || initialData.idTuyenDuong || '', 
            idXe: initialData.idXe || initialData.idXeBus || '',
            idTaiXe: initialData.idTaiXe || '',
            thoiGianBatDau: formatTime(initialData.thoiGianBatDau || '06:00'),
            thoiGianKetThuc: formatTime(initialData.thoiGianKetThuc || '07:00'),
            ngayChay: initialData.ngayChay ? new Date(initialData.ngayChay).toISOString().split('T')[0] : defaultState.ngayChay
        })
      } else {
        setFormData(defaultState)
      }
    }
  }, [initialData, open])

  const formatTime = (timeStr) => {
      if (!timeStr) return '06:00';
      if (timeStr.includes('T')) {
          const d = new Date(timeStr);
          return d.toTimeString().substring(0, 5);
      }
      return timeStr.substring(0, 5);
  }

  const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime || !durationMinutes) return startTime;
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0); 
    date.setMinutes(date.getMinutes() + durationMinutes); 
    return date.toTimeString().substring(0, 5);
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let updatedData = { ...formData, [name]: value }

    // Logic tự động tính giờ kết thúc khi chọn Tuyến hoặc đổi giờ đi
    if (name === 'idTuyen' || name === 'thoiGianBatDau') {
        const selectedRouteId = name === 'idTuyen' ? value : formData.idTuyen;
        const currentStartTime = name === 'thoiGianBatDau' ? value : formData.thoiGianBatDau;

        // Tìm tuyến trong danh sách (Chấp nhận cả idTuyen và idTuyenDuong)
        const selectedRoute = data.routes.find(r => 
            (r.idTuyenDuong == selectedRouteId) || (r.idTuyen == selectedRouteId)
        );
        
        if (selectedRoute && selectedRoute.thoiGianDuKien) {
            updatedData.thoiGianKetThuc = calculateEndTime(currentStartTime, selectedRoute.thoiGianDuKien);
        }
    }

    setFormData(updatedData)
  }

  const handleSave = () => {
      // Validate đơn giản trước khi gửi
      if (!formData.idTuyen || !formData.idXe || !formData.idTaiXe) {
          alert("Vui lòng chọn đầy đủ Tuyến đường, Xe Bus và Tài xế!");
          return;
      }
      onSave(formData);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialData ? 'Cập nhật lịch trình' : 'Tạo lịch trình chạy mới'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
                <TextField 
                    select 
                    label="Chọn Tuyến Đường" 
                    name="idTuyen" 
                    fullWidth 
                    value={formData.idTuyen} 
                    onChange={handleChange}
                >
                    {data.routes && data.routes.map(r => {
                        const val = r.idTuyen || r.idTuyenDuong; 
                        return (
                            <MenuItem key={val} value={val}>
                                {r.tenTuyen} ({r.thoiGianDuKien || 30} phút)
                            </MenuItem>
                        )
                    })}
                </TextField>
            </Grid>

            <Grid item xs={6}>
                <TextField 
                    type="time" 
                    label="Giờ khởi hành" 
                    name="thoiGianBatDau" 
                    fullWidth 
                    InputLabelProps={{ shrink: true }} 
                    value={formData.thoiGianBatDau} 
                    onChange={handleChange} 
                />
            </Grid>
            <Grid item xs={6}>
                <TextField 
                    type="time" 
                    label="Giờ kết thúc (Dự kiến)" 
                    name="thoiGianKetThuc" 
                    fullWidth 
                    InputLabelProps={{ shrink: true }} 
                    value={formData.thoiGianKetThuc} 
                    disabled 
                    helperText="Tự động tính theo Tuyến đường"
                />
            </Grid>

            <Grid item xs={6}>
                <TextField 
                    select 
                    label="Chọn Xe Bus" 
                    name="idXe" 
                    fullWidth 
                    value={formData.idXe} 
                    onChange={handleChange}
                >
                    {data.buses && data.buses.map(b => {
                        const val = b.idXe || b.idXeBus;
                        return (
                            <MenuItem key={val} value={val}>
                                {b.bienSo} ({b.sucChua} chỗ)
                            </MenuItem>
                        )
                    })}
                </TextField>
            </Grid>

            <Grid item xs={6}>
                <TextField 
                    select 
                    label="Chọn Tài Xế" 
                    name="idTaiXe" 
                    fullWidth 
                    value={formData.idTaiXe} 
                    onChange={handleChange}
                >
                    {data.drivers && data.drivers.map(d => (
                        <MenuItem key={d.idTaiXe} value={d.idTaiXe}>
                            {d.hoTen}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>

            <Grid item xs={12}>
                <TextField 
                    type="date" 
                    label="Ngày thực hiện" 
                    name="ngayChay" 
                    fullWidth 
                    InputLabelProps={{ shrink: true }} 
                    value={formData.ngayChay} 
                    onChange={handleChange} 
                />
            </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
            {initialData ? 'Lưu thay đổi' : 'Tạo lịch trình'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ScheduleDialog