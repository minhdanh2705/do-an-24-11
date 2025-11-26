import { useState, useEffect } from 'react'
import { Container, Box, Paper, TextField, Button, Typography, Alert } from '@mui/material'
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [tenDangNhap, setTenDangNhap] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const [localError, setLocalError] = useState('')
  
  // Lấy các state và hàm từ Context
  const { login, loading, error: authError } = useAuth()

  // Đồng bộ lỗi từ Context vào Local component để hiển thị
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('') // Reset lỗi cũ
    
    // Gọi hàm login từ Context
    const success = await login(tenDangNhap, matKhau);

    // Nếu thất bại, lỗi đã được cập nhật vào authError (và useEffect sẽ bắt lấy nó)
    if (!success) {
      console.log("Đăng nhập thất bại ở View");
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={24} 
          sx={{ 
            p: 5, 
            width: '100%',
            backgroundColor: '#000000',
            border: '1px solid #2a2a2a',
            borderRadius: 3,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <DirectionsBusIcon sx={{ fontSize: 50, color: 'white' }} />
            </Box>
            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
              Smart School Bus
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Hệ Thống Quản Lý Xe Đưa Đón Học Sinh
            </Typography>
          </Box>

          {/* Hiển thị lỗi nếu có */}
          {(localError || authError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {localError || authError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Tên đăng nhập"
              variant="outlined"
              margin="normal"
              value={tenDangNhap}
              onChange={(e) => setTenDangNhap(e.target.value)}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#2a2a2a' },
                  '&:hover fieldset': { borderColor: '#42a5f5' },
                },
              }}
            />
            <TextField
              fullWidth
              label="Mật khẩu"
              type="password"
              variant="outlined"
              margin="normal"
              value={matKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#2a2a2a' },
                  '&:hover fieldset': { borderColor: '#42a5f5' },
                },
              }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                mt: 4,
                py: 1.5,
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                },
              }}
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </Button>
          </form>

          <Box sx={{ mt: 4, p: 3, bgcolor: '#1a1a1a', borderRadius: 2, border: '1px solid #2a2a2a' }}>
            <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
              Tài khoản demo:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 2 }}>
              <strong>Admin:</strong> admin / admin123<br />
              <strong>Tài xế:</strong> taixe1 / taixe123<br />
              <strong>Phụ huynh:</strong> phuhuynh1 / ph123
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export default Login