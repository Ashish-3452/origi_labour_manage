import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid,
  Card, CardContent, Switch, Alert, Divider
} from '@mui/material';
import { Settings as SettingsIcon, Save, Security, Notifications } from '@mui/icons-material';

const Settings = () => {
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    company_name: 'Ashish Labour Contractor',
    company_phone: '9876543210',
    company_email: 'ashish@contractor.com',
    company_address: 'Your Address, City - Pin Code',
    gst_number: '',
    default_khoraki_rate: 250,
    max_advance_limit: 5000,
    enable_sms: false,
    enable_backup: true,
    language: 'hindi'
  });

  const handleSave = () => {
    localStorage.setItem('settings', JSON.stringify(settings));
    setSuccess('Settings saved successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ maxWidth: 700, mx: 'auto', p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Settings
        </Typography>

        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        {/* Company Info */}
        <Typography variant="h6" mb={2} color="primary">🏢 Company Information</Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12}>
            <TextField fullWidth label="Company Name" value={settings.company_name}
              onChange={(e) => setSettings({...settings, company_name: e.target.value})} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Phone" value={settings.company_phone}
              onChange={(e) => setSettings({...settings, company_phone: e.target.value})} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Email" value={settings.company_email}
              onChange={(e) => setSettings({...settings, company_email: e.target.value})} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={2} label="Address" value={settings.company_address}
              onChange={(e) => setSettings({...settings, company_address: e.target.value})} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="GST Number" value={settings.gst_number}
              onChange={(e) => setSettings({...settings, gst_number: e.target.value})} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Default Rates */}
        <Typography variant="h6" mb={2} color="primary">💰 Default Rates</Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6}>
            <TextField fullWidth type="number" label="Default Khoraki Rate" value={settings.default_khoraki_rate}
              onChange={(e) => setSettings({...settings, default_khoraki_rate: e.target.value})} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth type="number" label="Max Advance Limit" value={settings.max_advance_limit}
              onChange={(e) => setSettings({...settings, max_advance_limit: e.target.value})} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Toggles */}
        <Typography variant="h6" mb={2} color="primary">⚙️ Preferences</Typography>
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box><Notifications /><Typography display="inline" ml={1}>SMS Notifications</Typography></Box>
            <Switch checked={settings.enable_sms} onChange={(e) => setSettings({...settings, enable_sms: e.target.checked})} />
          </CardContent>
        </Card>
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box><Security /><Typography display="inline" ml={1}>Auto Backup</Typography></Box>
            <Switch checked={settings.enable_backup} onChange={(e) => setSettings({...settings, enable_backup: e.target.checked})} />
          </CardContent>
        </Card>

        <Button variant="contained" fullWidth size="large" startIcon={<Save />}
          onClick={handleSave} sx={{ py: 1.5 }}>
          Save Settings
        </Button>
      </Paper>
    </Box>
  );
};

export default Settings;