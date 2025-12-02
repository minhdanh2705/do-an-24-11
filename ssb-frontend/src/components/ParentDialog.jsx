import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, Typography, Box } from '@mui/material';

const ParentDialog = ({ open, onClose, onSave, parent }) => {
    const [formData, setFormData] = useState({
        hoTen: '', soDienThoai: '', email: '', trangThai: 1, tenDangNhap: '', matKhau: ''
    });

    useEffect(() => {
        if (parent) {
            setFormData({
                hoTen: parent.hoTen || '',
                soDienThoai: parent.soDienThoai || '',
                email: parent.email || '',
                trangThai: 1,
                tenDangNhap: parent.tenDangNhap || '', // Thường API không trả về username
                matKhau: ''
            });
        } else {
            setFormData({ hoTen: '', soDienThoai: '', email: '', trangThai: 1, tenDangNhap: '', matKhau: '' });
        }
    }, [parent, open]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: '#1e293b', color: 'white' }}>{parent ? 'Cập nhật' : 'Thêm mới'}</DialogTitle>
            <DialogContent sx={{ mt: 2, pt: 2 }}>
                <Box component="form" sx={{ mt: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}><TextField name="hoTen" label="Họ tên" fullWidth value={formData.hoTen} onChange={handleChange} /></Grid>
                        <Grid item xs={6}><TextField name="soDienThoai" label="Số điện thoại" fullWidth value={formData.soDienThoai} onChange={handleChange} /></Grid>
                        <Grid item xs={6}><TextField name="email" label="Email" fullWidth value={formData.email} onChange={handleChange} /></Grid>
                        
                        {!parent && (
                            <>
                                <Grid item xs={12}><Typography variant="subtitle2" sx={{ color: '#64748b', mt: 2 }}>Tài khoản đăng nhập</Typography></Grid>
                                <Grid item xs={6}><TextField name="tenDangNhap" label="Tên đăng nhập" fullWidth value={formData.tenDangNhap} onChange={handleChange} /></Grid>
                                <Grid item xs={6}><TextField name="matKhau" label="Mật khẩu" type="password" fullWidth value={formData.matKhau} onChange={handleChange} /></Grid>
                            </>
                        )}
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Hủy</Button>
                <Button onClick={() => onSave(formData)} variant="contained">{parent ? 'Cập nhật' : 'Thêm mới'}</Button>
            </DialogActions>
        </Dialog>
    );
};
export default ParentDialog;