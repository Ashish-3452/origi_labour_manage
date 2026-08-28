import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, TextField,
  MenuItem, Grid, Chip, IconButton, Dialog, DialogContent,
  DialogTitle, CircularProgress
} from '@mui/material';
import { Add, Search, Visibility, Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { labourAPI, categoryAPI, siteAPI } from '../services/api';

const LabourList = () => {
  const navigate = useNavigate();
  const [labour, setLabour] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sites, setSites] = useState([]);
  const [filters, setFilters] = useState({ search: '', category_id: '', site_id: '' });
  const [selectedLabour, setSelectedLabour] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [labRes, catRes, siteRes] = await Promise.all([
        labourAPI.getAll(),
        categoryAPI.getAll(),
        siteAPI.getAll()
      ]);
      setLabour(labRes.data.data);
      setCategories(catRes.data.data);
      setSites(siteRes.data.data);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {
        search: filters.search || undefined,
        category_id: filters.category_id || undefined,
        site_id: filters.site_id || undefined
      };
      const res = await labourAPI.getAll(params);
      setLabour(res.data.data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (lab) => {
    setSelectedLabour(lab);
    setOpenDetails(true);
  };

  const getCategoryColor = (code) => {
    const colors = { MAN: '#1976d2', LAD: '#e91e63', MAS: '#ff9800', CAR: '#795548' };
    return colors[code] || '#666';
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5" fontWeight="bold">👥 Labour List</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/labour/register')}>
            Add Labour
          </Button>
        </Box>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth size="small" label="Search" value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Name, Mobile, Code"
              InputProps={{ endAdornment: <Search /> }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth select size="small" label="Category" value={filters.category_id}
              onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat.id} value={cat.id}>{cat.category_name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth select size="small" label="Site" value={filters.site_id}
              onChange={(e) => setFilters({ ...filters, site_id: e.target.value })}
            >
              <MenuItem value="">All Sites</MenuItem>
              {sites.map(site => (
                <MenuItem key={site.id} value={site.id}>{site.site_name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button fullWidth variant="outlined" onClick={handleSearch} sx={{ py: 1 }} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Filter'}
            </Button>
          </Grid>
        </Grid>

        {/* Table */}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Code</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Mobile</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell><strong>Site</strong></TableCell>
                <TableCell><strong>Rate</strong></TableCell>
                <TableCell><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {labour.map((lab) => (
                <TableRow key={lab.id} hover>
                  <TableCell>{lab.labour_code}</TableCell>
                  <TableCell>{lab.name}</TableCell>
                  <TableCell>{lab.mobile || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={lab.category_name}
                      size="small"
                      sx={{ bgcolor: getCategoryColor(lab.category_code), color: 'white' }}
                    />
                  </TableCell>
                  <TableCell>{lab.site_name}</TableCell>
                  <TableCell>₹{lab.our_rate_8hr || '-'}</TableCell>
                  <TableCell>
                    <IconButton size="small" color="primary" onClick={() => handleViewDetails(lab)}>
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {labour.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">No labour found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Details Dialog */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Labour Details
          <IconButton onClick={() => setOpenDetails(false)} sx={{ float: 'right' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLabour && (
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Name</Typography><Typography fontWeight="bold">{selectedLabour.name}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Code</Typography><Typography fontWeight="bold">{selectedLabour.labour_code}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Mobile</Typography><Typography>{selectedLabour.mobile || '-'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Category</Typography><Typography>{selectedLabour.category_name}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Site</Typography><Typography>{selectedLabour.site_name}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Company Rate</Typography><Typography>₹{selectedLabour.company_rate_8hr}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Our Rate</Typography><Typography>₹{selectedLabour.our_rate_8hr}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Khoraki Rate</Typography><Typography>₹{selectedLabour.khoraki_rate}</Typography></Grid>
              <Grid item xs={12}><Typography variant="body2" color="text.secondary">Address</Typography><Typography>{selectedLabour.address || '-'}</Typography></Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default LabourList;