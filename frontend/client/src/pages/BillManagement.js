import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Alert, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Card, CardContent,
  Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider
} from '@mui/material';
import { Receipt, Add, Visibility, Delete, Save, Payment } from '@mui/icons-material';
import { siteAPI } from '../services/api';
import { billAPI } from '../services/api';

const BillManagement = () => {
  const [sites, setSites] = useState([]);
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Filters
  const [filterSite, setFilterSite] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // Add bill dialog
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({
    site_id: '', bill_date: new Date().toISOString().split('T')[0],
    period_start: '', period_end: '',
    bill_amount: '', food_advance_deducted: 0,
    other_deductions: 0, remarks: ''
  });
  const [calcLoading, setCalcLoading] = useState(false);
  const [netPayable, setNetPayable] = useState(0);

  // Details dialog
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [payments, setPayments] = useState([]);

  // Add payment dialog
  const [openPayment, setOpenPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '', payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'BANK_TRANSFER', reference_no: '', remarks: ''
  });

  useEffect(() => {
    siteAPI.getAll().then(res => setSites(res.data.data));
  }, []);

  useEffect(() => {
    loadBills();
  }, [filterSite, filterStatus, filterMonth]);

  useEffect(() => {
    // Recalculate net payable when bill amount/deductions change
    const billAmt = Number(form.bill_amount) || 0;
    const foodDed = Number(form.food_advance_deducted) || 0;
    const otherDed = Number(form.other_deductions) || 0;
    setNetPayable(billAmt - foodDed - otherDed);
  }, [form.bill_amount, form.food_advance_deducted, form.other_deductions]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filterSite) filters.site_id = filterSite;
      if (filterStatus) filters.status = filterStatus;
      if (filterMonth) filters.month = filterMonth;
      const res = await billAPI.getAll(filters);
      setBills(res.data.data);
      setStats(res.data.stats);
    } catch (err) {
      setError('Load failed');
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate food advance when site + date range selected
  const handleCalculateDeduction = async () => {
    if (!form.site_id || !form.period_start || !form.period_end) {
      setError('Pehle site aur date range select karo');
      return;
    }
    setCalcLoading(true);
    try {
      const res = await billAPI.calculateDeduction(form.site_id, form.period_start, form.period_end);
      setForm({ ...form, food_advance_deducted: res.data.food_advance_deducted });
    } catch (err) {
      setError('Calculation failed');
    } finally {
      setCalcLoading(false);
    }
  };

  const handleAddBill = async () => {
    if (!form.site_id || !form.period_start || !form.period_end || !form.bill_amount) {
      setError('Required fields bharein');
      return;
    }
    try {
      const res = await billAPI.create(form);
      setSuccess(`Bill ${res.data.bill_no} created! Net Payable: ₹${res.data.net_payable.toLocaleString()}`);
      setOpenAdd(false);
      setForm({
        site_id: '', bill_date: new Date().toISOString().split('T')[0],
        period_start: '', period_end: '',
        bill_amount: '', food_advance_deducted: 0,
        other_deductions: 0, remarks: ''
      });
      loadBills();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    }
  };

  const handleViewDetails = async (bill) => {
    try {
      const res = await billAPI.getById(bill.id);
      setSelectedBill(res.data.data);
      setPayments(res.data.payments);
      setOpenDetails(true);
    } catch (err) {
      setError('Details load failed');
    }
  };

  const handleAddPayment = async () => {
    if (!paymentForm.amount || !paymentForm.payment_date) {
      setError('Amount aur date required');
      return;
    }
    try {
      const res = await billAPI.addPayment(selectedBill.id, paymentForm);
      setSuccess(`Payment recorded! New Balance: ₹${res.data.balance.toLocaleString()}`);
      setOpenPayment(false);
      setPaymentForm({
        amount: '', payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'BANK_TRANSFER', reference_no: '', remarks: ''
      });
      // Reload details
      handleViewDetails(selectedBill);
      loadBills();
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill? All payments will also be deleted.')) return;
    try {
      await billAPI.delete(id);
      setSuccess('Bill deleted!');
      loadBills();
    } catch (err) {
      setError('Delete failed');
    }
  };

  const getStatusChip = (status) => {
    if (status === 'PAID') return <Chip label="PAID" color="success" size="small" />;
    if (status === 'PARTIAL') return <Chip label="PARTIAL" color="warning" size="small" />;
    return <Chip label="PENDING" color="error" size="small" />;
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Receipt sx={{ fontSize: 30, color: '#1a237e', mr: 1 }} />
          <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
            Bill & Payment Management
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}>
            New Bill
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#e3f2fd' }}><CardContent>
              <Typography variant="caption">Total Bill</Typography>
              <Typography variant="h6" fontWeight="bold">₹{Number(stats.total_bill_amount || 0).toLocaleString()}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#fff3e0' }}><CardContent>
              <Typography variant="caption">Food Deducted</Typography>
              <Typography variant="h6" fontWeight="bold">₹{Number(stats.total_food_deducted || 0).toLocaleString()}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#e8f5e9' }}><CardContent>
              <Typography variant="caption">Received</Typography>
              <Typography variant="h6" fontWeight="bold">₹{Number(stats.total_received || 0).toLocaleString()}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#ffebee' }}><CardContent>
              <Typography variant="caption">Balance</Typography>
              <Typography variant="h6" fontWeight="bold" color="error">₹{Number(stats.total_balance || 0).toLocaleString()}</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth select size="small" label="Site" value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)}>
              <MenuItem value="">All Sites</MenuItem>
              {sites.map(s => <MenuItem key={s.id} value={s.id}>{s.site_name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth select size="small" label="Status" value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="PARTIAL">Partial</MenuItem>
              <MenuItem value="PAID">Paid</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth type="month" size="small" label="Month" value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>

        {/* Bills Table */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
        ) : bills.length > 0 ? (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: { xs: 800, sm: 'auto' } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell>Bill No</TableCell>
                  <TableCell>Site</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Bill Amt</TableCell>
                  <TableCell>Food Ded</TableCell>
                  <TableCell>Net Payable</TableCell>
                  <TableCell>Received</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bills.map(b => (
                  <TableRow key={b.id} hover>
                    <TableCell>{b.bill_no}</TableCell>
                    <TableCell>{b.site_name}</TableCell>
                    <TableCell>
                      {new Date(b.period_start).toLocaleDateString('hi-IN')} - {new Date(b.period_end).toLocaleDateString('hi-IN')}
                    </TableCell>
                    <TableCell>₹{Number(b.bill_amount).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: 'warning.main' }}>₹{Number(b.food_advance_deducted).toLocaleString()}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>₹{Number(b.net_payable).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: 'success.main' }}>₹{Number(b.amount_received).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: b.balance > 0 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                      ₹{Number(b.balance).toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusChip(b.status)}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary" onClick={() => handleViewDetails(b)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                      {b.status === 'PAID' && (
                        <IconButton size="small" color="error" onClick={() => handleDelete(b.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
            No bills found
          </Typography>
        )}
      </Paper>

      {/* Add Bill Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Bill</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Site *" value={form.site_id}
                onChange={(e) => setForm({ ...form, site_id: e.target.value })}>
                <MenuItem value="">Select Site</MenuItem>
                {sites.map(s => <MenuItem key={s.id} value={s.id}>{s.site_name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Bill Date" value={form.bill_date}
                onChange={(e) => setForm({ ...form, bill_date: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Period Start *" value={form.period_start}
                onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Period End *" value={form.period_end}
                onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" fullWidth onClick={handleCalculateDeduction} disabled={calcLoading}>
                {calcLoading ? <CircularProgress size={20} /> : '🔄 Auto-Calculate Food Advance'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Bill Amount (₹) *" value={form.bill_amount}
                onChange={(e) => setForm({ ...form, bill_amount: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Food Advance Deducted" 
                value={form.food_advance_deducted}
                onChange={(e) => setForm({ ...form, food_advance_deducted: e.target.value })}
                InputProps={{ sx: { bgcolor: '#fff3e0' } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Other Deductions" value={form.other_deductions}
                onChange={(e) => setForm({ ...form, other_deductions: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Net Payable (Auto)" value={`₹${netPayable.toLocaleString()}`}
                InputProps={{ readOnly: true, sx: { bgcolor: '#e8f5e9', fontWeight: 'bold' } }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Remarks" multiline rows={2} value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddBill} startIcon={<Save />}>Save Bill</Button>
        </DialogActions>
      </Dialog>

      {/* Bill Details Dialog */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Bill Details
          <IconButton onClick={() => setOpenDetails(false)} sx={{ float: 'right' }}>✕</IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedBill && (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Bill No</Typography><Typography fontWeight="bold">{selectedBill.bill_no}</Typography></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Site</Typography><Typography>{selectedBill.site_name}</Typography></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Period</Typography><Typography>{new Date(selectedBill.period_start).toLocaleDateString('hi-IN')} - {new Date(selectedBill.period_end).toLocaleDateString('hi-IN')}</Typography></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Status</Typography><div>{getStatusChip(selectedBill.status)}</div></Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}><Typography variant="caption">Bill Amount</Typography><Typography variant="h6">₹{Number(selectedBill.bill_amount).toLocaleString()}</Typography></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption">Food Advance Deducted</Typography><Typography variant="h6" color="warning.main">-₹{Number(selectedBill.food_advance_deducted).toLocaleString()}</Typography></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption">Other Deductions</Typography><Typography variant="h6" color="warning.main">-₹{Number(selectedBill.other_deductions).toLocaleString()}</Typography></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption">Net Payable</Typography><Typography variant="h6" color="primary" fontWeight="bold">₹{Number(selectedBill.net_payable).toLocaleString()}</Typography></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption">Received</Typography><Typography variant="h6" color="success.main">₹{Number(selectedBill.amount_received).toLocaleString()}</Typography></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption">Balance</Typography><Typography variant="h6" color={selectedBill.balance > 0 ? 'error.main' : 'success.main'} fontWeight="bold">₹{Number(selectedBill.balance).toLocaleString()}</Typography></Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">💳 Payment History</Typography>
                {selectedBill.balance > 0 && (
                  <Button variant="contained" color="success" startIcon={<Payment />}
                    onClick={() => { setPaymentForm({ ...paymentForm, amount: selectedBill.balance }); setOpenPayment(true); }}>
                    Add Payment
                  </Button>
                )}
              </Box>
              {payments.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Mode</TableCell>
                        <TableCell>Reference</TableCell>
                        <TableCell>By</TableCell>
                        <TableCell>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map(p => (
                        <TableRow key={p.id}>
                          <TableCell>{new Date(p.payment_date).toLocaleDateString('hi-IN')}</TableCell>
                          <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>₹{Number(p.amount).toLocaleString()}</TableCell>
                          <TableCell>{p.payment_mode}</TableCell>
                          <TableCell>{p.reference_no || '-'}</TableCell>
                          <TableCell>{p.created_by_name || '-'}</TableCell>
                          <TableCell>{p.remarks || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" align="center" sx={{ py: 2 }}>No payments yet</Typography>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={openPayment} onClose={() => setOpenPayment(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth type="number" label="Amount (₹) *" value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="date" label="Payment Date *" value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Mode" value={paymentForm.payment_mode}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}>
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                <MenuItem value="CHEQUE">Cheque</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Reference No" value={paymentForm.reference_no}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference_no: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Remarks" value={paymentForm.remarks}
                onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPayment(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleAddPayment}>Save Payment</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillManagement;