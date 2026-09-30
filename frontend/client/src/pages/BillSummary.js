import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, Button, Alert,
  CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Card, CardContent, Chip, Tabs, Tab
} from '@mui/material';
import { Assessment, FileDownload, PictureAsPdf, Warning } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { billAPI } from '../services/api';

const BillSummary = () => {
  const [tab, setTab] = useState(0);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [siteData, setSiteData] = useState([]);
  const [totals, setTotals] = useState({});
  const [agingData, setAgingData] = useState([]);
  const [buckets, setBuckets] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [month]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [siteRes, agingRes] = await Promise.all([
        billAPI.getSiteSummary(month),
        billAPI.getAgingReport()
      ]);
      setSiteData(siteRes.data.data);
      setTotals(siteRes.data.totals);
      setAgingData(agingRes.data.data);
      setBuckets(agingRes.data.buckets);
    } catch (err) {
      setError('Load failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (tab === 0) {
      const exportData = siteData.map(s => ({
        'Site': s.site_name,
        'Total Bills': s.total_bills,
        'Bill Amount': s.total_bill_amount,
        'Food Deducted': s.total_food_deducted,
        'Other Deductions': s.total_other_deductions,
        'Net Payable': s.total_net_payable,
        'Received': s.total_received,
        'Balance': s.total_balance,
        'Pending Bills': s.pending_count,
        'Paid Bills': s.paid_count
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Site Summary');
      XLSX.writeFile(wb, `Bill_Summary_${month}.xlsx`);
    } else {
      const exportData = agingData.map(a => ({
        'Bill No': a.bill_no,
        'Site': a.site_name,
        'Bill Date': new Date(a.bill_date).toLocaleDateString('hi-IN'),
        'Net Payable': a.net_payable,
        'Received': a.amount_received,
        'Balance': a.balance,
        'Days Pending': a.days_pending,
        'Aging': a.aging_bucket
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Aging Report');
      XLSX.writeFile(wb, `Bill_Aging_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l');
    doc.setFontSize(16);
    doc.setTextColor(26, 35, 126);
    doc.text(`Bill Summary Report - ${month}`, 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Generated: ${new Date().toLocaleString('hi-IN')}`, 14, 22);

    if (tab === 0) {
      const tableData = siteData.map(s => [
        s.site_name,
        s.total_bills,
        `Rs.${Number(s.total_bill_amount).toLocaleString()}`,
        `Rs.${Number(s.total_food_deducted).toLocaleString()}`,
        `Rs.${Number(s.total_net_payable).toLocaleString()}`,
        `Rs.${Number(s.total_received).toLocaleString()}`,
        `Rs.${Number(s.total_balance).toLocaleString()}`
      ]);
      autoTable(doc, {
        startY: 28,
        head: [['Site', 'Bills', 'Bill Amt', 'Food Ded', 'Net Payable', 'Received', 'Balance']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [26, 35, 126], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 }
      });
    } else {
      const tableData = agingData.map(a => [
        a.bill_no,
        a.site_name,
        new Date(a.bill_date).toLocaleDateString('hi-IN'),
        `Rs.${Number(a.balance).toLocaleString()}`,
        a.days_pending,
        a.aging_bucket
      ]);
      autoTable(doc, {
        startY: 28,
        head: [['Bill No', 'Site', 'Bill Date', 'Balance', 'Days', 'Aging']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [26, 35, 126], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 }
      });
    }

    doc.save(`Bill_Summary_${tab === 0 ? month : new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Assessment sx={{ fontSize: 30, color: '#1a237e', mr: 1 }} />
          <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
            Bill Summary Report
          </Typography>
          <Button variant="contained" color="success" startIcon={<FileDownload />} onClick={handleExportExcel}>
            Excel
          </Button>
          <Button variant="contained" color="error" startIcon={<PictureAsPdf />} onClick={handleExportPDF}>
            PDF
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="🏢 Site-wise Summary" />
          <Tab label="⚠️ Aging Report" />
        </Tabs>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
        ) : tab === 0 ? (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: '#e3f2fd' }}><CardContent>
                  <Typography variant="caption">Total Bill Amount</Typography>
                  <Typography variant="h6" fontWeight="bold">₹{Number(totals.total_bill_amount || 0).toLocaleString()}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: '#fff3e0' }}><CardContent>
                  <Typography variant="caption">Food Deducted</Typography>
                  <Typography variant="h6" fontWeight="bold">₹{Number(totals.total_food_deducted || 0).toLocaleString()}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: '#e8f5e9' }}><CardContent>
                  <Typography variant="caption">Total Received</Typography>
                  <Typography variant="h6" fontWeight="bold">₹{Number(totals.total_received || 0).toLocaleString()}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: '#ffebee' }}><CardContent>
                  <Typography variant="caption">Total Balance</Typography>
                  <Typography variant="h6" fontWeight="bold" color="error">₹{Number(totals.total_balance || 0).toLocaleString()}</Typography>
                </CardContent></Card>
              </Grid>
            </Grid>

            <Box sx={{ mb: 2 }}>
              <TextField type="month" size="small" label="Filter by Month" value={month}
                onChange={(e) => setMonth(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Box>

            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: { xs: 700, sm: 'auto' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>Site</TableCell>
                    <TableCell>Bills</TableCell>
                    <TableCell>Bill Amt</TableCell>
                    <TableCell>Food Ded</TableCell>
                    <TableCell>Net Payable</TableCell>
                    <TableCell>Received</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {siteData.map(s => (
                    <TableRow key={s.id} hover>
                      <TableCell><strong>{s.site_name}</strong></TableCell>
                      <TableCell>{s.total_bills}</TableCell>
                      <TableCell>₹{Number(s.total_bill_amount).toLocaleString()}</TableCell>
                      <TableCell sx={{ color: 'warning.main' }}>₹{Number(s.total_food_deducted).toLocaleString()}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>₹{Number(s.total_net_payable).toLocaleString()}</TableCell>
                      <TableCell sx={{ color: 'success.main' }}>₹{Number(s.total_received).toLocaleString()}</TableCell>
                      <TableCell sx={{ color: s.total_balance > 0 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                        ₹{Number(s.total_balance).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {s.pending_count > 0 && <Chip label={`${s.pending_count} Pending`} color="error" size="small" sx={{ mr: 0.5 }} />}
                        {s.partial_count > 0 && <Chip label={`${s.partial_count} Partial`} color="warning" size="small" sx={{ mr: 0.5 }} />}
                        {s.paid_count > 0 && <Chip label={`${s.paid_count} Paid`} color="success" size="small" />}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                    <TableCell><strong>TOTAL</strong></TableCell>
                    <TableCell><strong>{totals.total_bills || 0}</strong></TableCell>
                    <TableCell><strong>₹{Number(totals.total_bill_amount || 0).toLocaleString()}</strong></TableCell>
                    <TableCell><strong>₹{Number(totals.total_food_deducted || 0).toLocaleString()}</strong></TableCell>
                    <TableCell><strong>₹{Number(totals.total_net_payable || 0).toLocaleString()}</strong></TableCell>
                    <TableCell><strong>₹{Number(totals.total_received || 0).toLocaleString()}</strong></TableCell>
                    <TableCell><strong>₹{Number(totals.total_balance || 0).toLocaleString()}</strong></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {Object.entries(buckets).map(([bucket, data]) => (
                <Grid item xs={6} sm={3} key={bucket}>
                  <Card sx={{ 
                    bgcolor: bucket === '60+ days' ? '#ffebee' : bucket === '30-60 days' ? '#fff3e0' : bucket === '15-30 days' ? '#fff9c4' : '#e8f5e9'
                  }}>
                    <CardContent>
                      <Typography variant="caption">{bucket}</Typography>
                      <Typography variant="h6" fontWeight="bold">{data.count} bills</Typography>
                      <Typography variant="body2" color="error">₹{Number(data.amount).toLocaleString()}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: { xs: 700, sm: 'auto' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>Bill No</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>Bill Date</TableCell>
                    <TableCell>Net Payable</TableCell>
                    <TableCell>Received</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell>Days Pending</TableCell>
                    <TableCell>Aging</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agingData.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center">✅ No pending bills!</TableCell></TableRow>
                  ) : agingData.map(a => (
                    <TableRow key={a.id} hover>
                      <TableCell>{a.bill_no}</TableCell>
                      <TableCell>{a.site_name}</TableCell>
                      <TableCell>{new Date(a.bill_date).toLocaleDateString('hi-IN')}</TableCell>
                      <TableCell>₹{Number(a.net_payable).toLocaleString()}</TableCell>
                      <TableCell sx={{ color: 'success.main' }}>₹{Number(a.amount_received).toLocaleString()}</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>₹{Number(a.balance).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={`${a.days_pending} days`}
                          color={a.days_pending > 60 ? 'error' : a.days_pending > 30 ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{a.aging_bucket}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default BillSummary;