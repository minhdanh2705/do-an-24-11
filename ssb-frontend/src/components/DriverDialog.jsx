import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, Typography } from '@mui/material'

const DriverDialog = ({ open, onClose, onSave, driver }) => {
  const initialData = { hoTen: '', soDienThoai: '', email: '', taiKhoan: '', matKhau: '' };
  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    if (driver) {
      // Nếu sửa: Ẩn mật khẩu (Backend xử lý riêng hoặc không cho sửa pass ở đây)
      setFormData({ ...driver, taiKhoan: driver.taiKhoan || '', matKhau: '' });
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