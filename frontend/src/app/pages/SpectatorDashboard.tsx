import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Calendar,
  Trophy,
  TrendingUp,
  Target,
  Gift,
  Play,
  Medal,
  Sparkles,
  Flame,
  Award,
  Activity,
  ChevronRight,
  Coins,
  Eye,
  CheckCircle,
  AlertCircle,
  Wallet,
  History,
  Home,
  XCircle,
  Clock,
  Shield,
  Building2,
  CreditCard,
  Smartphone,
  Bitcoin,
  Copy,
  Search,
} from "lucide-react";
import {
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AppShell, type NavItem } from "../components/layout/AppShell";
import { Pagination } from "../components/Pagination";
import { useAuth } from "../hooks/useAuth";
import { useWallet } from "../hooks/useWallet";
import { raceApi, type Race } from "../api/race";
import { betApi, type Bet, type BetType, BET_MULTIPLIERS } from "../api/bet";
import { tournamentApi, type Tournament } from "../api/tournament";
import {
  rankingsApi,
  type HorseRanking,
  type JockeyRanking,
  type OwnerRanking,
  type SpectatorRanking,
} from "../api/rankings";
import { userApi, type SpectatorOverview, type Transaction } from "../api/user";
import { rewardApi, type Reward, type Redemption } from "../api/reward";
import { toast } from "sonner";

const SPECTATOR_NAV: NavItem[] = [
  { to: "/spectator", label: "Tổng Quan", icon: <Home /> },
  { to: "/spectator/tournaments", label: "Giải Đấu", icon: <Sparkles /> },
  { to: "/spectator/live", label: "Đang Trực Tiếp", icon: <Play /> },
  { to: "/spectator/schedule", label: "Lịch Trình", icon: <Calendar /> },
  { to: "/spectator/predictions", label: "Dự Đoán Của Tôi", icon: <Target /> },
  { to: "/spectator/rankings", label: "Bảng Xếp Hạng", icon: <Trophy /> },
  { to: "/spectator/leaderboard", label: "Bảng Dẫn Đầu", icon: <Award /> },
  // { to: "/spectator/bet-history", label: "Lịch Sử Cược", icon: <History /> },
  { to: "/spectator/deposit", label: "Nạp Tiền", icon: <Wallet /> },
  { to: "/spectator/deposit-history", label: "Lịch Sử Nạp", icon: <Coins /> },
  { to: "/spectator/rewards", label: "Đổi Thưởng", icon: <Gift /> },
];

