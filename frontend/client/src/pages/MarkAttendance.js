import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, CircularProgress, Chip, Tabs, Tab, IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { labourAPI, siteAPI } from '../services/api';
import api from '../services/api';
import { Visibility, CheckCircle, Cancel, Edit, Lock } from '@mui/icons-material';

const MarkAttendance = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [tab, setTab] = useState(0);
  const [labour, setLabour] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    siteAPI.getAll().then(res => setSites(res.data.data));
  }, []);

  useEffect(() => {
    if (selectedSite && attendanceDate) loadAttendanceList();
  }, [selectedSite, attendanceDate]);

  const loadLabour = async () => {
    if (!selectedSite) return;
    setLoading(true);
    try {
      const res = await labourAPI.getAll({ site_id: selectedSite });
      setLabour(res.data.data);
    } catch (err) {
      setError('Labour load failed');
    }
    setLoading(false);
  };

  const loadAttendanceList = async () => {
    if (!selectedSite || !attendanceDate) return;
    setLoading(true);
    try {
      const res = await api.get('/attendance/list', { params: { date: attendanceDate, site_id: selectedSite } });
      setAttendanceList(res.data.data);
    } catch (err) {
      setError('Attendance list load failed');
    }
    setLoading(false);
  };

  const handleMorningPreset = async () => {
    if (!selectedSite) { setError('Site select karo'); return; }
    setLoading(true);
    try {
      await api.post('/attendance/morning-preset', { site_id: selectedSite, date: attendanceDate });
      setSuccess('Morning preset done!');
      loadAttendanceList();
    } catch (err) {
      setError(err.response?.data?.error || 'Morning preset failed');
    }
    setLoading(false);
  };

  const handleFinalize = async (lab) => {
    // lab object contains attendance details
    const newStatus = window.prompt('Status (present/absent/half_day):', lab.status || 'present');
    const regularHours = parseFloat(window.prompt('Regular hours:', lab.regular_hours || 8));
    const overtimeHours = parseFloat(window.prompt('Overtime hours:', lab.overtime_hours || 0));

    if (!newStatus || isNaN(regularHours) || isNaN(overtimeHours)) return;

    setLoading(true);
    try {
      await api.put('/attendance/finalize', {
        labour_id: lab.labour_id,
        date: attendanceDate,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        status: newStatus,
        marked_by: JSON.parse(localStorage.getItem('user')).id
      });
      setSuccess('Finalized!');
      loadAttendanceList();
    } catch (err) {
      setError(err.response?.data?.error || 'Finalize failed');
    }
    setLoading(false);
  };

  const renderAttendanceTable = () => {
    if (attendanceList.length === 0) return <Typography>No attendance records for selected date/site.</Typography>;
    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Regular Hrs</TableCell>
              <TableCell>OT Hrs</TableCell>
              <TableCell>Finalized</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendanceList.map((att, idx) => (
              <TableRow key={att.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{att.name}</TableCell>
                <TableCell>{att.labour_code}</TableCell>
                <TableCell>{att.category_name}</TableCell>
                <TableCell>
                  <Chip label={att.status} color={att.status === 'present' ? 'success' : att.status === 'half_day' ? 'warning' : 'error'} size="small" />
                </TableCell>
                <TableCell>{att.regular_hours}</TableCell>
                <TableCell>{att.overtime_hours}</TableCell>
                <TableCell>{att.is_finalized ? <Lock color="success" /> : <Edit color="warning" />}</TableCell>
                <TableCell>
                  {att.is_finalized ? (
                    <Typography variant="caption" color="text.secondary">Locked</Typography>
                  ) : (
                    <Button size="small" variant="outlined" onClick={() => handleFinalize(att)}>Finalize</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>📋 Attendance Management</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth select label="Select Site" value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}>
              <MenuItem value="">Select Site</MenuItem>
              {sites.map(s => <MenuItem key={s.id} value={s.id}>{s.site_name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth type="date" label="Date" value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button fullWidth variant="contained" onClick={handleMorningPreset} disabled={!selectedSite || loading}>
              🌅 Morning Preset
            </Button>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button fullWidth variant="outlined" onClick={loadAttendanceList} disabled={!selectedSite || loading}>
              🔄 Load List
            </Button>
          </Grid>
        </Grid>

        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Attendance List" />
          <Tab label="Manual Entry (Backdate)" />
        </Tabs>

        {tab === 0 && renderAttendanceTable()}

        {tab === 1 && (
          <Box>
            <Typography variant="h6" mb={2}>Manual Attendance Entry (Past Date)</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth select label="Labour" value={''} onChange={() => {}}>
                  {labour.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth type="date" label="Date" value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField fullWidth type="number" label="Regular Hours" defaultValue={8} />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField fullWidth type="number" label="OT Hours" defaultValue={0} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth select label="Status" defaultValue="present">
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="half_day">Half Day</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained">Save Manual Entry</Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MarkAttendance;