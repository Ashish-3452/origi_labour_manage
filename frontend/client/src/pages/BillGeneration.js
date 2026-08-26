import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { PictureAsPdf, Download } from '@mui/icons-material';
import { siteAPI } from '../services/api';
import api from '../services/api';

const BillGeneration = () => {
  const [sites, setSites] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [siteId, setSiteId] = useState('');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    siteAPI.getAll().then(res => setSites(res.data.data));
  }, []);

  const handlePreview = async () => {
    try {
      const res = await api.get('/profit/site-wise', { params: { month } });
      setPreview(siteId ? res.data.data.filter(s => s.site_name === sites.find(x => x.id == siteId)?.site_name) : res.data.data);
    } catch (err) { console.error(err); }
  };

  const handleDownload = () => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams({ month, token });
  if (siteId) params.append('site_id', siteId);
  window.open(`http://localhost:5000/api/bill/generate?${params.toString()}`, '_blank');
};

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 800, mx: 'auto', p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          <PictureAsPdf sx={{ mr: 1, verticalAlign: 'middle' }} />
          Bill Generation
        </Typography>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth type="month" label="Month" value={month}
              onChange={(e) => setMonth(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth select label="Site (Optional)" value={siteId}
              onChange={(e) => setSiteId(e.target.value)}>
              <MenuItem value="">All Sites</MenuItem>
              {sites.map(s => <MenuItem key={s.id} value={s.id}>{s.site_name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button fullWidth variant="outlined" onClick={handlePreview} sx={{ py: 1.5 }}>
              👁️ Preview
            </Button>
          </Grid>
        </Grid>

        {preview && (
          <>
            <TableContainer sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>Site</TableCell>
                    <TableCell>Labour</TableCell>
                    <TableCell>Hajri</TableCell>
                    <TableCell>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.map(p => (
                    <TableRow key={p.site_name}>
                      <TableCell>{p.site_name}</TableCell>
                      <TableCell>{p.labour_count}</TableCell>
                      <TableCell>{p.total_hajri}</TableCell>
                      <TableCell>₹{Number(p.company_bill).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                    <TableCell colSpan={3}><strong>Total</strong></TableCell>
                    <TableCell>
                      <strong>₹{preview.reduce((s, p) => s + Number(p.company_bill), 0).toLocaleString()}</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Button variant="contained" fullWidth size="large" startIcon={<Download />}
              onClick={handleDownload} sx={{ py: 1.5 }}>
              📥 Download Bill PDF
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default BillGeneration;