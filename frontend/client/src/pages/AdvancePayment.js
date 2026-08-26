import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Alert, CircularProgress, Card, CardContent
} from '@mui/material';
import { Payment } from '@mui/icons-material';
import { labourAPI } from '../services/api';
import api from '../services/api';

const AdvancePayment = () => {
  const [labour, setLabour] = useState([]);
  const [formData, setFormData] = useState({
    labour_id: '', amount: '', payment_mode: 'CASH',
    payment_date: new Date().toISOString().split('T')[0], remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadLabour();
  }, []);

  const loadLabour = async () => {
    try {
      const res = await labourAPI.getAll();
      setLabour(res.data.data);
    } catch (err) {
      setError('Failed to load labour');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.labour_id || !formData.amount) {
      setError('Please select labour and enter amount');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/payments/advance', {
        labour_id: formData.labour_id,
        amount: parseFloat(formData.amount),
        payment_mode: formData.payment_mode,
        payment_date: formData.payment_date,
        remarks: formData.remarks
      });

      if (res.data.success) {
        setSuccess(`Advance of ₹${formData.amount} given! Receipt: ${res.data.data.receipt_no}`);
        setFormData({ ...formData, labour_id: '', amount: '', remarks: '' });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 600, mx: 'auto', p: 3, borderRadius: 3 }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Payment sx={{ fontSize: 30, color: '#1976d2', mr: 1 }} />
          <Typography variant="h5" fontWeight="bold">Give Advance</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth select label="Select Labour" value={formData.labour_id}
                onChange={(e) => setFormData({...formData, labour_id: e.target.value})} required>
                <MenuItem value="">Select Labour</MenuItem>
                {labour.map(l => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.name} ({l.labour_code}) - Advance: ₹{l.total_advance_taken || 0}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Amount (₹)" type="number" required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Payment Mode" value={formData.payment_mode}
                onChange={(e) => setFormData({...formData, payment_mode: e.target.value})}>
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Remarks" value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                placeholder="Reason for advance..." />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" fullWidth size="large"
                disabled={loading} sx={{ py: 1.5, borderRadius: 2 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : '💰 Give Advance'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default AdvancePayment;