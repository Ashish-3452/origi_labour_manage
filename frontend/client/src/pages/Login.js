import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, Engineering } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ mobile: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.mobile || !formData.password) {
      setError('Please fill all fields');
      return;
    }

    if (formData.mobile.length !== 10) {
      setError('Mobile number must be 10 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 🔥 REAL API CALL - Backend se connect
      const response = await authAPI.login(formData.mobile, formData.password);
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Token aur user data localStorage me save karo
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Dashboard pe le jao
        navigate('/dashboard');
      }
    } catch (err) {
      // Agar error aaye to message dikhao
      const errorMsg = err.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMsg);
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
      background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #01579b 100%)',
      padding: 2
    }}>
      <Card sx={{ maxWidth: 420, width: '90%', mx: 'auto', borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <CardContent sx={{ padding: 4 }}>
          
          {/* Logo & Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 15px', boxShadow: '0 8px 25px rgba(102,126,234,0.4)'
            }}>
              <Engineering sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h5" fontWeight="bold" color="#1a237e">
              Labour Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Ashish Contractor System
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Mobile Number"
              name="mobile"
              type="tel"
              value={formData.mobile}
              onChange={handleChange}
              margin="normal"
              required
              inputProps={{ maxLength: 10 }}
              placeholder="Enter 10 digit mobile number"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              placeholder="Enter your password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3, mb: 2, py: 1.5, borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '1rem', fontWeight: 'bold',
                '&:hover': { boxShadow: '0 8px 25px rgba(102,126,234,0.5)' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '🔐 Login'}
            </Button>
          </form>

          {/* Demo Credentials */}
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              🧪 Demo Credentials
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="#1a237e">
              📱 9876543210 | 🔑 admin123
            </Typography>
          </Box>

        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;