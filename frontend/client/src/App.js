import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
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
import ProtectedRoute from './components/ProtectedRoute';
import LabourSiteRates from './pages/LabourSiteRates';
import './App.css';

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
          {/* Public route */}
          <Route path="/" element={<Login />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/labour/register" element={
            <ProtectedRoute>
              <LabourRegistration />
            </ProtectedRoute>
          } />

          <Route path="/labour/list" element={
            <ProtectedRoute>
              <LabourList />
            </ProtectedRoute>
          } />

          <Route path="/attendance/mark" element={
            <ProtectedRoute>
              <MarkAttendance />
            </ProtectedRoute>
          } />

          <Route path="/payments/advance" element={
            <ProtectedRoute>
              <AdvancePayment />
            </ProtectedRoute>
          } />

          <Route path="/khoraki" element={
            <ProtectedRoute>
              <KhorakiManagement />
            </ProtectedRoute>
          } />

          <Route path="/supervisors" element={
            <ProtectedRoute>
              <SupervisorManagement />
            </ProtectedRoute>
          } />

          <Route path="/expenses" element={
            <ProtectedRoute>
              <ExpenseManagement />
            </ProtectedRoute>
          } />

          <Route path="/profit" element={
            <ProtectedRoute>
              <ProfitDashboard />
            </ProtectedRoute>
          } />

          <Route path="/bills" element={
            <ProtectedRoute>
              <BillGeneration />
            </ProtectedRoute>
          } />

          <Route path="/theka" element={
            <ProtectedRoute>
              <ThekaWork />
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } />

          <Route path="/sites" element={
            <ProtectedRoute>
              <SiteManagement />
            </ProtectedRoute>
          } />

          <Route path="/categories" element={
            <ProtectedRoute>
              <CategoryManagement />
            </ProtectedRoute>
          } />

          <Route path="/activity" element={
            <ProtectedRoute>
              <ActivityLog />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          // Protected route:
<Route path="/labour/site-rates" element={
  <ProtectedRoute>
    <LabourSiteRates />
  </ProtectedRoute>
} />

          {/* Catch-all - should be last */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;