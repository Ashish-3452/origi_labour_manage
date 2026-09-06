import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Alert, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import { Restaurant, Save } from '@mui/icons-material';
import { siteAPI } from '../services/api';
import api from '../services/api';

const KhorakiManagement = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [labourList, setLabourList] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    siteAPI.getAll().then(res => setSites(res.data.data));
  }, []);

  const loadLabourList = async () => {
    if (!selectedSite || !selectedDate) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/khoraki/labour-list', {
        params: { site_id: selectedSite, date: selectedDate }
      });
      setLabourList(res.data.data);
      
      // Prefill amounts if already entered
      const prefill = {};
      res.data.data.forEach(l => {
        if (l.existing_amount) prefill[l.id] = l.existing_amount;
      });
      setAmounts(prefill);
    } catch (err) {
      setError('Labour list load failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (labourId, value) => {
    setAmounts(prev => ({ ...prev, [labourId]: value }));
  };

  const handleSaveAll = async () => {
    if (!selectedSite || !selectedDate) {
      setError('Site aur Date select karo');
      return;
    }

    const entries = labourList
      .filter(l => amounts[l.id] !== undefined && amounts[l.id] !== '')
      .map(l => ({
        labour_id: l.id,
        amount: amounts[l.id]
      }));

    if (entries.length === 0) {
      setError('Kisi labour ka amount enter karo');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/khoraki/batch-save', {
        site_id: selectedSite,
        date: selectedDate,
        entries
      });
      setSuccess(res.data.message);
      loadLabourList(); // Refresh
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Restaurant sx={{ fontSize: 30, color: '#1976d2', mr: 1 }} />
          <Typography variant="h5" fontWeight="bold">Khoraki Entry (Batch)</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Site & Date Selection */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth select label="Select Site" required
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
            >
              <MenuItem value="">Select Site</MenuItem>
              {sites.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.site_name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth type="date" label="Date" required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              fullWidth variant="outlined" onClick={loadLabourList}
              disabled={!selectedSite || loading} sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : '🔍 Load Labour'}
            </Button>
          </Grid>
        </Grid>

        {/* Labour List with Khoraki Entry */}
        {labourList.length > 0 && (
          <>
            <TableContainer sx={{ overflowX: 'auto', mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>#</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Khoraki Amount (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {labourList.map((lab, index) => (
                    <TableRow key={lab.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{lab.labour_code}</TableCell>
                      <TableCell>{lab.name}</TableCell>
                      <TableCell>{lab.category_name}</TableCell>
                      <TableCell>
                        <TextField
                          size="small" type="number"
                          value={amounts[lab.id] || ''}
                          onChange={(e) => handleAmountChange(lab.id, e.target.value)}
                          placeholder="1000"
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Button
              variant="contained" fullWidth size="large"
              startIcon={<Save />} onClick={handleSaveAll}
              disabled={saving} sx={{ py: 1.5, borderRadius: 2 }}
            >
              {saving ? <CircularProgress size={24} color="inherit" /> : '💾 Save All Khoraki'}
            </Button>
          </>
        )}

        {labourList.length === 0 && selectedSite && !loading && (
          <Typography align="center" color="text.secondary">
            No active labour found for this site
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default KhorakiManagement;