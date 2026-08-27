import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress
} from '@mui/material';
import { Engineering } from '@mui/icons-material';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ mobile: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mobile || !formData.password) {
      setError('Mobile aur password dono bharein');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', {
        mobile: formData.mobile,
        password: formData.password
      });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #01579b 100%)',
      padding: 2
    }}>
      <Card sx={{ maxWidth: 420, width: '90%', borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <CardContent sx={{ padding: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 15px'
            }}>
              <Engineering sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h5" fontWeight="bold" color="#1a237e">
              LabourBhai Login
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Labour Management System
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Mobile Number" name="mobile" type="tel"
              value={formData.mobile} onChange={handleChange}
              margin="normal" required inputProps={{ maxLength: 10 }}
              placeholder="10 digit mobile"
            />
            <TextField
              fullWidth label="Password" name="password" type="password"
              value={formData.password} onChange={handleChange}
              margin="normal" required
            />
            <Button type="submit" fullWidth variant="contained" size="large"
              disabled={loading} sx={{ mt: 3, py: 1.5, borderRadius: 2 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : '🔐 Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;