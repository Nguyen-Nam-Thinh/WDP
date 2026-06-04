import { createBrowserRouter } from "react-router";
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

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/horse-owner",
    element: <HorseOwnerDashboard />,
  },
  {
    path: "/jockey",
    element: <JockeyDashboard />,
  },
  {
    path: "/referee",
    element: <RefereeDashboard />,
  },
  {
    path: "/spectator",
    element: <SpectatorDashboard />,
  },
  {
    path: "/tournaments",
    element: <TournamentsPage />,
  },
  {
    path: "/rankings",
    element: <RankingsPage />,
  },
  {
    path: "/predictions",
    element: <PredictionsPage />,
  },
  {
    path: "/spectator/bet-history",
    element: <BetHistoryPage />,
  },
  {
    path: "/spectator/deposit-history",
    element: <DepositHistoryPage />,
  },
  {
    path: "/spectator/profile",
    element: <ProfilePage />,
  },
  {
    path: "/spectator/deposit",
    element: <DepositPortalPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/spectator/race/:raceId",
    element: <LiveRacePage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

