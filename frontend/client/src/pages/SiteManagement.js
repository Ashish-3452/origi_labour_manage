import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Alert, Chip
} from '@mui/material';
import { Add, Business } from '@mui/icons-material';
import { siteAPI } from '../services/api';

const SiteManagement = () => {
  const [sites, setSites] = useState([]);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    site_name: '', site_code: '', location: '',
    company_name: '', company_contact: ''
  });

  useEffect(() => { loadSites(); }, []);

  const loadSites = async () => {
    const res = await siteAPI.getAll();
    setSites(res.data.data);
  };

  const handleCreate = async () => {
    try {
      await siteAPI.create(form);
      setSuccess('Site created!');
      setOpen(false);
      setForm({ site_name: '', site_code: '', location: '', company_name: '', company_contact: '' });
      loadSites();
    } catch (err) { console.error(err); }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 800, mx: 'auto', p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
            Site Management
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
            Add Site
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>Site Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sites.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.site_name}</TableCell>
                  <TableCell>{s.site_code}</TableCell>
                  <TableCell>{s.location || '-'}</TableCell>
                  <TableCell>{s.company_name || '-'}</TableCell>
                  <TableCell>
                    <Chip label="Active" color="success" size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Site</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={8}>
              <TextField fullWidth label="Site Name" value={form.site_name}
                onChange={(e) => setForm({...form, site_name: e.target.value})} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Code" value={form.site_code}
                onChange={(e) => setForm({...form, site_code: e.target.value})}
                placeholder="SITE001" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Location" value={form.location}
                onChange={(e) => setForm({...form, location: e.target.value})} />
            </Grid>
            <Grid item xs={8}>
              <TextField fullWidth label="Company Name" value={form.company_name}
                onChange={(e) => setForm({...form, company_name: e.target.value})} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Contact" value={form.company_contact}
                onChange={(e) => setForm({...form, company_contact: e.target.value})} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create Site</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SiteManagement;