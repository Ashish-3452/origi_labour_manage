import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { History } from '@mui/icons-material';
import api from '../services/api';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/activity/list').then(res => setLogs(res.data.data)).catch(console.error);
  }, []);

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          <History sx={{ mr: 1, verticalAlign: 'middle' }} />
          Activity Log
        </Typography>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>Time</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map(l => (
                <TableRow key={l.id}>
                  <TableCell>{new Date(l.created_at).toLocaleString('hi-IN')}</TableCell>
                  <TableCell>{l.name || 'System'}</TableCell>
                  <TableCell><Chip label={l.action} size="small" color="primary" /></TableCell>
                  <TableCell>{l.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ActivityLog;