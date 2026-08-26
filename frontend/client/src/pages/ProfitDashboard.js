import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, TextField,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import api from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#e91e63', '#795548'];

const ProfitDashboard = () => {
  const [tab, setTab] = useState(0);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState(null);
  const [siteWise, setSiteWise] = useState([]);
  const [categoryWise, setCategoryWise] = useState([]);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [ghostHajri, setGhostHajri] = useState([]);

  useEffect(() => { loadAll(); }, [month]);

  const loadAll = async () => {
    try {
      const [sumRes, siteRes, catRes, trendRes, ghostRes] = await Promise.all([
        api.get('/profit/summary', { params: { month } }),
        api.get('/profit/site-wise', { params: { month } }),
        api.get('/profit/category-wise', { params: { month } }),
        api.get('/profit/daily-trend', { params: { month } }),
        api.get('/profit/ghost-hajri', { params: { month } })
      ]);
      setSummary(sumRes.data.data);
      setSiteWise(siteRes.data.data);
      setCategoryWise(catRes.data.data);
      setDailyTrend(trendRes.data.data);
      setGhostHajri(ghostRes.data.data);
    } catch (err) { console.error(err); }
  };

  if (!summary) return <Typography p={3}>Loading...</Typography>;

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">📊 Advanced Profit & Loss</Typography>
        <TextField type="month" size="small" value={month}
          onChange={(e) => setMonth(e.target.value)} />
      </Box>

      {/* Top Cards */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Company Billing', value: summary.company_bill, color: '#1976d2' },
          { label: 'Labour Payment', value: summary.labour_payment, color: '#ff9800' },
          { label: 'Gross Profit', value: summary.gross_profit, color: '#4caf50' },
          { label: 'Net Saving', value: summary.net_saving, color: '#9c27b0' },
        ].map((card, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ bgcolor: card.color, color: 'white' }}>
              <CardContent>
                <Typography variant="body2">{card.label}</Typography>
                <Typography variant="h5">₹{card.value?.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2, bgcolor: 'white', borderRadius: 2 }}>
        <Tab label="📈 Daily Trend" />
        <Tab label="🏢 Site-wise" />
        <Tab label="👷 Category" />
        <Tab label="👻 Ghost Hajri" />
      </Tabs>

      {/* TAB 0: Daily Trend */}
      {tab === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" mb={2}>Daily Profit Trend</Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="company_bill" stroke="#1976d2" name="Company Bill" strokeWidth={2} />
              <Line type="monotone" dataKey="labour_payment" stroke="#ff9800" name="Labour Pay" strokeWidth={2} />
              <Line type="monotone" dataKey="profit" stroke="#4caf50" name="Profit" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* TAB 1: Site-wise */}
      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" mb={2}>Site-wise Profit</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={siteWise}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="site_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="profit" fill="#4caf50" name="Profit" />
                  <Bar dataKey="company_bill" fill="#1976d2" name="Bill" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" mb={2}>Site Details</Typography>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow><TableCell>Site</TableCell><TableCell>Labour</TableCell><TableCell>Hajri</TableCell><TableCell>Bill</TableCell><TableCell>Profit</TableCell></TableRow>
                  </TableHead>
                  <TableBody>
                    {siteWise.map(s => (
                      <TableRow key={s.site_name}>
                        <TableCell>{s.site_name}</TableCell>
                        <TableCell>{s.labour_count}</TableCell>
                        <TableCell>{s.total_hajri}</TableCell>
                        <TableCell>₹{Number(s.company_bill).toLocaleString()}</TableCell>
                        <TableCell>₹{Number(s.profit).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 2: Category-wise */}
      {tab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" mb={2}>Category Distribution</Typography>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={categoryWise} dataKey="profit" nameKey="category_name" cx="50%" cy="50%" outerRadius={120} label>
                    {categoryWise.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" mb={2}>Category Details</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow><TableCell>Category</TableCell><TableCell>Labour</TableCell><TableCell>Hajri</TableCell><TableCell>Profit</TableCell></TableRow>
                  </TableHead>
                  <TableBody>
                    {categoryWise.map(c => (
                      <TableRow key={c.category_code}>
                        <TableCell>{c.category_name}</TableCell>
                        <TableCell>{c.labour_count}</TableCell>
                        <TableCell>{c.total_hajri}</TableCell>
                        <TableCell>₹{Number(c.profit).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 3: Ghost Hajri */}
      {tab === 3 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" mb={2}>👻 Ghost Hajri Tracking</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell>Site</TableCell>
                  <TableCell>Company Bill</TableCell>
                  <TableCell>Labour Pay</TableCell>
                  <TableCell>Profit</TableCell>
                  <TableCell>Ghost Hajri</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ghostHajri.map(g => (
                  <TableRow key={g.site_name}>
                    <TableCell>{g.site_name}</TableCell>
                    <TableCell>₹{Number(g.company_bill).toLocaleString()}</TableCell>
                    <TableCell>₹{Number(g.labour_payment).toLocaleString()}</TableCell>
                    <TableCell>₹{Number(g.profit).toLocaleString()}</TableCell>
                    <TableCell>
                      <Typography color={Number(g.ghost_hajri) > 0 ? 'success.main' : 'error'}>
                        {Number(g.ghost_hajri).toFixed(2)} Hajri
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

    </Box>
  );
};

export default ProfitDashboard;