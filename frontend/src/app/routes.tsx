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
import { BetHistoryPage } from "./pages/BetHistoryPage";
import { DepositHistoryPage } from "./pages/DepositHistoryPage";
import { ProfilePage } from "./pages/ProfilePage";
import { DepositPortalPage } from "./pages/DepositPortalPage";
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
      { path: "/spectator", element: <SpectatorDashboard /> },
      { path: "/spectator/tournaments", element: <SpectatorDashboard /> },
      { path: "/spectator/live", element: <SpectatorDashboard /> },
      { path: "/spectator/schedule", element: <SpectatorDashboard /> },
      { path: "/spectator/predictions", element: <SpectatorDashboard /> },
      { path: "/spectator/rankings", element: <SpectatorDashboard /> },
      { path: "/spectator/leaderboard", element: <SpectatorDashboard /> },
      { path: "/spectator/bet-history", element: <BetHistoryPage /> },
      { path: "/spectator/deposit-history", element: <DepositHistoryPage /> },
      { path: "/spectator/profile", element: <ProfilePage /> },
      { path: "/spectator/deposit", element: <DepositPortalPage /> },
      { path: "/spectator/race/:raceId", element: <LiveRacePage /> },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);

