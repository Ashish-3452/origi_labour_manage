import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Alert, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Card, CardContent
} from '@mui/material';
import { Add, TrendingDown } from '@mui/icons-material';
import api from '../services/api';

const EXPENSE_CATEGORIES = [
  'Transportation', 'Food/Khoraki', 'Tools & Equipment',
  'Mobile Recharge', 'Fuel/Petrol', 'Medical', 'Office Rent',
  'Chai-Pani', 'Documentation', 'Other'
];

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ BUSINESS: 0, PERSONAL: 0 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7));

  const [formData, setFormData] = useState({
    category_name: '', amount: '', expense_date: new Date().toISOString().split('T')[0],
    expense_type: 'BUSINESS', paid_to: '', payment_mode: 'CASH', remarks: ''
  });

  useEffect(() => { loadData(); }, [month]);

  const loadData = async () => {
    try {
      const [expRes, sumRes] = await Promise.all([
        api.get('/expenses/list', { params: { month } }),
        api.get('/expenses/summary', { params: { month } })
      ]);
      setExpenses(expRes.data.data);
      setSummary(sumRes.data.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/expenses/add', formData);
      setSuccess('Expense added!');
      setFormData({ ...formData, category_name: '', amount: '', paid_to: '', remarks: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
    setLoading(false);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>💸 Expense Management</Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#ffebee' }}>
            <CardContent>
              <Typography color="error">Business Expenses</Typography>
              <Typography variant="h5">₹{summary.BUSINESS?.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography color="primary">Personal Expenses</Typography>
              <Typography variant="h5">₹{summary.PERSONAL?.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Typography color="warning.main">Total Expenses</Typography>
              <Typography variant="h5">₹{totalExpenses.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Add Expense Form */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" mb={2}><Add sx={{ mr: 1 }} />Add Expense</Typography>
            <form onSubmit={handleSubmit}>
              <TextField fullWidth select label="Category" sx={{ mb: 2 }} required
                value={formData.category_name} onChange={(e) => setFormData({...formData, category_name: e.target.value})}>
                {EXPENSE_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Amount (₹)" type="number" sx={{ mb: 2 }} required
                value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              <TextField fullWidth label="Paid To" sx={{ mb: 2 }}
                value={formData.paid_to} onChange={(e) => setFormData({...formData, paid_to: e.target.value})} />
              <TextField fullWidth select label="Type" sx={{ mb: 2 }}
                value={formData.expense_type} onChange={(e) => setFormData({...formData, expense_type: e.target.value})}>
                <MenuItem value="BUSINESS">Business</MenuItem>
                <MenuItem value="PERSONAL">Personal</MenuItem>
              </TextField>
              <TextField fullWidth type="date" label="Date" sx={{ mb: 2 }}
                value={formData.expense_date} onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                InputLabelProps={{ shrink: true }} />
              <Button type="submit" variant="contained" fullWidth disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Add Expense'}
              </Button>
            </form>
          </Paper>
        </Grid>

        {/* Expenses List */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">📋 Expense List</Typography>
              <TextField type="month" size="small" value={month}
                onChange={(e) => setMonth(e.target.value)} />
            </Box>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Paid To</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses.map(e => (
                    <TableRow key={e.id}>
                      <TableCell>{new Date(e.expense_date).toLocaleDateString('hi-IN')}</TableCell>
                      <TableCell>{e.category_name}</TableCell>
                      <TableCell>₹{Number(e.amount).toLocaleString()}</TableCell>
                      <TableCell>{e.expense_type}</TableCell>
                      <TableCell>{e.paid_to || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExpenseManagement;