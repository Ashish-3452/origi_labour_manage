import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Alert, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { SupervisorAccount, Add, Payment } from '@mui/icons-material';
import { siteAPI } from '../services/api';
import api from '../services/api';

const SupervisorManagement = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [addOpen, setAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', mobile: '', assigned_site_id: '', joining_date: '',
    in_hand_salary: 15000, khoraki_allowance: 3000, mobile_allowance: 500,
    travel_allowance: 1500, accommodation_allowance: 2000
  });

  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advanceData, setAdvanceData] = useState({ supervisor_id: '', amount: '', remarks: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [supRes, siteRes] = await Promise.all([
        api.get('/supervisors/list'),
        siteAPI.getAll()
      ]);
      setSupervisors(supRes.data.data);
      setSites(siteRes.data.data);
    } catch (err) { console.error(err); }
  };

  const handleAddSupervisor = async () => {
    setLoading(true);
    try {
      await api.post('/supervisors/create', formData);
      setSuccess('Supervisor added!');
      setAddOpen(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
    setLoading(false);
  };

  const handleAdvance = async () => {
    setLoading(true);
    try {
      await api.post('/supervisors/advance', advanceData);
      setSuccess('Advance given!');
      setAdvanceOpen(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
    setLoading(false);
  };

  const totalCost = (s) => {
  const salary = Number(s.in_hand_salary) || 0;
  const khoraki = Number(s.khoraki_allowance) || 0;
  const mobile = Number(s.mobile_allowance) || 0;
  const travel = Number(s.travel_allowance) || 0;
  const accommodation = Number(s.accommodation_allowance) || 0;
  return salary + khoraki + mobile + travel + accommodation;
};
  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">👨‍💼 Supervisor Management</Typography>
          <Box>
            <Button variant="contained" startIcon={<Add />} onClick={() => setAddOpen(true)} sx={{ mr: 1 }}>
              Add Supervisor
            </Button>
            <Button variant="outlined" startIcon={<Payment />} onClick={() => setAdvanceOpen(true)}>
              Give Advance
            </Button>
          </Box>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Mobile</strong></TableCell>
                <TableCell><strong>Site</strong></TableCell>
                <TableCell><strong>Salary</strong></TableCell>
                <TableCell><strong>Total Cost</strong></TableCell>
                <TableCell><strong>Advance</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {supervisors.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.mobile || '-'}</TableCell>
                  <TableCell>{s.site_name || '-'}</TableCell>
                  <TableCell>₹{s.in_hand_salary?.toLocaleString()}</TableCell>
                  <TableCell>₹{totalCost(s).toLocaleString()}</TableCell>
                  <TableCell>₹{(s.total_advance_taken - s.total_advance_recovered)?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={s.is_active ? 'Active' : 'Inactive'} 
                          color={s.is_active ? 'success' : 'error'} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Supervisor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="Name" value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Mobile" value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Site" value={formData.assigned_site_id}
                onChange={(e) => setFormData({...formData, assigned_site_id: e.target.value})}>
                {sites.map(s => <MenuItem key={s.id} value={s.id}>{s.site_name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="date" label="Joining Date" value={formData.joining_date}
                onChange={(e) => setFormData({...formData, joining_date: e.target.value})}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="In-Hand Salary" value={formData.in_hand_salary}
                onChange={(e) => setFormData({...formData, in_hand_salary: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Khoraki Allowance" value={formData.khoraki_allowance}
                onChange={(e) => setFormData({...formData, khoraki_allowance: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Mobile Allowance" value={formData.mobile_allowance}
                onChange={(e) => setFormData({...formData, mobile_allowance: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Travel Allowance" value={formData.travel_allowance}
                onChange={(e) => setFormData({...formData, travel_allowance: e.target.value})} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddSupervisor} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={advanceOpen} onClose={() => setAdvanceOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Give Advance to Supervisor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth select label="Supervisor" value={advanceData.supervisor_id}
                onChange={(e) => setAdvanceData({...advanceData, supervisor_id: e.target.value})}>
                {supervisors.filter(s => s.is_active).map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Amount" value={advanceData.amount}
                onChange={(e) => setAdvanceData({...advanceData, amount: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Remarks" value={advanceData.remarks}
                onChange={(e) => setAdvanceData({...advanceData, remarks: e.target.value})} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdvanceOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdvance} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Give'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupervisorManagement;