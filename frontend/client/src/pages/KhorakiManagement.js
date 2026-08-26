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
  const [result, setResult] = useState(null);
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

  const handleCalculate = async () => {
    if (!selectedLabour || !weekStart || !weekEnd) {
      setError('Please select labour and week range');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/khoraki/process', {
        labour_id: selectedLabour, week_start: weekStart, week_end: weekEnd
      });
      setResult(res.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
    setLoading(false);
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const netPayable = result.total_khoraki - parseFloat(advanceDeduct || 0);
      const res = await api.post('/khoraki/pay', {
        labour_id: selectedLabour, week_start: weekStart, week_end: weekEnd,
        total_khoraki: result.total_khoraki,
        advance_deducted: parseFloat(advanceDeduct || 0),
        net_payable: netPayable
      });
      setSuccess(`Khoraki paid! Receipt: ${res.data.receipt_no}`);
      setResult(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 600, mx: 'auto', p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Restaurant sx={{ fontSize: 30, color: '#1976d2', mr: 1 }} />
          <Typography variant="h5" fontWeight="bold">Khoraki Management</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField fullWidth select label="Select Labour" value={selectedLabour}
              onChange={(e) => setSelectedLabour(e.target.value)}>
              <MenuItem value="">Select Labour</MenuItem>
              {labourList.map(l => (
                <MenuItem key={l.id} value={l.id}>{l.name} ({l.labour_code})</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth type="date" label="Week Start" value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth type="date" label="Week End" value={weekEnd}
              onChange={(e) => setWeekEnd(e.target.value)}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12}>
            <Button fullWidth variant="outlined" onClick={handleCalculate} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : '📊 Calculate Khoraki'}
            </Button>
          </Grid>
        </Grid>

        {result && (
          <Card sx={{ mt: 3, p: 2, bgcolor: '#f0f8ff' }}>
            <Typography variant="h6">Khoraki Details</Typography>
            <Typography>Total Hajri: <strong>{result.total_hajri}</strong></Typography>
            <Typography>Rate: <strong>₹{result.khoraki_rate}/hajri</strong></Typography>
            <Typography variant="h5" color="primary" mt={1}>
              Total: ₹{result.total_khoraki}
            </Typography>
            
            <TextField fullWidth label="Advance Deduction" type="number" sx={{ mt: 2 }}
              value={advanceDeduct} onChange={(e) => setAdvanceDeduct(e.target.value)} />
            
            <Typography variant="h6" mt={1} color="success.main">
              Net Payable: ₹{result.total_khoraki - parseFloat(advanceDeduct || 0)}
            </Typography>

            <Button fullWidth variant="contained" onClick={handlePay} disabled={loading} sx={{ mt: 2 }}>
              ✅ Pay Khoraki
            </Button>
          </Card>
        )}
      </Paper>
    </Box>
  );
};

export default KhorakiManagement;