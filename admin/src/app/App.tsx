import { ThemeProvider, createTheme, CircularProgress, Box } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router';
import { Toaster } from 'sonner';
import AdminLayout from './components/AdminLayout';
import Dashboard from './components/pages/Dashboard';
import UserManagement from './components/pages/UserManagement';
import TournamentManagement from './components/pages/TournamentManagement';
import RaceManagement from './components/pages/RaceManagement';
import RegistrationApproval from './components/pages/RegistrationApproval';
import RefereeAssignment from './components/pages/RefereeAssignment';
import ResultsPublishing from './components/pages/ResultsPublishing';
import BetManagement from './components/pages/BetManagement';
import Login from './pages/Login';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';

const theme = createTheme({
  palette: {
    primary: { main: '#030213' },
    secondary: { main: '#667eea' },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  shape: { borderRadius: 8 },
});

function ProtectedLayout() {
  const { user, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#030213' }}>
        <CircularProgress sx={{ color: '#d4a017' }} />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <AdminAuthProvider>
        <Toaster theme="light" position="top-right" richColors />
        <BrowserRouter>
          <div className="size-full">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/tournaments" element={<TournamentManagement />} />
                <Route path="/races" element={<RaceManagement />} />
                <Route path="/registrations" element={<RegistrationApproval />} />
                <Route path="/referees" element={<RefereeAssignment />} />
                <Route path="/results" element={<ResultsPublishing />} />
                <Route path="/bets" element={<BetManagement />} />
              </Route>
            </Routes>
          </div>
        </BrowserRouter>
      </AdminAuthProvider>
    </ThemeProvider>
  );
}
