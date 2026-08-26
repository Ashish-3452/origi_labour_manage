import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css';
import LabourRegistration from './pages/LabourRegistration';
import LabourList from './pages/LabourList';
import MarkAttendance from './pages/MarkAttendance';
import AdvancePayment from './pages/AdvancePayment';
import KhorakiManagement from './pages/KhorakiManagement';
import SupervisorManagement from './pages/SupervisorManagement';
import ExpenseManagement from './pages/ExpenseManagement';
import ProfitDashboard from './pages/ProfitDashboard';
import BillGeneration from './pages/BillGeneration';
import ThekaWork from './pages/ThekaWork';
import UserManagement from './pages/UserManagement';
import SiteManagement from './pages/SiteManagement';
import CategoryManagement from './pages/CategoryManagement';
import ActivityLog from './pages/ActivityLog';
import Settings from './pages/Settings';




const theme = createTheme({
  palette: {
    primary: { main: '#1a237e' },
    secondary: { main: '#dc004e' },
    success: { main: '#4caf50' },
    warning: { main: '#ff9800' },
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/labour/register" element={<LabourRegistration />} />
<Route path="/labour/list" element={<LabourList />} />
<Route path="/attendance/mark" element={<MarkAttendance />} />
<Route path="/payments/advance" element={<AdvancePayment />} />
<Route path="/khoraki" element={<KhorakiManagement />} />
<Route path="/supervisors" element={<SupervisorManagement />} />
<Route path="/expenses" element={<ExpenseManagement />} />
<Route path="/profit" element={<ProfitDashboard />} />
<Route path="/bills" element={<BillGeneration />} />
<Route path="/theka" element={<ThekaWork />} />
<Route path="/users" element={<UserManagement />} />
<Route path="/sites" element={<SiteManagement />} />
<Route path="/categories" element={<CategoryManagement />} />
<Route path="/activity" element={<ActivityLog />} />
<Route path="/settings" element={<Settings />} />





        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;