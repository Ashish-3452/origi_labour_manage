import React, { useState, useEffect } from 'react';
import {
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItem,
  ListItemIcon, ListItemText, Card, CardContent, Grid, IconButton,
  Avatar, Divider, Badge, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Menu, MenuItem, Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon, People, TrendingDown, Assignment, Payment,
  Restaurant, Settings, Menu as MenuIcon,
  Logout, Notifications, TrendingUp, Business, PersonAdd, Calculate, PictureAsPdf,
  SupervisorAccount, Category, History, Assessment,Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const drawerWidth = 280;

const Dashboard = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    total_labour: 0,
    present_today: 0,
    today_profit: 0,
    total_outstanding: 0,
    today_hajri: 0
  });

  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
const [notifAnchor, setNotifAnchor] = useState(null);

const handleRefresh = async () => {
  setRefreshing(true);
  await loadDashboardStats();
  setRefreshing(false);
};

const loadNotifications = async () => {
  try {
    const res = await api.get('/dashboard/notifications');
    if (res.data.success) setNotifications(res.data.data);
  } catch (err) {
    console.error('Notifications load error:', err);
  }
};

const handleNotifOpen = (e) => {
  setNotifAnchor(e.currentTarget);
  loadNotifications();
};

const handleNotifClose = () => {
  setNotifAnchor(null);
};

  const [siteWise, setSiteWise] = useState([]);
