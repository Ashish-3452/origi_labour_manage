import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Alert, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Card, CardContent
} from '@mui/material';
import { Assessment, Search,FileDownload,PictureAsPdf } from '@mui/icons-material';
import { siteAPI } from '../services/api';
import api from '../services/api';

const AttendanceReport = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    siteAPI.getAll().then(res => setSites(res.data.data));
  }, []);

  const loadReport = async () => {
    if (!selectedSite || !selectedDate) {
      setError('Site aur Date select karo');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/attendance/report', {
        params: { date: selectedDate, site_id: selectedSite }
      });
      setReport(res.data.data);
      setSummary(res.data.summary);
    } catch (err) {
      setError('Report load failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    if (!status) return <Chip label="Unmarked" size="small" color="default" variant="outlined" />;
    if (status === 'present') return <Chip label="Present" size="small" color="success" />;
    if (status === 'half_day') return <Chip label="Half Day" size="small" color="warning" />;
    return <Chip label="Absent" size="small" color="error" />;
  };

  const handleExportExcel = () => {
  if (report.length === 0) return;

  const exportData = report.map((lab, idx) => ({
    'S.No': idx + 1,
    'Code': lab.labour_code,
    'Name': lab.name,
    'Category': lab.category_name,
    'Status': lab.status || 'Unmarked',
    'Regular Hrs': lab.regular_hours || 0,
    'OT Hrs': lab.overtime_hours || 0,
    'Total Hajri': lab.total_hajri || 0,
    'Finalized': lab.is_finalized ? 'Yes' : 'No',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

  const siteName = sites.find(s => s.id === selectedSite)?.site_name || 'Site';
  const filename = `Attendance_${siteName}_${selectedDate}.xlsx`;
  XLSX.writeFile(wb, filename);
};

const handleExportPDF = () => {
  if (report.length === 0) return;

  const siteName = sites.find(s => s.id === selectedSite)?.site_name || 'Site';
  const doc = new jsPDF();

  // Header
  doc.setFontSize(16);
  doc.setTextColor(26, 35, 126);
  doc.text('LabourBhai - Attendance Report', 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Site: ${siteName}`, 14, 22);
  doc.text(`Date: ${new Date(selectedDate).toLocaleDateString('hi-IN')}`, 14, 27);
  doc.text(`Generated: ${new Date().toLocaleString('hi-IN')}`, 14, 32);

  // Summary
  if (summary) {
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(
      `Total: ${summary.total}  |  Present: ${summary.present}  |  Half Day: ${summary.half_day}  |  Absent: ${summary.absent}  |  Pending: ${summary.pending_finalize}`,
      14, 40
    );
  }

  // Table
  const tableData = report.map((lab, idx) => [
    idx + 1,
    lab.labour_code,
    lab.name,
    lab.category_name,
    lab.status || 'Unmarked',
    lab.regular_hours || 0,
    lab.overtime_hours || 0,
    lab.total_hajri || 0,
    lab.is_finalized ? 'Yes' : 'No',
  ]);

  doc.autoTable({
    startY: 45,
    head: [['#', 'Code', 'Name', 'Category', 'Status', 'Reg Hrs', 'OT Hrs', 'Hajri', 'Final']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [26, 35, 126], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`Attendance_${siteName}_${selectedDate}.pdf`);
};

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Assessment sx={{ fontSize: 30, color: '#1976d2', mr: 1 }} />
          <Typography variant="h5" fontWeight="bold">Attendance Report</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth select label="Select Site" required
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
            >
              <MenuItem value="">Select Site</MenuItem>
              {sites.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.site_name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth type="date" label="Date" required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              fullWidth variant="contained" onClick={loadReport}
              disabled={loading} sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : '🔍 View Report'}
            </Button>
          </Grid>
        </Grid>

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={2}><Card><CardContent><Typography variant="body2">Total</Typography><Typography variant="h5">{summary.total}</Typography></CardContent></Card></Grid>
            <Grid item xs={6} sm={2}><Card sx={{ bgcolor: '#e8f5e9' }}><CardContent><Typography variant="body2" color="success.main">Present</Typography><Typography variant="h5">{summary.present}</Typography></CardContent></Card></Grid>
            <Grid item xs={6} sm={2}><Card sx={{ bgcolor: '#fff3e0' }}><CardContent><Typography variant="body2" color="warning.main">Half Day</Typography><Typography variant="h5">{summary.half_day}</Typography></CardContent></Card></Grid>
            <Grid item xs={6} sm={2}><Card sx={{ bgcolor: '#ffebee' }}><CardContent><Typography variant="body2" color="error">Absent</Typography><Typography variant="h5">{summary.absent}</Typography></CardContent></Card></Grid>
            <Grid item xs={6} sm={2}><Card><CardContent><Typography variant="body2">Unmarked</Typography><Typography variant="h5">{summary.unmarked}</Typography></CardContent></Card></Grid>
            <Grid item xs={6} sm={2}><Card sx={{ bgcolor: '#f3e5f5' }}><CardContent><Typography variant="body2" color="secondary">Pending</Typography><Typography variant="h5">{summary.pending_finalize}</Typography></CardContent></Card></Grid>
          </Grid>
        )}

        {report.length > 0 && (
  <Box sx={{ mb: 2, textAlign: 'right', display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
    <Button
      variant="contained"
      color="success"
      startIcon={<FileDownload />}
      onClick={handleExportExcel}
    >
      📥 Excel
    </Button>
    <Button
      variant="contained"
      color="error"
      startIcon={<PictureAsPdf />}
      onClick={handleExportPDF}
    >
      📄 PDF
    </Button>
  </Box>
)}


        {/* Report Table */}
        {report.length > 0 && (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell>#</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Regular Hrs</TableCell>
                  <TableCell>OT Hrs</TableCell>
                  <TableCell>Total Hajri</TableCell>
                  <TableCell>Finalized</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.map((lab, idx) => (
                  <TableRow key={lab.id} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{lab.labour_code}</TableCell>
                    <TableCell>{lab.name}</TableCell>
                    <TableCell>{lab.category_name}</TableCell>
                    <TableCell>{getStatusChip(lab.status)}</TableCell>
                    <TableCell>{lab.regular_hours || 0}</TableCell>
                    <TableCell>{lab.overtime_hours || 0}</TableCell>
                    <TableCell>{lab.total_hajri || 0}</TableCell>
                    <TableCell>{lab.is_finalized ? '✅' : '⏳'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {report.length === 0 && selectedSite && !loading && (
          <Typography align="center" color="text.secondary">
            No labour found for this site
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default AttendanceReport;