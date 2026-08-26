import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, CircularProgress, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { labourAPI, siteAPI } from '../services/api';
import api from '../services/api';

const MarkAttendance = () => {
  const navigate = useNavigate();
  const [labour, setLabour] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSite) loadLabour();
  }, [selectedSite]);

  const loadSites = async () => {
    try {
      const res = await siteAPI.getAll();
      setSites(res.data.data);
    } catch (err) {
      setError('Failed to load sites');
    }
  };

  const loadLabour = async () => {
    try {
      const res = await labourAPI.getAll({ site_id: selectedSite });
      setLabour(res.data.data);
      
      // Initialize attendance
      const init = {};
      res.data.data.forEach(l => {
        init[l.id] = { regular_hours: 8, overtime_hours: 0, present: true };
      });
      setAttendanceData(init);
    } catch (err) {
      setError('Failed to load labour');
    }
  };

  const handleChange = (labourId, field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [labourId]: { ...prev[labourId], [field]: value }
    }));
  };

  const handleTogglePresent = (labourId) => {
    setAttendanceData(prev => ({
      ...prev,
      [labourId]: {
        ...prev[labourId],
        present: !prev[labourId].present,
        regular_hours: prev[labourId].present ? 0 : 8,
        overtime_hours: 0
      }
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let count = 0;
      for (const lab of labour) {
        const data = attendanceData[lab.id];
        if (data.present) {
          await api.post('/attendance/mark', {
            labour_id: lab.id,
            date: new Date().toISOString().split('T')[0],
            regular_hours: data.regular_hours,
            overtime_hours: data.overtime_hours,
            site_id: selectedSite,
            marked_by: JSON.parse(localStorage.getItem('user')).id
          });
          count++;
        }
      }
      setSuccess(`Attendance marked for ${count} labour!`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (code) => {
    const colors = { MAN: '#1976d2', LAD: '#e91e63', MAS: '#ff9800', CAR: '#795548' };
    return colors[code] || '#666';
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        
        <Typography variant="h5" fontWeight="bold" mb={3}>
          📋 Mark Attendance - {new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Site Select */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth select label="Select Site" value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
            >
              <MenuItem value="">Select Site</MenuItem>
              {sites.map(site => (
                <MenuItem key={site.id} value={site.id}>{site.site_name}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {/* Labour Table */}
        {labour.length > 0 && (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell><strong>Code</strong></TableCell>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Regular Hours</strong></TableCell>
                    <TableCell><strong>OT Hours</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {labour.map(lab => (
                    <TableRow key={lab.id} sx={{ opacity: attendanceData[lab.id]?.present ? 1 : 0.5 }}>
                      <TableCell>{lab.labour_code}</TableCell>
                      <TableCell>{lab.name}</TableCell>
                      <TableCell>
                        <Chip label={lab.category_name} size="small"
                          sx={{ bgcolor: getCategoryColor(lab.category_code), color: 'white' }} />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant={attendanceData[lab.id]?.present ? 'contained' : 'outlined'}
                          color={attendanceData[lab.id]?.present ? 'success' : 'error'}
                          onClick={() => handleTogglePresent(lab.id)}
                        >
                          {attendanceData[lab.id]?.present ? 'Present' : 'Absent'}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small" type="number" sx={{ width: { xs: 60, sm: 80 } }}
                          value={attendanceData[lab.id]?.regular_hours || 0}
                          onChange={(e) => handleChange(lab.id, 'regular_hours', parseFloat(e.target.value) || 0)}
                          disabled={!attendanceData[lab.id]?.present}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small" type="number" sx={{ width: { xs: 60, sm: 80 } }}
                          value={attendanceData[lab.id]?.overtime_hours || 0}
                          onChange={(e) => handleChange(lab.id, 'overtime_hours', parseFloat(e.target.value) || 0)}
                          disabled={!attendanceData[lab.id]?.present}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Button
              variant="contained" size="large" fullWidth
              onClick={handleSubmit} disabled={loading}
              sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '✅ Submit Attendance'}
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default MarkAttendance;