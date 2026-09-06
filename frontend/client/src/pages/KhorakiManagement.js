import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Alert, CircularProgress, Card, CardContent
} from '@mui/material';
import { Restaurant } from '@mui/icons-material';
import { labourAPI } from '../services/api';
import api from '../services/api';

const KhorakiManagement = () => {
  const [labourList, setLabourList] = useState([]);
  const [selectedLabour, setSelectedLabour] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const [amount, setAmount] = useState('');
  const [advanceDeduct, setAdvanceDeduct] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const res = await labourAPI.getAll();
      setLabourList(res.data.data);
    };
    load();
  }, []);

  const handlePay = async (e) => {
    e.preventDefault();
    
    if (!selectedLabour || !weekStart || !weekEnd || !amount) {
      setError('Labour, Week dates aur Amount required hain');
      return;
    }

    const netPayable = parseFloat(amount) - parseFloat(advanceDeduct || 0);

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/khoraki/pay', {
        labour_id: selectedLabour,
        week_start: weekStart,
        week_end: weekEnd,
        amount: parseFloat(amount),
        advance_deducted: parseFloat(advanceDeduct || 0)
      });

      setSuccess(`Khoraki paid! Receipt: ${res.data.receipt_no}`);
      setAmount('');
      setAdvanceDeduct(0);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 600, mx: 'auto', p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Restaurant sx={{ fontSize: 30, color: '#1976d2', mr: 1 }} />
          <Typography variant="h5" fontWeight="bold">Khoraki Payment</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <form onSubmit={handlePay}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth select label="Select Labour" required
                value={selectedLabour}
                onChange={(e) => setSelectedLabour(e.target.value)}
              >
                <MenuItem value="">Select Labour</MenuItem>
                {labourList.map(l => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.name} ({l.labour_code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth type="date" label="Week Start" required
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth type="date" label="Week End" required
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth type="number" label="Amount (₹)" required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth type="number" label="Advance Deduction (₹)"
                value={advanceDeduct}
                onChange={(e) => setAdvanceDeduct(e.target.value)}
                placeholder="0"
              />
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ bgcolor: '#f0f8ff', p: 1 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Net Payable</Typography>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    ₹{(parseFloat(amount || 0) - parseFloat(advanceDeduct || 0)).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit" variant="contained" fullWidth size="large"
                disabled={loading} sx={{ py: 1.5, borderRadius: 2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : '💰 Pay Khoraki'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default KhorakiManagement;