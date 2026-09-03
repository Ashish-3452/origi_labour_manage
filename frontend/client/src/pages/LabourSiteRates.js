import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Alert, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { Save, Business } from '@mui/icons-material';
import { labourAPI, siteAPI } from '../services/api';
import { siteRateAPI } from '../services/api';

const LabourSiteRates = () => {
  const [labourList, setLabourList] = useState([]);
  const [sites, setSites] = useState([]);
  const [savedRates, setSavedRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    labour_id: '',
    site_id: '',
    company_rate: '',
    company_ot: '',
    our_rate: '',
    our_ot: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [labRes, siteRes] = await Promise.all([
        labourAPI.getAll(),
        siteAPI.getAll()
      ]);
      setLabourList(labRes.data.data);
      setSites(siteRes.data.data);
    } catch (err) {
      setError('Data load failed');
    }
  };

  const handleLabourChange = async (labourId) => {
    setForm({ ...form, labour_id: labourId });
    // Load existing rates for this labour
    if (labourId) {
      try {
        const res = await siteRateAPI.getByLabour(labourId);
        setSavedRates(res.data.data);
      } catch (err) {
        setSavedRates([]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.labour_id || !form.site_id || !form.company_rate || !form.our_rate) {
      setError('Labour, Site, Company Rate aur Our Rate required hain');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await siteRateAPI.save({
  labour_id: form.labour_id,
  site_id: form.site_id,
  company_rate: parseFloat(form.company_rate),
  company_ot: parseFloat(form.company_ot || 0),
  our_rate: parseFloat(form.our_rate),
  our_ot: parseFloat(form.our_ot || 0)
});

      setSuccess('Site rate saved successfully!');
      setForm({
        labour_id: form.labour_id,
        site_id: '',
        company_rate: '',
        company_ot: '',
        our_rate: '',
        our_ot: ''
      });
      
      // Reload rates
      handleLabourChange(form.labour_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 900, mx: 'auto', p: 4, borderRadius: 3 }}>
        
        <Typography variant="h5" fontWeight="bold" mb={3}>
          <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
          Site-wise Labour Rates
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth select label="Select Labour" required
                value={form.labour_id}
                onChange={(e) => handleLabourChange(e.target.value)}
              >
                <MenuItem value="">Select Labour</MenuItem>
                {labourList.map(l => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.name} ({l.labour_code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth select label="Select Site" required
                value={form.site_id}
                onChange={(e) => setForm({...form, site_id: e.target.value})}
              >
                <MenuItem value="">Select Site</MenuItem>
                {sites.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.site_name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth type="number" label="Company Rate (8hr)" required
                value={form.company_rate}
                onChange={(e) => setForm({...form, company_rate: e.target.value})}
                placeholder="500"
              />
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth type="number" label="Company OT Rate/hr"
                value={form.company_ot}
                onChange={(e) => setForm({...form, company_ot: e.target.value})}
                placeholder="62.5"
              />
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth type="number" label="Our Rate (8hr)" required
                value={form.our_rate}
                onChange={(e) => setForm({...form, our_rate: e.target.value})}
                placeholder="400"
              />
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth type="number" label="Our OT Rate/hr"
                value={form.our_ot}
                onChange={(e) => setForm({...form, our_ot: e.target.value})}
                placeholder="50"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit" variant="contained" fullWidth size="large"
                startIcon={<Save />} disabled={loading}
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Site Rate'}
              </Button>
            </Grid>
          </Grid>
        </form>

        {/* Existing Rates Table */}
        {savedRates.length > 0 && (
          <>
            <Typography variant="h6" mt={4} mb={2}>📋 Existing Site Rates</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>Site</TableCell>
                    <TableCell>Company Rate</TableCell>
                    <TableCell>Company OT</TableCell>
                    <TableCell>Our Rate</TableCell>
                    <TableCell>Our OT</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {savedRates.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.site_name}</TableCell>
                      <TableCell>₹{r.company_rate_8hr}</TableCell>
                      <TableCell>₹{r.company_ot_rate_hr}</TableCell>
                      <TableCell>₹{r.our_rate_8hr}</TableCell>
                      <TableCell>₹{r.our_ot_rate_hr}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default LabourSiteRates;