// MUI input style cho nền sáng
const lightSelectSx = {
  color: "#23201A",
  ".MuiOutlinedInput-notchedOutline": { borderColor: "#E3DCCB" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#C9C2B0" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#1F3D2B" },
  ".MuiSvgIcon-root": { color: "#7A7468" },
  background: "#FFFFFF",
  borderRadius: 0,
};

export function SpectatorDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { balance, formatted: walletBalance, refetch: refetchWallet, adjustBalance } = useWallet();
  const { pathname, search } = useLocation();
  const activeTab =
    pathname === "/spectator/live"
      ? "live"
      : pathname === "/spectator/schedule"
        ? "schedule"
        : pathname === "/spectator/predictions"
          ? "predictions"
          : pathname === "/spectator/rankings"
            ? "rankings"
            : pathname === "/spectator/leaderboard"
              ? "leaderboard"
              : pathname === "/spectator/tournaments"
                ? "tournaments"
                : pathname === "/spectator/bet-history"
                  ? "bet-history"
                  : pathname === "/spectator/deposit"
                    ? "deposit"
                    : pathname === "/spectator/deposit-history"
                      ? "deposit-history"
                      : pathname === "/spectator/rewards"
                        ? "rewards"
                        : "overview";
  const [predictionModalOpen, setPredictionModalOpen] = useState(false);
  const [tournamentDetailsModalOpen, setTournamentDetailsModalOpen] =
    useState(false);

  // ── Overview stats ──
  const [overview, setOverview] = useState<SpectatorOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const loadOverview = async () => {
    if (!token) return;
    setLoadingOverview(true);
    try {
      const data = await userApi.getOverviewStats(token);
      setOverview(data as unknown as SpectatorOverview);
    } catch {
      /* silently ignore */
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (token && activeTab === "overview") loadOverview();
  }, [token, activeTab]);

  // Quay về từ Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(search);
    const topup = params.get("topup");
    if (topup === "success") {
      toast.success("Nạp coin thành công! Số dư sẽ cập nhật trong giây lát.");
      // webhook cộng coin bất đồng bộ -> refetch sau vài giây
      refetchWallet();
      const t = setTimeout(() => refetchWallet(), 3000);
      navigate("/spectator/deposit-history", { replace: true });
      return () => clearTimeout(t);
    }
    if (topup === "cancel") {
      toast.info("Bạn đã hủy giao dịch nạp coin");
      navigate("/spectator/deposit", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ── Real tournaments ──
  const [tournamentsData, setTournamentsData] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);

  const loadTournaments = async () => {
    if (!token) return;
    setLoadingTournaments(true);
    try {
      const res = await tournamentApi.getTournaments(token);
      setTournamentsData(res.tournaments ?? []);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải giải đấu");
    } finally {
      setLoadingTournaments(false);
    }
  };

  // ── Real races for Schedule tab ──
  const [liveRacesData, setLiveRacesData] = useState<Race[]>([]);
  const [scheduleRaces, setScheduleRaces] = useState<Race[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [selectedRaceRegistrations, setSelectedRaceRegistrations] = useState<
    any[]
  >([]);

  // ── Real bets ──
  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);
  const [placingBet, setPlacingBet] = useState(false);
  const [cancellingBetId, setCancellingBetId] = useState<string | null>(null);

  const loadSchedule = async () => {
    if (!token) return;
    setLoadingSchedule(true);
    try {
      const [openRes, runningRes, preCheckRes, closedRes] = await Promise.all([
        raceApi.getRaces(token, { status: "open", limit: 30 }),
        raceApi.getRaces(token, { status: "running", limit: 10 }),
        raceApi.getRaces(token, { status: "pre_check", limit: 10 }),
        raceApi.getRaces(token, { status: "closed", limit: 10 }),
      ]);
      // Schedule tab: open races + closed races (registration closed but betting may still be open)
      setScheduleRaces([...(openRes.races ?? []), ...(closedRes.races ?? [])]);
      // Live tab shows running + pre_check
      setLiveRacesData([
        ...(runningRes.races ?? []),
        ...(preCheckRes.races ?? []),
      ]);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải lịch đua");
    } finally {
      setLoadingSchedule(false);
    }
  };

  const loadMyBets = async () => {
    if (!token) return;
    setLoadingBets(true);
    try {
      const res = await betApi.getMyBets(token, { limit: 50 });
      setMyBets(res.bets ?? []);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải lịch sử cược");
    } finally {
      setLoadingBets(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tournaments") loadTournaments();
    if (activeTab === "schedule" || activeTab === "live") loadSchedule();
    if (activeTab === "predictions" || activeTab === "bet-history") loadMyBets();
    if (activeTab === "rankings") loadRankings();
    if (activeTab === "leaderboard") loadLeaderboard();
    if (activeTab === "deposit-history") loadTransactions();
    if (activeTab === "rewards") {
      loadRewards();
      loadRedemptions();
    }
    setTournamentPage(1); setTournamentSearch('');
    setLivePage(1); setLiveSearch('');
    setSchedulePage(1); setScheduleSearch('');
    setRankingsPage(1); setRankingsSearch('');
    setLeaderboardPage(1); setLeaderboardSearch('');
    setRewardsPage(1); setRedemptionsPage(1);
  }, [activeTab, token]);

  // Load bets on mount để stats cards dùng dữ liệu thật
  useEffect(() => {
    if (token) loadMyBets();
  }, [token]);
  const [depositMethod, setDepositMethod] = useState("bank");
  const [depositAmountInput, setDepositAmountInput] = useState("");
  const [betPage, setBetPage] = useState(1);
  const [depositHistoryPage, setDepositHistoryPage] = useState(1);
  const [tournamentPage, setTournamentPage] = useState(1);
  const [tournamentSearch, setTournamentSearch] = useState('');
  const [livePage, setLivePage] = useState(1);
  const [liveSearch, setLiveSearch] = useState('');
  const [schedulePage, setSchedulePage] = useState(1);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [rankingsPage, setRankingsPage] = useState(1);
  const [rankingsSearch, setRankingsSearch] = useState('');
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [leaderboardSearch, setLeaderboardSearch] = useState('');
  const [myTransactions, setMyTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [myRedemptions, setMyRedemptions] = useState<Redemption[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);
  const [rewardsPage, setRewardsPage] = useState(1);
  const [redemptionsPage, setRedemptionsPage] = useState(1);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemConfirmOpen, setRedeemConfirmOpen] = useState(false);
  const [pendingReward, setPendingReward] = useState<Reward | null>(null);
  const [redeemResultOpen, setRedeemResultOpen] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{
    type: "success" | "error";
    message: string;
    redemption?: Redemption;
  } | null>(null);
  const [copiedVoucherId, setCopiedVoucherId] = useState<string | null>(null);
  const PAGE_SIZE = 10;
  const [depositStep, setDepositStep] = useState(1);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [selectedTournamentForDetails, setSelectedTournamentForDetails] =
    useState<any>(null);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [betType, setBetType] = useState("win");
  const [selectedHorse, setSelectedHorse] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [rankingType, setRankingType] = useState("horses");
  const [tournamentFilter, setTournamentFilter] = useState("all");

  // ── Real rankings data ──
  const [horseRankings, setHorseRankings] = useState<HorseRanking[]>([]);
  const [jockeyRankings, setJockeyRankings] = useState<JockeyRanking[]>([]);
  const [ownerRankings, setOwnerRankings] = useState<OwnerRanking[]>([]);
  const [spectatorRankings, setSpectatorRankings] = useState<
    SpectatorRanking[]
  >([]);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const loadRankings = async () => {
    if (!token) return;
    setLoadingRankings(true);
    try {
      const [horses, jockeys, owners] = await Promise.all([
        rankingsApi.getHorseRankings(token),
        rankingsApi.getJockeyRankings(token),
        rankingsApi.getOwnerRankings(token),
      ]);
      setHorseRankings(horses);
      setJockeyRankings(jockeys);
      setOwnerRankings(owners);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải bảng xếp hạng");
    } finally {
      setLoadingRankings(false);
    }
  };

  const loadLeaderboard = async () => {
    if (!token) return;
    setLoadingLeaderboard(true);
    try {
      const data = await rankingsApi.getSpectatorLeaderboard(token);
      setSpectatorRankings(data);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải bảng dẫn đầu");
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const loadTransactions = async () => {
    if (!token) return;
    setLoadingTransactions(true);
    try {
      const res = await userApi.getMyTransactions(token, 1, 100);
      setMyTransactions(res.transactions ?? []);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải lịch sử giao dịch');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadRewards = async () => {
    if (!token) return;
    setLoadingRewards(true);
    try {
      const data = await rewardApi.getRewards(token);
      setRewards(data);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách phần thưởng");
    } finally {
      setLoadingRewards(false);
    }
  };

  const loadRedemptions = async () => {
    if (!token) return;
    setLoadingRedemptions(true);
    try {
      const data = await rewardApi.getMyRedemptions(token);
      setMyRedemptions(data);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải lịch sử đổi thưởng");
    } finally {
      setLoadingRedemptions(false);
    }
  };

  const openRedeemConfirm = (reward: Reward) => {
    const currentBalance = balance ?? 0;
    if (currentBalance < reward.coinsRequired) {
      setRedeemResult({
        type: "error",
        message: "Số dư ví không đủ để đổi phần quà này",
      });
      setRedeemResultOpen(true);
      return;
    }
    setPendingReward(reward);
    setRedeemConfirmOpen(true);
  };

  const confirmRedeem = async () => {
    if (!token || !pendingReward) return;
    const reward = pendingReward;
    const costInCoins = reward.coinsRequired;

    setRedeemConfirmOpen(false);
    setRedeemingId(reward._id);

    adjustBalance(-costInCoins);
    setRewards((prev) =>
      prev.map((r) =>
        r._id === reward._id ? { ...r, stock: Math.max(0, r.stock - 1) } : r,
      ),
    );

    try {
      const redemption = await rewardApi.redeem(token, reward._id);
      setMyRedemptions((prev) => [redemption, ...prev]);
      setRedeemResult({
        type: "success",
        message: "Đổi phần thưởng thành công! Mã voucher đã được tạo.",
        redemption,
      });
      setRedeemResultOpen(true);
      refetchWallet();
    } catch (err: any) {
      adjustBalance(costInCoins);
      setRewards((prev) =>
        prev.map((r) =>
          r._id === reward._id ? { ...r, stock: r.stock + 1 } : r,
        ),
      );
      setRedeemResult({
        type: "error",
        message: err.message || "Đổi thưởng thất bại",
      });
      setRedeemResultOpen(true);
    } finally {
      setRedeemingId(null);
      setPendingReward(null);
    }
  };

  const handleStripeTopup = async () => {
    if (!token) return;
    const coins = Number(depositAmountInput);
    if (!coins || coins <= 0) {
      toast.error("Vui lòng nhập số coin hợp lệ");
      return;
    }
    setStripeLoading(true);
    try {
      const { url } = await userApi.createTopup(token, coins);
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || "Không thể tạo phiên thanh toán");
      setStripeLoading(false);
    }
  };

  const topupTransactions = myTransactions.filter(t => t.type === 'topup');

  const pendingBets = myBets.filter((b) => b.status === "pending").length;
  const wonBets = myBets.filter((b) => b.status === "won").length;
  const settledBets = myBets.filter(
    (b) => b.status === "won" || b.status === "lost",
  ).length;
  const winRate =
    settledBets > 0 ? Math.round((wonBets / settledBets) * 100) : 0;
  const totalWinnings = myBets.reduce((s, b) => s + (b.payoutAmount || 0), 0);

  const stats = [
    {
      label: "Số Dư Ví",
      value: walletBalance ?? "...",
      icon: Coins,
      iconCls: "bg-gold text-foreground",
    },
    {
      label: "Cược Đang Chờ",
      value: String(pendingBets),
      icon: Target,
      iconCls: "bg-primary text-primary-foreground",
    },
    {
      label: "Tỷ Lệ Thắng",
      value: settledBets > 0 ? `${winRate}%` : "—",
      icon: TrendingUp,
      iconCls: "bg-secondary text-white",
    },
    {
      label: "Tổng Tiền Thắng",
      value: totalWinnings > 0 ? `+${totalWinnings.toLocaleString('vi-VN')} coins` : "0 coins",
      icon: Gift,
      iconCls: "bg-[#7A7468] text-white",
    },
  ];

  const handleOpenPrediction = async (race: any) => {
    setSelectedRace(race);
    setSelectedHorse("");
    setBetAmount("");
    setBetType("win");
    setSelectedRaceRegistrations([]);
    setPredictionModalOpen(true);
    if (token) {
      try {
        const res = await raceApi.getRaceHorses(token, race._id);
        setSelectedRaceRegistrations(res.horses ?? []);
      } catch {
        // silently ignore
      }
    }
  };

  const handleOpenTournamentDetails = (tournament: any) => {
    setSelectedTournamentForDetails(tournament);
    setTournamentDetailsModalOpen(true);
  };

  const handleSubmitPrediction = async () => {
    if (!token || !selectedRace || !selectedHorse || !betAmount) return;
    const amount = Number(betAmount);
    if (isNaN(amount) || amount < 1) {
      toast.error("Số tiền cược tối thiểu là 1");
      return;
    }
    setPlacingBet(true);
    try {
      await betApi.place(token, {
        raceId: selectedRace._id,
        horseId: selectedHorse,
        betType: betType as BetType,
        amount,
      });
      toast.success(
        `Đặt cược thành công! Tiềm năng thắng: ${Math.floor(amount * BET_MULTIPLIERS[betType as BetType]).toLocaleString('vi-VN')} coins`,
      );
      setPredictionModalOpen(false);
      setBetType("win");
      setSelectedHorse("");
      setBetAmount("");
      if (activeTab === "predictions") loadMyBets();
    } catch (err: any) {
      toast.error(err.message || "Đặt cược thất bại");
    } finally {
      setPlacingBet(false);
    }
  };

  const handleCancelBet = async (betId: string) => {
    if (!token || !confirm("Hủy cược? Bạn sẽ được hoàn 100% tiền.")) return;
    setCancellingBetId(betId);
    try {
      await betApi.cancel(token, betId);
      toast.success("Đã hủy cược, tiền đã được hoàn trả");
      loadMyBets();
    } catch (err: any) {
      toast.error(err.message || "Hủy cược thất bại");
    } finally {
      setCancellingBetId(null);
    }
  };

  const getTournamentStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-secondary";
      case "upcoming":
        return "bg-primary";
      case "finished":
        return "bg-[#7A7468]";
      case "cancelled":
        return "bg-destructive";
      default:
        return "bg-[#7A7468]";
    }
  };

  const getTournamentStatusHex = (status: string) => {
    switch (status) {
      case "ongoing":
        return "#8C2F1B";
      case "upcoming":
        return "#1F3D2B";
      case "finished":
        return "#7A7468";
      case "cancelled":
        return "#B42318";
      default:
        return "#7A7468";
    }
  };

  const getTournamentStatusLabel = (status: string) => {
    switch (status) {
      case "ongoing":
        return "Đang Diễn Ra";
      case "upcoming":
        return "Sắp Diễn Ra";
      case "finished":
        return "Đã Kết Thúc";
      case "cancelled":
        return "Đã Hủy";
      default:
        return status;
    }
  };

  const filteredTournaments = tournamentsData.filter((t) => {
    const statusOk = tournamentFilter === "all" || t.status === tournamentFilter;
    const searchOk = !tournamentSearch || t.name.toLowerCase().includes(tournamentSearch.toLowerCase());
    return statusOk && searchOk;
  });
  const pagedTournaments = filteredTournaments.slice((tournamentPage - 1) * PAGE_SIZE, tournamentPage * PAGE_SIZE);

  const filteredLive = liveRacesData.filter(r => !liveSearch || r.name.toLowerCase().includes(liveSearch.toLowerCase()));
  const pagedLive = filteredLive.slice((livePage - 1) * PAGE_SIZE, livePage * PAGE_SIZE);

  const filteredSchedule = scheduleRaces.filter(r => !scheduleSearch || r.name.toLowerCase().includes(scheduleSearch.toLowerCase()));
  const pagedSchedule = filteredSchedule.slice((schedulePage - 1) * PAGE_SIZE, schedulePage * PAGE_SIZE);

  const filteredLeaderboard = spectatorRankings.filter(e => !leaderboardSearch || e.name.toLowerCase().includes(leaderboardSearch.toLowerCase()));
  const pagedLeaderboard = filteredLeaderboard.slice((leaderboardPage - 1) * PAGE_SIZE, leaderboardPage * PAGE_SIZE);

  return (
    <AppShell roleLabel="SPECTATOR" nav={SPECTATOR_NAV}>
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards — only on overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stat cards */}
            {loadingOverview ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Số Dư Ví",
                      value: walletBalance ?? "...",
                      icon: Coins,
                      cls: "bg-gold text-foreground",
                      accent: "bg-gold",
                    },
                    {
                      label: "Cược Đang Chờ",
                      value: String(
                        overview?.pendingBets ??
                          myBets.filter((b) => b.status === "pending").length,
                      ),
                      icon: Clock,
                      cls: "bg-primary text-primary-foreground",
                      accent: "bg-primary",
                    },
                    {
                      label: "Tỷ Lệ Thắng",
                      value: overview
                        ? `${overview.winRate}%`
                        : settledBets > 0
                          ? `${winRate}%`
                          : "—",
                      icon: TrendingUp,
                      cls: "bg-secondary text-white",
                      accent: "bg-secondary",
                    },
                    {
                      label: "Tổng Tiền Thắng",
                      value: overview
                        ? overview.totalWinnings > 0
                          ? `+${overview.totalWinnings.toLocaleString('vi-VN')} coins`
                          : "0 coins"
                        : totalWinnings > 0
                          ? `+${totalWinnings.toLocaleString('vi-VN')} coins`
                          : "0 coins",
                      icon: Gift,
                      cls: "bg-[#7A7468] text-white",
                      accent: "bg-[#7A7468]",
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="relative bg-card border border-border p-5 hover:border-primary transition-colors flex flex-col overflow-hidden"
                    >
                      <div
                        className={`w-10 h-10 ${s.cls} flex items-center justify-center shrink-0 mb-3`}
                      >
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-bold text-foreground mb-1 tabular-nums break-all">
                        {s.value}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-auto">
                        {s.label}
                      </div>
                      <div
                        className={`absolute bottom-0 left-0 right-0 h-0.5 ${s.accent}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Bet summary chart */}
                  <div className="bg-card border border-border p-6">
                    <h3 className="font-serif text-lg font-bold text-foreground mb-4">
                      Thống Kê Cược
                    </h3>
                    {overview ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                          data={[
                            { name: "Thắng", value: overview.wonBets },
                            { name: "Thua", value: overview.lostBets },
                            { name: "Chờ", value: overview.pendingBets },
                          ]}
                          barSize={40}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#E3DCCB"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "#7A7468", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: "#7A7468", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#fff",
                              border: "1px solid #E3DCCB",
                              borderRadius: 0,
                              fontSize: 12,
                            }}
                          />
                          <Bar dataKey="value" radius={0}>
                            <Cell fill="#1F3D2B" />
                            <Cell fill="#B42318" />
                            <Cell fill="#C9A227" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                        Chưa có dữ liệu
                      </div>
                    )}
                    <div className="flex gap-4 mt-3">
                      {[
                        { c: "bg-primary", l: "Thắng" },
                        { c: "bg-destructive", l: "Thua" },
                        { c: "bg-gold", l: "Đang chờ" },
                      ].map((x) => (
                        <div
                          key={x.l}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <div className={`w-2.5 h-2.5 ${x.c}`} />
                          {x.l}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent bets */}
                  <div className="bg-card border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-serif text-lg font-bold text-foreground">
                        Cược Gần Đây
                      </h3>
                      <button
                        type="button"
                        onClick={() => navigate("/spectator/predictions")}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Xem tất cả <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    {(overview?.recentBets ?? myBets.slice(0, 5)).length ===
                    0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Chưa có cược nào
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(overview?.recentBets ?? myBets.slice(0, 5)).map(
                          (bet: any, i: number) => {
                            const race = bet.raceId;
                            const horse = bet.horseId;
                            const statusMap: Record<
                              string,
                              { icon: any; cls: string; label: string }
                            > = {
                              won: {
                                icon: CheckCircle,
                                cls: "text-primary",
                                label: "Thắng",
                              },
                              lost: {
                                icon: XCircle,
                                cls: "text-destructive",
                                label: "Thua",
                              },
                              pending: {
                                icon: Clock,
                                cls: "text-[#8F7318]",
                                label: "Chờ",
                              },
                              cancelled: {
                                icon: XCircle,
                                cls: "text-muted-foreground",
                                label: "Hủy",
                              },
                            };
                            const st =
                              statusMap[bet.status] ?? statusMap.pending;
                            const betTypeLabel: Record<string, string> = {
                              win: "Win",
                              place: "Place",
                              show: "Show",
                            };
                            return (
                              <div
                                key={bet._id ?? i}
                                className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-foreground truncate">
                                    {race?.name ?? "—"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {horse?.name ?? "—"} ·{" "}
                                    {betTypeLabel[bet.betType] ?? bet.betType}
                                  </div>
                                </div>
                                <div className="text-right shrink-0 ml-4">
                                  <div
                                    className={`flex items-center gap-1 text-xs font-semibold ${st.cls}`}
                                  >
                                    <st.icon className="w-3.5 h-3.5" />
                                    {st.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground tabular-nums">
                                    {bet.status === "won"
                                      ? `+${(bet.payoutAmount || 0).toLocaleString('vi-VN')} coins`
                                      : `${bet.amount?.toLocaleString('vi-VN')} coins`}
                                  </div>
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: "Đặt Cược",
                      icon: Target,
                      to: "/spectator/schedule",
                      color: "bg-secondary text-white hover:bg-secondary/90",
                    },
                    {
                      label: "Xem Trực Tiếp",
                      icon: Play,
                      to: "/spectator/live",
                      color:
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                    },
                    {
                      label: "Nạp Xu",
                      icon: Coins,
                      to: "/spectator/deposit",
                      color: "bg-gold text-foreground hover:bg-gold/90",
                    },
                  ].map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => navigate(a.to)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 border border-border transition-colors ${a.color}`}
                    >
                      <a.icon className="w-5 h-5" />
                      <span className="text-sm font-semibold">{a.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tournaments Tab */}
        {activeTab === "tournaments" && (
          <div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
                  Giải Đấu
                </h2>
                <p className="text-muted-foreground">
                  Duyệt qua tất cả các giải đấu đua ngựa và thông tin chi tiết
                </p>
              </div>

              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm giải đấu..."
                    value={tournamentSearch}
                    onChange={e => { setTournamentSearch(e.target.value); setTournamentPage(1); }}
                    className="pl-9 pr-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-48"
                  />
                </div>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={tournamentFilter}
                    onChange={(e) => { setTournamentFilter(e.target.value); setTournamentPage(1); }}
                    sx={lightSelectSx}
                  >
                    <MenuItem key="all" value="all">Tất Cả Trạng Thái</MenuItem>
                    <MenuItem key="ongoing" value="ongoing">Đang Diễn Ra</MenuItem>
                    <MenuItem key="upcoming" value="upcoming">Sắp Diễn Ra</MenuItem>
                    <MenuItem key="finished" value="finished">Đã Kết Thúc</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            {loadingTournaments ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredTournaments.length === 0 ? (
              <div className="bg-card border border-border p-12 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Không có giải đấu nào</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pagedTournaments.map((tournament) => (
                  <div
                    key={tournament._id}
                    className="group bg-card border border-border overflow-hidden hover:border-primary transition-all"
                  >
                    <div
                      className="relative h-36 overflow-hidden flex items-end p-4 border-b border-border"
                      style={{
                        background: `linear-gradient(135deg, ${getTournamentStatusHex(tournament.status)}1F, ${getTournamentStatusHex(tournament.status)}08)`,
                      }}
                    >
                      <div className="absolute top-4 right-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getTournamentStatusColor(tournament.status)}`}
                        >
                          {getTournamentStatusLabel(tournament.status)}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-foreground leading-tight pr-24 relative z-10">
                        {tournament.name}
                      </h3>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">
                            Bắt Đầu
                          </div>
                          <div className="text-foreground font-medium">
                            {new Date(tournament.startDate).toLocaleDateString(
                              "vi-VN",
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">
                            Kết Thúc
                          </div>
                          <div className="text-foreground font-medium">
                            {new Date(tournament.endDate).toLocaleDateString(
                              "vi-VN",
                            )}
                          </div>
                        </div>
                      </div>

                      {tournament.location && (
                        <div className="bg-background border border-border p-3 mb-4 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-foreground text-sm">
                            {tournament.location}
                          </span>
                        </div>
                      )}

                      {tournament.description && (
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {tournament.description}
                        </p>
                      )}

                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleOpenTournamentDetails(tournament)}
                        endIcon={<ChevronRight className="w-4 h-4" />}
                        sx={{
                          borderColor: "#1F3D2B",
                          color: "#1F3D2B",
                          borderRadius: 0,
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "#1F3D2B",
                            backgroundColor: "rgba(31,61,43,0.06)",
                          },
                        }}
                      >
                        Xem Chi Tiết
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination
              page={tournamentPage}
              totalPages={Math.ceil(filteredTournaments.length / PAGE_SIZE)}
              onPageChange={setTournamentPage}
            />
          </div>
        )}

        {/* Live Races Tab */}
        {activeTab === "live" && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-3 h-3 bg-secondary rounded-full animate-pulse shrink-0" />
                <h2 className="font-serif text-3xl font-bold text-foreground">Đang Trực Tiếp</h2>
                <Chip
                  label={`${filteredLive.length} Đang Hoạt Động`}
                  size="small"
                  sx={{ backgroundColor: filteredLive.length > 0 ? "#8C2F1B" : "#7A7468", color: "white" }}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm cuộc đua..."
                    value={liveSearch}
                    onChange={e => { setLiveSearch(e.target.value); setLivePage(1); }}
                    className="pl-9 pr-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-44"
                  />
                </div>
                <button
                  type="button"
                  onClick={loadSchedule}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 shrink-0"
                >
                  <Activity className="w-3 h-3" />
                  Làm mới
                </button>
              </div>
            </div>

            {loadingSchedule ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredLive.length > 0 ? (
              <div className="space-y-6">
                {pagedLive.map((race) => {
                  const myBetOnRace = myBets.some(
                    (b) =>
                      (b.raceId as any)?._id === race._id &&
                      b.status === "pending",
                  );
                  const isRunning = race.status === "running";
                  const borderColor = isRunning
                    ? "border-secondary/40"
                    : "border-gold/50";
                  const statusLabel = isRunning
                    ? "TRỰC TIẾP"
                    : race.status === "pre_check"
                      ? "Chuẩn bị"
                      : "Đóng cược";
                  const statusBg = isRunning ? "#8C2F1B" : "#C9A227";
                  return (
                    <div
                      key={race._id}
                      className={`bg-card border ${borderColor} p-6`}
                    >
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div
                            className={`w-3 h-3 rounded-full animate-pulse shrink-0 ${isRunning ? "bg-secondary" : "bg-gold"}`}
                          />
                          <div>
                            <h3 className="font-serif text-xl font-bold text-foreground">
                              {race.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {race.distance}m •{" "}
                              {new Date(race.scheduledTime).toLocaleTimeString(
                                "vi-VN",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </p>
                          </div>
                          <Chip
                            label={statusLabel}
                            size="small"
                            sx={{
                              backgroundColor: statusBg,
                              color:
                                statusBg === "#C9A227" ? "#23201A" : "white",
                              fontWeight: "bold",
                            }}
                          />
                          {myBetOnRace && (
                            <Chip
                              label="✓ Bạn đã cược"
                              size="small"
                              sx={{
                                bgcolor: "#C9A227",
                                color: "#23201A",
                                fontWeight: "bold",
                                fontSize: "0.7rem",
                              }}
                            />
                          )}
                        </div>
                        <Chip
                          label={race.grade}
                          size="small"
                          sx={{
                            bgcolor: "rgba(201,162,39,0.15)",
                            color: "#8F7318",
                            border: "1px solid #C9A227",
                            fontWeight: "bold",
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                        <div className="bg-background border border-border p-3">
                          <div className="text-xs text-muted-foreground mb-1">
                            Cấp Hạng
                          </div>
                          <div className="text-foreground font-semibold">
                            {race.grade}
                          </div>
                        </div>
                        <div className="bg-background border border-border p-3">
                          <div className="text-xs text-muted-foreground mb-1">
                            Cự Ly
                          </div>
                          <div className="text-foreground font-semibold">
                            {race.distance}m
                          </div>
                        </div>
                        <div className="bg-background border border-border p-3">
                          <div className="text-xs text-muted-foreground mb-1">
                            Giải Thưởng
                          </div>
                          <div className="text-[#8F7318] font-semibold tabular-nums">
                            {race.purse.toLocaleString('vi-VN')} coins
                          </div>
                        </div>
                      </div>

                      <div
                        className={`${isRunning ? "bg-secondary/8 border-secondary/25" : "bg-gold/10 border-gold/40"} border p-4 mb-4 flex items-center gap-3`}
                      >
                        <div
                          className={`w-8 h-8 ${isRunning ? "bg-secondary/15" : "bg-gold/20"} rounded-full flex items-center justify-center shrink-0`}
                        >
                          <Activity
                            className={`w-4 h-4 ${isRunning ? "text-secondary" : "text-[#8F7318]"}`}
                          />
                        </div>
                        <div>
                          <div className="text-foreground text-sm font-medium">
                            {isRunning
                              ? "Cuộc đua đang diễn ra"
                              : "Cuộc đua sắp bắt đầu"}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Vào xem trực tiếp để theo dõi vị trí ngựa và nhận
                            kết quả ngay khi hoàn thành
                          </div>
                        </div>
                      </div>

                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Eye />}
                        onClick={() => navigate(`/spectator/race/${race._id}`)}
                        sx={{
                          background: "#8C2F1B",
                          borderRadius: 0,
                          py: 1.5,
                          fontWeight: 700,
                          textTransform: "none",
                          fontSize: "0.95rem",
                          boxShadow: "none",
                          "&:hover": {
                            background: "#6B2415",
                            boxShadow: "none",
                          },
                        }}
                      >
                        Xem Trực Tiếp
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-card border border-border p-12 text-center">
                <Play className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="font-serif text-xl text-foreground font-bold mb-2">
                  Không Có Cuộc Đua Trực Tiếp
                </h3>
                <p className="text-muted-foreground mb-6">
                  Hiện chưa có cuộc đua nào đang chạy
                </p>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/spectator/schedule")}
                  sx={{
                    borderColor: "#1F3D2B",
                    color: "#1F3D2B",
                    borderRadius: 0,
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "#1F3D2B",
                      backgroundColor: "rgba(31,61,43,0.06)",
                    },
                  }}
                >
                  Xem Lịch Trình Sắp Tới
                </Button>
              </div>
            )}
            <Pagination
              page={livePage}
              totalPages={Math.ceil(filteredLive.length / PAGE_SIZE)}
              onPageChange={setLivePage}
            />
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === "schedule" && (
          <div>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Lịch Trình Đua &amp; Đặt Cược</h2>
                <p className="text-muted-foreground">Các cuộc đua đang mở — đặt cược trước khi hết hạn</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm cuộc đua..."
                  value={scheduleSearch}
                  onChange={e => { setScheduleSearch(e.target.value); setSchedulePage(1); }}
                  className="pl-9 pr-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-48"
                />
              </div>
            </div>

            {loadingSchedule ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredSchedule.length === 0 ? (
              <div className="bg-card border border-border p-12 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Hiện không có cuộc đua nào đang mở đặt cược
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pagedSchedule.map((race) => {
                  const bettingCutoff = new Date(
                    new Date(race.scheduledTime).getTime() - 60 * 60 * 1000,
                  );
                  const cutoffPassed = new Date() > bettingCutoff;
                  const myBetOnRace = myBets.some(
                    (b) =>
                      (b.raceId as any)?._id === race._id &&
                      b.status === "pending",
                  );
                  const canBet =
                    (race.status === "open" || race.status === "closed") &&
                    !cutoffPassed;

                  return (
                    <div
                      key={race._id}
                      className="bg-card border border-border p-6 hover:border-primary transition-all"
                    >
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <Trophy className="w-5 h-5 text-[#8F7318]" />
                            <h3 className="font-serif text-xl font-bold text-foreground">
                              {race.name}
                            </h3>
                            <Chip
                              label={race.grade}
                              size="small"
                              sx={{
                                bgcolor: "rgba(201,162,39,0.15)",
                                color: "#8F7318",
                                border: "1px solid #C9A227",
                                fontWeight: "bold",
                                fontSize: "0.7rem",
                              }}
                            />
                            {myBetOnRace && (
                              <Chip
                                label="✓ Đã Đặt Cược"
                                size="small"
                                sx={{
                                  bgcolor: "#C9A227",
                                  color: "#23201A",
                                  fontWeight: "bold",
                                  fontSize: "0.7rem",
                                }}
                              />
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <div className="text-muted-foreground text-xs mb-1">
                                Thời Gian Đua
                              </div>
                              <div className="text-foreground font-medium">
                                {new Date(race.scheduledTime).toLocaleString(
                                  "vi-VN",
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-xs mb-1">
                                Cự Ly
                              </div>
                              <div className="text-foreground font-medium">
                                {race.distance}m
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-xs mb-1">
                                Giải Thưởng
                              </div>
                              <div className="text-[#8F7318] font-semibold tabular-nums">
                                {race.purse?.toLocaleString('vi-VN')} coins
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-xs mb-1">
                                Hạn Đặt Cược
                              </div>
                              <div
                                className={`font-medium text-sm ${cutoffPassed ? "text-destructive" : "text-primary"}`}
                              >
                                {bettingCutoff.toLocaleString("vi-VN")}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-center gap-3 lg:w-44">
                          {canBet ? (
                            <Button
                              fullWidth
                              variant="contained"
                              startIcon={<Target />}
                              onClick={() => handleOpenPrediction(race)}
                              sx={{
                                background: "#8C2F1B",
                                color: "white",
                                borderRadius: 0,
                                py: 1.5,
                                fontWeight: 700,
                                textTransform: "none",
                                boxShadow: "none",
                                "&:hover": {
                                  background: "#6B2415",
                                  boxShadow: "none",
                                },
                              }}
                            >
                              Đặt Cược
                            </Button>
                          ) : (
                            <div className="bg-gold/10 border border-gold/40 p-3 text-center">
                              <AlertCircle className="w-5 h-5 text-[#8F7318] mx-auto mb-1" />
                              <div className="text-xs text-[#8F7318] font-medium">
                                Đã Đóng Cược
                              </div>
                            </div>
                          )}
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Eye />}
                            onClick={() =>
                              navigate(`/spectator/race/${race._id}`)
                            }
                            sx={{
                              borderColor: "#E3DCCB",
                              color: "#7A7468",
                              borderRadius: 0,
                              py: 1,
                              fontWeight: 600,
                              textTransform: "none",
                              fontSize: "0.8rem",
                              "&:hover": {
                                borderColor: "#1F3D2B",
                                color: "#1F3D2B",
                                backgroundColor: "rgba(31,61,43,0.04)",
                              },
                            }}
                          >
                            Xem Race
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Pagination
              page={schedulePage}
              totalPages={Math.ceil(filteredSchedule.length / PAGE_SIZE)}
              onPageChange={setSchedulePage}
            />
          </div>
        )}

        {/* Deposit Tab */}
        {activeTab === "deposit" && (
          <div>
            <div className="mb-6">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
                Nạp Xu
              </h2>
              <p className="text-muted-foreground">
                An toàn · Nhanh chóng · Tiện lợi
              </p>
            </div>
            <div className="bg-card border border-border max-w-2xl mx-auto overflow-hidden">
              <div className="relative bg-gold/10 border-b border-border p-6">
                <div className="flex items-center justify-between relative">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gold flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-foreground">
                        Cổng Nạp Tiền
                      </h3>
                      <p className="text-muted-foreground text-sm mt-0.5">
                        An toàn · Nhanh chóng · Tiện lợi
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span className="text-primary text-xs font-semibold">
                        Bảo Mật SSL
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        Số Dư Hiện Tại
                      </div>
                      <div className="text-[#8F7318] font-bold text-lg tabular-nums">
                        {walletBalance ?? "..."}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-5">
                  {["Chọn Phương Thức", "Nhập Số Tiền", "Xác Nhận"].map(
                    (step, i) => (
                      <div key={i} className="flex items-center gap-2 flex-1">
                        <div
                          className={`flex items-center gap-2 ${i + 1 <= depositStep ? "text-[#8F7318]" : "text-muted-foreground/60"}`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                              i + 1 < depositStep
                                ? "bg-gold border-gold text-foreground"
                                : i + 1 === depositStep
                                  ? "border-gold text-[#8F7318]"
                                  : "border-border text-muted-foreground/60"
                            }`}
                          >
                            {i + 1 < depositStep ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                              i + 1
                            )}
                          </div>
                          <span className="text-xs font-medium whitespace-nowrap hidden sm:block">
                            {step}
                          </span>
                        </div>
                        {i < 2 && (
                          <div
                            className={`flex-1 h-0.5 mx-1 rounded-full ${i + 1 < depositStep ? "bg-gold" : "bg-muted"}`}
                          />
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="overflow-x-hidden">
                {depositStep === 1 && (
                  <div className="p-6 space-y-4">
                    <h3 className="font-serif text-foreground font-bold mb-4">
                      Chọn phương thức nạp tiền
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          id: "bank",
                          icon: Building2,
                          label: "Chuyển Khoản Ngân Hàng",
                          sub: "Vietcombank, Techcombank, MB Bank...",
                          time: "5-30 phút",
                          color: "text-primary",
                          limit: "Tối thiểu: $10",
                        },
                        {
                          id: "card",
                          icon: CreditCard,
                          label: "Thẻ Tín Dụng / Ghi Nợ",
                          sub: "Visa, Mastercard, JCB",
                          time: "1-5 phút",
                          color: "text-secondary",
                          limit: "Tối thiểu: $20",
                        },
                        {
                          id: "ewallet",
                          icon: Smartphone,
                          label: "Ví Điện Tử",
                          sub: "MoMo, ZaloPay, VNPay",
                          time: "Tức thì",
                          color: "text-secondary",
                          limit: "Tối thiểu: $5",
                        },
                        {
                          id: "crypto",
                          icon: Bitcoin,
                          label: "Tiền Điện Tử",
                          sub: "USDT (TRC20), BTC, ETH",
                          time: "10-30 phút",
                          color: "text-[#8F7318]",
                          limit: "Tối thiểu: $50",
                        },
                      ].map((method) => (
                        <button
                          type="button"
                          key={method.id}
                          onClick={() => setDepositMethod(method.id)}
                          className={`relative p-4 border-2 text-left transition-all hover:scale-[1.02] ${depositMethod === method.id ? "bg-primary/5 border-primary" : "bg-background border-border hover:border-muted-foreground/40"}`}
                        >
                          {depositMethod === method.id && (
                            <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                          <method.icon
                            className={`w-8 h-8 mb-3 ${method.color}`}
                          />
                          <div className="text-foreground font-semibold text-sm mb-1">
                            {method.label}
                          </div>
                          <div className="text-muted-foreground text-xs mb-2">
                            {method.sub}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-primary font-medium">
                              ⚡ {method.time}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {method.limit}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="bg-primary/5 border border-primary/20 p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-foreground">
                        <span className="font-semibold">Hướng Dẫn: </span>
                        Chọn phương thức nạp phù hợp với bạn. Tất cả giao dịch
                        đều được mã hóa và bảo mật. Nếu cần hỗ trợ, liên hệ 24/7
                        qua chat trực tiếp.
                      </div>
                    </div>
                  </div>
                )}

                {depositStep === 2 && (
                  <div className="p-6 space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gold/15 flex items-center justify-center">
                        {depositMethod === "bank" && (
                          <Building2 className="w-5 h-5 text-primary" />
                        )}
                        {depositMethod === "card" && (
                          <CreditCard className="w-5 h-5 text-secondary" />
                        )}
                        {depositMethod === "ewallet" && (
                          <Smartphone className="w-5 h-5 text-secondary" />
                        )}
                        {depositMethod === "crypto" && (
                          <Bitcoin className="w-5 h-5 text-[#8F7318]" />
                        )}
                      </div>
                      <div>
                        <div className="text-foreground font-bold">
                          {depositMethod === "bank" && "Chuyển Khoản Ngân Hàng"}
                          {depositMethod === "card" && "Thẻ Tín Dụng / Ghi Nợ"}
                          {depositMethod === "ewallet" && "Ví Điện Tử"}
                          {depositMethod === "crypto" && "Tiền Điện Tử (USDT)"}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Điền thông tin nạp tiền bên dưới
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        Số Tiền Muốn Nạp (coins)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                          🪙
                        </span>
                        <input
                          type="number"
                          value={depositAmountInput}
                          onChange={(e) =>
                            setDepositAmountInput(e.target.value)
                          }
                          placeholder="0"
                          className="w-full bg-background border border-border pl-8 pr-4 py-3.5 text-foreground text-xl font-bold placeholder-muted-foreground/60 focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        {["50000", "100000", "200000", "500000", "1000000"].map((amt) => (
                          <button
                            type="button"
                            key={amt}
                            onClick={() => setDepositAmountInput(amt)}
                            className={`flex-1 py-2 text-xs font-bold border transition-all ${depositAmountInput === amt ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"}`}
                          >
                            {Number(amt).toLocaleString('vi-VN')}
                          </button>
                        ))}
                      </div>
                    </div>
                    {depositMethod === "bank" && (
                      <div className="bg-background border border-border p-5 space-y-4">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-foreground font-semibold flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" /> Thông
                            Tin Tài Khoản
                          </h4>
                          <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                            Đang Hoạt Động
                          </span>
                        </div>
                        {[
                          { label: "Ngân Hàng", value: "Vietcombank (VCB)" },
                          {
                            label: "Số Tài Khoản",
                            value: "1020 4857 2934 8800",
                            copy: true,
                          },
                          {
                            label: "Chủ Tài Khoản",
                            value: "CONG TY TNHH RACING VN",
                          },
                          { label: "Chi Nhánh", value: "TP. Hồ Chí Minh" },
                          {
                            label: "Nội Dung CK",
                            value: `NAP ${(user?.fullName ?? "USER").replace(/ /g, "").toUpperCase()} ${depositAmountInput || "___"} coins`,
                            copy: true,
                          },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2 border-b border-border last:border-0"
                          >
                            <span className="text-muted-foreground text-sm">
                              {item.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-foreground font-medium text-sm">
                                {item.value}
                              </span>
                              {item.copy && (
                                <button
                                  type="button"
                                  className="p-1 hover:bg-muted rounded transition-colors"
                                  title="Sao chép"
                                >
                                  <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {depositMethod === "ewallet" && (
                      <div className="bg-background border border-border p-5">
                        <h4 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-secondary" /> Chọn
                          Ví Điện Tử
                        </h4>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {["MoMo", "ZaloPay", "VNPay"].map((w) => (
                            <button
                              type="button"
                              key={w}
                              className="bg-card hover:bg-primary/5 border border-border hover:border-primary py-3 text-foreground text-sm font-medium transition-all"
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                        <div className="bg-muted/40 p-4 text-center">
                          <div className="w-24 h-24 bg-white border border-border mx-auto mb-3 flex items-center justify-center">
                            <div className="text-foreground text-xs font-mono text-center">
                              QR Code
                              <br />
                              Preview
                            </div>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            Mở app ví và quét mã QR hoặc nhập số điện thoại:{" "}
                            <span className="text-foreground font-semibold">
                              0909.888.777
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                    {depositMethod === "crypto" && (
                      <div className="bg-background border border-border p-5 space-y-3">
                        <h4 className="text-foreground font-semibold flex items-center gap-2">
                          <Bitcoin className="w-4 h-4 text-[#8F7318]" /> Địa Chỉ
                          Nạp USDT (TRC20)
                        </h4>
                        <div className="bg-muted/40 border border-border p-4 flex items-center justify-between gap-2">
                          <span className="text-primary font-mono text-xs break-all">
                            TRX7YmK9...4xPQm8NvL2sW
                          </span>
                          <button
                            type="button"
                            className="p-1.5 hover:bg-muted flex-shrink-0"
                          >
                            <Copy className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </button>
                        </div>
                        <div className="bg-gold/10 border border-gold/40 p-3 text-xs text-[#8F7318]">
                          ⚠️ Chỉ gửi <strong>USDT TRC20</strong>. Gửi sai mạng
                          sẽ mất tiền vĩnh viễn. Tối thiểu 50.000 coins.
                        </div>
                      </div>
                    )}
                    {depositMethod === "card" && (
                      <div className="bg-background border border-border p-5 space-y-4">
                        <h4 className="text-foreground font-semibold flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-secondary" />{" "}
                          Thông Tin Thẻ
                        </h4>
                        {[
                          "Số Thẻ (16 chữ số)",
                          "Tên Chủ Thẻ",
                          "Ngày Hết Hạn (MM/YY)",
                          "Mã CVV",
                        ].map((ph, i) => (
                          <div key={i} className="relative">
                            <input
                              type={i === 3 ? "password" : "text"}
                              placeholder={ph}
                              className="w-full bg-card border border-border px-4 py-3 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary transition-all text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="bg-gold/5 border border-gold/30 p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-[#8F7318] flex-shrink-0 mt-0.5" />
                        <div className="text-sm space-y-1.5">
                          <div className="text-[#8F7318] font-semibold">
                            Lưu Ý Quan Trọng
                          </div>
                          <ul className="text-muted-foreground space-y-1 list-disc list-inside text-xs">
                            <li>
                              Nhập đúng nội dung chuyển khoản để hệ thống tự
                              động xác nhận
                            </li>
                            <li>
                              Tiền sẽ được cộng vào tài khoản trong vòng 5-30
                              phút
                            </li>
                            <li>
                              Hỗ trợ 24/7: support@racingvn.com hoặc Hotline
                              1800-8888
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {depositStep === 3 && (
                  <div className="p-6 flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mt-2">
                      <CheckCircle className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
                        Yêu Cầu Đã Gửi!
                      </h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        Chúng tôi đã nhận được yêu cầu nạp{" "}
                        <span className="text-[#8F7318] font-bold">
                          {Number(depositAmountInput).toLocaleString('vi-VN')} coins
                        </span>{" "}
                        của bạn. Hệ thống sẽ xử lý trong vài phút.
                      </p>
                    </div>
                    <div className="w-full bg-background border border-border p-5 text-left space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Mã Giao Dịch
                        </span>
                        <span className="text-foreground font-mono font-semibold">
                          TRX-{Date.now().toString().slice(-8)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Số Tiền</span>
                        <span className="text-[#8F7318] font-bold tabular-nums">
                          {Number(depositAmountInput).toLocaleString('vi-VN')} coins
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Trạng Thái
                        </span>
                        <span className="text-[#8F7318] font-semibold">
                          Đang Xử Lý
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Thời Gian</span>
                        <span className="text-foreground">
                          {new Date().toLocaleTimeString("vi-VN")}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDepositStep(1);
                        setDepositAmountInput("");
                        navigate("/spectator/deposit-history");
                      }}
                      className="text-sm text-secondary hover:text-secondary/80 underline underline-offset-2 transition-colors"
                    >
                      Xem Lịch Sử Nạp Tiền →
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border flex items-center gap-2">
                {depositStep > 1 && depositStep < 3 && (
                  <Button
                    onClick={() => setDepositStep((s) => s - 1)}
                    sx={{ color: "#7A7468", textTransform: "none" }}
                  >
                    ← Quay Lại
                  </Button>
                )}
                <div className="flex-1" />
                <Button
                  onClick={() => {
                    setDepositStep(1);
                    setDepositAmountInput("");
                    navigate("/spectator");
                  }}
                  sx={{ color: "#7A7468", textTransform: "none" }}
                >
                  {depositStep === 3 ? "Đóng" : "Hủy"}
                </Button>
                {depositStep < 3 && (
                  <Button
                    variant="contained"
                    disabled={(depositStep === 2 && !depositAmountInput) || stripeLoading}
                    onClick={() => {
                      if (depositStep === 2) {
                        handleStripeTopup();
                      } else {
                        setDepositStep((s) => s + 1);
                      }
                    }}
                    sx={{
                      background: "#1F3D2B",
                      color: "#F7F3EA",
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: 0,
                      px: 3,
                      boxShadow: "none",
                      "&:hover": { background: "#172D20", boxShadow: "none" },
                      "&:disabled": { background: "#EDE7D8", color: "#7A7468" },
                    }}
                  >
                    {depositStep === 1
                      ? "Tiếp Theo →"
                      : stripeLoading
                        ? "Đang chuyển đến Stripe..."
                        : "Thanh Toán Qua Stripe"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Deposit History Tab */}
        {activeTab === "deposit-history" && (
          <div>
            <div className="mb-6">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Lịch Sử Nạp</h2>
              <p className="text-muted-foreground">Theo dõi các giao dịch nạp tiền của bạn</p>
            </div>
            {loadingTransactions ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : topupTransactions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Coins className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p className="font-semibold text-foreground mb-1">Chưa có giao dịch nạp tiền</p>
                <p className="text-sm">Các lần nạp tiền sẽ xuất hiện ở đây</p>
              </div>
            ) : (
              <div className="bg-card border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Mã Giao Dịch</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Ngày</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Số Tiền</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Số Dư Sau</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Mô Tả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topupTransactions
                      .slice((depositHistoryPage - 1) * PAGE_SIZE, depositHistoryPage * PAGE_SIZE)
                      .map((tx) => (
                        <tr key={tx._id} className="border-t border-border hover:bg-muted/40 transition-colors">
                          <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{tx._id.slice(-8).toUpperCase()}</td>
                          <td className="px-6 py-4 text-foreground">{new Date(tx.createdAt).toLocaleString('vi-VN')}</td>
                          <td className="px-6 py-4 text-primary font-bold tabular-nums">+{tx.amount.toLocaleString('vi-VN')} coins</td>
                          <td className="px-6 py-4 text-foreground tabular-nums">{tx.balanceAfter.toLocaleString('vi-VN')} coins</td>
                          <td className="px-6 py-4 text-muted-foreground text-sm">{tx.description || 'Nạp tiền vào ví'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination
              page={depositHistoryPage}
              totalPages={Math.ceil(topupTransactions.length / PAGE_SIZE)}
              onPageChange={setDepositHistoryPage}
            />
          </div>
        )}

        {/* Bet History Tab */}
        {/* {activeTab === 'bet-history' && (
          <div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Lịch Sử Cược</h2>
                <p className="text-muted-foreground">Xem lại tất cả các vé cược của bạn</p>
              </div>
              {myBets.length > 0 && (
                <div className="flex gap-6">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Thắng / Tổng</div>
                    <div className="text-2xl font-bold text-foreground tabular-nums">{myBets.filter(b => b.status === 'won').length} / {myBets.length}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Tổng Tiền Thắng</div>
                    <div className="text-2xl font-bold text-[#8F7318] tabular-nums">+{myBets.reduce((s, b) => s + (b.payoutAmount || 0), 0).toLocaleString('vi-VN')} coins</div>
                  </div>
                </div>
              )}
            </div>
            {loadingBets ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myBets.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p className="font-semibold text-foreground mb-1">Chưa có lịch sử cược</p>
                <p className="text-sm">Các vé cược của bạn sẽ xuất hiện ở đây</p>
              </div>
            ) : (
              <div className="bg-card border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Cuộc Đua</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Ngày</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Cược / Ngựa</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Số Tiền</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Hệ Số</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Trạng Thái</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Thực Nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myBets.slice((betPage - 1) * PAGE_SIZE, betPage * PAGE_SIZE).map((bet) => {
                      const statusMap: Record<string, { label: string; bg: string; color: string }> = {
                        won:       { label: 'Thắng',   bg: '#1F3D2B', color: 'white' },
                        lost:      { label: 'Thua',    bg: '#B42318', color: 'white' },
                        pending:   { label: 'Chờ KQ', bg: '#EDE7D8', color: '#7A7468' },
                        cancelled: { label: 'Đã Hủy', bg: '#EDE7D8', color: '#7A7468' },
                        refunded:  { label: 'Đã Hoàn', bg: '#EDE7D8', color: '#7A7468' },
                      };
                      const st = statusMap[bet.status] ?? statusMap.pending;
                      const betTypeLabel: Record<string, string> = { win: 'Thắng (Hạng 1)', place: 'Về Nhì (Hạng 2)', show: 'Về Ba (Hạng 3)' };
                      return (
                        <tr key={bet._id} className="border-t border-border hover:bg-muted/40 transition-colors">
                          <td className="px-6 py-4 text-foreground font-medium">{bet.raceId?.name ?? '—'}</td>
                          <td className="px-6 py-4 text-foreground">{new Date(bet.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td className="px-6 py-4">
                            <div className="text-primary text-xs font-medium mb-1">{betTypeLabel[bet.betType] ?? bet.betType}</div>
                            <div className="text-foreground">{bet.horseId?.name ?? '—'}</div>
                          </td>
                          <td className="px-6 py-4 text-foreground tabular-nums">{bet.amount?.toLocaleString('vi-VN')} coins</td>
                          <td className="px-6 py-4 text-muted-foreground">{bet.multiplier}x</td>
                          <td className="px-6 py-4">
                            <Chip label={st.label} size="small" sx={{ backgroundColor: st.bg, color: st.color, fontWeight: 600 }} />
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-bold tabular-nums ${bet.status === 'won' ? 'text-[#8F7318]' : 'text-muted-foreground'}`}>
                              {bet.status === 'won' ? `+${(bet.payoutAmount || 0).toLocaleString('vi-VN')} coins` : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {myBets.length > PAGE_SIZE && (
              <Pagination
                page={betPage}
                totalPages={Math.ceil(myBets.length / PAGE_SIZE)}
                onPageChange={setBetPage}
              />
            )}
          </div>
        )} */}

        {/* Predictions Tab */}
        {activeTab === "predictions" && (
          <div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
                  Lịch Sử Đặt Cược
                </h2>
                <p className="text-muted-foreground">
                  Theo dõi các cược của bạn
                </p>
              </div>
              {myBets.length > 0 && (
                <div className="flex gap-6">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Thắng / Tổng
                    </div>
                    <div className="text-2xl font-bold text-foreground tabular-nums">
                      {myBets.filter((b) => b.status === "won").length} /{" "}
                      {myBets.length}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Tổng Tiền Thắng
                    </div>
                    <div className="text-2xl font-bold text-[#8F7318] tabular-nums">
                      +{myBets
                        .reduce((s, b) => s + (b.payoutAmount || 0), 0)
                        .toLocaleString('vi-VN')} coins
                    </div>
                  </div>
                </div>
              )}
            </div>

            {loadingBets ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myBets.length === 0 ? (
              <div className="bg-card border border-border p-12 text-center">
                <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Bạn chưa đặt cược nào. Vào tab Lịch Trình để đặt cược!
                </p>
              </div>
            ) : (
              <div className="bg-card border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                          Cuộc Đua
                        </th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                          Ngày
                        </th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                          Loại Cược
                        </th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                          Ngựa
                        </th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                          Tiền Cược
                        </th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                          Hệ Số
                        </th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                          Trạng Thái
                        </th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                          Kết Quả
                        </th>
                        <th className="px-5 py-4 text-sm font-semibold text-muted-foreground"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {myBets.map((bet) => {
                        const statusMap: Record<
                          string,
                          { label: string; color: string }
                        > = {
                          pending: {
                            label: "Chờ kết quả",
                            color: "bg-gold/15 text-[#8F7318]",
                          },
                          won: {
                            label: "Thắng",
                            color: "bg-primary/10 text-primary",
                          },
                          lost: {
                            label: "Thua",
                            color: "bg-destructive/10 text-destructive",
                          },
                          cancelled: {
                            label: "Đã hủy",
                            color: "bg-muted text-muted-foreground",
                          },
                          refunded: {
                            label: "Đã hoàn",
                            color: "bg-secondary/10 text-secondary",
                          },
                        };
                        const st = statusMap[bet.status] || statusMap.pending;
                        const betTypeLabel: Record<string, string> = {
                          win: "Thắng (Hạng 1)",
                          place: "Hạng 2",
                          show: "Hạng 3",
                        };
                        const race = bet.raceId as any;
                        const horse = bet.horseId as any;
                        return (
                          <tr
                            key={bet._id}
                            className="border-t border-border hover:bg-muted/40 transition-colors"
                          >
                            <td className="px-5 py-4">
                              <div className="text-foreground font-medium">
                                {race?.name || "-"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {race?.grade}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-foreground text-sm">
                              {new Date(bet.createdAt).toLocaleDateString(
                                "vi-VN",
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium">
                                {betTypeLabel[bet.betType]}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-foreground font-medium">
                              {horse?.name || "-"}
                            </td>
                            <td className="px-5 py-4 text-foreground tabular-nums">
                              {bet.amount.toLocaleString('vi-VN')} coins
                            </td>
                            <td className="px-5 py-4 text-[#8F7318] font-semibold">
                              {bet.multiplier}x
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`px-2 py-1 text-xs font-semibold ${st.color}`}
                              >
                                {st.label}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`font-bold tabular-nums ${bet.status === "won" ? "text-[#8F7318]" : "text-muted-foreground"}`}
                              >
                                {bet.status === "won"
                                  ? `+${bet.payoutAmount?.toLocaleString('vi-VN')} coins`
                                  : "-"}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {bet.status === "pending" && (
                                <button
                                  type="button"
                                  disabled={cancellingBetId === bet._id}
                                  onClick={() => handleCancelBet(bet._id)}
                                  className="text-xs text-destructive hover:text-destructive/80 border border-destructive/30 px-2 py-1 transition-colors disabled:opacity-50"
                                >
                                  {cancellingBetId === bet._id ? "..." : "Hủy"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rankings Tab */}
        {activeTab === "rankings" &&
          (() => {
            const gradeColor: Record<string, string> = {
              G1: "bg-gold text-foreground border-gold",
              G2: "border-secondary text-secondary",
              G3: "border-primary text-primary",
              Maiden: "border-muted-foreground text-muted-foreground",
            };
            const rankBadge = (rank: number) => (
              <div
                className={`w-12 h-12 shrink-0 flex items-center justify-center text-sm font-bold ${
                  rank === 1
                    ? "bg-gold text-foreground"
                    : rank === 2
                      ? "bg-[#9A937F] text-white"
                      : rank === 3
                        ? "bg-[#A85C32] text-white"
                        : "bg-muted text-muted-foreground"
                }`}
              >
                {rank <= 3 ? <Medal className="w-5 h-5" /> : `#${rank}`}
              </div>
            );
            const winBar = (rate: number) => (
              <div className="w-full bg-muted h-1.5 mt-1">
                <div
                  className="bg-primary h-1.5"
                  style={{ width: `${Math.min(rate, 100)}%` }}
                />
              </div>
            );
            const activeList =
              rankingType === "horses"
                ? horseRankings
                : rankingType === "jockeys"
                  ? jockeyRankings
                  : ownerRankings;
            const filteredRankings = activeList.filter((r: any) =>
              !rankingsSearch || r.name.toLowerCase().includes(rankingsSearch.toLowerCase())
            );
            const pagedRankings = filteredRankings.slice((rankingsPage - 1) * PAGE_SIZE, rankingsPage * PAGE_SIZE);

            return (
              <>
              <div>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-serif text-3xl font-bold text-foreground mb-1">
                      Bảng Xếp Hạng
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Dữ liệu tích lũy toàn sự nghiệp
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Tìm tên..."
                        value={rankingsSearch}
                        onChange={e => { setRankingsSearch(e.target.value); setRankingsPage(1); }}
                        className="pl-9 pr-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-40"
                      />
                    </div>
                    <div className="flex gap-2 p-1 bg-card border border-border">
                      {(["horses", "jockeys", "owners"] as const).map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => { setRankingType(t); setRankingsPage(1); setRankingsSearch(''); }}
                          className={`px-4 py-2 text-sm font-semibold transition-all ${
                            rankingType === t
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t === "horses" ? "🐎 Ngựa" : t === "jockeys" ? "🏇 Kỵ Sĩ" : "👑 Chủ Ngựa"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {loadingRankings ? (
                  <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredRankings.length === 0 ? (
                  <div className="bg-card border border-border p-12 text-center">
                    <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Chưa có dữ liệu xếp hạng
                    </p>
                  </div>
                ) : (
                  <div className="bg-card border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      {rankingType === "horses" && (
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Hạng
                              </th>
                              <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Ngựa
                              </th>
                              <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Grade
                              </th>
                              <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Chủ
                              </th>
                              <th className="text-right px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Điểm
                              </th>
                              <th className="text-right px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Thắng
                              </th>
                              <th className="text-right px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Tỷ Lệ
                              </th>
                              <th className="text-right px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Coins
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(pagedRankings as typeof horseRankings).map((h) => (
                              <tr
                                key={h._id}
                                className="border-t border-border hover:bg-muted/40 transition-colors"
                              >
                                <td className="px-5 py-4">
                                  {rankBadge(h.rank)}
                                </td>
                                <td className="px-5 py-4 text-foreground font-medium">
                                  {h.name}
                                </td>
                                <td className="px-5 py-4">
                                  <span
                                    className={`text-xs px-2 py-0.5 border font-semibold uppercase tracking-wider ${gradeColor[h.currentGrade] || gradeColor.Maiden}`}
                                  >
                                    {h.currentGrade}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-sm text-muted-foreground">
                                  {h.owner}
                                </td>
                                <td className="px-5 py-4 text-right font-medium tabular-nums">
                                  {h.totalPoints.toLocaleString()}
                                </td>
                                <td className="px-5 py-4 text-right font-medium text-[#8F7318] tabular-nums">
                                  {h.winCount}
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <div className="font-medium text-primary tabular-nums">
                                    {h.winRate}%
                                  </div>
                                  <div className="w-16 bg-muted h-1.5 mt-1 ml-auto">
                                    {winBar(h.winRate)}
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-right font-medium text-secondary tabular-nums">
                                  {h.totalEarnings.toLocaleString('vi-VN')} coins
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {rankingType === "jockeys" && (
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Hạng
                              </th>
                              <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Kỵ Sĩ
                              </th>
                              <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Kinh Nghiệm
                              </th>
                              <th className="text-right px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Cuộc Đua
                              </th>
                              <th className="text-right px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Thắng
                              </th>
                              <th className="text-right px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Tỷ Lệ
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(pagedRankings as typeof jockeyRankings).map((j) => (
                              <tr
                                key={j._id}
                                className="border-t border-border hover:bg-muted/40 transition-colors"
                              >
                                <td className="px-5 py-4">
                                  {rankBadge(j.rank)}
                                </td>
                                <td className="px-5 py-4 text-foreground font-medium">
                                  {j.name}
                                </td>
                                <td className="px-5 py-4 text-sm text-muted-foreground">
                                  {j.experienceYears} năm
                                </td>
                                <td className="px-5 py-4 text-right font-medium tabular-nums">
                                  {j.raceCount}
                                </td>
                                <td className="px-5 py-4 text-right font-medium text-[#8F7318] tabular-nums">
                                  {j.winCount}
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <div className="font-medium text-primary tabular-nums">
                                    {j.winRate}%
                                  </div>
                                  <div className="w-16 bg-muted h-1.5 mt-1 ml-auto">
                                    {winBar(j.winRate)}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {rankingType === "owners" && (
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Hạng
                              </th>
                              <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Chủ Ngựa
                              </th>
                              <th className="text-right px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Ngựa
                              </th>
                              <th className="text-right px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Cuộc Đua
                              </th>
                              <th className="text-right px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Thắng
                              </th>
                              <th className="text-right px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Tỷ Lệ
                              </th>
                              <th className="text-right px-5 py-4 text-sm font-semibold text-muted-foreground">
                                Coins
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(pagedRankings as typeof ownerRankings).map((o) => (
                              <tr
                                key={o._id}
                                className="border-t border-border hover:bg-muted/40 transition-colors"
                              >
                                <td className="px-5 py-4">
                                  {rankBadge(o.rank)}
                                </td>
                                <td className="px-5 py-4 text-foreground font-medium">
                                  {o.name}
                                </td>
                                <td className="px-5 py-4 text-right font-medium tabular-nums">
                                  {o.totalHorses}
                                </td>
                                <td className="px-5 py-4 text-right font-medium tabular-nums">
                                  {o.totalRaces}
                                </td>
                                <td className="px-5 py-4 text-right font-medium text-[#8F7318] tabular-nums">
                                  {o.totalWins}
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <div className="font-medium text-primary tabular-nums">
                                    {o.winRate}%
                                  </div>
                                  <div className="w-16 bg-muted h-1.5 mt-1 ml-auto">
                                    {winBar(o.winRate)}
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-right font-medium text-secondary tabular-nums">
                                  {o.totalEarnings.toLocaleString('vi-VN')} coins
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Pagination
                page={rankingsPage}
                totalPages={Math.ceil(filteredRankings.length / PAGE_SIZE)}
                onPageChange={setRankingsPage}
              />
              </>
            );
          })()}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-1">
                  Bảng Dẫn Đầu Khán Giả
                </h2>
                <p className="text-muted-foreground text-sm">
                  Xếp hạng theo tổng tiền thắng cược
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm khán giả..."
                    value={leaderboardSearch}
                    onChange={e => { setLeaderboardSearch(e.target.value); setLeaderboardPage(1); }}
                    className="pl-9 pr-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-44"
                  />
                </div>
                <button
                  type="button"
                  onClick={loadLeaderboard}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2 bg-card border border-border"
                >
                  <Activity className="w-3.5 h-3.5" /> Làm mới
                </button>
              </div>
            </div>

            {loadingLeaderboard ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : spectatorRankings.length === 0 ? (
              <div className="bg-card border border-border p-12 text-center">
                <Award className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">
                  Chưa có ai vào bảng xếp hạng
                </p>
                <p className="text-muted-foreground/70 text-sm">
                  Hãy đặt cược và thắng để xuất hiện ở đây!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pagedLeaderboard.map((entry) => {
                  const isMe = entry._id === user?._id;
                  return (
                    <div
                      key={entry._id}
                      className={`flex items-center gap-4 p-4 bg-card border transition-all ${
                        isMe
                          ? "border-gold bg-gold/5"
                          : entry.rank <= 3
                            ? "border-gold/50"
                            : "border-border hover:border-primary"
                      }`}
                    >
                      {/* Rank badge */}
                      <div
                        className={`w-12 h-12 shrink-0 flex items-center justify-center text-sm font-bold ${
                          entry.rank === 1
                            ? "bg-gold text-foreground"
                            : entry.rank === 2
                              ? "bg-[#9A937F] text-white"
                              : entry.rank === 3
                                ? "bg-[#A85C32] text-white"
                                : isMe
                                  ? "bg-gold/20 text-[#8F7318] border border-gold/50"
                                  : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {entry.rank <= 3 ? (
                          <Medal className="w-5 h-5" />
                        ) : (
                          `#${entry.rank}`
                        )}
                      </div>

                      {/* Avatar + name */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            isMe
                              ? "bg-gold text-foreground"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          {entry.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-semibold truncate">
                              {entry.name}
                            </span>
                            {isMe && (
                              <Chip
                                label="Bạn"
                                size="small"
                                sx={{
                                  bgcolor: "#C9A227",
                                  color: "#23201A",
                                  fontWeight: 700,
                                  height: 18,
                                  fontSize: "0.65rem",
                                }}
                              />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {entry.totalBets} cược · {entry.winRate}% thắng
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-8">
                        <div className="text-center">
                          <div className="text-sm font-bold text-[#8F7318] tabular-nums">
                            {entry.wonBets}/{entry.totalBets}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Thắng/Tổng
                          </div>
                        </div>
                        <div className="text-center">
                          <div
                            className={`text-sm font-bold tabular-nums ${entry.profit >= 0 ? "text-primary" : "text-destructive"}`}
                          >
                            {entry.profit >= 0 ? "+" : ""}
                            {entry.profit.toLocaleString('vi-VN')} coins
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Lợi nhuận
                          </div>
                        </div>
                        <div className="text-center min-w-[90px]">
                          <div className="text-lg font-bold text-foreground tabular-nums">
                            {entry.totalPayout.toLocaleString('vi-VN')} coins
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Tổng nhận
                          </div>
                        </div>
                      </div>

                      {/* Mobile */}
                      <div className="md:hidden text-right shrink-0">
                        <div className="text-[#8F7318] font-bold text-sm tabular-nums">
                          {entry.totalPayout.toLocaleString('vi-VN')} coins
                        </div>
                        <div
                          className={`text-xs tabular-nums ${entry.profit >= 0 ? "text-primary" : "text-destructive"}`}
                        >
                          {entry.profit >= 0 ? "+" : ""}
                          {entry.profit.toLocaleString('vi-VN')} coins
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Pagination
              page={leaderboardPage}
              totalPages={Math.ceil(filteredLeaderboard.length / PAGE_SIZE)}
              onPageChange={setLeaderboardPage}
            />

            {/* CTA */}
            <div className="mt-8 bg-card border border-gold/40 p-8 text-center">
              <div className="w-14 h-14 bg-gold/15 flex items-center justify-center mx-auto mb-4">
                <Flame className="w-8 h-8 text-[#8F7318]" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
                Leo Lên Đỉnh Cao!
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                Đặt cược thông minh và liên tục để tích lũy chiến thắng, leo
                hạng và được ghi danh trên bảng dẫn đầu.
              </p>
              <Button
                variant="contained"
                startIcon={<Target />}
                onClick={() => navigate("/spectator/schedule")}
                sx={{
                  background: "#1F3D2B",
                  color: "#F7F3EA",
                  fontWeight: 700,
                  borderRadius: 0,
                  px: 4,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { background: "#172D20", boxShadow: "none" },
                }}
              >
                Đặt Cược Ngay
              </Button>
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === "rewards" && (
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Đổi Quà &amp; Voucher</h2>
              <p className="text-muted-foreground">Sử dụng Xu hiện có trong ví đặt cược để đổi lấy các phần quà và mã giảm giá vô cùng giá trị</p>
            </div>

            {/* Balances */}
            <div className="bg-card border border-border p-5 flex items-center justify-between">
              <div>
                <span className="text-muted-foreground text-sm uppercase tracking-wide font-medium">Số dư khả dụng</span>
                <div className="text-[#8F7318] text-3xl font-extrabold tabular-nums mt-1">{walletBalance ?? "0 coins"}</div>
              </div>
              <div className="w-12 h-12 bg-gold/15 flex items-center justify-center rounded-none text-[#8F7318]">
                <Coins className="w-6 h-6" />
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Rewards List */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="font-serif text-xl font-bold text-foreground border-b border-border pb-2">Quà Tặng Hiện Có</h3>
                {loadingRewards ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : rewards.length === 0 ? (
                  <div className="bg-card border border-border p-8 text-center text-muted-foreground">
                    Không tìm thấy phần quà nào khả dụng.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {rewards.map((reward) => (
                      <div key={reward._id} className="bg-card border border-border overflow-hidden flex flex-col justify-between hover:border-primary transition-all">
                        {reward.imageUrl && (
                          <div className="h-44 overflow-hidden bg-muted">
                            <img src={reward.imageUrl} alt={reward.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-serif text-lg font-bold text-foreground mb-2">{reward.name}</h4>
                            <p className="text-muted-foreground text-xs leading-relaxed mb-4">{reward.description}</p>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Số lượng còn lại: <strong className="text-foreground">{reward.stock}</strong></span>
                              <span className="flex items-center gap-1 text-[#8F7318] font-bold text-sm">
                                <Coins className="w-4 h-4" /> {reward.coinsRequired.toLocaleString('vi-VN')} coins
                              </span>
                            </div>
                            <Button
                              fullWidth
                              variant="contained"
                              disabled={redeemingId !== null}
                              onClick={() => openRedeemConfirm(reward)}
                              sx={{
                                background: "#1F3D2B",
                                color: "#F7F3EA",
                                borderRadius: 0,
                                py: 1,
                                fontWeight: 700,
                                textTransform: "none",
                                boxShadow: "none",
                                "&:hover": {
                                  background: "#172D20",
                                  boxShadow: "none",
                                },
                              }}
                            >
                              {redeemingId === reward._id ? "Đang xử lý..." : "Đổi Quà"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Redemption History */}
              <div className="space-y-6">
                <h3 className="font-serif text-xl font-bold text-foreground border-b border-border pb-2">Lịch Sử Đổi Quà</h3>
                {loadingRedemptions ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : myRedemptions.length === 0 ? (
                  <div className="bg-card border border-border p-6 text-center text-muted-foreground text-sm">
                    Bạn chưa thực hiện giao dịch đổi quà nào.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {myRedemptions.map((redemption) => {
                      const isPhysical = redemption.rewardId?.type === 'physical';
                      return (
                        <div key={redemption._id} className="bg-card border border-border p-4 space-y-3">
                          <div>
                            <div className="font-semibold text-foreground text-sm">{redemption.rewardId?.name || "Phần thưởng đã đổi"}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {new Date(redemption.createdAt).toLocaleString('vi-VN')}
                            </div>
                          </div>
                          
                          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                            {isPhysical ? "Mã Nhận Quà:" : "Mã Voucher:"}
                          </div>

                          <div className="bg-background border border-border px-3 py-2 flex items-center justify-between gap-2">
                            <span className="font-mono text-xs text-primary font-bold">{redemption.voucherCode}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(redemption.voucherCode);
                                setCopiedVoucherId(redemption._id);
                                setTimeout(() => setCopiedVoucherId(null), 1500);
                              }}
                              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"
                              title="Sao chép"
                            >
                              {copiedVoucherId === redemption._id ? (
                                <span className="text-[10px] text-primary font-semibold">Đã chép</span>
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="text-[10px] text-muted-foreground italic">
                            {isPhysical 
                              ? "⚡ Vui lòng trình mã này cho ban tổ chức tại quầy để nhận quà vật lý." 
                              : "⚡ Sử dụng mã này khi mua sắm để được áp dụng giảm giá."
                            }
                          </div>

                          <div className="flex justify-between items-center text-xs border-t border-border/60 pt-2">
                            <span className="text-muted-foreground">Chi phí:</span>
                            <span className="font-bold text-secondary">
                              -{redemption.coinsSpent.toLocaleString('vi-VN')} coins
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prediction Modal */}
      <Dialog
        open={predictionModalOpen}
        onClose={() => setPredictionModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: "#FFFFFF",
            border: "1px solid #E3DCCB",
            borderRadius: 0,
          },
        }}
      >
        <DialogTitle
          sx={{ color: "#23201A", borderBottom: "1px solid #E3DCCB" }}
        >
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-secondary" />
            <span className="font-serif font-bold">Đặt Cược</span>
          </div>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {selectedRace && (
            <div>
              <div className="bg-background border border-border p-4 mb-6">
                <h3 className="font-serif text-foreground font-bold mb-1">
                  {selectedRace.name}
                </h3>
                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                  <span className="text-muted-foreground">
                    Hạng:{" "}
                    <span className="text-[#8F7318] font-medium">
                      {selectedRace.grade}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Cự Ly:{" "}
                    <span className="text-foreground">
                      {selectedRace.distance}m
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Giải Thưởng:{" "}
                    <span className="text-[#8F7318] font-medium">
                      {selectedRace.purse?.toLocaleString('vi-VN')} coins
                    </span>
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "#7A7468" }}>Loại Cược</InputLabel>
                  <Select
                    value={betType}
                    onChange={(e) => setBetType(e.target.value)}
                    label="Loại Cược"
                    sx={lightSelectSx}
                  >
                    <MenuItem value="win">
                      Thắng — ngựa về hạng 1 (hệ số 3.0x)
                    </MenuItem>
                    <MenuItem value="place">
                      Về Nhì — ngựa về hạng 2 (hệ số 2.0x)
                    </MenuItem>
                    <MenuItem value="show">
                      Về Ba — ngựa về hạng 3 (hệ số 1.5x)
                    </MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel sx={{ color: "#7A7468" }}>Chọn Ngựa *</InputLabel>
                  <Select
                    value={selectedHorse}
                    onChange={(e) => setSelectedHorse(e.target.value)}
                    label="Chọn Ngựa *"
                    sx={lightSelectSx}
                  >
                    {selectedRaceRegistrations.length > 0 ? (
                      selectedRaceRegistrations.map((h: any) => (
                        <MenuItem key={h.horseId} value={h.horseId}>
                          {h.horseName} — {h.currentGrade}{h.jockeyName ? ` · 🏇 ${h.jockeyName}` : ''}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled value="">Đang tải danh sách ngựa...</MenuItem>
                    )}
                  </Select>
                </FormControl>
                {selectedHorse && (() => {
                  const h = selectedRaceRegistrations.find((x: any) => x.horseId === selectedHorse);
                  if (!h) return null;
                  const gradeColors: Record<string, string> = { G1: '#8F7318', G2: '#8C2F1B', G3: '#1F3D2B', Maiden: '#7A7468' };
                  const gradeColor = gradeColors[h.currentGrade] ?? '#7A7468';
                  const winRatePct = h.winRate != null ? `${Math.round(h.winRate)}%` : '—';
                  return (
                    <div className="border border-border bg-background p-4 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{h.horseName}</span>
                        <span className="text-xs font-bold px-1.5 py-0.5 border" style={{ color: gradeColor, borderColor: gradeColor + '60', background: gradeColor + '15' }}>
                          {h.currentGrade}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted/40 p-2">
                          <div className="text-xs text-muted-foreground mb-0.5">Điểm tích lũy</div>
                          <div className="font-semibold text-[#8F7318]">{h.totalPoints ?? 0} điểm</div>
                        </div>
                        <div className="bg-muted/40 p-2">
                          <div className="text-xs text-muted-foreground mb-0.5">Tỷ lệ thắng</div>
                          <div className="font-semibold text-foreground">{winRatePct}</div>
                        </div>
                        {h.breed && (
                          <div className="bg-muted/40 p-2">
                            <div className="text-xs text-muted-foreground mb-0.5">Giống</div>
                            <div className="font-medium text-foreground">{h.breed}</div>
                          </div>
                        )}
                        {h.gender && (
                          <div className="bg-muted/40 p-2">
                            <div className="text-xs text-muted-foreground mb-0.5">Giới tính</div>
                            <div className="font-medium text-foreground">{h.gender === 'male' ? '♂ Đực' : h.gender === 'female' ? '♀ Cái' : h.gender}</div>
                          </div>
                        )}
                      </div>
                      {h.jockeyName && (
                        <div className="border-t border-border pt-3 text-sm">
                          <div className="text-xs text-muted-foreground mb-1">Jockey</div>
                          <div className="font-semibold text-foreground">🏇 {h.jockeyName}</div>
                          {h.jockeyExperience != null && (
                            <div className="text-xs text-muted-foreground mt-0.5">{h.jockeyExperience} năm kinh nghiệm</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <TextField
                  fullWidth
                  label="Số Tiền Cược ($) *"
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="Nhập số tiền (tối thiểu 1)"
                  sx={{
                    "& .MuiInputLabel-root": { color: "#7A7468" },
                    "& .MuiOutlinedInput-root": {
                      color: "#23201A",
                      borderRadius: 0,
                      "& fieldset": { borderColor: "#E3DCCB" },
                      "&:hover fieldset": { borderColor: "#C9C2B0" },
                      "&.Mui-focused fieldset": { borderColor: "#1F3D2B" },
                    },
                  }}
                />

                <div className="bg-gold/10 border border-gold/40 p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      Tiềm năng thắng:
                    </span>
                    <span className="text-[#8F7318] font-bold text-lg tabular-nums">
                      {betAmount &&
                      !isNaN(Number(betAmount)) &&
                      Number(betAmount) > 0
                        ? `${Math.floor(Number(betAmount) * BET_MULTIPLIERS[betType as BetType]).toLocaleString('vi-VN')} coins`
                        : "0 coins"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Hệ số: {BET_MULTIPLIERS[betType as BetType]}x</span>
                    <span>Phí sẽ trừ ngay từ ví</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: "1px solid #E3DCCB" }}>
          <Button
            onClick={() => setPredictionModalOpen(false)}
            sx={{ color: "#7A7468", textTransform: "none" }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmitPrediction}
            variant="contained"
            disabled={!selectedHorse || !betAmount || placingBet}
            sx={{
              background: "#8C2F1B",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 0,
              boxShadow: "none",
              "&:hover": { background: "#6B2415", boxShadow: "none" },
            }}
          >
            {placingBet ? "..." : "Xác Nhận Đặt Cược"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Tournament Details Modal */}
      <Dialog
        open={tournamentDetailsModalOpen}
        onClose={() => setTournamentDetailsModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: "#FFFFFF",
            border: "1px solid #E3DCCB",
            borderRadius: 0,
          },
        }}
      >
        {selectedTournamentForDetails && (
          <>
            <DialogTitle
              sx={{ color: "#23201A", borderBottom: "1px solid #E3DCCB", p: 3 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold text-foreground">
                  {selectedTournamentForDetails.name}
                </h2>
                <Chip
                  label={getTournamentStatusLabel(
                    selectedTournamentForDetails.status,
                  )}
                  sx={{
                    bgcolor: getTournamentStatusHex(
                      selectedTournamentForDetails.status,
                    ),
                    color: "white",
                    fontWeight: "bold",
                  }}
                />
              </div>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <div className="mt-4 grid md:grid-cols-2 gap-6">
                <div className="bg-background border border-border p-5">
                  <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" /> Thời Gian
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Bắt Đầu
                      </div>
                      <div className="text-foreground font-medium">
                        {new Date(
                          selectedTournamentForDetails.startDate,
                        ).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Kết Thúc
                      </div>
                      <div className="text-foreground font-medium">
                        {new Date(
                          selectedTournamentForDetails.endDate,
                        ).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                    {selectedTournamentForDetails.location && (
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Địa Điểm
                        </div>
                        <div className="text-foreground font-medium">
                          {selectedTournamentForDetails.location}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-background border border-border p-5">
                  <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#8F7318]" /> Mô Tả
                  </h3>
                  {selectedTournamentForDetails.description ? (
                    <p className="text-foreground text-sm leading-relaxed">
                      {selectedTournamentForDetails.description}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">
                      Chưa có mô tả
                    </p>
                  )}
                </div>
              </div>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: "1px solid #E3DCCB" }}>
              <Button
                onClick={() => setTournamentDetailsModalOpen(false)}
                sx={{ color: "#7A7468", textTransform: "none" }}
              >
                Đóng
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setTournamentDetailsModalOpen(false);
                  navigate("/spectator/schedule");
                }}
                sx={{
                  background: "#1F3D2B",
                  color: "#F7F3EA",
                  fontWeight: "bold",
                  borderRadius: 0,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { background: "#172D20", boxShadow: "none" },
                }}
              >
                Xem Lịch Trình Ngay
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Redeem Confirm Dialog */}
      <Dialog
        open={redeemConfirmOpen}
        onClose={() => !redeemingId && setRedeemConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            background: "#FFFFFF",
            border: "1px solid #E3DCCB",
            borderRadius: 0,
          },
        }}
      >
        <DialogTitle sx={{ color: "#23201A", borderBottom: "1px solid #E3DCCB" }}>
          <div className="flex items-center gap-3">
            <Gift className="w-5 h-5 text-secondary" />
            <span className="font-serif font-bold">Xác Nhận Đổi Quà</span>
          </div>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {pendingReward && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn dùng{" "}
              <strong className="text-[#8F7318]">
                {pendingReward.coinsRequired.toLocaleString("vi-VN")} coins
              </strong>{" "}
              để đổi <strong className="text-foreground">"{pendingReward.name}"</strong>?
            </p>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: "1px solid #E3DCCB", gap: 1 }}>
          <Button
            onClick={() => {
              setRedeemConfirmOpen(false);
              setPendingReward(null);
            }}
            disabled={redeemingId !== null}
            sx={{ color: "#7A7468", textTransform: "none", fontWeight: 600 }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={confirmRedeem}
            disabled={redeemingId !== null}
            sx={{
              background: "#1F3D2B",
              color: "#F7F3EA",
              borderRadius: 0,
              textTransform: "none",
              fontWeight: 700,
              boxShadow: "none",
              "&:hover": { background: "#172D20", boxShadow: "none" },
            }}
          >
            {redeemingId ? "Đang xử lý..." : "Đồng Ý Đổi"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Redeem Result Dialog */}
      <Dialog
        open={redeemResultOpen}
        onClose={() => setRedeemResultOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            background: "#FFFFFF",
            border: "1px solid #E3DCCB",
            borderRadius: 0,
          },
        }}
      >
        <DialogTitle sx={{ color: "#23201A", borderBottom: "1px solid #E3DCCB" }}>
          <div className="flex items-center gap-3">
            {redeemResult?.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-[#1F3D2B]" />
            ) : (
              <AlertCircle className="w-5 h-5 text-destructive" />
            )}
            <span className="font-serif font-bold">
              {redeemResult?.type === "success" ? "Đổi Quà Thành Công" : "Đổi Quà Thất Bại"}
            </span>
          </div>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <p className="text-sm text-muted-foreground">{redeemResult?.message}</p>
          {redeemResult?.type === "success" && redeemResult.redemption && (
            <div className="mt-4 space-y-2">
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                {redeemResult.redemption.rewardId?.type === "physical"
                  ? "Mã Nhận Quà"
                  : "Mã Voucher"}
              </div>
              <div className="bg-background border border-border px-3 py-2 flex items-center justify-between gap-2">
                <span className="font-mono text-sm text-primary font-bold">
                  {redeemResult.redemption.voucherCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(redeemResult.redemption!.voucherCode);
                    setCopiedVoucherId(redeemResult.redemption!._id);
                    setTimeout(() => setCopiedVoucherId(null), 1500);
                  }}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  {copiedVoucherId === redeemResult.redemption._id ? "Đã chép" : "Sao chép"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: "1px solid #E3DCCB" }}>
          <Button
            variant="contained"
            onClick={() => setRedeemResultOpen(false)}
            fullWidth
            sx={{
              background: "#1F3D2B",
              color: "#F7F3EA",
              borderRadius: 0,
              textTransform: "none",
              fontWeight: 700,
              boxShadow: "none",
              "&:hover": { background: "#172D20", boxShadow: "none" },
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
