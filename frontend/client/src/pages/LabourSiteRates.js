import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Alert, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import { Save, Business } from '@mui/icons-material';
import { siteAPI, categoryAPI } from '../services/api';
import api from '../services/api';

const LabourSiteRates = () => {
  const [sites, setSites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [rates, setRates] = useState([]);
  const [form, setForm] = useState({
    category_id: '',
    company_rate: '',
    company_ot: '',
    our_rate: '',
    our_ot: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [siteRes, catRes] = await Promise.all([
        siteAPI.getAll(),
        categoryAPI.getAll()
      ]);
      setSites(siteRes.data.data);
      setCategories(catRes.data.data);
    } catch (err) {
      setError('Data load failed');
    }
  };

  const loadRates = async (siteId) => {
    try {
      const res = await api.get(`/labour/site-category-rates/${siteId}`);
      setRates(res.data.data);
    } catch (err) {
      setRates([]);
    }
  };

  const handleSiteChange = (e) => {
    const siteId = e.target.value;
    setSelectedSite(siteId);
    if (siteId) loadRates(siteId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSite || !form.category_id || !form.company_rate || !form.our_rate) {
      setError('Site, Category, Company Rate aur Our Rate required');
      return;
    }

    setLoading(true);
    try {
      await api.post('/labour/site-category-rate', {
        site_id: selectedSite,
        category_id: form.category_id,
        company_rate: parseFloat(form.company_rate),
        company_ot: parseFloat(form.company_ot || 0),
        our_rate: parseFloat(form.our_rate),
        our_ot: parseFloat(form.our_ot || 0)
      });
      setSuccess('Site category rate saved!');
      setForm({ category_id: '', company_rate: '', company_ot: '', our_rate: '', our_ot: '' });
      loadRates(selectedSite);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
          Site-wise Category Rates
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth select label="Select Site" required
              value={selectedSite}
              onChange={handleSiteChange}
            >
              <MenuItem value="">Select Site</MenuItem>
              {sites.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.site_name}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {selectedSite && (
          <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth select label="Category" required
                  value={form.category_id}
                  onChange={(e) => setForm({...form, category_id: e.target.value})}
                >
                  <MenuItem value="">Select Category</MenuItem>
                  {categories.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.category_name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth type="number" label="Company Rate (8hr)" required
                  value={form.company_rate}
                  onChange={(e) => setForm({...form, company_rate: e.target.value})}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth type="number" label="Company OT/hr"
                  value={form.company_ot}
                  onChange={(e) => setForm({...form, company_ot: e.target.value})}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth type="number" label="Our Rate (8hr)" required
                  value={form.our_rate}
                  onChange={(e) => setForm({...form, our_rate: e.target.value})}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth type="number" label="Our OT/hr"
                  value={form.our_ot}
                  onChange={(e) => setForm({...form, our_ot: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" startIcon={<Save />} disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : 'Save Category Rate'}
                </Button>
              </Grid>
            </Grid>
          </form>
        )}

        {rates.length > 0 && (
          <>
            <Typography variant="h6" mt={4} mb={2}>📋 Existing Category Rates</Typography>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>Category</TableCell>
                    <TableCell>Company Rate</TableCell>
                    <TableCell>Company OT</TableCell>
                    <TableCell>Our Rate</TableCell>
                    <TableCell>Our OT</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rates.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.category_name}</TableCell>
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