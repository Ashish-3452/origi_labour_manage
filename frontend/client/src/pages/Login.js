import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, CircularProgress
} from '@mui/material';
import { Engineering, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=mobile, 2=otp
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (mobile.length !== 10) {
      setError('Valid 10-digit mobile number required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/otp/request', { mobile });
      if (res.data.success) {
        setStep(2);
        setSuccess('OTP sent to your mobile!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/otp/verify', { mobile, otp });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
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
              {step === 1 ? 'Login' : 'Enter OTP'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {step === 1 ? 'Labour Management System' : `Sent to ${mobile}`}
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {step === 1 && (
            <form onSubmit={handleRequestOtp}>
              <TextField
                fullWidth label="Mobile Number" type="tel"
                value={mobile} onChange={(e) => setMobile(e.target.value)}
                margin="normal" required
                inputProps={{ maxLength: 10 }}
                placeholder="Enter 10 digit mobile"
              />
              <Button type="submit" fullWidth variant="contained" size="large"
                disabled={loading} sx={{ mt: 3, py: 1.5, borderRadius: 2 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : '📱 Get OTP'}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <TextField
                fullWidth label="6-Digit OTP" type="number"
                value={otp} onChange={(e) => setOtp(e.target.value)}
                margin="normal" required
                inputProps={{ maxLength: 6 }}
                placeholder="Enter OTP"
              />
              <Button type="submit" fullWidth variant="contained" size="large"
                disabled={loading} sx={{ mt: 3, py: 1.5, borderRadius: 2 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : '✅ Verify & Login'}
              </Button>
              <Button fullWidth onClick={() => setStep(1)} sx={{ mt: 1 }}>
                <ArrowBack sx={{ mr: 1 }} /> Change Number
              </Button>
            </form>
          )}

        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;