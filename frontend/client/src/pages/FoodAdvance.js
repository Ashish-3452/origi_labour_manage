import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Alert, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Card, CardContent,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Restaurant, Add, Edit, Delete, Save } from '@mui/icons-material';
import { siteAPI } from '../services/api';
import { foodAdvanceAPI } from '../services/api';

const FoodAdvance = () => {
  const [sites, setSites] = useState([]);
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({ total_amount: 0, total_entries: 0 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Filters
  const [filterSite, setFilterSite] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  // Add dialog
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({
    site_id: '',
    week_start: '',
    week_end: '',
    amount: '',
    given_date: new Date().toISOString().split('T')[0],
    given_to: '',
    remarks: ''
  });

  // Edit dialog
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    siteAPI.getAll().then(res => setSites(res.data.data));
  }, []);

  useEffect(() => {
    loadEntries();
  }, [filterSite, filterMonth]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filterSite) filters.site_id = filterSite;
      if (filterMonth) filters.month = filterMonth;
      const res = await foodAdvanceAPI.getAll(filters);
      setEntries(res.data.data);
      setStats(res.data.stats);
    } catch (err) {
      setError('Load failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.site_id || !form.week_start || !form.week_end || !form.amount) {
      setError('Site, week dates, aur amount required');
      return;
    }
    try {
      await foodAdvanceAPI.create(form);
      setSuccess('Food advance saved!');
      setOpenAdd(false);
      setForm({
        site_id: '', week_start: '', week_end: '', amount: '',
        given_date: new Date().toISOString().split('T')[0], given_to: '', remarks: ''
      });
      loadEntries();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    }
  };

  const handleEditOpen = (entry) => {
    setEditId(entry.id);
    setForm({
      site_id: entry.site_id,
      week_start: entry.week_start?.split('T')[0] || '',
      week_end: entry.week_end?.split('T')[0] || '',
      amount: entry.amount,
      given_date: entry.given_date?.split('T')[0] || '',
      given_to: entry.given_to || '',
      remarks: entry.remarks || ''
    });
    setOpenEdit(true);
  };

  const handleEditSave = async () => {
    try {
      await foodAdvanceAPI.update(editId, form);
      setSuccess('Updated!');
      setOpenEdit(false);
      loadEntries();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await foodAdvanceAPI.delete(id);
      setSuccess('Deleted!');
      loadEntries();
    } catch (err) {
      setError('Delete failed');
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Restaurant sx={{ fontSize: 30, color: '#ff9800', mr: 1 }} />
          <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
            Food Advance Management
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}>
            Add Entry
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ bgcolor: '#fff3e0' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Total Food Advance</Typography>
                <Typography variant="h5" fontWeight="bold" color="#e65100">
                  ₹{Number(stats.total_amount || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card sx={{ bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Total Entries</Typography>
                <Typography variant="h5" fontWeight="bold" color="#1565c0">
                  {stats.total_entries || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={5}>
            <TextField fullWidth select label="Filter by Site" value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)} size="small">
              <MenuItem value="">All Sites</MenuItem>
              {sites.map(s => <MenuItem key={s.id} value={s.id}>{s.site_name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth type="month" label="Month" value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)} size="small"
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button fullWidth variant="outlined" onClick={() => { setFilterSite(''); setFilterMonth(''); }}>
              Clear Filters
            </Button>
          </Grid>
        </Grid>

        {/* Entries Table */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
        ) : entries.length > 0 ? (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: { xs: 700, sm: 'auto' } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell>#</TableCell>
                  <TableCell>Given Date</TableCell>
                  <TableCell>Site</TableCell>
                  <TableCell>Week Start</TableCell>
                  <TableCell>Week End</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Given To</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((e, idx) => (
                  <TableRow key={e.id} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{new Date(e.given_date).toLocaleDateString('hi-IN')}</TableCell>
                    <TableCell>{e.site_name}</TableCell>
                    <TableCell>{e.week_start ? new Date(e.week_start).toLocaleDateString('hi-IN') : '-'}</TableCell>
                    <TableCell>{e.week_end ? new Date(e.week_end).toLocaleDateString('hi-IN') : '-'}</TableCell>
                    <TableCell>₹{Number(e.amount).toLocaleString()}</TableCell>
                    <TableCell>{e.given_to || '-'}</TableCell>
                    <TableCell>{e.remarks || '-'}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="warning" onClick={() => handleEditOpen(e)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(e.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
            No food advance entries found
          </Typography>
        )}
      </Paper>

      {/* Add Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Food Advance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth select label="Site" value={form.site_id}
                onChange={(e) => setForm({ ...form, site_id: e.target.value })}>
                <MenuItem value="">Select Site</MenuItem>
                {sites.map(s => <MenuItem key={s.id} value={s.id}>{s.site_name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Week Start (Friday)" value={form.week_start}
                onChange={(e) => setForm({ ...form, week_start: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Week End (Sunday)" value={form.week_end}
                onChange={(e) => setForm({ ...form, week_end: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Amount (₹)" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Given Date" value={form.given_date}
                onChange={(e) => setForm({ ...form, given_date: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Given To" value={form.given_to}
                onChange={(e) => setForm({ ...form, given_to: e.target.value })}
                placeholder="Supervisor name" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Remarks" multiline rows={2} value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} startIcon={<Save />}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Food Advance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth select label="Site" value={form.site_id}
                onChange={(e) => setForm({ ...form, site_id: e.target.value })}>
                {sites.map(s => <MenuItem key={s.id} value={s.id}>{s.site_name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Week Start" value={form.week_start}
                onChange={(e) => setForm({ ...form, week_start: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Week End" value={form.week_end}
                onChange={(e) => setForm({ ...form, week_end: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Amount" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Given Date" value={form.given_date}
                onChange={(e) => setForm({ ...form, given_date: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Given To" value={form.given_to}
                onChange={(e) => setForm({ ...form, given_to: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Remarks" multiline rows={2} value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FoodAdvance;