import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { useAuth } from "./hooks/useAuth";
import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { HorseOwnerDashboard } from "./pages/HorseOwnerDashboard";
import { JockeyDashboard } from "./pages/JockeyDashboard";
import { RefereeDashboard } from "./pages/RefereeDashboard";
import { SpectatorDashboard } from "./pages/SpectatorDashboard";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { TournamentsPage } from "./pages/TournamentsPage";
import { RankingsPage } from "./pages/RankingsPage";
import { PredictionsPage } from "./pages/PredictionsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ForgotPassword } from "./pages/ForgotPassword";
import { LiveRacePage } from "./pages/LiveRacePage";

// Chặn truy cập nếu chưa đăng nhập hoặc là admin
function RequireAuth() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if ((user?.role as string) === 'admin') return <Navigate to="/login" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  // Public — không cần đăng nhập
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/tournaments", element: <TournamentsPage /> },
  { path: "/rankings", element: <RankingsPage /> },
  { path: "/predictions", element: <PredictionsPage /> },

  // Protected — phải đăng nhập
  {
    element: <RequireAuth />,
    children: [
      { path: "/horse-owner", element: <HorseOwnerDashboard /> },
      { path: "/horse-owner/horses", element: <HorseOwnerDashboard /> },
      { path: "/horse-owner/jockeys", element: <HorseOwnerDashboard /> },
      { path: "/horse-owner/schedule", element: <HorseOwnerDashboard /> },
      { path: "/horse-owner/results", element: <HorseOwnerDashboard /> },
      { path: "/horse-owner/wallet", element: <HorseOwnerDashboard /> },
      { path: "/jockey", element: <JockeyDashboard /> },
      { path: "/jockey/invitations", element: <JockeyDashboard /> },
      { path: "/jockey/schedule", element: <JockeyDashboard /> },
      { path: "/jockey/results", element: <JockeyDashboard /> },
      { path: "/referee", element: <RefereeDashboard /> },
      { path: "/referee/pre-check", element: <RefereeDashboard /> },
      { path: "/referee/reports", element: <RefereeDashboard /> },
      { path: "/spectator/profile", element: <ProfilePage /> },
      { path: "/spectator/race/:raceId", element: <LiveRacePage /> },
      { path: "/spectator/*", element: <SpectatorDashboard /> },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);

