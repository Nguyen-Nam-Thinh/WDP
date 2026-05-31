import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff, AdminPanelSettings, Lock, Email } from '@mui/icons-material';
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
      background: 'linear-gradient(135deg, #030213 0%, #1a1a2e 50%, #16213e 100%)',
    }}>
      <Paper sx={{
        p: 5, width: '100%', maxWidth: 420, borderRadius: '16px',
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '16px', mx: 'auto', mb: 2,
            background: 'linear-gradient(135deg, #d4a017, #f5c842)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AdminPanelSettings sx={{ color: '#030213', fontSize: 36 }} />
          </Box>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, letterSpacing: '-0.5px' }}>
            Admin Portal
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
            HRTMS — Horse Racing Management
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '10px', bgcolor: 'rgba(211,47,47,0.15)', color: '#f87171', border: '1px solid rgba(211,47,47,0.3)', '& .MuiAlert-icon': { color: '#f87171' } }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2.5, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' }, '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&.Mui-focused fieldset': { borderColor: '#d4a017' } } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }} /></InputAdornment> }}
          />
          <TextField
            fullWidth label="Mật khẩu" type={showPassword ? 'text' : 'password'}
            value={password} onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' }, '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&.Mui-focused fieldset': { borderColor: '#d4a017' } } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }} /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: 'rgba(255,255,255,0.4)' }}>
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth type="submit" variant="contained" disabled={loading}
            sx={{ py: 1.5, borderRadius: '10px', fontSize: '1rem', fontWeight: 700, textTransform: 'none', background: 'linear-gradient(135deg, #d4a017, #f5c842)', color: '#030213', '&:hover': { background: 'linear-gradient(135deg, #b8860b, #d4a017)' }, '&.Mui-disabled': { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' } }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#030213' }} /> : 'Đăng nhập'}
          </Button>
        </Box>

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3, color: 'rgba(255,255,255,0.25)' }}>
          Chỉ dành cho quản trị viên hệ thống
        </Typography>
      </Paper>
    </Box>
  );
}
