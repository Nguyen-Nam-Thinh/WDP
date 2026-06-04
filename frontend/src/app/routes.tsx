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

// Chặn truy cập nếu chưa đăng nhập, redirect về /login
function RequireAuth() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
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
      { path: "/jockey", element: <JockeyDashboard /> },
      { path: "/referee", element: <RefereeDashboard /> },
      { path: "/spectator", element: <SpectatorDashboard /> },
      { path: "/spectator/bet-history", element: <BetHistoryPage /> },
      { path: "/spectator/deposit-history", element: <DepositHistoryPage /> },
      { path: "/spectator/profile", element: <ProfilePage /> },
      { path: "/spectator/deposit", element: <DepositPortalPage /> },
      { path: "/spectator/race/:raceId", element: <LiveRacePage /> },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);

