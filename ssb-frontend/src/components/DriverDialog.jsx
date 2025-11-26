import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, Typography, MenuItem } from '@mui/material'

const DriverDialog = ({ open, onClose, onSave, driver }) => {
  const initialData = { hoTen: '', soDienThoai: '', email: '', taiKhoan: '', matKhau: '', trangThai: 1 };
  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    if (driver) {
      // Nếu sửa: Load data và trạng thái
      setFormData({ 
          ...driver, 
          taiKhoan: driver.taiKhoan || '', 
          matKhau: '',
          trangThai: driver.trangThai !== undefined ? driver.trangThai : 1 
      });
    } else {
      setFormData(initialData);
    }
  }, [driver, open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{driver ? 'Cập nhật tài xế' : 'Thêm tài xế mới'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField fullWidth label="Họ và tên" name="hoTen" value={formData.hoTen} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Số điện thoại" name="soDienThoai" value={formData.soDienThoai} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleChange} />
          </Grid>

          {/* --- Ô CHỌN TRẠNG THÁI --- */}
          <Grid item xs={12}>
             <TextField
                select
                fullWidth
                label="Trạng thái"
                name="trangThai"
                value={formData.trangThai}
                onChange={handleChange}
             >
                <MenuItem value={1} sx={{ color: 'green' }}>Hoạt động</MenuItem>
                <MenuItem value={0} sx={{ color: 'red' }}>Ngưng hoạt động</MenuItem>
             </TextField>
          </Grid>
          
          {/* Chỉ hiện form tạo tài khoản khi thêm mới */}
          {!driver && (
            <>
              <Grid item xs={12}><Typography variant="caption" color="primary">Tạo tài khoản đăng nhập</Typography></Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Tên đăng nhập" name="taiKhoan" value={formData.taiKhoan} onChange={handleChange} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="password" label="Mật khẩu" name="matKhau" value={formData.matKhau} onChange={handleChange} />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Hủy</Button>
        <Button onClick={() => onSave(formData)} variant="contained" color="primary">
          {driver ? 'Lưu thay đổi' : 'Thêm mới'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DriverDialog;