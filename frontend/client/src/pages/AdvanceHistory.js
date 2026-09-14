import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Alert, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Card, CardContent, Chip
} from '@mui/material';
import { History, Search, FileDownload, PictureAsPdf } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { labourAPI } from '../services/api';
import api from '../services/api';

const AdvanceHistory = () => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total_given: 0, total_recovered: 0, total_outstanding: 0 });
  const [labourList, setLabourList] = useState([]);
  const [selectedLabour, setSelectedLabour] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistory();
    labourAPI.getAll().then(res => setLabourList(res.data.data));
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/all-history');
      setHistory(res.data.data);
      setStats(res.data.stats);
    } catch (err) {
      setError('History load failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterByLabour = async (labourId) => {
    setSelectedLabour(labourId);
    setLoading(true);
    try {
      if (labourId) {
        const res = await api.get(`/payments/history/${labourId}`);
        setHistory(res.data.data);
      } else {
        loadHistory();
      }
    } catch (err) {
      setError('Filter failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (history.length === 0) return;
    const exportData = history.map((h, idx) => ({
      'S.No': idx + 1,
      'Date': new Date(h.payment_date).toLocaleDateString('hi-IN'),
      'Labour': h.name,
      'Code': h.labour_code,
      'Category': h.category_name,
      'Amount': h.total_amount,
      'Recovered': h.advance_deducted || 0,
      'Net Paid': h.net_paid || h.total_amount,
      'Mode': h.payment_mode,
      'Receipt No': h.receipt_no,
      'Remarks': h.remarks || '-'
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Advance History');
    XLSX.writeFile(wb, `Advance_History_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    if (history.length === 0) return;
    const doc = new jsPDF('l'); // Landscape for more columns

    doc.setFontSize(16);
    doc.setTextColor(26, 35, 126);
    doc.text('LabourBhai - Advance Payment History', 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Generated: ${new Date().toLocaleString('hi-IN')}`, 14, 22);

    const tableData = history.map((h, idx) => [
      idx + 1,
      new Date(h.payment_date).toLocaleDateString('hi-IN'),
      h.name,
      h.labour_code,
      h.category_name,
      `Rs.${Number(h.total_amount).toLocaleString()}`,
      `Rs.${Number(h.advance_deducted || 0).toLocaleString()}`,
      h.payment_mode,
      h.receipt_no
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['#', 'Date', 'Labour', 'Code', 'Category', 'Amount', 'Recovered', 'Mode', 'Receipt']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [26, 35, 126], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`Advance_History_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 2, md: 3 }, borderRadius: 3 }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <History sx={{ fontSize: 30, color: '#1a376e', mr: 1 }} />
          <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
            Advance Payment History
          </Typography>
          <Button variant="contained" color="success" startIcon={<FileDownload />}
            onClick={handleExportExcel} disabled={history.length === 0}>
            Excel
          </Button>
          <Button variant="contained" color="error" startIcon={<PictureAsPdf />}
            onClick={handleExportPDF} disabled={history.length === 0}>
            PDF
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Typography variant="body2" color="primary">Total Advance Given</Typography>
                <Typography variant="h5" fontWeight="bold">
                  ₹{Number(stats.total_given || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#e8f5e9' }}>
              <CardContent>
                <Typography variant="body2" color="success.main">Total Recovered</Typography>
                <Typography variant="h5" fontWeight="bold">
                  ₹{Number(stats.total_recovered || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#ffebee' }}>
              <CardContent>
                <Typography variant="body2" color="error">Outstanding</Typography>
                <Typography variant="h5" fontWeight="bold">
                  ₹{Number(stats.total_outstanding || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter by Labour */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth select label="Filter by Labour"
              value={selectedLabour}
              onChange={(e) => handleFilterByLabour(e.target.value)}
            >
              <MenuItem value="">All Labour</MenuItem>
              {labourList.map(l => (
                <MenuItem key={l.id} value={l.id}>{l.name} ({l.labour_code})</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing <strong>{history.length}</strong> records
            </Typography>
          </Grid>
        </Grid>

        {/* History Table */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
        ) : history.length > 0 ? (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell>#</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Labour</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Recovered</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Receipt</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((h, idx) => (
                  <TableRow key={h.id} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{new Date(h.payment_date).toLocaleDateString('hi-IN')}</TableCell>
                    <TableCell>{h.name}</TableCell>
                    <TableCell>{h.labour_code}</TableCell>
                    <TableCell>{h.category_name}</TableCell>
                    <TableCell>₹{Number(h.total_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={`₹${Number(h.advance_deducted || 0).toLocaleString()}`}
                        size="small" color={h.advance_deducted > 0 ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>{h.payment_mode}</TableCell>
                    <TableCell>{h.receipt_no}</TableCell>
                    <TableCell>{h.remarks || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
            No advance history found
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default AdvanceHistory;