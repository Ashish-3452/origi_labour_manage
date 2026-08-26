import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Grid, MenuItem, Alert, CircularProgress, Paper
} from '@mui/material';
import { PersonAdd, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { labourAPI, categoryAPI, siteAPI } from '../services/api';

const LabourRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [sites, setSites] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    aadhar_no: '',
    address: '',
    category_id: '',
    site_id: '',
    emergency_contact: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, siteRes] = await Promise.all([
        categoryAPI.getAll(),
        siteAPI.getAll()
      ]);
      setCategories(catRes.data.data);
      setSites(siteRes.data.data);
    } catch (err) {
      setError('Failed to load categories or sites');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category_id || !formData.site_id) {
      setError('Please fill Name, Category and Site');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await labourAPI.register(formData);
      
      if (response.data.success) {
        setSuccess(`Labour registered successfully! Code: ${response.data.data.labour_code}`);
        setFormData({
          name: '', mobile: '', aadhar_no: '', address: '',
          category_id: '', site_id: '', emergency_contact: '',
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 800, mx: 'auto', p: 3, borderRadius: 3 }}>
        
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            Back
          </Button>
          <PersonAdd sx={{ fontSize: 30, color: '#1976d2', mr: 1 }} />
          <Typography variant="h5" fontWeight="bold">
            Labour Registration
          </Typography>
        </Box>

        {/* Alerts */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Full Name *" name="name"
                value={formData.name} onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Mobile Number" name="mobile"
                value={formData.mobile} onChange={handleChange}
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Aadhar Number" name="aadhar_no"
                value={formData.aadhar_no} onChange={handleChange}
                inputProps={{ maxLength: 12 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Emergency Contact" name="emergency_contact"
                value={formData.emergency_contact} onChange={handleChange}
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth select label="Category *" name="category_id"
                value={formData.category_id} onChange={handleChange}
                required
              >
                <MenuItem value="">Select Category</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.category_name} (₹{cat.our_rate_8hr}/8hr)
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth select label="Site *" name="site_id"
                value={formData.site_id} onChange={handleChange}
                required
              >
                <MenuItem value="">Select Site</MenuItem>
                {sites.map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.site_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Address" name="address"
                value={formData.address} onChange={handleChange}
                multiline rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit" variant="contained" size="large"
                disabled={loading} fullWidth
                sx={{ py: 1.5, borderRadius: 2, fontSize: '1rem' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Register Labour'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default LabourRegistration;