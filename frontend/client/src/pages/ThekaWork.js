import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Alert, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { Calculate, Save } from '@mui/icons-material';
import { siteAPI } from '../services/api';
import api from '../services/api';

const ThekaWork = () => {
  const [sites, setSites] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    work_description: '', site_id: '', work_date: new Date().toISOString().split('T')[0],
    work_type: 'THEKA', company_hajri: 3, company_rate: 500,
    labour_hajri_per_person: 2, labour_rate: 400, num_labours: 5
  });

  useEffect(() => {
    siteAPI.getAll().then(res => setSites(res.data.data));
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.get('/theka/list');
      setHistory(res.data.data);
    } catch (err) { console.error(err); }
  };

  const handleCalculate = async () => {
    try {
      const res = await api.post('/theka/calculate', {
        company_hajri: form.company_hajri,
        company_rate: form.company_rate,
        labour_hajri_per_person: form.labour_hajri_per_person,
        labour_rate: form.labour_rate,
        num_labours: form.num_labours
      });
      setResult(res.data.data);
    } catch (err) {
      setError('Calculation failed');
    }
  };

  const handleSave = async () => {
    try {
      await api.post('/theka/save', {
        ...form,
        company_total_bill: result.company_bill,
        total_labour_hajri: result.total_labour_hajri,
        labour_payment: result.labour_payment,
        profit: result.profit,
        profit_percentage: result.profit_percentage
      });
      setSuccess('Theka work saved!');
      loadHistory();
    } catch (err) {
      setError('Save failed');
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>🎯 Theka / Contract Work</Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Form */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" mb={2}>📝 Work Details</Typography>
            <TextField fullWidth label="Description" sx={{ mb: 2 }}
              value={form.work_description} onChange={(e) => setForm({...form, work_description: e.target.value})} />
            <TextField fullWidth select label="Site" sx={{ mb: 2 }}
              value={form.site_id} onChange={(e) => setForm({...form, site_id: e.target.value})}>
              {sites.map(s => <MenuItem key={s.id} value={s.id}>{s.site_name}</MenuItem>)}
            </TextField>
            <TextField fullWidth type="date" label="Date" sx={{ mb: 2 }}
              value={form.work_date} onChange={(e) => setForm({...form, work_date: e.target.value})}
              InputLabelProps={{ shrink: true }} />

            <Typography variant="subtitle1" fontWeight="bold" mt={2}>🏢 Company Side</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField label="Hajri" type="number" value={form.company_hajri}
                  onChange={(e) => setForm({...form, company_hajri: e.target.value})} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Rate/Hajri" type="number" value={form.company_rate}
                  onChange={(e) => setForm({...form, company_rate: e.target.value})} />
              </Grid>
            </Grid>

            <Typography variant="subtitle1" fontWeight="bold" mt={2}>👷 Labour Side</Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <TextField label="Hajri/Person" type="number" value={form.labour_hajri_per_person}
                  onChange={(e) => setForm({...form, labour_hajri_per_person: e.target.value})} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Rate" type="number" value={form.labour_rate}
                  onChange={(e) => setForm({...form, labour_rate: e.target.value})} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Labour" type="number" value={form.num_labours}
                  onChange={(e) => setForm({...form, num_labours: e.target.value})} />
              </Grid>
            </Grid>

            <Button variant="contained" fullWidth startIcon={<Calculate />} onClick={handleCalculate} sx={{ mt: 3, py: 1.5 }}>
              Calculate Profit
            </Button>
          </Paper>
        </Grid>

        {/* Result */}
        <Grid item xs={12} md={7}>
          {result && (
            <Card sx={{ mb: 3, bgcolor: result.is_profitable ? '#e8f5e9' : '#ffebee' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {result.is_profitable ? '🟢 PROFITABLE' : '🔴 LOSS'}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}><Typography>Company Bill</Typography><Typography variant="h6">₹{result.company_bill.toLocaleString()}</Typography></Grid>
                  <Grid item xs={6}><Typography>Labour Payment</Typography><Typography variant="h6">₹{result.labour_payment.toLocaleString()}</Typography></Grid>
                  <Grid item xs={6}><Typography>Total Labour Hajri</Typography><Typography variant="h6">{result.total_labour_hajri}</Typography></Grid>
                  <Grid item xs={6}>
                    <Typography>Profit</Typography>
                    <Typography variant="h5" color={result.is_profitable ? 'success.main' : 'error'}>
                      ₹{result.profit.toLocaleString()} ({result.profit_percentage}%)
                    </Typography>
                  </Grid>
                </Grid>
                <Button variant="contained" fullWidth startIcon={<Save />} onClick={handleSave} sx={{ mt: 2 }}>
                  Save Theka Work
                </Button>
              </CardContent>
            </Card>
          )}

          {/* History */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" mb={2}>📋 Theka History</Typography>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>Date</TableCell><TableCell>Site</TableCell><TableCell>Company</TableCell><TableCell>Labour</TableCell><TableCell>Profit</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {history.map(h => (
                    <TableRow key={h.id}>
                      <TableCell>{new Date(h.work_date).toLocaleDateString('hi-IN')}</TableCell>
                      <TableCell>{h.site_name}</TableCell>
                      <TableCell>₹{Number(h.company_total_bill).toLocaleString()}</TableCell>
                      <TableCell>₹{Number(h.total_labour_payment).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label={`₹${Number(h.profit_loss).toLocaleString()}`} 
                              color={h.is_profitable ? 'success' : 'error'} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ThekaWork;