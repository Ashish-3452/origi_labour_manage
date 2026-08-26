import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Alert, Chip
} from '@mui/material';
import { Add, Category } from '@mui/icons-material';
import { categoryAPI } from '../services/api';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    category_name: '', category_code: '', company_rate_8hr: 500,
    company_ot_rate_hr: 62.50, our_rate_8hr: 400, our_ot_rate_hr: 50, khoraki_rate: 250
  });

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    const res = await categoryAPI.getAll();
    setCategories(res.data.data);
  };

  const getCodeColor = (code) => {
    const colors = { MAN: '#1976d2', LAD: '#e91e63', MAS: '#ff9800', CAR: '#795548' };
    return colors[code] || '#666';
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 900, mx: 'auto', p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            <Category sx={{ mr: 1, verticalAlign: 'middle' }} />
            Labour Categories
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
            Add Category
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>Category</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Company Rate</TableCell>
                <TableCell>Our Rate</TableCell>
                <TableCell>Khoraki</TableCell>
                <TableCell>Profit/Day</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Chip label={c.category_name} sx={{ bgcolor: getCodeColor(c.category_code), color: 'white' }} />
                  </TableCell>
                  <TableCell>{c.category_code}</TableCell>
                  <TableCell>₹{c.company_rate_8hr}</TableCell>
                  <TableCell>₹{c.our_rate_8hr}</TableCell>
                  <TableCell>₹{c.khoraki_rate}</TableCell>
                  <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                    ₹{c.company_rate_8hr - c.our_rate_8hr}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Category</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={8}>
              <TextField fullWidth label="Category Name" value={form.category_name}
                onChange={(e) => setForm({...form, category_name: e.target.value})} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Code" value={form.category_code}
                onChange={(e) => setForm({...form, category_code: e.target.value})} placeholder="MAN" />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Company Rate (8hr)" value={form.company_rate_8hr}
                onChange={(e) => setForm({...form, company_rate_8hr: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Our Rate (8hr)" value={form.our_rate_8hr}
                onChange={(e) => setForm({...form, our_rate_8hr: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Company OT Rate/hr" value={form.company_ot_rate_hr}
                onChange={(e) => setForm({...form, company_ot_rate_hr: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Our OT Rate/hr" value={form.our_ot_rate_hr}
                onChange={(e) => setForm({...form, our_ot_rate_hr: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Khoraki Rate" value={form.khoraki_rate}
                onChange={(e) => setForm({...form, khoraki_rate: e.target.value})} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryManagement;