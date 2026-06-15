import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
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
  CreditCard,
  Building2,
  Smartphone,
  Bitcoin,
  Copy,
  Shield,
  Home
} from 'lucide-react';
import { Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { AppShell, type NavItem } from '../components/layout/AppShell';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { raceApi, type Race } from '../api/race';
import { betApi, type Bet, type BetType, BET_MULTIPLIERS } from '../api/bet';
import { tournamentApi, type Tournament } from '../api/tournament';
import { rankingsApi, type HorseRanking, type JockeyRanking, type OwnerRanking, type SpectatorRanking } from '../api/rankings';
import { toast } from 'sonner';

const SPECTATOR_NAV: NavItem[] = [
  { to: '/spectator', label: 'Tổng Quan', icon: <Home /> },
  { to: '/spectator/tournaments', label: 'Giải Đấu', icon: <Sparkles /> },
  { to: '/spectator/live', label: 'Đang Trực Tiếp', icon: <Play /> },
  { to: '/spectator/schedule', label: 'Lịch Trình', icon: <Calendar /> },
  { to: '/spectator/predictions', label: 'Dự Đoán Của Tôi', icon: <Target /> },
  { to: '/spectator/rankings', label: 'Bảng Xếp Hạng', icon: <Trophy /> },
  { to: '/spectator/leaderboard', label: 'Bảng Dẫn Đầu', icon: <Award /> },
  { to: '/spectator/bet-history', label: 'Lịch Sử Cược', icon: <History /> },
  { to: '/spectator/deposit', label: 'Nạp Xu', icon: <Wallet /> },
];

// MUI input style cho nền sáng
const lightSelectSx = {
  color: '#23201A',
  '.MuiOutlinedInput-notchedOutline': { borderColor: '#E3DCCB' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#C9C2B0' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1F3D2B' },
  '.MuiSvgIcon-root': { color: '#7A7468' },
  background: '#FFFFFF',
  borderRadius: 0,
};

export function SpectatorDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { formatted: walletBalance } = useWallet();
  const { pathname } = useLocation();
  const activeTab = pathname === '/spectator/live' ? 'live'
    : pathname === '/spectator/schedule' ? 'schedule'
    : pathname === '/spectator/predictions' ? 'predictions'
    : pathname === '/spectator/rankings' ? 'rankings'
    : pathname === '/spectator/leaderboard' ? 'leaderboard'
    : pathname === '/spectator/tournaments' ? 'tournaments'
    : 'overview';
  const [predictionModalOpen, setPredictionModalOpen] = useState(false);
  const [tournamentDetailsModalOpen, setTournamentDetailsModalOpen] = useState(false);
  const [depositPortalOpen, setDepositPortalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

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
      toast.error(err.message || 'Không thể tải giải đấu');
    } finally {
      setLoadingTournaments(false);
    }
  };

  // ── Real races for Schedule tab ──
  const [liveRacesData, setLiveRacesData] = useState<Race[]>([]);
  const [scheduleRaces, setScheduleRaces] = useState<Race[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [selectedRaceRegistrations, setSelectedRaceRegistrations] = useState<any[]>([]);

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
        raceApi.getRaces(token, { status: 'open', limit: 30 }),
        raceApi.getRaces(token, { status: 'running', limit: 10 }),
        raceApi.getRaces(token, { status: 'pre_check', limit: 10 }),
        raceApi.getRaces(token, { status: 'closed', limit: 10 }),
      ]);
      // Schedule tab: open races + closed races (registration closed but betting may still be open)
      setScheduleRaces([
        ...(openRes.races ?? []),
        ...(closedRes.races ?? []),
      ]);
      // Live tab shows running + pre_check
      setLiveRacesData([
        ...(runningRes.races ?? []),
        ...(preCheckRes.races ?? []),
      ]);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải lịch đua');
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
      toast.error(err.message || 'Không thể tải lịch sử cược');
    } finally {
      setLoadingBets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tournaments') loadTournaments();
    if (activeTab === 'schedule' || activeTab === 'live') loadSchedule();
    if (activeTab === 'predictions') loadMyBets();
    if (activeTab === 'rankings') loadRankings();
    if (activeTab === 'leaderboard') loadLeaderboard();
  }, [activeTab, token]);

  // Load bets on mount để stats cards dùng dữ liệu thật
  useEffect(() => {
    if (token) loadMyBets();
  }, [token]);
  const [depositMethod, setDepositMethod] = useState('bank');
  const [depositAmountInput, setDepositAmountInput] = useState('');
  const [depositStep, setDepositStep] = useState(1);
  const [selectedTournamentForDetails, setSelectedTournamentForDetails] = useState<any>(null);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [betType, setBetType] = useState('win');
  const [selectedHorse, setSelectedHorse] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [rankingType, setRankingType] = useState('horses');
  const [tournamentFilter, setTournamentFilter] = useState('all');

  // ── Real rankings data ──
  const [horseRankings, setHorseRankings] = useState<HorseRanking[]>([]);
  const [jockeyRankings, setJockeyRankings] = useState<JockeyRanking[]>([]);
  const [ownerRankings, setOwnerRankings] = useState<OwnerRanking[]>([]);
  const [spectatorRankings, setSpectatorRankings] = useState<SpectatorRanking[]>([]);
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
      toast.error(err.message || 'Không thể tải bảng xếp hạng');
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
      toast.error(err.message || 'Không thể tải bảng dẫn đầu');
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const depositHistory = [
    { id: 'DEP001', date: '2026-05-28 10:30', amount: '$500', method: 'Chuyển Khoản Ngân Hàng', status: 'Thành Công', reference: 'TRX-987654321' },
    { id: 'DEP002', date: '2026-05-25 14:15', amount: '$200', method: 'Thẻ Tín Dụng', status: 'Thành Công', reference: 'TRX-123456789' },
    { id: 'DEP003', date: '2026-05-20 09:00', amount: '$1,000', method: 'Ví Điện Tử', status: 'Thành Công', reference: 'TRX-456789123' },
    { id: 'DEP004', date: '2026-05-18 16:45', amount: '$300', method: 'Crypto', status: 'Đang Xử Lý', reference: 'TRX-789123456' },
  ];

  const betHistory = [
    { id: 'BET001', date: '2026-05-28 11:00', race: 'Cuộc Đua 15 - Chung Kết', amount: 100, type: 'Thắng', horse: 'Thunder Strike', odds: '2.5x', status: 'pending', reward: 0 },
    { id: 'BET002', date: '2026-05-27 15:30', race: 'Cuộc Đua 12 - Bán Kết', amount: 50, type: 'Về Đích Hạng 3', horse: 'Golden Arrow', odds: '1.8x', status: 'won', reward: 90 },
    { id: 'BET003', date: '2026-05-26 14:00', race: 'Cuộc Đua 10 - Vòng Loại', amount: 200, type: 'Về Đích Hạng 3', horse: 'Storm Chaser', odds: '3.0x', status: 'lost', reward: 0 },
    { id: 'BET004', date: '2026-05-25 09:15', race: 'Cuộc Đua 8 - Khởi Động', amount: 150, type: 'Thắng', horse: 'Wild Fire', odds: '5.5x', status: 'won', reward: 825 },
  ];

  const pendingBets = myBets.filter(b => b.status === 'pending').length;
  const wonBets = myBets.filter(b => b.status === 'won').length;
  const settledBets = myBets.filter(b => b.status === 'won' || b.status === 'lost').length;
  const winRate = settledBets > 0 ? Math.round((wonBets / settledBets) * 100) : 0;
  const totalWinnings = myBets.reduce((s, b) => s + (b.payoutAmount || 0), 0);

  const stats = [
    { label: 'Số Dư Ví', value: walletBalance ?? '...', icon: Coins, iconCls: 'bg-gold text-foreground' },
    { label: 'Cược Đang Chờ', value: String(pendingBets), icon: Target, iconCls: 'bg-primary text-primary-foreground' },
    { label: 'Tỷ Lệ Thắng', value: settledBets > 0 ? `${winRate}%` : '—', icon: TrendingUp, iconCls: 'bg-secondary text-white' },
    { label: 'Tổng Tiền Thắng', value: totalWinnings > 0 ? `+${totalWinnings.toLocaleString()}` : '0', icon: Gift, iconCls: 'bg-[#7A7468] text-white' },
  ];

  const handleOpenPrediction = async (race: any) => {
    setSelectedRace(race);
    setSelectedHorse('');
    setBetAmount('');
    setBetType('win');
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
    if (isNaN(amount) || amount < 1) { toast.error('Số tiền cược tối thiểu là 1'); return; }
    setPlacingBet(true);
    try {
      await betApi.place(token, {
        raceId: selectedRace._id,
        horseId: selectedHorse,
        betType: betType as BetType,
        amount,
      });
      toast.success(`Đặt cược thành công! Tiềm năng thắng: $${Math.floor(amount * BET_MULTIPLIERS[betType as BetType])}`);
      setPredictionModalOpen(false);
      setBetType('win');
      setSelectedHorse('');
      setBetAmount('');
      if (activeTab === 'predictions') loadMyBets();
    } catch (err: any) {
      toast.error(err.message || 'Đặt cược thất bại');
    } finally {
      setPlacingBet(false);
    }
  };

  const handleCancelBet = async (betId: string) => {
    if (!token || !confirm('Hủy cược? Bạn sẽ được hoàn 100% tiền.')) return;
    setCancellingBetId(betId);
    try {
      await betApi.cancel(token, betId);
      toast.success('Đã hủy cược, tiền đã được hoàn trả');
      loadMyBets();
    } catch (err: any) {
      toast.error(err.message || 'Hủy cược thất bại');
    } finally {
      setCancellingBetId(null);
    }
  };

  const getTournamentStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-secondary';
      case 'upcoming': return 'bg-primary';
      case 'finished': return 'bg-[#7A7468]';
      case 'cancelled': return 'bg-destructive';
      default: return 'bg-[#7A7468]';
    }
  };

  const getTournamentStatusHex = (status: string) => {
    switch (status) {
      case 'ongoing': return '#8C2F1B';
      case 'upcoming': return '#1F3D2B';
      case 'finished': return '#7A7468';
      case 'cancelled': return '#B42318';
      default: return '#7A7468';
    }
  };

  const getTournamentStatusLabel = (status: string) => {
    switch (status) {
      case 'ongoing': return 'Đang Diễn Ra';
      case 'upcoming': return 'Sắp Diễn Ra';
      case 'finished': return 'Đã Kết Thúc';
      case 'cancelled': return 'Đã Hủy';
      default: return status;
    }
  };

  const filteredTournaments = tournamentsData.filter(t => {
    if (tournamentFilter === 'all') return true;
    return t.status === tournamentFilter;
  });

  return (
    <AppShell roleLabel="SPECTATOR" nav={SPECTATOR_NAV}>
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards — only on overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="relative bg-card border border-border p-5 hover:-translate-y-1 transition-all hover:border-primary flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 ${stat.iconCls} flex items-center justify-center shrink-0`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="font-serif text-2xl font-bold text-foreground mb-1 tabular-nums break-all">{stat.value}</div>
                <div className="text-xs text-muted-foreground font-medium leading-tight mt-auto uppercase tracking-wide">{stat.label}</div>
                {idx === 0 && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
              </div>
            ))}
          </div>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Giải Đấu</h2>
                <p className="text-muted-foreground">Duyệt qua tất cả các giải đấu đua ngựa và thông tin chi tiết</p>
              </div>

              <div className="flex gap-3">
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={tournamentFilter}
                    onChange={(e) => setTournamentFilter(e.target.value)}
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
                {filteredTournaments.map((tournament) => (
                  <div key={tournament._id} className="group bg-card border border-border overflow-hidden hover:border-primary transition-all">
                    <div className="relative h-36 overflow-hidden flex items-end p-4 border-b border-border" style={{ background: `linear-gradient(135deg, ${getTournamentStatusHex(tournament.status)}1F, ${getTournamentStatusHex(tournament.status)}08)` }}>
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getTournamentStatusColor(tournament.status)}`}>
                          {getTournamentStatusLabel(tournament.status)}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-foreground leading-tight pr-24 relative z-10">{tournament.name}</h3>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Bắt Đầu</div>
                          <div className="text-foreground font-medium">{new Date(tournament.startDate).toLocaleDateString('vi-VN')}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Kết Thúc</div>
                          <div className="text-foreground font-medium">{new Date(tournament.endDate).toLocaleDateString('vi-VN')}</div>
                        </div>
                      </div>

                      {tournament.location && (
                        <div className="bg-background border border-border p-3 mb-4 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-foreground text-sm">{tournament.location}</span>
                        </div>
                      )}

                      {tournament.description && (
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{tournament.description}</p>
                      )}

                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleOpenTournamentDetails(tournament)}
                        endIcon={<ChevronRight className="w-4 h-4" />}
                        sx={{
                          borderColor: '#1F3D2B',
                          color: '#1F3D2B',
                          borderRadius: 0,
                          textTransform: 'none',
                          '&:hover': { borderColor: '#1F3D2B', backgroundColor: 'rgba(31,61,43,0.06)' }
                        }}
                      >
                        Xem Chi Tiết
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live Races Tab */}
        {activeTab === 'live' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-secondary rounded-full animate-pulse" />
              <h2 className="font-serif text-3xl font-bold text-foreground">Đang Trực Tiếp</h2>
              <Chip
                label={`${liveRacesData.length} Đang Hoạt Động`}
                size="small"
                sx={{ backgroundColor: liveRacesData.length > 0 ? '#8C2F1B' : '#7A7468', color: 'white' }}
              />
              <button
                type="button"
                onClick={loadSchedule}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Activity className="w-3 h-3" />
                Làm mới
              </button>
            </div>

            {loadingSchedule ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : liveRacesData.length > 0 ? (
              <div className="space-y-6">
                {liveRacesData.map(race => {
                  const myBetOnRace = myBets.some(b => (b.raceId as any)?._id === race._id && b.status === 'pending');
                  const isRunning = race.status === 'running';
                  const borderColor = isRunning ? 'border-secondary/40' : 'border-gold/50';
                  const statusLabel = isRunning ? 'TRỰC TIẾP' : race.status === 'pre_check' ? 'Chuẩn bị' : 'Đóng cược';
                  const statusBg = isRunning ? '#8C2F1B' : '#C9A227';
                  return (
                    <div key={race._id} className={`bg-card border ${borderColor} p-6`}>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className={`w-3 h-3 rounded-full animate-pulse shrink-0 ${isRunning ? 'bg-secondary' : 'bg-gold'}`} />
                          <div>
                            <h3 className="font-serif text-xl font-bold text-foreground">{race.name}</h3>
                            <p className="text-sm text-muted-foreground">{race.distance}m • {new Date(race.scheduledTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <Chip label={statusLabel} size="small" sx={{ backgroundColor: statusBg, color: statusBg === '#C9A227' ? '#23201A' : 'white', fontWeight: 'bold' }} />
                          {myBetOnRace && (
                            <Chip label="✓ Bạn đã cược" size="small" sx={{ bgcolor: '#C9A227', color: '#23201A', fontWeight: 'bold', fontSize: '0.7rem' }} />
                          )}
                        </div>
                        <Chip
                          label={race.grade}
                          size="small"
                          sx={{ bgcolor: 'rgba(201,162,39,0.15)', color: '#8F7318', border: '1px solid #C9A227', fontWeight: 'bold' }}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                        <div className="bg-background border border-border p-3">
                          <div className="text-xs text-muted-foreground mb-1">Cấp Hạng</div>
                          <div className="text-foreground font-semibold">{race.grade}</div>
                        </div>
                        <div className="bg-background border border-border p-3">
                          <div className="text-xs text-muted-foreground mb-1">Cự Ly</div>
                          <div className="text-foreground font-semibold">{race.distance}m</div>
                        </div>
                        <div className="bg-background border border-border p-3">
                          <div className="text-xs text-muted-foreground mb-1">Giải Thưởng</div>
                          <div className="text-[#8F7318] font-semibold tabular-nums">{race.purse.toLocaleString()} coins</div>
                        </div>
                      </div>

                      <div className={`${isRunning ? 'bg-secondary/8 border-secondary/25' : 'bg-gold/10 border-gold/40'} border p-4 mb-4 flex items-center gap-3`}>
                        <div className={`w-8 h-8 ${isRunning ? 'bg-secondary/15' : 'bg-gold/20'} rounded-full flex items-center justify-center shrink-0`}>
                          <Activity className={`w-4 h-4 ${isRunning ? 'text-secondary' : 'text-[#8F7318]'}`} />
                        </div>
                        <div>
                          <div className="text-foreground text-sm font-medium">{isRunning ? 'Cuộc đua đang diễn ra' : 'Cuộc đua sắp bắt đầu'}</div>
                          <div className="text-muted-foreground text-xs">Vào xem trực tiếp để theo dõi vị trí ngựa và nhận kết quả ngay khi hoàn thành</div>
                        </div>
                      </div>

                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Eye />}
                        onClick={() => navigate(`/spectator/race/${race._id}`)}
                        sx={{
                          background: '#8C2F1B',
                          borderRadius: 0,
                          py: 1.5,
                          fontWeight: 700,
                          textTransform: 'none',
                          fontSize: '0.95rem',
                          boxShadow: 'none',
                          '&:hover': { background: '#6B2415', boxShadow: 'none' }
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
                <h3 className="font-serif text-xl text-foreground font-bold mb-2">Không Có Cuộc Đua Trực Tiếp</h3>
                <p className="text-muted-foreground mb-6">Hiện chưa có cuộc đua nào đang chạy</p>
                <Button
                  variant="outlined"
                  onClick={() => setActiveTab('schedule')}
                  sx={{ borderColor: '#1F3D2B', color: '#1F3D2B', borderRadius: 0, textTransform: 'none', '&:hover': { borderColor: '#1F3D2B', backgroundColor: 'rgba(31,61,43,0.06)' } }}
                >
                  Xem Lịch Trình Sắp Tới
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div>
            <div className="mb-6">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Lịch Trình Đua &amp; Đặt Cược</h2>
              <p className="text-muted-foreground">Các cuộc đua đang mở — đặt cược trước khi hết hạn</p>
            </div>

            {loadingSchedule ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : scheduleRaces.length === 0 ? (
              <div className="bg-card border border-border p-12 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Hiện không có cuộc đua nào đang mở đặt cược</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduleRaces.map(race => {
                  const bettingCutoff = new Date(new Date(race.scheduledTime).getTime() - 60 * 60 * 1000);
                  const cutoffPassed = new Date() > bettingCutoff;
                  const myBetOnRace = myBets.some(b => (b.raceId as any)?._id === race._id && b.status === 'pending');
                  const canBet = (race.status === 'open' || race.status === 'closed') && !cutoffPassed;

                  return (
                    <div key={race._id} className="bg-card border border-border p-6 hover:border-primary transition-all">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <Trophy className="w-5 h-5 text-[#8F7318]" />
                            <h3 className="font-serif text-xl font-bold text-foreground">{race.name}</h3>
                            <Chip label={race.grade} size="small" sx={{ bgcolor: 'rgba(201,162,39,0.15)', color: '#8F7318', border: '1px solid #C9A227', fontWeight: 'bold', fontSize: '0.7rem' }} />
                            {myBetOnRace && (
                              <Chip label="✓ Đã Đặt Cược" size="small" sx={{ bgcolor: '#C9A227', color: '#23201A', fontWeight: 'bold', fontSize: '0.7rem' }} />
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <div className="text-muted-foreground text-xs mb-1">Thời Gian Đua</div>
                              <div className="text-foreground font-medium">{new Date(race.scheduledTime).toLocaleString('vi-VN')}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-xs mb-1">Cự Ly</div>
                              <div className="text-foreground font-medium">{race.distance}m</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-xs mb-1">Giải Thưởng</div>
                              <div className="text-[#8F7318] font-semibold tabular-nums">${race.purse?.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-xs mb-1">Hạn Đặt Cược</div>
                              <div className={`font-medium text-sm ${cutoffPassed ? 'text-destructive' : 'text-primary'}`}>
                                {bettingCutoff.toLocaleString('vi-VN')}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-center gap-3 lg:w-44">
                          {canBet ? (
                            <Button fullWidth variant="contained" startIcon={<Target />}
                              onClick={() => handleOpenPrediction(race)}
                              sx={{ background: '#8C2F1B', color: 'white', borderRadius: 0, py: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none', '&:hover': { background: '#6B2415', boxShadow: 'none' } }}>
                              Đặt Cược
                            </Button>
                          ) : (
                            <div className="bg-gold/10 border border-gold/40 p-3 text-center">
                              <AlertCircle className="w-5 h-5 text-[#8F7318] mx-auto mb-1" />
                              <div className="text-xs text-[#8F7318] font-medium">Đã Đóng Cược</div>
                            </div>
                          )}
                          <Button fullWidth variant="outlined" startIcon={<Eye />}
                            onClick={() => navigate(`/spectator/race/${race._id}`)}
                            sx={{ borderColor: '#E3DCCB', color: '#7A7468', borderRadius: 0, py: 1, fontWeight: 600, textTransform: 'none', fontSize: '0.8rem', '&:hover': { borderColor: '#1F3D2B', color: '#1F3D2B', backgroundColor: 'rgba(31,61,43,0.04)' } }}>
                            Xem Race
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Deposit History Tab */}
        {activeTab === 'deposit-history' && (
          <div>
            <div className="mb-6">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Lịch Sử Nạp</h2>
              <p className="text-muted-foreground">Theo dõi các giao dịch nạp tiền của bạn</p>
            </div>
            <div className="bg-card border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Mã Giao Dịch</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Ngày</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Số Tiền</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Phương Thức</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {depositHistory.map((deposit) => (
                    <tr key={deposit.id} className="border-t border-border hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4 text-muted-foreground">{deposit.reference}</td>
                      <td className="px-6 py-4 text-foreground">{deposit.date}</td>
                      <td className="px-6 py-4 text-[#8F7318] font-bold tabular-nums">{deposit.amount}</td>
                      <td className="px-6 py-4 text-foreground">{deposit.method}</td>
                      <td className="px-6 py-4">
                        <Chip
                          label={deposit.status}
                          size="small"
                          sx={{
                            backgroundColor: deposit.status === 'Thành Công' ? 'rgba(31,61,43,0.12)' : 'rgba(201,162,39,0.15)',
                            color: deposit.status === 'Thành Công' ? '#1F3D2B' : '#8F7318',
                            fontWeight: 600
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bet History Tab */}
        {activeTab === 'bet-history' && (
          <div>
            <div className="mb-6">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Lịch Sử Cược</h2>
              <p className="text-muted-foreground">Xem lại tất cả các vé cược của bạn</p>
            </div>
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
                  {betHistory.map((bet) => (
                    <tr key={bet.id} className="border-t border-border hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4 text-foreground font-medium">{bet.race}</td>
                      <td className="px-6 py-4 text-foreground">{bet.date}</td>
                      <td className="px-6 py-4">
                        <div className="text-primary text-xs font-medium mb-1">{bet.type}</div>
                        <div className="text-foreground">{bet.horse}</div>
                      </td>
                      <td className="px-6 py-4 text-foreground tabular-nums">${bet.amount}</td>
                      <td className="px-6 py-4 text-muted-foreground">{bet.odds}</td>
                      <td className="px-6 py-4">
                        <Chip
                          label={bet.status === 'won' ? 'Thắng' : bet.status === 'lost' ? 'Thua' : 'Chờ'}
                          size="small"
                          sx={{
                            backgroundColor: bet.status === 'won' ? '#1F3D2B' : bet.status === 'lost' ? '#B42318' : '#EDE7D8',
                            color: bet.status === 'won' || bet.status === 'lost' ? 'white' : '#7A7468',
                            fontWeight: 600
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold tabular-nums ${bet.status === 'won' ? 'text-[#8F7318]' : 'text-muted-foreground'}`}>
                          {bet.status === 'won' ? `+$${bet.reward}` : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Lịch Sử Đặt Cược</h2>
                <p className="text-muted-foreground">Theo dõi các cược của bạn</p>
              </div>
              {myBets.length > 0 && (
                <div className="flex gap-6">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Thắng / Tổng</div>
                    <div className="font-serif text-2xl font-bold text-foreground tabular-nums">{myBets.filter(b => b.status === 'won').length} / {myBets.length}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Tổng Tiền Thắng</div>
                    <div className="font-serif text-2xl font-bold text-[#8F7318] tabular-nums">+${myBets.reduce((s, b) => s + (b.payoutAmount || 0), 0).toLocaleString()}</div>
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
                <p className="text-muted-foreground">Bạn chưa đặt cược nào. Vào tab Lịch Trình để đặt cược!</p>
              </div>
            ) : (
              <div className="bg-card border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">Cuộc Đua</th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">Ngày</th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">Loại Cược</th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">Ngựa</th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">Tiền Cược</th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">Hệ Số</th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">Trạng Thái</th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground">Kết Quả</th>
                        <th className="px-5 py-4 text-sm font-semibold text-muted-foreground"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {myBets.map(bet => {
                        const statusMap: Record<string, { label: string; color: string }> = {
                          pending: { label: 'Chờ kết quả', color: 'bg-gold/15 text-[#8F7318]' },
                          won: { label: 'Thắng', color: 'bg-primary/10 text-primary' },
                          lost: { label: 'Thua', color: 'bg-destructive/10 text-destructive' },
                          cancelled: { label: 'Đã hủy', color: 'bg-muted text-muted-foreground' },
                          refunded: { label: 'Đã hoàn', color: 'bg-secondary/10 text-secondary' },
                        };
                        const st = statusMap[bet.status] || statusMap.pending;
                        const betTypeLabel: Record<string, string> = { win: 'Thắng (Hạng 1)', place: 'Hạng 2', show: 'Hạng 3' };
                        const race = bet.raceId as any;
                        const horse = bet.horseId as any;
                        return (
                          <tr key={bet._id} className="border-t border-border hover:bg-muted/40 transition-colors">
                            <td className="px-5 py-4">
                              <div className="text-foreground font-medium">{race?.name || '-'}</div>
                              <div className="text-xs text-muted-foreground">{race?.grade}</div>
                            </td>
                            <td className="px-5 py-4 text-foreground text-sm">{new Date(bet.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td className="px-5 py-4">
                              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium">{betTypeLabel[bet.betType]}</span>
                            </td>
                            <td className="px-5 py-4 text-foreground font-medium">{horse?.name || '-'}</td>
                            <td className="px-5 py-4 text-foreground tabular-nums">${bet.amount.toLocaleString()}</td>
                            <td className="px-5 py-4 text-[#8F7318] font-semibold">{bet.multiplier}x</td>
                            <td className="px-5 py-4">
                              <span className={`px-2 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`font-bold tabular-nums ${bet.status === 'won' ? 'text-[#8F7318]' : 'text-muted-foreground'}`}>
                                {bet.status === 'won' ? `+$${bet.payoutAmount?.toLocaleString()}` : '-'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {bet.status === 'pending' && (
                                <button
                                  type="button"
                                  disabled={cancellingBetId === bet._id}
                                  onClick={() => handleCancelBet(bet._id)}
                                  className="text-xs text-destructive hover:text-destructive/80 border border-destructive/30 px-2 py-1 transition-colors disabled:opacity-50"
                                >
                                  {cancellingBetId === bet._id ? '...' : 'Hủy'}
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
        {activeTab === 'rankings' && (() => {
          const gradeColor: Record<string, string> = {
            G1: 'bg-gold text-foreground border-gold',
            G2: 'border-secondary text-secondary',
            G3: 'border-primary text-primary',
            Maiden: 'border-muted-foreground text-muted-foreground',
          };
          const rankBadge = (rank: number) => (
            <div className={`w-12 h-12 shrink-0 flex items-center justify-center text-sm font-bold ${
              rank === 1 ? 'bg-gold text-foreground' :
              rank === 2 ? 'bg-[#9A937F] text-white' :
              rank === 3 ? 'bg-[#A85C32] text-white' :
              'bg-muted text-muted-foreground'
            }`}>
              {rank <= 3 ? <Medal className="w-5 h-5" /> : `#${rank}`}
            </div>
          );
          const winBar = (rate: number) => (
            <div className="w-full bg-muted h-1.5 mt-1">
              <div className="bg-primary h-1.5" style={{ width: `${Math.min(rate, 100)}%` }} />
            </div>
          );
          const activeList = rankingType === 'horses' ? horseRankings
            : rankingType === 'jockeys' ? jockeyRankings
            : ownerRankings;

          return (
            <div>
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-serif text-3xl font-bold text-foreground mb-1">Bảng Xếp Hạng</h2>
                  <p className="text-muted-foreground text-sm">Dữ liệu tích lũy toàn sự nghiệp</p>
                </div>
                <div className="flex gap-2 p-1 bg-card border border-border">
                  {(['horses', 'jockeys', 'owners'] as const).map((t) => (
                    <button type="button" key={t} onClick={() => setRankingType(t)}
                      className={`px-4 py-2 text-sm font-semibold transition-all ${
                        rankingType === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}>
                      {t === 'horses' ? '🐎 Ngựa' : t === 'jockeys' ? '🏇 Kỵ Sĩ' : '👑 Chủ Ngựa'}
                    </button>
                  ))}
                </div>
              </div>

              {loadingRankings ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : activeList.length === 0 ? (
                <div className="bg-card border border-border p-12 text-center">
                  <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Chưa có dữ liệu xếp hạng</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rankingType === 'horses' && horseRankings.map((h) => (
                    <div key={h._id} className={`group flex items-center gap-4 p-4 bg-card border transition-all hover:-translate-y-0.5 ${
                      h.rank <= 3 ? 'border-gold/50' : 'border-border hover:border-primary'
                    }`}>
                      {rankBadge(h.rank)}

                      {/* Name + owner + grade */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-foreground font-bold truncate">{h.name}</span>
                          <span className={`text-xs px-2 py-0.5 border font-semibold shrink-0 uppercase tracking-wider ${gradeColor[h.currentGrade] || gradeColor.Maiden}`}>
                            {h.currentGrade}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">Chủ: {h.owner}</span>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:grid grid-cols-4 gap-6 text-center">
                        <div>
                          <div className="text-lg font-bold text-foreground tabular-nums">{h.totalPoints.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Điểm</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-[#8F7318] tabular-nums">{h.winCount}</div>
                          <div className="text-xs text-muted-foreground">Thắng</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-primary tabular-nums">{h.winRate}%</div>
                          {winBar(h.winRate)}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-secondary tabular-nums">{h.totalEarnings.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Coins</div>
                        </div>
                      </div>

                      {/* Mobile compact */}
                      <div className="md:hidden text-right">
                        <div className="text-[#8F7318] font-bold tabular-nums">{h.totalPoints} pts</div>
                        <div className="text-xs text-muted-foreground">{h.winRate}% win</div>
                      </div>
                    </div>
                  ))}

                  {rankingType === 'jockeys' && jockeyRankings.map((j) => (
                    <div key={j._id} className={`group flex items-center gap-4 p-4 bg-card border transition-all hover:-translate-y-0.5 ${
                      j.rank <= 3 ? 'border-gold/50' : 'border-border hover:border-primary'
                    }`}>
                      {rankBadge(j.rank)}

                      <div className="flex-1 min-w-0">
                        <div className="text-foreground font-bold truncate">{j.name}</div>
                        <div className="text-xs text-muted-foreground">{j.experienceYears} năm kinh nghiệm</div>
                      </div>

                      <div className="hidden md:grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-lg font-bold text-foreground tabular-nums">{j.raceCount}</div>
                          <div className="text-xs text-muted-foreground">Cuộc Đua</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-[#8F7318] tabular-nums">{j.winCount}</div>
                          <div className="text-xs text-muted-foreground">Thắng</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-primary tabular-nums">{j.winRate}%</div>
                          {winBar(j.winRate)}
                        </div>
                      </div>

                      <div className="md:hidden text-right">
                        <div className="text-[#8F7318] font-bold tabular-nums">{j.winCount} thắng</div>
                        <div className="text-xs text-muted-foreground">{j.winRate}% win</div>
                      </div>
                    </div>
                  ))}

                  {rankingType === 'owners' && ownerRankings.map((o) => (
                    <div key={o._id} className={`group flex items-center gap-4 p-4 bg-card border transition-all hover:-translate-y-0.5 ${
                      o.rank <= 3 ? 'border-gold/50' : 'border-border hover:border-primary'
                    }`}>
                      {rankBadge(o.rank)}

                      <div className="flex-1 min-w-0">
                        <div className="text-foreground font-bold truncate">{o.name}</div>
                        <div className="text-xs text-muted-foreground">{o.totalHorses} ngựa · {o.totalRaces} cuộc đua</div>
                      </div>

                      <div className="hidden md:grid grid-cols-4 gap-6 text-center">
                        <div>
                          <div className="text-lg font-bold text-foreground tabular-nums">{o.totalHorses}</div>
                          <div className="text-xs text-muted-foreground">Ngựa</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-[#8F7318] tabular-nums">{o.totalWins}</div>
                          <div className="text-xs text-muted-foreground">Thắng</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-primary tabular-nums">{o.winRate}%</div>
                          {winBar(o.winRate)}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-secondary tabular-nums">{o.totalEarnings.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Coins</div>
                        </div>
                      </div>

                      <div className="md:hidden text-right">
                        <div className="text-[#8F7318] font-bold tabular-nums">{o.totalWins} thắng</div>
                        <div className="text-xs text-muted-foreground">{o.winRate}% win</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-1">Bảng Dẫn Đầu Khán Giả</h2>
                <p className="text-muted-foreground text-sm">Xếp hạng theo tổng tiền thắng cược</p>
              </div>
              <button type="button" onClick={loadLeaderboard}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2 bg-card border border-border">
                <Activity className="w-3.5 h-3.5" /> Làm mới
              </button>
            </div>

            {loadingLeaderboard ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : spectatorRankings.length === 0 ? (
              <div className="bg-card border border-border p-12 text-center">
                <Award className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">Chưa có ai vào bảng xếp hạng</p>
                <p className="text-muted-foreground/70 text-sm">Hãy đặt cược và thắng để xuất hiện ở đây!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {spectatorRankings.map((entry) => {
                  const isMe = entry._id === user?._id;
                  return (
                    <div key={entry._id} className={`flex items-center gap-4 p-4 bg-card border transition-all ${
                      isMe
                        ? 'border-gold bg-gold/5'
                        : entry.rank <= 3
                        ? 'border-gold/50'
                        : 'border-border hover:border-primary'
                    }`}>
                      {/* Rank badge */}
                      <div className={`w-12 h-12 shrink-0 flex items-center justify-center text-sm font-bold ${
                        entry.rank === 1 ? 'bg-gold text-foreground' :
                        entry.rank === 2 ? 'bg-[#9A937F] text-white' :
                        entry.rank === 3 ? 'bg-[#A85C32] text-white' :
                        isMe ? 'bg-gold/20 text-[#8F7318] border border-gold/50' : 'bg-muted text-muted-foreground'
                      }`}>
                        {entry.rank <= 3 ? <Medal className="w-5 h-5" /> : `#${entry.rank}`}
                      </div>

                      {/* Avatar + name */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          isMe ? 'bg-gold text-foreground' : 'bg-primary text-primary-foreground'
                        }`}>
                          {entry.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-semibold truncate">{entry.name}</span>
                            {isMe && <Chip label="Bạn" size="small" sx={{ bgcolor: '#C9A227', color: '#23201A', fontWeight: 700, height: 18, fontSize: '0.65rem' }} />}
                          </div>
                          <div className="text-xs text-muted-foreground">{entry.totalBets} cược · {entry.winRate}% thắng</div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-8">
                        <div className="text-center">
                          <div className="text-sm font-bold text-[#8F7318] tabular-nums">{entry.wonBets}/{entry.totalBets}</div>
                          <div className="text-xs text-muted-foreground">Thắng/Tổng</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-sm font-bold tabular-nums ${entry.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            {entry.profit >= 0 ? '+' : ''}{entry.profit.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Lợi nhuận</div>
                        </div>
                        <div className="text-center min-w-[90px]">
                          <div className="text-lg font-bold text-foreground tabular-nums">{entry.totalPayout.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Tổng nhận</div>
                        </div>
                      </div>

                      {/* Mobile */}
                      <div className="md:hidden text-right shrink-0">
                        <div className="text-[#8F7318] font-bold text-sm tabular-nums">{entry.totalPayout.toLocaleString()}</div>
                        <div className={`text-xs tabular-nums ${entry.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {entry.profit >= 0 ? '+' : ''}{entry.profit.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA */}
            <div className="mt-8 bg-card border border-gold/40 p-8 text-center">
              <div className="w-14 h-14 bg-gold/15 flex items-center justify-center mx-auto mb-4">
                <Flame className="w-8 h-8 text-[#8F7318]" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground mb-2">Leo Lên Đỉnh Cao!</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                Đặt cược thông minh và liên tục để tích lũy chiến thắng, leo hạng và được ghi danh trên bảng dẫn đầu.
              </p>
              <Button variant="contained" startIcon={<Target />}
                onClick={() => setActiveTab('schedule')}
                sx={{ background: '#1F3D2B', color: '#F7F3EA', fontWeight: 700, borderRadius: 0, px: 4, textTransform: 'none', boxShadow: 'none', '&:hover': { background: '#172D20', boxShadow: 'none' } }}>
                Đặt Cược Ngay
              </Button>
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
            background: '#FFFFFF',
            border: '1px solid #E3DCCB',
            borderRadius: 0
          }
        }}
      >
        <DialogTitle sx={{ color: '#23201A', borderBottom: '1px solid #E3DCCB' }}>
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-secondary" />
            <span className="font-serif font-bold">Đặt Cược</span>
          </div>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {selectedRace && (
            <div>
              <div className="bg-background border border-border p-4 mb-6">
                <h3 className="font-serif text-foreground font-bold mb-1">{selectedRace.name}</h3>
                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                  <span className="text-muted-foreground">Hạng: <span className="text-[#8F7318] font-medium">{selectedRace.grade}</span></span>
                  <span className="text-muted-foreground">Cự Ly: <span className="text-foreground">{selectedRace.distance}m</span></span>
                  <span className="text-muted-foreground">Giải Thưởng: <span className="text-[#8F7318] font-medium">${selectedRace.purse?.toLocaleString()}</span></span>
                </div>
              </div>

              <div className="space-y-4">
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#7A7468' }}>Loại Cược</InputLabel>
                  <Select value={betType} onChange={(e) => setBetType(e.target.value)} label="Loại Cược"
                    sx={lightSelectSx}>
                    <MenuItem value="win">Thắng — ngựa về hạng 1 (hệ số 3.0x)</MenuItem>
                    <MenuItem value="place">Về Nhì — ngựa về hạng 2 (hệ số 2.0x)</MenuItem>
                    <MenuItem value="show">Về Ba — ngựa về hạng 3 (hệ số 1.5x)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#7A7468' }}>Chọn Ngựa *</InputLabel>
                  <Select value={selectedHorse} onChange={(e) => setSelectedHorse(e.target.value)} label="Chọn Ngựa *"
                    sx={lightSelectSx}>
                    {selectedRaceRegistrations.length > 0
                      ? selectedRaceRegistrations.map((h: any) => (
                          <MenuItem key={h.horseId} value={h.horseId}>
                            {h.horseName} ({h.currentGrade} · {h.totalPoints} điểm){h.jockeyName ? ` — ${h.jockeyName}` : ''}
                          </MenuItem>
                        ))
                      : <MenuItem disabled value="">Đang tải danh sách ngựa...</MenuItem>
                    }
                  </Select>
                </FormControl>

                <TextField fullWidth label="Số Tiền Cược ($) *" type="number" value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)} placeholder="Nhập số tiền (tối thiểu 1)"
                  sx={{ '& .MuiInputLabel-root': { color: '#7A7468' }, '& .MuiOutlinedInput-root': { color: '#23201A', borderRadius: 0, '& fieldset': { borderColor: '#E3DCCB' }, '&:hover fieldset': { borderColor: '#C9C2B0' }, '&.Mui-focused fieldset': { borderColor: '#1F3D2B' } } }} />

                <div className="bg-gold/10 border border-gold/40 p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Tiềm năng thắng:</span>
                    <span className="text-[#8F7318] font-bold text-lg tabular-nums">
                      {betAmount && !isNaN(Number(betAmount)) && Number(betAmount) > 0
                        ? `$${Math.floor(Number(betAmount) * BET_MULTIPLIERS[betType as BetType]).toLocaleString()}`
                        : '$0'}
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
        <DialogActions sx={{ p: 3, borderTop: '1px solid #E3DCCB' }}>
          <Button onClick={() => setPredictionModalOpen(false)} sx={{ color: '#7A7468', textTransform: 'none' }}>Hủy</Button>
          <Button onClick={handleSubmitPrediction} variant="contained"
            disabled={!selectedHorse || !betAmount || placingBet}
            sx={{ background: '#8C2F1B', textTransform: 'none', fontWeight: 700, borderRadius: 0, boxShadow: 'none', '&:hover': { background: '#6B2415', boxShadow: 'none' } }}>
            {placingBet ? '...' : 'Xác Nhận Đặt Cược'}
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
            background: '#FFFFFF',
            border: '1px solid #E3DCCB',
            borderRadius: 0
          }
        }}
      >
        {selectedTournamentForDetails && (
          <>
            <DialogTitle sx={{ color: '#23201A', borderBottom: '1px solid #E3DCCB', p: 3 }}>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold text-foreground">{selectedTournamentForDetails.name}</h2>
                <Chip
                  label={getTournamentStatusLabel(selectedTournamentForDetails.status)}
                  sx={{
                    bgcolor: getTournamentStatusHex(selectedTournamentForDetails.status),
                    color: 'white',
                    fontWeight: 'bold'
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
                      <div className="text-sm text-muted-foreground">Bắt Đầu</div>
                      <div className="text-foreground font-medium">{new Date(selectedTournamentForDetails.startDate).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Kết Thúc</div>
                      <div className="text-foreground font-medium">{new Date(selectedTournamentForDetails.endDate).toLocaleDateString('vi-VN')}</div>
                    </div>
                    {selectedTournamentForDetails.location && (
                      <div>
                        <div className="text-sm text-muted-foreground">Địa Điểm</div>
                        <div className="text-foreground font-medium">{selectedTournamentForDetails.location}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-background border border-border p-5">
                  <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#8F7318]" /> Mô Tả
                  </h3>
                  {selectedTournamentForDetails.description ? (
                    <p className="text-foreground text-sm leading-relaxed">{selectedTournamentForDetails.description}</p>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">Chưa có mô tả</p>
                  )}
                </div>
              </div>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid #E3DCCB' }}>
              <Button onClick={() => setTournamentDetailsModalOpen(false)} sx={{ color: '#7A7468', textTransform: 'none' }}>Đóng</Button>
              <Button
                variant="contained"
                onClick={() => { setTournamentDetailsModalOpen(false); setActiveTab('schedule'); }}
                sx={{ background: '#1F3D2B', color: '#F7F3EA', fontWeight: 'bold', borderRadius: 0, textTransform: 'none', boxShadow: 'none', '&:hover': { background: '#172D20', boxShadow: 'none' } }}
              >
                Xem Lịch Trình Ngay
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ========== DEPOSIT PORTAL MODAL ========== */}
      <Dialog
        open={depositPortalOpen}
        onClose={() => { setDepositPortalOpen(false); setDepositStep(1); setDepositAmountInput(''); }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: '#FFFFFF',
            border: '1px solid #E3DCCB',
            borderRadius: 0,
            overflow: 'hidden'
          }
        }}
      >
        {/* Modal Header */}
        <div className="relative bg-gold/10 border-b border-border p-6">
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold flex items-center justify-center">
                <Wallet className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">Cổng Nạp Tiền</h2>
                <p className="text-muted-foreground text-sm mt-0.5">An toàn · Nhanh chóng · Tiện lợi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary text-xs font-semibold">Bảo Mật SSL</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Số Dư Hiện Tại</div>
                <div className="text-[#8F7318] font-bold text-lg tabular-nums">{walletBalance ?? '...'}</div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-2 mt-5">
            {['Chọn Phương Thức', 'Nhập Số Tiền', 'Xác Nhận'].map((step, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 ${i + 1 <= depositStep ? 'text-[#8F7318]' : 'text-muted-foreground/60'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i + 1 < depositStep ? 'bg-gold border-gold text-foreground' :
                    i + 1 === depositStep ? 'border-gold text-[#8F7318]' :
                    'border-border text-muted-foreground/60'
                  }`}>{i + 1 < depositStep ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}</div>
                  <span className="text-xs font-medium whitespace-nowrap hidden sm:block">{step}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 mx-1 rounded-full ${i + 1 < depositStep ? 'bg-gold' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
        </div>

        <DialogContent sx={{ p: 0, overflowX: 'hidden' }}>
          {/* STEP 1: Choose Method */}
          {depositStep === 1 && (
            <div className="p-6 space-y-4">
              <h3 className="font-serif text-foreground font-bold mb-4">Chọn phương thức nạp tiền</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'bank', icon: Building2, label: 'Chuyển Khoản Ngân Hàng', sub: 'Vietcombank, Techcombank, MB Bank...', time: '5-30 phút', color: 'text-primary', limit: 'Tối thiểu: $10' },
                  { id: 'card', icon: CreditCard, label: 'Thẻ Tín Dụng / Ghi Nợ', sub: 'Visa, Mastercard, JCB', time: '1-5 phút', color: 'text-secondary', limit: 'Tối thiểu: $20' },
                  { id: 'ewallet', icon: Smartphone, label: 'Ví Điện Tử', sub: 'MoMo, ZaloPay, VNPay', time: 'Tức thì', color: 'text-secondary', limit: 'Tối thiểu: $5' },
                  { id: 'crypto', icon: Bitcoin, label: 'Tiền Điện Tử', sub: 'USDT (TRC20), BTC, ETH', time: '10-30 phút', color: 'text-[#8F7318]', limit: 'Tối thiểu: $50' },
                ].map(method => (
                  <button
                    type="button"
                    key={method.id}
                    onClick={() => setDepositMethod(method.id)}
                    className={`relative p-4 border-2 text-left transition-all hover:scale-[1.02] ${
                      depositMethod === method.id
                        ? 'bg-primary/5 border-primary'
                        : 'bg-background border-border hover:border-muted-foreground/40'
                    }`}
                  >
                    {depositMethod === method.id && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <method.icon className={`w-8 h-8 mb-3 ${method.color}`} />
                    <div className="text-foreground font-semibold text-sm mb-1">{method.label}</div>
                    <div className="text-muted-foreground text-xs mb-2">{method.sub}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-primary font-medium">⚡ {method.time}</span>
                      <span className="text-xs text-muted-foreground">{method.limit}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Info Alert */}
              <div className="bg-primary/5 border border-primary/20 p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-foreground">
                  <span className="font-semibold">Hướng Dẫn: </span>
                  Chọn phương thức nạp phù hợp với bạn. Tất cả giao dịch đều được mã hóa và bảo mật. Nếu cần hỗ trợ, liên hệ 24/7 qua chat trực tiếp.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Enter Amount & Info */}
          {depositStep === 2 && (
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gold/15 flex items-center justify-center">
                  {depositMethod === 'bank' && <Building2 className="w-5 h-5 text-primary" />}
                  {depositMethod === 'card' && <CreditCard className="w-5 h-5 text-secondary" />}
                  {depositMethod === 'ewallet' && <Smartphone className="w-5 h-5 text-secondary" />}
                  {depositMethod === 'crypto' && <Bitcoin className="w-5 h-5 text-[#8F7318]" />}
                </div>
                <div>
                  <div className="text-foreground font-bold">
                    {depositMethod === 'bank' && 'Chuyển Khoản Ngân Hàng'}
                    {depositMethod === 'card' && 'Thẻ Tín Dụng / Ghi Nợ'}
                    {depositMethod === 'ewallet' && 'Ví Điện Tử'}
                    {depositMethod === 'crypto' && 'Tiền Điện Tử (USDT)'}
                  </div>
                  <div className="text-muted-foreground text-sm">Điền thông tin nạp tiền bên dưới</div>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Số Tiền Muốn Nạp (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                  <input
                    type="number"
                    value={depositAmountInput}
                    onChange={(e) => setDepositAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-background border border-border pl-8 pr-4 py-3.5 text-foreground text-xl font-bold placeholder-muted-foreground/60 focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                {/* Quick Amount Buttons */}
                <div className="flex gap-2 mt-3">
                  {['50', '100', '200', '500', '1000'].map(amt => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setDepositAmountInput(amt)}
                      className={`flex-1 py-2 text-xs font-bold border transition-all ${
                        depositAmountInput === amt
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Details Based on Method */}
              {depositMethod === 'bank' && (
                <div className="bg-background border border-border p-5 space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-foreground font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Thông Tin Tài Khoản</h4>
                    <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">Đang Hoạt Động</span>
                  </div>
                  {[
                    { label: 'Ngân Hàng', value: 'Vietcombank (VCB)' },
                    { label: 'Số Tài Khoản', value: '1020 4857 2934 8800', copy: true },
                    { label: 'Chủ Tài Khoản', value: 'CONG TY TNHH RACING VN' },
                    { label: 'Chi Nhánh', value: 'TP. Hồ Chí Minh' },
                    { label: 'Nội Dung CK', value: `NAP ${(user?.fullName ?? 'USER').replace(/ /g, '').toUpperCase()} ${depositAmountInput || '___'}USD`, copy: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-muted-foreground text-sm">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium text-sm">{item.value}</span>
                        {item.copy && (
                          <button type="button" className="p-1 hover:bg-muted rounded transition-colors" title="Sao chép">
                            <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {depositMethod === 'ewallet' && (
                <div className="bg-background border border-border p-5">
                  <h4 className="text-foreground font-semibold mb-4 flex items-center gap-2"><Smartphone className="w-4 h-4 text-secondary" /> Chọn Ví Điện Tử</h4>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {['MoMo', 'ZaloPay', 'VNPay'].map(w => (
                      <button type="button" key={w} className="bg-card hover:bg-primary/5 border border-border hover:border-primary py-3 text-foreground text-sm font-medium transition-all">
                        {w}
                      </button>
                    ))}
                  </div>
                  <div className="bg-muted/40 p-4 text-center">
                    <div className="w-24 h-24 bg-white border border-border mx-auto mb-3 flex items-center justify-center">
                      <div className="text-foreground text-xs font-mono text-center">QR Code<br/>Preview</div>
                    </div>
                    <p className="text-muted-foreground text-xs">Mở app ví và quét mã QR hoặc nhập số điện thoại: <span className="text-foreground font-semibold">0909.888.777</span></p>
                  </div>
                </div>
              )}

              {depositMethod === 'crypto' && (
                <div className="bg-background border border-border p-5 space-y-3">
                  <h4 className="text-foreground font-semibold flex items-center gap-2"><Bitcoin className="w-4 h-4 text-[#8F7318]" /> Địa Chỉ Nạp USDT (TRC20)</h4>
                  <div className="bg-muted/40 border border-border p-4 flex items-center justify-between gap-2">
                    <span className="text-primary font-mono text-xs break-all">TRX7YmK9...4xPQm8NvL2sW</span>
                    <button type="button" className="p-1.5 hover:bg-muted flex-shrink-0"><Copy className="w-4 h-4 text-muted-foreground hover:text-primary" /></button>
                  </div>
                  <div className="bg-gold/10 border border-gold/40 p-3 text-xs text-[#8F7318]">
                    ⚠️ Chỉ gửi <strong>USDT TRC20</strong>. Gửi sai mạng sẽ mất tiền vĩnh viễn. Tối thiểu $50.
                  </div>
                </div>
              )}

              {depositMethod === 'card' && (
                <div className="bg-background border border-border p-5 space-y-4">
                  <h4 className="text-foreground font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4 text-secondary" /> Thông Tin Thẻ</h4>
                  {['Số Thẻ (16 chữ số)', 'Tên Chủ Thẻ', 'Ngày Hết Hạn (MM/YY)', 'Mã CVV'].map((ph, i) => (
                    <div key={i} className="relative">
                      <input type={i === 3 ? 'password' : 'text'} placeholder={ph}
                        className="w-full bg-card border border-border px-4 py-3 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary transition-all text-sm" />
                    </div>
                  ))}
                </div>
              )}

              {/* Important Notice */}
              <div className="bg-gold/5 border border-gold/30 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-[#8F7318] flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1.5">
                    <div className="text-[#8F7318] font-semibold">Lưu Ý Quan Trọng</div>
                    <ul className="text-muted-foreground space-y-1 list-disc list-inside text-xs">
                      <li>Nhập đúng nội dung chuyển khoản để hệ thống tự động xác nhận</li>
                      <li>Tiền sẽ được cộng vào tài khoản trong vòng 5-30 phút</li>
                      <li>Hỗ trợ 24/7: support@racingvn.com hoặc Hotline 1800-8888</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Confirm */}
          {depositStep === 3 && (
            <div className="p-6 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mt-2">
                <CheckCircle className="w-10 h-10 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-foreground mb-2">Yêu Cầu Đã Gửi!</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">Chúng tôi đã nhận được yêu cầu nạp <span className="text-[#8F7318] font-bold">${depositAmountInput}</span> của bạn. Hệ thống sẽ xử lý trong vài phút.</p>
              </div>
              <div className="w-full bg-background border border-border p-5 text-left space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mã Giao Dịch</span>
                  <span className="text-foreground font-mono font-semibold">TRX-{Date.now().toString().slice(-8)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Số Tiền</span>
                  <span className="text-[#8F7318] font-bold tabular-nums">${depositAmountInput}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trạng Thái</span>
                  <span className="text-[#8F7318] font-semibold">Đang Xử Lý</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Thời Gian</span>
                  <span className="text-foreground">{new Date().toLocaleTimeString('vi-VN')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setDepositPortalOpen(false); setDepositStep(1); setDepositAmountInput(''); setActiveTab('deposit-history'); }}
                className="text-sm text-secondary hover:text-secondary/80 underline underline-offset-2 transition-colors"
              >
                Xem Lịch Sử Nạp Tiền →
              </button>
            </div>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #E3DCCB', gap: 1 }}>
          {depositStep > 1 && depositStep < 3 && (
            <Button onClick={() => setDepositStep(s => s - 1)} sx={{ color: '#7A7468', textTransform: 'none' }}>
              ← Quay Lại
            </Button>
          )}
          <div className="flex-1" />
          <Button
            onClick={() => { setDepositPortalOpen(false); setDepositStep(1); setDepositAmountInput(''); }}
            sx={{ color: '#7A7468', textTransform: 'none' }}
          >
            {depositStep === 3 ? 'Đóng' : 'Hủy'}
          </Button>
          {depositStep < 3 && (
            <Button
              variant="contained"
              disabled={depositStep === 2 && !depositAmountInput}
              onClick={() => setDepositStep(s => s + 1)}
              sx={{
                background: '#1F3D2B',
                color: '#F7F3EA',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 0,
                px: 3,
                boxShadow: 'none',
                '&:hover': { background: '#172D20', boxShadow: 'none' },
                '&:disabled': { background: '#EDE7D8', color: '#7A7468' }
              }}
            >
              {depositStep === 1 ? 'Tiếp Theo →' : 'Xác Nhận Nạp Tiền'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
