import { ThemeProvider, createTheme } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import AdminLayout from './components/AdminLayout';
import Dashboard from './components/pages/Dashboard';
import UserManagement from './components/pages/UserManagement';
import TournamentManagement from './components/pages/TournamentManagement';
import RaceManagement from './components/pages/RaceManagement';
import RegistrationApproval from './components/pages/RegistrationApproval';
import RefereeAssignment from './components/pages/RefereeAssignment';
import ResultsPublishing from './components/pages/ResultsPublishing';
import SpectatorPrediction from './components/pages/predictions/SpectatorPrediction';
import CreatePrediction from './components/pages/predictions/CreatePrediction';
import LivePrediction from './components/pages/predictions/LivePrediction';
import PredictionLeaderboard from './components/pages/predictions/PredictionLeaderboard';
import PredictionAnalytics from './components/pages/predictions/PredictionAnalytics';
import MyPredictions from './components/pages/predictions/MyPredictions';
import AdminPredictionControl from './components/pages/predictions/AdminPredictionControl';

const theme = createTheme({
  palette: {
    primary: {
      main: '#030213',
    },
    secondary: {
      main: '#667eea',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <div className="size-full">
          <AdminLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/tournaments" element={<TournamentManagement />} />
              <Route path="/races" element={<RaceManagement />} />
              <Route path="/registrations" element={<RegistrationApproval />} />
              <Route path="/referees" element={<RefereeAssignment />} />
              <Route path="/results" element={<ResultsPublishing />} />

              {/* Prediction System Routes */}
              <Route path="/predictions" element={<SpectatorPrediction />} />
              <Route path="/predictions/create" element={<CreatePrediction />} />
              <Route path="/predictions/live" element={<LivePrediction />} />
              <Route path="/predictions/leaderboard" element={<PredictionLeaderboard />} />
              <Route path="/predictions/analytics" element={<PredictionAnalytics />} />
              <Route path="/predictions/my-predictions" element={<MyPredictions />} />
              <Route path="/predictions/admin" element={<AdminPredictionControl />} />
            </Routes>
          </AdminLayout>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}