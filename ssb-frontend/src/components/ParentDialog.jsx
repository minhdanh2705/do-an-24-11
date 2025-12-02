import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem, Typography, Box 
} from '@mui/material';

const ParentDialog = ({ open, onClose, onSave, parent }) => {
    // Khởi tạo state chuẩn xác
    const [formData, setFormData] = useState({
        hoTen: '',
        soDienThoai: '',
        email: '',
        trangThai: 1,
        tenDangNhap: '',
        matKhau: ''
    });

    useEffect(() => {
        if (parent) {
            setFormData({
                hoTen: parent.hoTen || '',
                soDienThoai: parent.soDienThoai || '',
                email: parent.email || '',
                trangThai: parent.trangThai !== undefined ? parent.trangThai : 1,
                tenDangNhap: parent.tenDangNhap || '',
                matKhau: '' // Khi sửa thì reset mật khẩu
            });
        } else {
            // Khi thêm mới: Reset form
            setFormData({
                hoTen: '',
                soDienThoai: '',
                email: '',
                trangThai: 1,
                tenDangNhap: '',
                matKhau: ''
            });
        }
    }, [parent, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        // Truyền dữ liệu ra ngoài
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: '#1e293b', color: 'white' }}>
                {parent ? 'Cập nhật thông tin' : 'Thêm phụ huynh mới'}
            </DialogTitle>
            
            <DialogContent sx={{ mt: 2, pt: 2 }}>
                <Box component="form" sx={{ mt: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>Thông tin cá nhân</Typography>
                        </Grid>

                        {/* QUAN TRỌNG: Các thuộc tính name="" phải chính xác từng chữ */}
                        <Grid item xs={12}>
                            <TextField
                                name="hoTen" 
                                label="Họ tên"
                                fullWidth
                                value={formData.hoTen}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                name="soDienThoai"
                                label="Số điện thoại"
                                fullWidth
                                value={formData.soDienThoai}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                name="email"
                                label="Email"
                                fullWidth
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    name="trangThai"
                                    value={formData.trangThai}
                                    label="Trạng thái"
                                    onChange={handleChange}
                                >
                                    <MenuItem value={1}>Hoạt động</MenuItem>
                                    <MenuItem value={0}>Bị khóa</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, mt: 2 }}>
                                Tài khoản đăng nhập
                            </Typography>
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                name="tenDangNhap"
                                label="Tên đăng nhập"
                                fullWidth
                                value={formData.tenDangNhap}
                                onChange={handleChange}
                                disabled={!!parent} // Không cho sửa tên đăng nhập khi update
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                name="matKhau"
                                label="Mật khẩu"
                                type="password"
                                fullWidth
                                value={formData.matKhau}
                                onChange={handleChange}
                                placeholder={parent ? "Để trống nếu không đổi" : ""}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">Hủy</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    {parent ? 'Cập nhật' : 'Thêm mới'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ParentDialog;