import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid } from '@mui/material'

const ScheduleDialog = ({ open, onClose, onSave, initialData, data = { routes: [], buses: [], drivers: [] } }) => {
  // Debug: Bật F12 xem dữ liệu thực tế nhận được là gì
  useEffect(() => {
    if (open) {
      console.log("Dữ liệu Routes nhận được:", data.routes);
      console.log("Dữ liệu Buses nhận được:", data.buses);
    }
  }, [open, data]);

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
            // Map đúng trường ID cho form edit
            idTuyen: initialData.idTuyen || initialData.idTuyenDuong || '', 
            idXe: initialData.idXe || initialData.idXeBus || '',
            idTaiXe: initialData.idTaiXe || '',
            thoiGianBatDau: formatTime(initialData.thoiGianBatDau || initialData.gioKhoiHanh || '06:00'),
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
          // Lưu ý: Dùng toTimeString để lấy giờ địa phương chính xác
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

    // LOGIC TỰ ĐỘNG TÍNH TOÁN GIỜ KẾT THÚC
    if (name === 'idTuyen' || name === 'thoiGianBatDau') {
        const selectedRouteId = name === 'idTuyen' ? value : formData.idTuyen;
        const currentStartTime = name === 'thoiGianBatDau' ? value : formData.thoiGianBatDau;

        // FIX LỖI: Dùng toán tử == (2 dấu bằng) để so sánh lỏng (String vs Number)
        // FIX LỖI: Kiểm tra cả idTuyen (alias) và idTuyenDuong (gốc)
        const selectedRoute = data.routes.find(r => 
            (r.idTuyenDuong == selectedRouteId) || (r.idTuyen == selectedRouteId)
        );
        
        // Nếu tìm thấy tuyến và tuyến có thời gian dự kiến -> Tính giờ kết thúc
        if (selectedRoute && selectedRoute.thoiGianDuKien) {
            updatedData.thoiGianKetThuc = calculateEndTime(currentStartTime, selectedRoute.thoiGianDuKien);
        }
    }

    setFormData(updatedData)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialData ? 'Cập nhật lịch trình' : 'Tạo lịch trình chạy mới'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* 1. Chọn Tuyến Đường */}
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
                        // FIX LỖI: Ưu tiên lấy idTuyen, nếu không có lấy idTuyenDuong
                        const val = r.idTuyen || r.idTuyenDuong; 
                        return (
                            <MenuItem key={val} value={val}>
                                {r.tenTuyen} ({r.thoiGianDuKien || 30} phút)
                            </MenuItem>
                        )
                    })}
                </TextField>
            </Grid>

            {/* 2. Chọn Thời Gian */}
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
                    disabled // Chỉ để xem, không cho sửa
                    helperText="Tự động tính theo Tuyến đường"
                />
            </Grid>

            {/* 3. Chọn Xe Bus */}
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
                        // FIX LỖI: Ưu tiên lấy idXe (mới), nếu không có lấy idXeBus (cũ)
                        const val = b.idXe || b.idXeBus;
                        return (
                            <MenuItem key={val} value={val}>
                                {b.bienSo} ({b.sucChua} chỗ)
                            </MenuItem>
                        )
                    })}
                </TextField>
            </Grid>

            {/* 4. Chọn Tài Xế */}
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

            {/* 5. Chọn Ngày */}
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
        <Button onClick={() => onSave(formData)} variant="contained" color="primary">
            {initialData ? 'Lưu thay đổi' : 'Tạo lịch trình'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ScheduleDialog