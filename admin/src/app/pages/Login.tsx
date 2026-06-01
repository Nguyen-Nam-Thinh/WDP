import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress, InputAdornment, IconButton, Fade } from '@mui/material';
import { Visibility, VisibilityOff, Lock, Email } from '@mui/icons-material';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Vui lòng nhập email và mật khẩu'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#050510',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      {/* Background with animated gradients and premium image feel */}
      <Box sx={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#050510',
        zIndex: 0,
        '&::before': {
          content: '""', position: 'absolute', inset: 0,
          background: 'url("/images/background.jpg") center/cover no-repeat',
          opacity: 0.5,
          filter: 'contrast(1.1) brightness(0.7)'
        },
        '&::after': {
          content: '""', position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% 50%, transparent 20%, #050510 100%), linear-gradient(to right, rgba(5,5,16,0.8), transparent, rgba(5,5,16,0.8))'
        }
      }} />

      <Fade in={true} timeout={1000}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 5 }, 
            width: '100%', 
            maxWidth: 440, 
            borderRadius: '24px',
            position: 'relative',
            zIndex: 1,
            background: 'rgba(20, 20, 30, 0.65)', 
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)', 
            boxShadow: '0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)'
            }
          }}
        >
          {/* Logo Area */}
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: '20px', mx: 'auto', mb: 3,
              background: 'linear-gradient(135deg, #FFD700 0%, #D4A017 50%, #996515 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 24px rgba(212, 160, 23, 0.3), inset 0 2px 0 rgba(255,255,255,0.4)',
              position: 'relative',
              overflow: 'hidden'
            }}>
               <Box component="img" src="/images/logo.png" sx={{ width: 44, height: 44, objectFit: 'contain', zIndex: 1 }} alt="Logo" />
               <Box sx={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'shimmer 3s infinite' }} />
               <style>{`@keyframes shimmer { 100% { left: 200%; } }`}</style>
            </Box>
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.5px', mb: 1, fontFamily: "'Inter', sans-serif" }}>
              Admin Portal
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              HRTMS — Horse Racing Management
            </Typography>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4, borderRadius: '12px', bgcolor: 'rgba(239, 68, 68, 0.1)', 
                color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', 
                '& .MuiAlert-icon': { color: '#fca5a5' },
                alignItems: 'center'
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Địa chỉ Email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="filled"
              sx={{ 
                mb: 3, 
                '& .MuiFilledInput-root': { 
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.2s',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1)' },
                  '&.Mui-focused': { backgroundColor: 'rgba(0,0,0,0.6)', borderColor: '#D4A017' },
                  '&::before, &::after': { display: 'none' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)', '&.Mui-focused': { color: '#D4A017' } }
              }}
              InputProps={{ 
                startAdornment: <InputAdornment position="start"><Email sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 22, ml: 1, mr: 1 }} /></InputAdornment>,
                disableUnderline: true
              }}
            />
            <TextField
              fullWidth label="Mật khẩu" type={showPassword ? 'text' : 'password'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              variant="filled"
              sx={{ 
                mb: 4, 
                '& .MuiFilledInput-root': { 
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.2s',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1)' },
                  '&.Mui-focused': { backgroundColor: 'rgba(0,0,0,0.6)', borderColor: '#D4A017' },
                  '&::before, &::after': { display: 'none' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)', '&.Mui-focused': { color: '#D4A017' } }
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 22, ml: 1, mr: 1 }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: 'rgba(255,255,255,0.4)', mr: 0.5, '&:hover': { color: 'white' } }}>
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
                disableUnderline: true
              }}
            />

            <Button
              fullWidth type="submit" variant="contained" disabled={loading}
              sx={{ 
                py: 1.8, 
                borderRadius: '12px', 
                fontSize: '1.05rem', 
                fontWeight: 700, 
                textTransform: 'none', 
                background: 'linear-gradient(135deg, #E6B93D 0%, #D4A017 50%, #B38600 100%)', 
                color: '#050510', 
                boxShadow: '0 8px 20px rgba(212, 160, 23, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  background: 'linear-gradient(135deg, #F5D366 0%, #E6B93D 50%, #C99600 100%)',
                  boxShadow: '0 12px 28px rgba(212, 160, 23, 0.4), inset 0 1px 0 rgba(255,255,255,0.4)',
                  transform: 'translateY(-2px)'
                }, 
                '&.Mui-disabled': { 
                  background: 'rgba(255,255,255,0.05)', 
                  color: 'rgba(255,255,255,0.3)',
                  boxShadow: 'none'
                } 
              }}
            >
              {loading ? <CircularProgress size={28} sx={{ color: '#050510' }} /> : 'Đăng nhập vào hệ thống'}
            </Button>
          </Box>

          <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '0.5px' }}>
              &copy; 2026 HORSE RACING TOURNAMENT MANAGEMENT. <br/> CHỈ DÀNH CHO QUẢN TRỊ VIÊN.
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
}