const [pendingFinal, setPendingFinal] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
    } else {
      setUser(JSON.parse(userData));
      loadDashboardStats();
    }
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const loadDashboardStats = async () => {
  try {
    const [statsRes, siteRes, pendingRes, fullRes, notifRes] = await Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/site-wise'),
      api.get('/dashboard/pending-finalization'),
      api.get('/dashboard/full-summary'),
      api.get('/dashboard/notifications')
    ]);
    if (statsRes.data.success) setStats(statsRes.data.data);
    if (siteRes.data.success) setSiteWise(siteRes.data.data);
    if (pendingRes.data.success) setPendingFinal(pendingRes.data.data);
    if (fullRes.data.success) setFullSummary(fullRes.data.data);
    if (notifRes.data.success) setNotifications(notifRes.data.data);
  } catch (err) {
    console.error('Stats load error:', err);
  }
};

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const [fullSummary, setFullSummary] = useState({
  topDuesLabour: [],
  supervisorSummary: {},
  profitSummary: {},
  totalOutstanding: 0
});

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Labour List', icon: <People />, path: '/labour/list' },
    { text: 'Add Labour', icon: <PersonAdd />, path: '/labour/register' },
    { text: 'Attendance', icon: <Assignment />, path: '/attendance/mark' },
    { text: 'Advance Payment', icon: <Payment />, path: '/payments/advance' },
    { text: 'Khoraki', icon: <Restaurant />, path: '/khoraki' },
    { text: 'Theka Work', icon: <Calculate />, path: '/theka' },
    { text: 'Profit & Loss', icon: <TrendingUp />, path: '/profit' },
    { text: 'Bill Generation', icon: <PictureAsPdf />, path: '/bills' },
    { text: 'Expenses', icon: <TrendingDown />, path: '/expenses' },
    { text: 'Supervisors', icon: <SupervisorAccount />, path: '/supervisors' },
    { text: 'Sites', icon: <Business />, path: '/sites' },
    { text: 'Categories', icon: <Category />, path: '/categories' },
    { text: 'Site Rates', icon: <Business />, path: '/labour/site-rates' },
    { text: 'Attendance Report', icon: <Assessment />, path: '/attendance/report' },
    { text: 'Users', icon: <People />, path: '/users' },
    { text: 'Activity Log', icon: <History />, path: '/activity' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const statsCards = [
  { title: 'Total Labour', value: stats.total_labour, color: '#1976d2', icon: <People /> },
  { title: 'Present Today', value: stats.present_today, color: '#4caf50', icon: <Assignment /> },
  { title: 'Absent Today', value: stats.absent_today || 0, color: '#f44336', icon: <Assignment /> },
  { title: "Today's Profit", value: `₹${(stats.today_profit || 0).toLocaleString()}`, color: '#ff9800', icon: <Payment /> },
  { title: 'Outstanding', value: `₹${(stats.total_outstanding || 0).toLocaleString()}`, color: '#f44336', icon: <Assessment /> },
];

  const drawer = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #1a237e 0%, #0d47a1 100%)'
    }}>
      <Box sx={{
        p: 2.5,
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Avatar sx={{
          width: 60, height: 60,
          margin: '0 auto 10px',
          bgcolor: 'white',
          color: '#1a237e',
          fontSize: 24,
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}>
          {user?.name?.charAt(0) || 'A'}
        </Avatar>
        <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
          {user?.name || 'Admin'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          {user?.role || 'SUPER_ADMIN'}
        </Typography>
      </Box>

      <List sx={{
        flex: 1,
        pt: 1,
        overflowY: 'auto',
        '&::-webkit-scrollbar': { width: '4px' }
      }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => { navigate(item.path); setMobileOpen(false); }}
            sx={{
              mx: 1,
              my: 0.3,
              borderRadius: 2,
              color: 'rgba(255,255,255,0.85)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <ListItem
          button
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: '#ffebee',
            '&:hover': { bgcolor: 'rgba(255,0,0,0.2)' }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: '#ff5252' }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f0f2f5', minHeight: '100vh' }}>

      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'rgba(255,255,255,0.95)',
          color: '#333',
          boxShadow: '0 1px 10px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '0.9rem', sm: '1.25rem' },
              color: '#1a237e'
            }}
          >
            🏗️ {window.innerWidth < 600 ? 'LMS' : 'LabourBhai'}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mr: 2,
              color: 'text.secondary',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            {currentTime.toLocaleDateString('hi-IN', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </Typography>

<IconButton onClick={handleRefresh} disabled={refreshing} title="Refresh Data">
  <Refresh sx={{ color: '#1a237e', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
</IconButton>

          <IconButton onClick={handleNotifOpen}>
  <Badge badgeContent={notifications.length} color="error">
    <Notifications sx={{ color: '#1a237e' }} />
  </Badge>
</IconButton>

<Menu
  anchorEl={notifAnchor}
  open={Boolean(notifAnchor)}
  onClose={handleNotifClose}
  PaperProps={{
    sx: { maxWidth: 350, width: '90vw', maxHeight: 400 }
  }}
>
  <Box sx={{ p: 2, bgcolor: '#1a237e', color: 'white' }}>
    <Typography variant="subtitle1" fontWeight="bold">
      🔔 Notifications
    </Typography>
  </Box>
  <Divider />
  {notifications.length === 0 ? (
    <MenuItem disabled>
      <ListItemText primary="No notifications" />
    </MenuItem>
  ) : (
    notifications.map((notif, idx) => (
      <MenuItem key={idx} onClick={handleNotifClose} sx={{ alignItems: 'flex-start', py: 1.5 }}>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" fontWeight="bold"
              color={
                notif.type === 'error' ? 'error.main' :
                notif.type === 'warning' ? 'warning.main' : 'info.main'
              }>
              {notif.title}
            </Typography>
            <Chip
              label={notif.type === 'error' ? 'Alert' : notif.type === 'warning' ? 'Warning' : 'Info'}
              size="small"
              color={notif.type === 'error' ? 'error' : notif.type === 'warning' ? 'warning' : 'info'}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {notif.message}
          </Typography>
        </Box>
      </MenuItem>
    ))
  )}
</Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {statsCards.map((stat, index) => (
            <Grid item xs={6} sm={6} md={3} key={index}>
              <Card sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                transition: 'all 0.3s',
                height: '100%',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                }
              }}>
                <CardContent sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 1, sm: 2 },
                  padding: { xs: 1.5, sm: 2 }
                }}>
                  <Avatar sx={{
                    bgcolor: `${stat.color}15`,
                    color: stat.color,
                    width: { xs: 40, sm: 50 },
                    height: { xs: 40, sm: 50 }
                  }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                    >
                      {stat.title}
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}
                    >
                      {stat.value}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card sx={{
          mt: 3,
          borderRadius: 3,
          p: { xs: 2, sm: 3 },
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
            🎉 Welcome back, {user?.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>
            Today's Hajri: <strong>{stats.today_hajri || 0}</strong> | 
            Present: <strong>{stats.present_today || 0}</strong> | 
            Profit: <strong>₹{(stats.today_profit || 0).toLocaleString()}</strong>
          </Typography>
        </Card>

        {/* Site-wise Attendance Summary */}
<Card sx={{ mt: 3, borderRadius: 3, p: { xs: 2, sm: 3 }, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
  <Typography variant="h6" fontWeight="bold" mb={2}>🏢 Site-wise Attendance (Today)</Typography>
  <TableContainer sx={{ overflowX: 'auto' }}>
    <Table size="small">
      <TableHead>
        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
          <TableCell>Site</TableCell>
          <TableCell>Present</TableCell>
          <TableCell>Half Day</TableCell>
          <TableCell>Absent</TableCell>
          <TableCell>Pending Finalize</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {siteWise.map(site => (
          <TableRow key={site.id}>
            <TableCell>{site.site_name}</TableCell>
            <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>{site.present || 0}</TableCell>
            <TableCell sx={{ color: 'warning.main' }}>{site.half_day || 0}</TableCell>
            <TableCell sx={{ color: 'error.main' }}>{site.absent || 0}</TableCell>
            <TableCell sx={{ color: site.pending_finalize > 0 ? 'error.main' : 'text.secondary' }}>
              {site.pending_finalize || 0}
            </TableCell>
          </TableRow>
        ))}
        {siteWise.length === 0 && (
          <TableRow><TableCell colSpan={5} align="center">No data</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  </TableContainer>
</Card>

{/* Supervisor Financial Summary */}
<Card sx={{ mt: 3, borderRadius: 3, p: { xs: 2, sm: 3 }, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
  <Typography variant="h6" fontWeight="bold" mb={2}>👨‍💼 Supervisor Summary</Typography>
  <Grid container spacing={2}>
    <Grid item xs={6} sm={3}><Typography variant="body2">Total Supervisors</Typography><Typography variant="h6">{fullSummary.supervisorSummary?.total_supervisors || 0}</Typography></Grid>
    <Grid item xs={6} sm={3}><Typography variant="body2">Monthly Cost</Typography><Typography variant="h6">₹{Number(fullSummary.supervisorSummary?.total_monthly_cost || 0).toLocaleString()}</Typography></Grid>
    <Grid item xs={6} sm={3}><Typography variant="body2">Advance Taken</Typography><Typography variant="h6">₹{Number(fullSummary.supervisorSummary?.total_advance_taken || 0).toLocaleString()}</Typography></Grid>
    <Grid item xs={6} sm={3}><Typography variant="body2">Outstanding</Typography><Typography variant="h6" color="error">₹{Number(fullSummary.supervisorSummary?.outstanding_advance || 0).toLocaleString()}</Typography></Grid>
  </Grid>
</Card>

{/* Top 10 Dues Labour Slider */}
{/* Top 10 Dues Labour Auto Slider */}
<Card sx={{ mt: 3, borderRadius: 3, p: { xs: 2, sm: 3 }, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
  <Typography variant="h6" fontWeight="bold" mb={2}>🔝 Top 10 Dues Labour</Typography>
  <Box className="slider-container">
    <Box className="slider-track">
      {/* Original list */}
      {fullSummary.topDuesLabour?.map((lab, i) => (
        <Card key={`a-${lab.id}`} className="slider-card" sx={{ bgcolor: '#fff3e0', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">#{i+1}</Typography>
            <Typography variant="subtitle2" fontWeight="bold">{lab.name}</Typography>
            <Typography variant="body2" color="text.secondary">{lab.labour_code} • {lab.category_name}</Typography>
            <Typography variant="h6" color="error">₹{Number(lab.balance_due).toLocaleString()}</Typography>
          </CardContent>
        </Card>
      ))}
      {/* Duplicate list for seamless loop */}
      {fullSummary.topDuesLabour?.map((lab, i) => (
        <Card key={`b-${lab.id}`} className="slider-card" sx={{ bgcolor: '#fff3e0', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">#{i+1}</Typography>
            <Typography variant="subtitle2" fontWeight="bold">{lab.name}</Typography>
            <Typography variant="body2" color="text.secondary">{lab.labour_code} • {lab.category_name}</Typography>
            <Typography variant="h6" color="error">₹{Number(lab.balance_due).toLocaleString()}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  </Box>
  {fullSummary.topDuesLabour?.length === 0 && (
    <Typography variant="body2" color="text.secondary">No dues pending</Typography>
  )}
</Card>

{/* Combined Profit Summary */}
<Card sx={{ mt: 3, borderRadius: 3, p: { xs: 2, sm: 3 }, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
  <Typography variant="h6" fontWeight="bold" mb={2}>💰 Profit Summary (This Month)</Typography>
  <Grid container spacing={2}>
    <Grid item xs={6} sm={3}><Typography variant="body2">Company Bill</Typography><Typography variant="h6">₹{Number(fullSummary.profitSummary?.company_bill || 0).toLocaleString()}</Typography></Grid>
    <Grid item xs={6} sm={3}><Typography variant="body2">Labour Payment</Typography><Typography variant="h6">₹{Number(fullSummary.profitSummary?.labour_payment || 0).toLocaleString()}</Typography></Grid>
    <Grid item xs={6} sm={3}><Typography variant="body2">Business Expense</Typography><Typography variant="h6">₹{Number(fullSummary.profitSummary?.business_expense || 0).toLocaleString()}</Typography></Grid>
    <Grid item xs={6} sm={3}><Typography variant="body2">Total Outstanding</Typography><Typography variant="h6" color="error">₹{Number(fullSummary.totalOutstanding || 0).toLocaleString()}</Typography></Grid>
  </Grid>
</Card>

{/* Pending Finalization Alerts */}
{pendingFinal.length > 0 && (
  <Card sx={{ mt: 3, borderRadius: 3, p: { xs: 2, sm: 3 }, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#fff3e0' }}>
    <Typography variant="h6" fontWeight="bold" mb={2} color="warning.main">
      ⚠️ Pending Finalization
    </Typography>
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#ffe0b2' }}>
            <TableCell>Date</TableCell>
            <TableCell>Site</TableCell>
            <TableCell>Pending Count</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pendingFinal.map((p, idx) => (
            <TableRow key={idx}>
              <TableCell>{new Date(p.date).toLocaleDateString('hi-IN')}</TableCell>
              <TableCell>{p.site_name}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'error.main' }}>{p.pending_count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Card>
)}

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {[
            { title: '📋 Mark Attendance', path: '/attendance/mark', color: '#4caf50' },
            { title: '➕ Add Labour', path: '/labour/register', color: '#1976d2' },
            { title: '💰 Give Advance', path: '/payments/advance', color: '#ff9800' },
            { title: '👥 View Labour', path: '/labour/list', color: '#9c27b0' },
          ].map((link, i) => (
            <Grid item xs={6} sm={6} md={3} key={i}>
              <Card
                onClick={() => navigate(link.path)}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: `linear-gradient(135deg, ${link.color} 0%, ${link.color}dd 100%)`,
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                  },
                  transition: 'all 0.3s'
                }}
              >
                <Typography variant="h6" sx={{ fontSize: { xs: '0.8rem', sm: '1.1rem' } }}>
                  {link.title}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;