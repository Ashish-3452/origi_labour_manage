import React, { useState, useEffect } from 'react';
import {
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItem,
  ListItemIcon, ListItemText, Card, CardContent, Grid, IconButton,
  Avatar, Divider, Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon, People, TrendingDown, Assignment, Payment,
  Restaurant, Settings, Menu as MenuIcon,
  Logout, Notifications, TrendingUp, Business, PersonAdd, Calculate, PictureAsPdf,
  SupervisorAccount, Category, History,Assessment
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
      const res = await api.get('/dashboard/stats');
      if (res.data.success) setStats(res.data.data);
    } catch (err) {
      console.error('Stats load error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

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
    { text: 'Users', icon: <People />, path: '/users' },
    { text: 'Activity Log', icon: <History />, path: '/activity' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const statsCards = [
    { title: 'Total Labour', value: stats.total_labour, color: '#1976d2', icon: <People /> },
    { title: 'Present Today', value: stats.present_today, color: '#4caf50', icon: <Assignment /> },
    { title: "Today's Profit", value: `₹${(stats.today_profit || 0).toLocaleString()}`, color: '#ff9800', icon: <Payment /> },
    { title: 'Outstanding', value: `₹${(stats.total_outstanding || 0).toLocaleString()}`, color: '#f44336', icon: <Assessment /> },
  ];

  const drawer = (
    <Box>
      <Box sx={{ 
        p: 2.5, textAlign: 'center',
        background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
        color: 'white'
      }}>
        <Avatar sx={{ 
          width: 60, height: 60, margin: '0 auto 10px',
          bgcolor: 'white', color: '#1a237e', fontSize: 24, fontWeight: 'bold'
        }}>
          {user?.name?.charAt(0) || 'A'}
        </Avatar>
        <Typography variant="h6" fontWeight="bold">
          {user?.name || 'Admin'}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          {user?.role || 'SUPER_ADMIN'}
        </Typography>
      </Box>

      <List sx={{ pt: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text}
            onClick={() => { navigate(item.path); setMobileOpen(false); }}
            sx={{ mx: 1, my: 0.5, borderRadius: 2, '&:hover': { bgcolor: '#e3f2fd' } }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mx: 2 }} />

      <List>
        <ListItem button onClick={handleLogout}
          sx={{ mx: 1, borderRadius: 2, '&:hover': { bgcolor: '#ffebee' } }}>
          <ListItemIcon sx={{ minWidth: 40 }}><Logout color="error" /></ListItemIcon>
          <ListItemText primary="Logout" sx={{ color: 'error.main' }} />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      
      <AppBar position="fixed" sx={{ 
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        background: 'white', color: '#333', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" fontWeight="bold" 
            sx={{ flexGrow: 1, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
            🏗️ {window.innerWidth < 600 ? 'LMS' : 'Labour Management System'}
          </Typography>

          <Typography variant="body2" 
            sx={{ mr: 2, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
            {currentTime.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Typography>

          <IconButton>
            <Badge badgeContent={stats.present_today || 0} color="success">
              <Notifications />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }} open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ 
        flexGrow: 1, p: { xs: 1, sm: 2, md: 3 }, 
        width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8 
      }}>
        <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
          {statsCards.map((stat, index) => (
            <Grid item xs={6} sm={6} md={3} key={index}>
              <Card sx={{ 
                borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' }
              }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                  <Avatar sx={{ bgcolor: stat.color, width: { xs: 40, sm: 50 }, height: { xs: 40, sm: 50 } }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card sx={{ mt: 3, borderRadius: 3, p: { xs: 2, sm: 3 }, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
            🎉 Welcome back, {user?.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>
            Today's Hajri: <strong>{stats.today_hajri || 0}</strong> | 
            Present: <strong>{stats.present_today || 0}</strong> | 
            Profit: <strong>₹{(stats.today_profit || 0).toLocaleString()}</strong>
          </Typography>
        </Card>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {[
            { title: '📋 Mark Attendance', path: '/attendance/mark', color: '#4caf50' },
            { title: '➕ Add Labour', path: '/labour/register', color: '#1976d2' },
            { title: '💰 Give Advance', path: '/payments/advance', color: '#ff9800' },
            { title: '👥 View Labour', path: '/labour/list', color: '#9c27b0' },
          ].map((link, i) => (
            <Grid item xs={6} sm={6} md={3} key={i}>
              <Card onClick={() => navigate(link.path)}
                sx={{ 
                  p: { xs: 1.5, sm: 2 }, textAlign: 'center', cursor: 'pointer',
                  bgcolor: link.color, color: 'white', borderRadius: 3,
                  '&:hover': { opacity: 0.9, transform: 'scale(1.05)' },
                  transition: 'all 0.3s'
                }}>
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