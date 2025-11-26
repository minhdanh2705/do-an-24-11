import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, MenuItem } from '@mui/material'

const BusDialog = ({ open, onClose, onSave, bus }) => {
  const initialData = { bienSo: '', sucChua: '', trangThai: 1 }
  const [formData, setFormData] = useState(initialData)

  useEffect(() => {
    if (bus) {
      setFormData({ 
        bienSo: bus.bienSo || '', 
        sucChua: bus.sucChua || '',
        trangThai: bus.trangThai === undefined ? 1 : bus.trangThai 
      })
    } else {
      setFormData(initialData)
    }
  }, [bus, open])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{bus ? 'Cập nhật xe bus' : 'Thêm xe bus mới'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField fullWidth label="Biển số xe" name="bienSo" value={formData.bienSo} onChange={handleChange} placeholder="Ví dụ: 51B-123.45" />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth type="number" label="Sức chứa (chỗ)" name="sucChua" value={formData.sucChua} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField select fullWidth label="Trạng thái" name="trangThai" value={formData.trangThai} onChange={handleChange}>
                <MenuItem value={1}>Hoạt động</MenuItem>
                <MenuItem value={2}>Bảo trì </MenuItem>
                <MenuItem value={0}>Ngưng</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Hủy</Button>
        <Button onClick={() => onSave(formData)} variant="contained" color="primary">
          {bus ? 'Lưu thay đổi' : 'Thêm mới'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BusDialog