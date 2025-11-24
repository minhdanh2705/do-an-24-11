import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid } from '@mui/material'

const ScheduleDialog = ({ open, onClose, onSave, schedule, data = { routes: [], buses: [], drivers: [] } }) => {
  const initialData = { idTuyen: '', idXe: '', idTaiXe: '', ngayThucHien: '' }
  const [formData, setFormData] = useState(initialData)

  useEffect(() => {
    if (open) {
        if (schedule) {
            // Logic sửa (nếu cần sau này)
        } else {
            const today = new Date().toISOString().split('T')[0]
            setFormData({ ...initialData, ngayThucHien: today })
        }
    }
  }, [schedule, open])

  const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Tạo lịch trình chạy mới</DialogTitle>
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
                    {data.routes && data.routes.map(r => (
                        <MenuItem key={r.idTuyen} value={r.idTuyen}>{r.tenTuyen}</MenuItem>
                    ))}
                </TextField>
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
                    {data.buses && data.buses.map(b => (
                        <MenuItem key={b.idXeBus} value={b.idXeBus}>{b.bienSo}</MenuItem>
                    ))}
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
                        <MenuItem key={d.idTaiXe} value={d.idTaiXe}>{d.hoTen}</MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid item xs={12}>
                <TextField 
                    type="date" 
                    label="Ngày thực hiện" 
                    name="ngayThucHien" 
                    fullWidth 
                    InputLabelProps={{ shrink: true }} 
                    value={formData.ngayThucHien} 
                    onChange={handleChange} 
                />
            </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={() => onSave(formData)} variant="contained" color="primary">Tạo lịch trình</Button>
      </DialogActions>
    </Dialog>
  )
}
export default ScheduleDialog