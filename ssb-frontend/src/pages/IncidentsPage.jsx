import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Chip, CircularProgress, Divider } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import MapIcon from '@mui/icons-material/Map';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { incidentService } from '../services/api';
import '../styles/admin.css';

const IncidentsPage = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await incidentService.getAll();
            const data = res.data?.data || res.data || [];
            
            // --- DEBUG DỮ LIỆU ---
            console.log("Dữ liệu sự cố nhận được:", data);
            if (data.length > 0) {
                console.log("ID của phần tử đầu tiên:", data[0].idSuCo);
            }
            // ---------------------

            setIncidents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, currentStatus) => {
        // KIỂM TRA ID TRƯỚC KHI GỌI API
        if (!id) {
            alert("Lỗi: Không tìm thấy ID sự cố. Vui lòng kiểm tra Console (F12).");
            return;
        }

        try {
            const newStatus = currentStatus === 0 ? 1 : 0; 
            await incidentService.updateStatus(id, newStatus);
            loadData(); 
        } catch (error) {
            alert("Lỗi: " + error.message);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', { 
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' 
        });
    };

    const todayCount = incidents.filter(i => {
        if (!i.thoiGian) return false;
        const dateIncident = new Date(i.thoiGian);
        const dateToday = new Date();
        dateIncident.setHours(0, 0, 0, 0);
        dateToday.setHours(0, 0, 0, 0);
        return dateIncident.getTime() >= dateToday.getTime();
    }).length;

    const filteredList = incidents.filter(i => 
        (i.moTa && i.moTa.toLowerCase().includes(search.toLowerCase())) || 
        (i.tenTaiXe && i.tenTaiXe.toLowerCase().includes(search.toLowerCase())) ||
        (i.tieuDe && i.tieuDe.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Box sx={{ p: 3 }}>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Quản lý sự cố</h1>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Theo dõi và xử lý các báo cáo từ tài xế
                    </Typography>
                </div>
            </div>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                    <Card sx={{ bgcolor: '#1e293b', color: '#f87171', border: '1px solid #7f1d1d' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <WarningIcon fontSize="large" />
                            <Box>
                                <Typography variant="h4" fontWeight="bold">{incidents.length}</Typography>
                                <Typography variant="caption">Tổng số sự cố</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ bgcolor: '#1e293b', color: '#60a5fa', border: '1px solid #1e3a8a' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <AccessTimeIcon fontSize="large" />
                            <Box>
                                <Typography variant="h4" fontWeight="bold">{todayCount}</Typography>
                                <Typography variant="caption">Hôm nay</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <input 
                type="text" 
                className="admin-search-input" 
                placeholder="Tìm kiếm theo mô tả, tên tài xế..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: '20px' }}
            />

            {loading ? (
                <Box sx={{display:'flex', justifyContent:'center', py: 5}}><CircularProgress/></Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredList.length > 0 ? filteredList.map((item, index) => (
                        <Card 
                            key={`${item.idSuCo}-${index}`} 
                            sx={{ bgcolor: '#1e293b', color: 'white', borderLeft: item.trangThai === 1 ? '4px solid #4ade80' : '4px solid #f87171' }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {item.trangThai === 1 ? <CheckCircleIcon color="success" /> : <WarningIcon color="error" />}
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: item.trangThai === 1 ? '#86efac' : '#fca5a5' }}>
                                                {item.tieuDe || "Sự cố khác"}
                                            </Typography>
                                            <Chip label={`ID: #${item.idSuCo}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#666', height: 20, fontSize: 10, mt: 0.5 }} />
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                                        <Chip 
                                            icon={<AccessTimeIcon style={{color: '#94a3b8', fontSize: 16}}/>} 
                                            label={formatDate(item.thoiGian)} 
                                            size="small" 
                                            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }} 
                                        />
                                        <Chip 
                                            label={item.trangThai === 1 ? "Đã xử lý" : "Chưa xử lý"} 
                                            color={item.trangThai === 1 ? "success" : "error"}
                                            // SỬ DỤNG idSuCo tại đây
                                            onClick={() => handleUpdateStatus(item.idSuCo, item.trangThai)}
                                            sx={{ cursor: 'pointer', fontWeight: 'bold', height: 24 }}
                                        />
                                    </Box>
                                </Box>

                                <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1, mb: 2, border: '1px dashed #334155' }}>
                                    <Typography variant="body1" sx={{whiteSpace: 'pre-line', textDecoration: item.trangThai === 1 ? 'line-through' : 'none', opacity: item.trangThai === 1 ? 0.6 : 1}}>
                                        {item.moTa}
                                    </Typography>
                                </Box>

                                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
                                <Grid container spacing={2} sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                    <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PersonIcon fontSize="small"/> 
                                        <span>Tài xế: <strong style={{color:'white'}}>{item.tenTaiXe || '---'}</strong></span>
                                    </Grid>
                                    {item.tenTuyen && (
                                        <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <MapIcon fontSize="small"/> 
                                            <span>Tuyến: <strong style={{color:'white'}}>{item.tenTuyen}</strong></span>
                                        </Grid>
                                    )}
                                    {item.bienSo && (
                                        <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DirectionsBusIcon fontSize="small"/> 
                                            <span>Xe: <strong style={{color:'white'}}>{item.bienSo}</strong></span>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    )) : (
                        <Box sx={{ textAlign: 'center', py: 5, color: '#64748b' }}>
                            <WarningIcon sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
                            <Typography>Chưa có báo cáo sự cố nào.</Typography>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default IncidentsPage;