import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, TextField,
  MenuItem, Grid, Chip, IconButton
} from '@mui/material';
import { Add, Search, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { labourAPI, categoryAPI, siteAPI } from '../services/api';

const LabourList = () => {
  const navigate = useNavigate();
  const [labour, setLabour] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sites, setSites] = useState([]);
  const [filters, setFilters] = useState({
    search: '', category_id: '', site_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
    }
  };

  const handleSearch = async () => {
    try {
      const res = await labourAPI.getAll(filters);
      setLabour(res.data.data);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const getCategoryColor = (code) => {
    const colors = {
      MAN: '#1976d2', LAD: '#e91e63', MAS: '#ff9800', CAR: '#795548'
    };
    return colors[code] || '#666';
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">👥 Labour List</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/labour/register')}>
            Add Labour
          </Button>
        </Box>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth size="small" label="Search" name="search"
              value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})}
              placeholder="Name, Mobile, Code"
              InputProps={{ endAdornment: <Search /> }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth select size="small" label="Category" name="category_id"
              value={filters.category_id} onChange={(e) => setFilters({...filters, category_id: e.target.value})}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat.id} value={cat.id}>{cat.category_name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth select size="small" label="Site" name="site_id"
              value={filters.site_id} onChange={(e) => setFilters({...filters, site_id: e.target.value})}
            >
              <MenuItem value="">All Sites</MenuItem>
              {sites.map(site => (
                <MenuItem key={site.id} value={site.id}>{site.site_name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button fullWidth variant="outlined" onClick={handleSearch} sx={{ py: 1 }}>
              Filter
            </Button>
          </Grid>
        </Grid>

        {/* Table */}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
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
                  <TableCell>₹{lab.our_rate_8hr}/day</TableCell>
                  <TableCell>
                    <IconButton size="small" color="primary">
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
    </Box>
  );
};

export default LabourList;