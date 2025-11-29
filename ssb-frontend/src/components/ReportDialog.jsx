import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Typography, Box, Alert } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

const ReportDialog = ({ open, onClose, onSave, schedules = [] }) => {
    const [formData, setFormData] = useState({ idLichTrinh: '', moTa: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        if (!formData.moTa) {
            alert("Vui lòng nhập mô tả sự cố");
            return;
        }
        onSave(formData);
        setFormData({ idLichTrinh: '', moTa: '' }); // Reset form
    };

    // Tìm thông tin lịch trình đang chọn để hiển thị chi tiết (nếu có)
    const selectedSchedule = schedules.find(s => s.idLichTrinh === formData.idLichTrinh);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#1e293b', color: '#f87171' }}>
                <WarningIcon /> Báo cáo sự cố
            </DialogTitle>
            <DialogContent sx={{ mt: 1, bgcolor: '#0f172a' }}>
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        select
                        label="Chọn chuyến xe gặp sự cố"
                        name="idLichTrinh"
                        value={formData.idLichTrinh}
                        onChange={handleChange}
                        fullWidth
                        InputLabelProps={{ style: { color: '#94a3b8' } }}
                        sx={{ 
                            '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: '#334155' } },
                            '& .MuiSvgIcon-root': { color: 'white' }
                        }}
                    >
                        <MenuItem value=""><em>-- Sự cố chung / Ngoài tuyến --</em></MenuItem>
                        {schedules.map(sch => (
                            <MenuItem key={sch.idLichTrinh} value={sch.idLichTrinh}>
                                {sch.tenTuyen} ({sch.thoiGianBatDau})
                            </MenuItem>
                        ))}
                    </TextField>

                    {selectedSchedule && (
                        <Box sx={{ p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 1, border: '1px solid #3b82f6' }}>
                            <Typography variant="body2" sx={{ color: '#60a5fa' }}>📍 Tuyến: {selectedSchedule.tenTuyen}</Typography>
                            <Typography variant="body2" sx={{ color: '#60a5fa' }}>🚌 Xe: {selectedSchedule.bienSoXe}</Typography>
                        </Box>
                    )}

                    <TextField
                        label="Mô tả sự cố *"
                        name="moTa"
                        value={formData.moTa}
                        onChange={handleChange}
                        multiline
                        rows={4}
                        fullWidth
                        placeholder="Ví dụ: Xe bị thủng lốp, tắc đường kẹt xe..."
                        InputLabelProps={{ style: { color: '#94a3b8' } }}
                        sx={{ 
                            '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: '#334155' } }
                        }}
                    />

                    <Alert severity="warning" sx={{ bgcolor: 'rgba(245, 124, 0, 0.1)', color: '#ffcc80' }}>
                        Báo cáo sẽ được gửi ngay lập tức đến Quản trị viên.
                    </Alert>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#1e293b' }}>
                <Button onClick={onClose} sx={{ color: '#94a3b8' }}>Hủy</Button>
                <Button onClick={handleSubmit} variant="contained" color="error" startIcon={<WarningIcon />}>
                    Gửi ngay
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReportDialog;