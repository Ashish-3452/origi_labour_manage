import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Grid, Alert, CircularProgress
} from '@mui/material';
import { PersonAdd, Block } from '@mui/icons-material';
import api, { authAPI } from '../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', mobile: '', email: '', password: '', role: 'ADMIN'
  });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.data);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      await authAPI.register(form);
      setSuccess('User created!');
      setOpen(false);
      setForm({ name: '', mobile: '', email: '', password: '', role: 'ADMIN' });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
    setLoading(false);
  };

  const handleToggle = async (userId) => {
    try {
      await api.put(`/auth/users/${userId}/toggle`);
      loadUsers();
    } catch (err) { console.error(err); }
  };

  const getRoleColor = (role) => {
    if (role === 'SUPER_ADMIN') return 'error';
    if (role === 'ADMIN') return 'primary';
    return 'warning';
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">👥 User Management</Typography>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setOpen(true)}>
            Add User
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>Name</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.mobile}</TableCell>
                  <TableCell>
                    <Chip label={u.role} color={getRoleColor(u.role)} size="small" />
                  </TableCell>
                  <TableCell>{u.last_login ? new Date(u.last_login).toLocaleDateString('hi-IN') : '-'}</TableCell>
                  <TableCell>
                    <Chip label={u.is_active ? 'Active' : 'Inactive'} 
                          color={u.is_active ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    {u.role !== 'SUPER_ADMIN' && (
                      <Button size="small" color="warning" startIcon={<Block />}
                        onClick={() => handleToggle(u.id)}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add User Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Name" value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Mobile" value={form.mobile}
                onChange={(e) => setForm({...form, mobile: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Email" value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Password" type="password" value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Role" value={form.role}
                onChange={(e) => setForm({...form, role: e.target.value})}>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;