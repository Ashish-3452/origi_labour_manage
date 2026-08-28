import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Alert, IconButton
} from '@mui/material';
import { Add, Business, Edit, Delete } from '@mui/icons-material';
import { siteAPI } from '../services/api';

const SiteManagement = () => {
  const [sites, setSites] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    site_name: '', site_code: '', location: '', company_name: '', company_contact: ''
  });

  useEffect(() => { loadSites(); }, []);

  const loadSites = async () => {
    try {
      const res = await siteAPI.getAll();
      setSites(res.data.data);
    } catch (err) {
      setError('Failed to load sites');
    }
  };

  const handleAdd = async () => {
    try {
      await siteAPI.create(form);
      setSuccess('Site created!');
      setOpenAdd(false);
      resetForm();
      loadSites();
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating site');
    }
  };

  const handleEditOpen = (site) => {
    setSelectedSite(site);
    setForm({
      site_name: site.site_name,
      site_code: site.site_code || '',
      location: site.location || '',
      company_name: site.company_name || '',
      company_contact: site.company_contact || ''
    });
    setOpenEdit(true);
  };

  const handleEditSave = async () => {
    try {
      await siteAPI.update(selectedSite.id, form);
      setSuccess('Site updated!');
      setOpenEdit(false);
      loadSites();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      try {
        await siteAPI.delete(id);
        setSuccess('Site deleted!');
        loadSites();
      } catch (err) {
        setError(err.response?.data?.error || 'Delete failed');
      }
    }
  };

  const resetForm = () => {
    setForm({ site_name: '', site_code: '', location: '', company_name: '', company_contact: '' });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
            Site Management
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}>
            Add Site
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>Site Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Actions</TableCell>
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
                    <IconButton color="primary" onClick={() => handleEditOpen(s)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(s.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {sites.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No sites found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Site</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Site Name" value={form.site_name}
                onChange={(e) => setForm({...form, site_name: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Code (optional)" value={form.site_code}
                onChange={(e) => setForm({...form, site_code: e.target.value})}
                placeholder="Auto" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Location" value={form.location}
                onChange={(e) => setForm({...form, location: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Company Name" value={form.company_name}
                onChange={(e) => setForm({...form, company_name: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Contact" value={form.company_contact}
                onChange={(e) => setForm({...form, company_contact: e.target.value})} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Site</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Site Name" value={form.site_name}
                onChange={(e) => setForm({...form, site_name: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Code" value={form.site_code}
                onChange={(e) => setForm({...form, site_code: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Location" value={form.location}
                onChange={(e) => setForm({...form, location: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Company Name" value={form.company_name}
                onChange={(e) => setForm({...form, company_name: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Contact" value={form.company_contact}
                onChange={(e) => setForm({...form, company_contact: e.target.value})} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SiteManagement;