import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Users,
  Calendar,
  Trophy,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Target,
  Gift,
  Play,
  Medal,
  Star,
  DollarSign,
  Clock,
  Sparkles,
  Bell,
  Filter,
  Search,
  Flame,
  Award,
  Activity,
  ChevronRight,
  ChevronDown,
  Coins,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Wallet,
  History,
  CreditCard,
  Building2,
  Smartphone,
  Bitcoin,
  Copy,
  Shield
} from 'lucide-react';
import { Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { raceApi, type Race } from '../api/race';
import { betApi, type Bet, type BetType, BET_MULTIPLIERS } from '../api/bet';
import { toast } from 'sonner';

export function SpectatorDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { formatted: walletBalance } = useWallet();
  const [activeTab, setActiveTab] = useState('tournaments');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [predictionModalOpen, setPredictionModalOpen] = useState(false);
  const [tournamentDetailsModalOpen, setTournamentDetailsModalOpen] = useState(false);
  const [depositPortalOpen, setDepositPortalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

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
      setScheduleRaces(openRes.races ?? []);
      // Live tab shows running + pre_check + closed (sắp chạy)
      setLiveRacesData([
        ...(runningRes.races ?? []),
        ...(preCheckRes.races ?? []),
        ...(closedRes.races ?? []),
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
    if (activeTab === 'schedule' || activeTab === 'live') loadSchedule();
    if (activeTab === 'predictions') loadMyBets();
  }, [activeTab, token]);
  const [depositMethod, setDepositMethod] = useState('bank');
  const [depositAmountInput, setDepositAmountInput] = useState('');
  const [depositStep, setDepositStep] = useState(1);
  const [selectedTournamentForDetails, setSelectedTournamentForDetails] = useState<any>(null);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [betType, setBetType] = useState('win');
  const [selectedHorse, setSelectedHorse] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [rankingType, setRankingType] = useState('horses');
  const [rankingFilter, setRankingFilter] = useState('all-time');
  const [tournamentFilter, setTournamentFilter] = useState('all');
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mockUser = {
    name: 'Alex Morgan',
    email: 'alex.morgan@email.com',
    avatar: 'AM',
    level: 'Thành Viên Vàng',
    joinDate: '01/2025',
    totalBets: 18,
    winRate: '67%',
    balance: '$1,350',
    rank: 4,
    verified: true,
  };

  const tournaments = [
    {
      id: 1,
      name: 'Giải Vô Địch Ưu Tú 2026',
      banner: 'https://images.unsplash.com/photo-1568572933382-74d440642117?w=800',
      status: 'Đang Diễn Ra',
      startDate: '2026-05-01',
      endDate: '2026-06-30',
      totalRaces: 24,
      prizePool: '$500,000',
      grade: 'Grade A',
      currentLeader: 'Thunder Strike',
      participants: 120
    },
    {
      id: 2,
      name: 'Giải Mùa Xuân',
      banner: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800',
      status: 'Sắp Diễn Ra',
      startDate: '2026-06-15',
      endDate: '2026-07-15',
      totalRaces: 18,
      prizePool: '$300,000',
      grade: 'Grade B',
      currentLeader: '-',
      participants: 85
    },
    {
      id: 3,
      name: 'Chung Kết Derby Vàng',
      banner: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800',
      status: 'Đã Kết Thúc',
      startDate: '2026-03-01',
      endDate: '2026-04-30',
      totalRaces: 30,
      prizePool: '$750,000',
      grade: 'Grade A',
      currentLeader: 'Midnight Star',
      participants: 150
    }
  ];

  const liveRaces = [
    {
      id: 1,
      tournament: 'Giải Vô Địch Ưu Tú 2026',
      raceName: 'Cuộc Đua 12 - Vòng Chung Kết',
      grade: 'Grade A',
      distance: '2400m',
      status: 'Đang Diễn Ra',
      elapsed: '2:45',
      referee: 'John Martinez',
      leaders: [
        { position: 1, horse: 'Thunder Strike', jockey: 'Mike Johnson', speed: '58 km/h', distance: '450m' },
        { position: 2, horse: 'Golden Arrow', jockey: 'Sarah Williams', speed: '57 km/h', distance: '455m' },
        { position: 3, horse: 'Storm Chaser', jockey: 'David Chen', speed: '56 km/h', distance: '462m' },
        { position: 4, horse: 'Wind Runner', jockey: 'Emma Davis', speed: '55 km/h', distance: '470m' },
        { position: 5, horse: 'Crimson Glory', jockey: 'Alex Kim', speed: '54 km/h', distance: '480m' }
      ]
    }
  ];

  const upcomingRaces = [
    {
      id: 1,
      date: '2026-05-25',
      time: '14:00',
      tournament: 'Giải Vô Địch Ưu Tú 2026',
      raceName: 'Cuộc Đua 13 - Tứ Kết',
      grade: 'Grade A',
      distance: '2000m',
      referee: 'Michael Brown',
      status: 'Đang Mở',
      cutoffTime: '2026-05-25 13:45',
      horses: [
        { id: 'h1', name: 'Blazing Star', jockey: 'Tom Wilson', odds: '2.5x' },
        { id: 'h2', name: 'Night Fury', jockey: 'Lisa Anderson', odds: '3.2x' },
        { id: 'h3', name: 'Silver Bullet', jockey: 'Chris Lee', odds: '4.0x' },
        { id: 'h4', name: 'Desert Storm', jockey: 'Maria Garcia', odds: '5.5x' },
        { id: 'h5', name: 'Royal Thunder', jockey: 'James Miller', odds: '6.0x' }
      ],
      predicted: false
    },
    {
      id: 2,
      date: '2026-05-25',
      time: '16:00',
      tournament: 'Giải Vô Địch Ưu Tú 2026',
      raceName: 'Cuộc Đua 14 - Bán Kết',
      grade: 'Grade A',
      distance: '2400m',
      referee: 'Sarah Johnson',
      status: 'Kiểm Tra Trước',
      cutoffTime: '2026-05-25 15:45',
      horses: [
        { id: 'h6', name: 'Phoenix Rising', jockey: 'Robert Taylor', odds: '3.0x' },
        { id: 'h7', name: 'Ocean Wave', jockey: 'Jennifer White', odds: '3.5x' },
        { id: 'h8', name: 'Mountain King', jockey: 'Daniel Brown', odds: '4.2x' }
      ],
      predicted: true
    }
  ];

  const myPredictions = [
    {
      id: 1,
      race: 'Cuộc Đua 10 - Cổ Điển Mùa Xuân',
      tournament: 'Giải Vô Địch Ưu Tú 2026',
      date: '2026-05-20',
      betType: 'Thắng',
      predicted: 'Thunder Strike',
      actual: 'Thunder Strike',
      amount: 100,
      multiplier: '3.0x',
      status: 'won',
      reward: 300
    },
    {
      id: 2,
      race: 'Cuộc Đua 9 - Cúp Chiến Thắng',
      tournament: 'Giải Mùa Xuân',
      date: '2026-05-18',
      betType: 'Về Đích Top 3',
      predicted: 'Storm Runner',
      actual: 'Golden Arrow',
      amount: 150,
      multiplier: '2.0x',
      status: 'lost',
      reward: 0
    },
    {
      id: 3,
      race: 'Cuộc Đua 8 - Derby Ưu Tú',
      tournament: 'Giải Vô Địch Ưu Tú 2026',
      date: '2026-05-15',
      betType: 'Về Đích Top 5',
      predicted: 'Wild Fire',
      actual: 'Wild Fire',
      amount: 200,
      multiplier: '1.5x',
      status: 'won',
      reward: 300
    },
    {
      id: 4,
      race: 'Cuộc Đua 7 - Nước Rút Vàng',
      tournament: 'Chung Kết Derby Vàng',
      date: '2026-05-12',
      betType: 'Thắng',
      predicted: 'Midnight Star',
      actual: 'Midnight Star',
      amount: 250,
      multiplier: '3.0x',
      status: 'won',
      reward: 750
    }
  ];

  const depositHistory = [
    { id: 'DEP001', date: '2026-05-28 10:30', amount: '$500', method: 'Chuyển Khoản Ngân Hàng', status: 'Thành Công', reference: 'TRX-987654321' },
    { id: 'DEP002', date: '2026-05-25 14:15', amount: '$200', method: 'Thẻ Tín Dụng', status: 'Thành Công', reference: 'TRX-123456789' },
    { id: 'DEP003', date: '2026-05-20 09:00', amount: '$1,000', method: 'Ví Điện Tử', status: 'Thành Công', reference: 'TRX-456789123' },
    { id: 'DEP004', date: '2026-05-18 16:45', amount: '$300', method: 'Crypto', status: 'Đang Xử Lý', reference: 'TRX-789123456' },
  ];

  const betHistory = [
    { id: 'BET001', date: '2026-05-28 11:00', race: 'Cuộc Đua 15 - Chung Kết', amount: 100, type: 'Thắng', horse: 'Thunder Strike', odds: '2.5x', status: 'pending', reward: 0 },
    { id: 'BET002', date: '2026-05-27 15:30', race: 'Cuộc Đua 12 - Bán Kết', amount: 50, type: 'Về Đích Top 3', horse: 'Golden Arrow', odds: '1.8x', status: 'won', reward: 90 },
    { id: 'BET003', date: '2026-05-26 14:00', race: 'Cuộc Đua 10 - Vòng Loại', amount: 200, type: 'Về Đích Top 5', horse: 'Storm Chaser', odds: '3.0x', status: 'lost', reward: 0 },
    { id: 'BET004', date: '2026-05-25 09:15', race: 'Cuộc Đua 8 - Khởi Động', amount: 150, type: 'Thắng', horse: 'Wild Fire', odds: '5.5x', status: 'won', reward: 825 },
  ];


  const horseRankings = [
    { rank: 1, name: 'Thunder Strike', owner: 'Elite Stables', totalPoints: 2450, wins: 18, earnings: '$125,000', winRate: '75%' },
    { rank: 2, name: 'Midnight Star', owner: 'Royal Racing', totalPoints: 2180, wins: 15, earnings: '$98,500', winRate: '68%' },
    { rank: 3, name: 'Golden Arrow', owner: 'Summit Farms', totalPoints: 1920, wins: 12, earnings: '$85,200', winRate: '63%' },
    { rank: 4, name: 'Storm Chaser', owner: 'Thunder Valley', totalPoints: 1850, wins: 11, earnings: '$78,400', winRate: '61%' },
    { rank: 5, name: 'Wild Fire', owner: 'Phoenix Racing', totalPoints: 1740, wins: 10, earnings: '$72,100', winRate: '58%' }
  ];

  const jockeyRankings = [
    { rank: 1, name: 'Mike Johnson', races: 45, wins: 32, earnings: '$215,000', winRate: '71%' },
    { rank: 2, name: 'Sarah Williams', races: 52, wins: 35, earnings: '$198,000', winRate: '67%' },
    { rank: 3, name: 'David Chen', races: 38, wins: 24, earnings: '$165,000', winRate: '63%' },
    { rank: 4, name: 'Emma Davis', races: 41, wins: 25, earnings: '$152,000', winRate: '61%' },
    { rank: 5, name: 'Alex Kim', races: 36, wins: 21, earnings: '$138,000', winRate: '58%' }
  ];

  const ownerRankings = [
    { rank: 1, name: 'Elite Stables', horses: 12, wins: 45, earnings: '$485,000', winRate: '68%' },
    { rank: 2, name: 'Royal Racing', horses: 10, wins: 38, earnings: '$425,000', winRate: '65%' },
    { rank: 3, name: 'Summit Farms', horses: 15, wins: 42, earnings: '$398,000', winRate: '61%' },
    { rank: 4, name: 'Thunder Valley', horses: 8, wins: 28, earnings: '$325,000', winRate: '59%' },
    { rank: 5, name: 'Phoenix Racing', horses: 11, wins: 32, earnings: '$298,000', winRate: '56%' }
  ];

  const spectatorLeaderboard = [
    { rank: 1, name: 'Alex Morgan', predictions: 45, wins: 32, winRate: '71%', earnings: 2450, accuracy: '71%' },
    { rank: 2, name: 'Emma Wilson', predictions: 52, wins: 35, winRate: '67%', earnings: 2180, accuracy: '67%' },
    { rank: 3, name: 'Chris Lee', predictions: 38, wins: 24, winRate: '63%', earnings: 1920, accuracy: '63%' },
    { rank: 4, name: 'You', predictions: 18, wins: 12, winRate: '67%', earnings: 1350, accuracy: '67%', isYou: true },
    { rank: 5, name: 'Jordan Smith', predictions: 41, wins: 25, winRate: '61%', earnings: 1640, accuracy: '61%' }
  ];

  const notifications = [
    { id: 1, type: 'won', title: 'Dự Đoán Thắng!', message: 'Cược của bạn vào Thunder Strike đã thắng! +$300', amount: 300, time: '5 phút trước', read: false },
    { id: 2, type: 'starting', title: 'Cuộc Đua Sắp Bắt Đầu', message: 'Cuộc Đua 13 bắt đầu trong 15 phút', time: '12 phút trước', read: false },
    { id: 3, type: 'result', title: 'Kết Quả Đã Công Bố', message: 'Kết quả Cuộc Đua 10 đã có', time: '1 giờ trước', read: true },
    { id: 4, type: 'lost', title: 'Dự Đoán Thua', message: 'Cược của bạn vào Storm Runner không thắng', time: '2 giờ trước', read: true }
  ];

  const stats = [
    { label: 'Số Dư Ví', value: '$1,350', icon: Coins, color: 'from-[#FFDE42] to-[#E6C21E]' },
    { label: 'Dự Đoán Đang Hoạt Động', value: '3', icon: Target, color: 'from-blue-500 to-blue-600' },
    { label: 'Tỷ Lệ Thắng', value: '67%', icon: TrendingUp, color: 'from-amber-500 to-amber-600' },
    { label: 'Tổng Tiền Thắng', value: '+$1,350', icon: Gift, color: 'from-purple-500 to-purple-600' }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đang Mở': return 'bg-[#FFDE42]/10 text-[#FFDE42] border-[#FFDE42]/30';
      case 'Đang Diễn Ra': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'Đã Kết Thúc': return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'Kiểm Tra Trước': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Đã Đóng': return 'bg-slate-600/10 text-slate-400 border-slate-600/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getTournamentStatusColor = (status: string) => {
    switch (status) {
      case 'Đang Diễn Ra': return 'bg-[#FFDE42]';
      case 'Sắp Diễn Ra': return 'bg-blue-500';
      case 'Đã Kết Thúc': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  const filteredTournaments = tournaments.filter(t => {
    if (tournamentFilter === 'all') return true;
    return t.status.toLowerCase() === tournamentFilter;
  });

  const totalPredictions = myPredictions.length;
  const wonPredictions = myPredictions.filter(p => p.status === 'won').length;
  const accuracyRate = totalPredictions > 0 ? ((wonPredictions / totalPredictions) * 100).toFixed(0) : '0';

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <img src="/images/logo.png" alt="RaceTrack Logo" className="w-12 h-12 object-contain drop-shadow-md" />
            </div>
            <div>
              <div className="text-white font-semibold">Khu Vực Khán Giả</div>
              <div className="text-sm text-slate-400">Chào mừng, {user?.fullName || 'Khán Giả'}</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {/* Wallet Balance Badge */}
            <div className="flex items-center gap-2 bg-[#FFDE42]/10 border border-[#FFDE42]/20 px-4 py-2 rounded-xl">
              <Coins className="w-4 h-4 text-[#FFDE42]" />
              <span className="text-[#FFDE42] font-bold text-sm">{walletBalance ?? user?.balance ?? '...'}</span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-slate-400" />
              <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-950"></div>
            </button>

            {/* Profile Dropdown */}
            <ProfileDropdown />
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <div className="pt-24 max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-5 hover:-translate-y-1 transition-transform">
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-3 shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'tournaments', label: 'Giải Đấu', icon: Sparkles },
            { id: 'live', label: 'Đang Trực Tiếp', icon: Play },
            { id: 'schedule', label: 'Lịch Trình', icon: Calendar },
            { id: 'predictions', label: 'Dự Đoán Của Tôi', icon: Target },
            { id: 'rankings', label: 'Bảng Xếp Hạng', icon: Trophy },
            { id: 'leaderboard', label: 'Bảng Dẫn Đầu', icon: Award }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap font-medium ${
                activeTab === tab.id
                  ? 'bg-[#FFDE42] text-white shadow-lg shadow-[#FFDE42]/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Giải Đấu</h2>
                <p className="text-slate-400">Duyệt qua tất cả các giải đấu đua ngựa và thông tin chi tiết</p>
              </div>

              <div className="flex gap-3">
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={tournamentFilter}
                    onChange={(e) => setTournamentFilter(e.target.value)}
                    sx={{
                      color: 'white',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FFDE42' },
                      '.MuiSvgIcon-root': { color: '#94a3b8' },
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '12px'
                    }}
                  >
                    <MenuItem key="all" value="all">Tất Cả Trạng Thái</MenuItem>
                    <MenuItem key="running" value="running">Đang Diễn Ra</MenuItem>
                    <MenuItem key="upcoming" value="upcoming">Sắp Diễn Ra</MenuItem>
                    <MenuItem key="finished" value="finished">Đã Kết Thúc</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <div key={tournament.id} className="group bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:border-[#FFDE42]/30 transition-all">
                  <div className="relative h-40 bg-slate-900">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getTournamentStatusColor(tournament.status)}`}>
                        {tournament.status}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <div className="text-xs font-medium text-[#FFDE42] mb-1">{tournament.grade}</div>
                      <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <div className="text-slate-500 text-xs mb-1">Thời Gian</div>
                        <div className="text-white font-medium">{tournament.startDate} - {tournament.endDate}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs mb-1">Giải Thưởng</div>
                        <div className="text-[#FFDE42] font-bold">{tournament.prizePool}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs mb-1">Tổng Cuộc Đua</div>
                        <div className="text-white font-medium">{tournament.totalRaces} cuộc</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs mb-1">Người Tham Gia</div>
                        <div className="text-white font-medium">{tournament.participants}</div>
                      </div>
                    </div>

                    {tournament.currentLeader !== '-' && (
                      <div className="bg-white/5 rounded-lg p-3 mb-4">
                        <div className="text-xs text-slate-400 mb-1">Đang Dẫn Đầu</div>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <span className="text-white font-medium">{tournament.currentLeader}</span>
                        </div>
                      </div>
                    )}

                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleOpenTournamentDetails(tournament)}
                      endIcon={<ChevronRight className="w-4 h-4" />}
                      sx={{
                        borderColor: 'rgba(16, 185, 129, 0.3)',
                        color: '#FFDE42',
                        borderRadius: '10px',
                        '&:hover': { borderColor: '#FFDE42', backgroundColor: 'rgba(255, 222, 66, 0.1)' }
                      }}
                    >
                      Xem Chi Tiết
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Races Tab */}
        {activeTab === 'live' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-3xl font-bold text-white">Đang Trực Tiếp</h2>
              <Chip
                label={`${liveRacesData.length} Đang Hoạt Động`}
                size="small"
                sx={{ backgroundColor: liveRacesData.length > 0 ? '#ef4444' : '#475569', color: 'white' }}
              />
              <button
                onClick={loadSchedule}
                className="ml-auto text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <Activity className="w-3 h-3" />
                Làm mới
              </button>
            </div>

            {loadingSchedule ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#FFDE42] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : liveRacesData.length > 0 ? (
              <div className="space-y-6">
                {liveRacesData.map(race => {
                  const myBetOnRace = myBets.some(b => (b.raceId as any)?._id === race._id && b.status === 'pending');
                  const isRunning = race.status === 'running';
                  const borderColor = isRunning ? 'border-red-500/30' : 'border-amber-500/20';
                  const statusLabel = isRunning ? 'LIVE' : race.status === 'pre_check' ? 'Chuẩn bị' : 'Đóng cược';
                  const statusBg = isRunning ? '#ef4444' : '#f59e0b';
                  return (
                    <div key={race._id} className={`bg-white/5 backdrop-blur-md border ${borderColor} rounded-2xl p-6`}>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className={`w-3 h-3 rounded-full animate-pulse shrink-0 ${isRunning ? 'bg-red-500' : 'bg-amber-400'}`} />
                          <div>
                            <h3 className="text-xl font-bold text-white">{race.name}</h3>
                            <p className="text-sm text-slate-400">{race.distance}m • {new Date(race.scheduledTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <Chip label={statusLabel} size="small" sx={{ backgroundColor: statusBg, color: 'white', fontWeight: 'bold' }} />
                          {myBetOnRace && (
                            <Chip label="✓ Bạn đã cược" size="small" sx={{ bgcolor: '#FFDE42', color: '#1B0C0C', fontWeight: 'bold', fontSize: '0.7rem' }} />
                          )}
                        </div>
                        <Chip
                          label={race.grade}
                          size="small"
                          sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid #f59e0b', fontWeight: 'bold' }}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="text-xs text-slate-400 mb-1">Cấp Hạng</div>
                          <div className="text-white font-semibold">{race.grade}</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="text-xs text-slate-400 mb-1">Cự Ly</div>
                          <div className="text-white font-semibold">{race.distance}m</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="text-xs text-slate-400 mb-1">Giải Thưởng</div>
                          <div className="text-[#FFDE42] font-semibold">{race.purse.toLocaleString()} coins</div>
                        </div>
                      </div>

                      <div className={`${isRunning ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'} border rounded-xl p-4 mb-4 flex items-center gap-3`}>
                        <div className={`w-8 h-8 ${isRunning ? 'bg-red-500/20' : 'bg-amber-500/20'} rounded-full flex items-center justify-center shrink-0`}>
                          <Activity className={`w-4 h-4 ${isRunning ? 'text-red-400' : 'text-amber-400'}`} />
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{isRunning ? 'Cuộc đua đang diễn ra' : 'Cuộc đua sắp bắt đầu'}</div>
                          <div className="text-slate-400 text-xs">Vào xem trực tiếp để theo dõi vị trí ngựa và nhận kết quả ngay khi hoàn thành</div>
                        </div>
                      </div>

                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Eye />}
                        onClick={() => navigate(`/spectator/race/${race._id}`)}
                        sx={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                          borderRadius: '12px',
                          py: 1.5,
                          fontWeight: 700,
                          textTransform: 'none',
                          fontSize: '0.95rem',
                          '&:hover': { background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)' }
                        }}
                      >
                        Xem Trực Tiếp
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-12 text-center">
                <Play className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl text-white font-semibold mb-2">Không Có Cuộc Đua Trực Tiếp</h3>
                <p className="text-slate-400 mb-6">Hiện chưa có cuộc đua nào đang chạy</p>
                <Button
                  variant="outlined"
                  onClick={() => setActiveTab('schedule')}
                  sx={{ borderColor: 'rgba(255,222,66,0.4)', color: '#FFDE42', borderRadius: '10px', textTransform: 'none', '&:hover': { borderColor: '#FFDE42', backgroundColor: 'rgba(255,222,66,0.05)' } }}
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
              <h2 className="text-3xl font-bold text-white mb-2">Lịch Trình Đua & Đặt Cược</h2>
              <p className="text-slate-400">Các cuộc đua đang mở — đặt cược trước khi hết hạn</p>
            </div>

            {loadingSchedule ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#FFDE42] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : scheduleRaces.length === 0 ? (
              <div className="bg-white/5 border border-white/5 rounded-2xl p-12 text-center">
                <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Hiện không có cuộc đua nào đang mở đặt cược</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduleRaces.map(race => {
                  const bettingCutoff = new Date(new Date(race.scheduledTime).getTime() - 60 * 60 * 1000);
                  const cutoffPassed = new Date() > bettingCutoff;
                  const myBetOnRace = myBets.some(b => (b.raceId as any)?._id === race._id && b.status === 'pending');
                  const canBet = race.status === 'open' && !cutoffPassed;

                  return (
                    <div key={race._id} className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-[#FFDE42]/30 transition-all">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <Trophy className="w-5 h-5 text-[#FFDE42]" />
                            <h3 className="text-xl font-bold text-white">{race.name}</h3>
                            <Chip label={race.grade} size="small" sx={{ bgcolor: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid #f59e0b', fontWeight: 'bold', fontSize: '0.7rem' }} />
                            {myBetOnRace && (
                              <Chip label="✓ Đã Đặt Cược" size="small" sx={{ bgcolor: '#FFDE42', color: '#1B0C0C', fontWeight: 'bold', fontSize: '0.7rem' }} />
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <div className="text-slate-500 text-xs mb-1">Thời Gian Đua</div>
                              <div className="text-white font-medium">{new Date(race.scheduledTime).toLocaleString('vi-VN')}</div>
                            </div>
                            <div>
                              <div className="text-slate-500 text-xs mb-1">Cự Ly</div>
                              <div className="text-white font-medium">{race.distance}m</div>
                            </div>
                            <div>
                              <div className="text-slate-500 text-xs mb-1">Giải Thưởng</div>
                              <div className="text-[#FFDE42] font-semibold">${race.purse?.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-slate-500 text-xs mb-1">Hạn Đặt Cược</div>
                              <div className={`font-medium text-sm ${cutoffPassed ? 'text-red-400' : 'text-emerald-400'}`}>
                                {bettingCutoff.toLocaleString('vi-VN')}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-center gap-3 lg:w-44">
                          {canBet ? (
                            <Button fullWidth variant="contained" startIcon={<Target />}
                              onClick={() => handleOpenPrediction(race)}
                              sx={{ background: 'linear-gradient(135deg, #FFDE42 0%, #E6C21E 100%)', color: '#1B0C0C', borderRadius: '12px', py: 1.5, fontWeight: 700, textTransform: 'none', '&:hover': { background: 'linear-gradient(135deg, #FFDE42 0%, #C29D13 100%)' } }}>
                              Đặt Cược
                            </Button>
                          ) : (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                              <AlertCircle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                              <div className="text-xs text-amber-400 font-medium">Đã Đóng Cược</div>
                            </div>
                          )}
                          <Button fullWidth variant="outlined" startIcon={<Eye />}
                            onClick={() => navigate(`/spectator/race/${race._id}`)}
                            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#94a3b8', borderRadius: '12px', py: 1, fontWeight: 600, textTransform: 'none', fontSize: '0.8rem', '&:hover': { borderColor: '#FFDE42', color: '#FFDE42', backgroundColor: 'rgba(255,222,66,0.05)' } }}>
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
              <h2 className="text-3xl font-bold text-white mb-2">Lịch Sử Nạp</h2>
              <p className="text-slate-400">Theo dõi các giao dịch nạp tiền của bạn</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Mã Giao Dịch</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Ngày</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Số Tiền</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Phương Thức</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {depositHistory.map((deposit) => (
                    <tr key={deposit.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-slate-400">{deposit.reference}</td>
                      <td className="px-6 py-4 text-slate-300">{deposit.date}</td>
                      <td className="px-6 py-4 text-[#FFDE42] font-bold">{deposit.amount}</td>
                      <td className="px-6 py-4 text-white">{deposit.method}</td>
                      <td className="px-6 py-4">
                        <Chip
                          label={deposit.status}
                          size="small"
                          sx={{
                            backgroundColor: deposit.status === 'Thành Công' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: deposit.status === 'Thành Công' ? '#10b981' : '#f59e0b',
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
              <h2 className="text-3xl font-bold text-white mb-2">Lịch Sử Cược</h2>
              <p className="text-slate-400">Xem lại tất cả các vé cược của bạn</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Cuộc Đua</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Ngày</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Cược / Ngựa</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Số Tiền</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Hệ Số</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Trạng Thái</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Thực Nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {betHistory.map((bet) => (
                    <tr key={bet.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{bet.race}</td>
                      <td className="px-6 py-4 text-slate-300">{bet.date}</td>
                      <td className="px-6 py-4">
                        <div className="text-blue-400 text-xs font-medium mb-1">{bet.type}</div>
                        <div className="text-white">{bet.horse}</div>
                      </td>
                      <td className="px-6 py-4 text-white">${bet.amount}</td>
                      <td className="px-6 py-4 text-slate-400">{bet.odds}</td>
                      <td className="px-6 py-4">
                        <Chip
                          label={bet.status === 'won' ? 'Thắng' : bet.status === 'lost' ? 'Thua' : 'Chờ'}
                          size="small"
                          sx={{
                            backgroundColor: bet.status === 'won' ? '#FFDE42' : bet.status === 'lost' ? '#ef4444' : 'rgba(100, 116, 139, 0.5)',
                            color: bet.status === 'won' ? '#1B0C0C' : 'white',
                            fontWeight: 600
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${bet.status === 'won' ? 'text-[#FFDE42]' : 'text-slate-500'}`}>
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
                <h2 className="text-3xl font-bold text-white mb-2">Lịch Sử Đặt Cược</h2>
                <p className="text-slate-400">Theo dõi các cược của bạn</p>
              </div>
              {myBets.length > 0 && (
                <div className="flex gap-6">
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Thắng / Tổng</div>
                    <div className="text-2xl font-bold text-[#FFDE42]">{myBets.filter(b => b.status === 'won').length} / {myBets.length}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Tổng Tiền Thắng</div>
                    <div className="text-2xl font-bold text-[#FFDE42]">+${myBets.reduce((s, b) => s + (b.payoutAmount || 0), 0).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>

            {loadingBets ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#FFDE42] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myBets.length === 0 ? (
              <div className="bg-white/5 border border-white/5 rounded-2xl p-12 text-center">
                <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Bạn chưa đặt cược nào. Vào tab Lịch Trình để đặt cược!</p>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-slate-300">Cuộc Đua</th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-slate-300">Ngày</th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-slate-300">Loại Cược</th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-slate-300">Ngựa</th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-slate-300">Tiền Cược</th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-slate-300">Hệ Số</th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-slate-300">Trạng Thái</th>
                        <th className="text-left px-5 py-4 text-sm font-semibold text-slate-300">Kết Quả</th>
                        <th className="px-5 py-4 text-sm font-semibold text-slate-300"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {myBets.map(bet => {
                        const statusMap: Record<string, { label: string; color: string }> = {
                          pending: { label: 'Chờ kết quả', color: 'bg-amber-500/20 text-amber-300' },
                          won: { label: 'Thắng', color: 'bg-emerald-500/20 text-emerald-300' },
                          lost: { label: 'Thua', color: 'bg-red-500/20 text-red-400' },
                          cancelled: { label: 'Đã hủy', color: 'bg-slate-500/20 text-slate-400' },
                          refunded: { label: 'Đã hoàn', color: 'bg-blue-500/20 text-blue-400' },
                        };
                        const st = statusMap[bet.status] || statusMap.pending;
                        const betTypeLabel: Record<string, string> = { win: 'Thắng (1st)', place: 'Top 2', show: 'Top 3' };
                        const race = bet.raceId as any;
                        const horse = bet.horseId as any;
                        return (
                          <tr key={bet._id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-5 py-4">
                              <div className="text-white font-medium">{race?.name || '-'}</div>
                              <div className="text-xs text-slate-400">{race?.grade}</div>
                            </td>
                            <td className="px-5 py-4 text-slate-300 text-sm">{new Date(bet.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td className="px-5 py-4">
                              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs font-medium">{betTypeLabel[bet.betType]}</span>
                            </td>
                            <td className="px-5 py-4 text-slate-200 font-medium">{horse?.name || '-'}</td>
                            <td className="px-5 py-4 text-white">${bet.amount.toLocaleString()}</td>
                            <td className="px-5 py-4 text-[#FFDE42] font-semibold">{bet.multiplier}x</td>
                            <td className="px-5 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${st.color}`}>{st.label}</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`font-bold ${bet.status === 'won' ? 'text-[#FFDE42]' : 'text-slate-500'}`}>
                                {bet.status === 'won' ? `+$${bet.payoutAmount?.toLocaleString()}` : '-'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {bet.status === 'pending' && (
                                <button
                                  disabled={cancellingBetId === bet._id}
                                  onClick={() => handleCancelBet(bet._id)}
                                  className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-1 rounded transition-colors disabled:opacity-50"
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
        {activeTab === 'rankings' && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-4">Bảng Xếp Hạng</h2>

              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setRankingType('horses')}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                    rankingType === 'horses'
                      ? 'bg-[#FFDE42] text-white shadow-lg shadow-[#FFDE42]/30'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  Ngựa
                </button>
                <button
                  onClick={() => setRankingType('jockeys')}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                    rankingType === 'jockeys'
                      ? 'bg-[#FFDE42] text-white shadow-lg shadow-[#FFDE42]/30'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  Kỵ Sĩ
                </button>
                <button
                  onClick={() => setRankingType('owners')}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                    rankingType === 'owners'
                      ? 'bg-[#FFDE42] text-white shadow-lg shadow-[#FFDE42]/30'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  Chủ Ngựa
                </button>
              </div>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={rankingFilter}
                  onChange={(e) => setRankingFilter(e.target.value)}
                  sx={{
                    color: 'white',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FFDE42' },
                    '.MuiSvgIcon-root': { color: '#94a3b8' },
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px'
                  }}
                >
                  <MenuItem key="all-time" value="all-time">Mọi Thời Đại</MenuItem>
                  <MenuItem key="monthly" value="monthly">Tháng Này</MenuItem>
                  <MenuItem key="weekly" value="weekly">Tuần Này</MenuItem>
                </Select>
              </FormControl>
            </div>

            {/* Horse Rankings */}
            {rankingType === 'horses' && (
              <div className="space-y-3">
                {horseRankings.map((entry) => (
                  <div
                    key={entry.rank}
                    className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-[#FFDE42]/30 transition-all"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 flex items-center justify-center rounded-2xl text-xl font-bold shadow-lg ${
                        entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                        entry.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                        entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {entry.rank <= 3 ? <Medal className="w-7 h-7" /> : `#${entry.rank}`}
                      </div>

                      <div className="flex-1">
                        <div className="text-white text-xl font-bold mb-1">{entry.name}</div>
                        <div className="text-sm text-slate-400">Chủ: {entry.owner}</div>
                      </div>

                      <div className="grid grid-cols-4 gap-8 text-center">
                        <div>
                          <div className="text-2xl font-bold text-white">{entry.totalPoints}</div>
                          <div className="text-xs text-slate-400">Điểm</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[#FFDE42]">{entry.wins}</div>
                          <div className="text-xs text-slate-400">Thắng</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-amber-400">{entry.winRate}</div>
                          <div className="text-xs text-slate-400">Tỷ Lệ Thắng</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-400">{entry.earnings}</div>
                          <div className="text-xs text-slate-400">Thu Nhập</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Jockey Rankings */}
            {rankingType === 'jockeys' && (
              <div className="space-y-3">
                {jockeyRankings.map((entry) => (
                  <div
                    key={entry.rank}
                    className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-[#FFDE42]/30 transition-all"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 flex items-center justify-center rounded-2xl text-xl font-bold shadow-lg ${
                        entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                        entry.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                        entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {entry.rank <= 3 ? <Medal className="w-7 h-7" /> : `#${entry.rank}`}
                      </div>

                      <div className="flex-1">
                        <div className="text-white text-xl font-bold">{entry.name}</div>
                      </div>

                      <div className="grid grid-cols-4 gap-8 text-center">
                        <div>
                          <div className="text-2xl font-bold text-white">{entry.races}</div>
                          <div className="text-xs text-slate-400">Cuộc Đua</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[#FFDE42]">{entry.wins}</div>
                          <div className="text-xs text-slate-400">Thắng</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-amber-400">{entry.winRate}</div>
                          <div className="text-xs text-slate-400">Tỷ Lệ Thắng</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-400">{entry.earnings}</div>
                          <div className="text-xs text-slate-400">Thu Nhập</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Owner Rankings */}
            {rankingType === 'owners' && (
              <div className="space-y-3">
                {ownerRankings.map((entry) => (
                  <div
                    key={entry.rank}
                    className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-[#FFDE42]/30 transition-all"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 flex items-center justify-center rounded-2xl text-xl font-bold shadow-lg ${
                        entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                        entry.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                        entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {entry.rank <= 3 ? <Medal className="w-7 h-7" /> : `#${entry.rank}`}
                      </div>

                      <div className="flex-1">
                        <div className="text-white text-xl font-bold">{entry.name}</div>
                      </div>

                      <div className="grid grid-cols-4 gap-8 text-center">
                        <div>
                          <div className="text-2xl font-bold text-white">{entry.horses}</div>
                          <div className="text-xs text-slate-400">Ngựa</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[#FFDE42]">{entry.wins}</div>
                          <div className="text-xs text-slate-400">Thắng</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-amber-400">{entry.winRate}</div>
                          <div className="text-xs text-slate-400">Tỷ Lệ Thắng</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-400">{entry.earnings}</div>
                          <div className="text-xs text-slate-400">Thu Nhập</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">Bảng Dẫn Đầu Khán Giả</h2>
              <p className="text-slate-400">Những người dự đoán hàng đầu và thống kê của họ</p>
            </div>

            <div className="space-y-3">
              {spectatorLeaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`bg-white/5 backdrop-blur-md border rounded-2xl p-6 transition-all ${
                    entry.isYou
                      ? 'border-[#FFDE42]/50 shadow-lg shadow-[#FFDE42]/20'
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 flex items-center justify-center rounded-2xl text-xl font-bold shadow-lg ${
                      entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                      entry.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                      entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {entry.rank <= 3 ? <Medal className="w-7 h-7" /> : `#${entry.rank}`}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white text-xl font-bold">{entry.name}</span>
                        {entry.isYou && (
                          <Chip label="Bạn" size="small" sx={{ backgroundColor: '#10b981', color: 'white', fontWeight: 600 }} />
                        )}
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-slate-400">Dự Đoán: </span>
                          <span className="text-white font-medium">{entry.predictions}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Thắng: </span>
                          <span className="text-[#FFDE42] font-medium">{entry.wins}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Chính Xác: </span>
                          <span className="text-amber-400 font-medium">{entry.accuracy}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-3xl font-bold text-[#FFDE42] mb-1 flex items-center gap-1">
                        <Coins className="w-6 h-6" />
                        {entry.earnings}
                      </div>
                      <div className="text-sm text-slate-400">Tổng Thu Nhập</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-8 text-center shadow-2xl">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Flame className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">Leo Lên Đỉnh Cao!</h3>
              <p className="text-emerald-50 text-lg mb-6 max-w-xl mx-auto">
                Thực hiện dự đoán chính xác liên tục để nhận phần thưởng và cạnh tranh với những người dự đoán tốt nhất
              </p>
              <Button
                variant="contained"
                size="large"
                startIcon={<Target />}
                sx={{
                  background: 'white',
                  color: '#047857',
                  px: 6,
                  py: 1.5,
                  fontSize: '16px',
                  fontWeight: 700,
                  borderRadius: '12px',
                  '&:hover': { background: '#f0fdf4', transform: 'translateY(-2px)' }
                }}
              >
                Bắt Đầu Dự Đoán
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
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-[#FFDE42]" />
            <span>Đặt Cược</span>
          </div>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {selectedRace && (
            <div>
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <h3 className="text-white font-bold mb-1">{selectedRace.name}</h3>
                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                  <span className="text-slate-400">Hạng: <span className="text-[#FFDE42] font-medium">{selectedRace.grade}</span></span>
                  <span className="text-slate-400">Cự Ly: <span className="text-white">{selectedRace.distance}m</span></span>
                  <span className="text-slate-400">Giải Thưởng: <span className="text-[#FFDE42] font-medium">${selectedRace.purse?.toLocaleString()}</span></span>
                </div>
              </div>

              <div className="space-y-4">
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#94a3b8' }}>Loại Cược</InputLabel>
                  <Select value={betType} onChange={(e) => setBetType(e.target.value)} label="Loại Cược"
                    sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FFDE42' }, '.MuiSvgIcon-root': { color: '#94a3b8' } }}>
                    <MenuItem value="win">Thắng — ngựa về 1st (hệ số 3.0x)</MenuItem>
                    <MenuItem value="place">Place — ngựa về Top 2 (hệ số 2.0x)</MenuItem>
                    <MenuItem value="show">Show — ngựa về Top 3 (hệ số 1.5x)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#94a3b8' }}>Chọn Ngựa *</InputLabel>
                  <Select value={selectedHorse} onChange={(e) => setSelectedHorse(e.target.value)} label="Chọn Ngựa *"
                    sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FFDE42' }, '.MuiSvgIcon-root': { color: '#94a3b8' } }}>
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
                  sx={{ '& .MuiInputLabel-root': { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#10b981' } } }} />

                <div className="bg-[#FFDE42]/10 border border-[#FFDE42]/30 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Tiềm năng thắng:</span>
                    <span className="text-[#FFDE42] font-bold text-lg">
                      {betAmount && !isNaN(Number(betAmount)) && Number(betAmount) > 0
                        ? `$${Math.floor(Number(betAmount) * BET_MULTIPLIERS[betType as BetType]).toLocaleString()}`
                        : '$0'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Hệ số: {BET_MULTIPLIERS[betType as BetType]}x</span>
                    <span>Phí sẽ trừ ngay từ ví</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={() => setPredictionModalOpen(false)} sx={{ color: '#94a3b8' }}>Hủy</Button>
          <Button onClick={handleSubmitPrediction} variant="contained"
            disabled={!selectedHorse || !betAmount || placingBet}
            sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', textTransform: 'none', fontWeight: 700, '&:hover': { background: 'linear-gradient(135deg, #FFDE42 0%, #b8960a 100%)' } }}>
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
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px'
          }
        }}
      >
        {selectedTournamentForDetails && (
          <>
            <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', p: 3 }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#FFDE42] font-medium mb-1">{selectedTournamentForDetails.grade}</div>
                  <h2 className="text-2xl font-bold text-white">{selectedTournamentForDetails.name}</h2>
                </div>
                <Chip 
                  label={selectedTournamentForDetails.status} 
                  sx={{ 
                    bgcolor: getTournamentStatusColor(selectedTournamentForDetails.status),
                    color: selectedTournamentForDetails.status === 'Đang Diễn Ra' ? '#1B0C0C' : 'white',
                    fontWeight: 'bold'
                  }} 
                />
              </div>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <div className="mt-4 mb-6 relative h-48 rounded-xl overflow-hidden shadow-xl border border-white/10">
                <img src={selectedTournamentForDetails.banner} alt="Banner" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div>
                    <div className="text-white/80 text-sm mb-1">Tổng Giải Thưởng</div>
                    <div className="text-3xl font-bold text-[#FFDE42]">{selectedTournamentForDetails.prizePool}</div>
                  </div>
                  <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-center">
                    <div className="text-white/80 text-xs mb-1">Tổng Cuộc Đua</div>
                    <div className="text-xl font-bold text-white">{selectedTournamentForDetails.totalRaces}</div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-400" /> Thời Gian & Địa Điểm</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-slate-400">Bắt Đầu</div>
                      <div className="text-white font-medium">{selectedTournamentForDetails.startDate}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Kết Thúc</div>
                      <div className="text-white font-medium">{selectedTournamentForDetails.endDate}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Số Lượng Đăng Ký</div>
                      <div className="text-white font-medium">{selectedTournamentForDetails.participants} Kỵ Sĩ / Ngựa</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400" /> Cập Nhật Hiện Tại</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                      <div className="text-sm text-slate-400 mb-1">Đang Dẫn Đầu Bảng Xếp Hạng</div>
                      <div className="text-xl font-bold text-[#FFDE42]">{selectedTournamentForDetails.currentLeader}</div>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                      <div className="text-sm text-slate-400 mb-1">Cơ Hội Chiến Thắng Cao Nhất</div>
                      <div className="text-white font-medium">Theo dữ liệu từ chuyên gia, Thunder Strike đang chiếm 65% tỷ lệ cược thắng.</div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Button onClick={() => setTournamentDetailsModalOpen(false)} sx={{ color: '#94a3b8' }}>Đóng</Button>
              <Button 
                variant="contained" 
                onClick={() => { setTournamentDetailsModalOpen(false); setActiveTab('schedule'); }}
                sx={{ background: '#FFDE42', color: '#1B0C0C', fontWeight: 'bold', '&:hover': { background: '#E6C21E' } }}
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
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            overflow: 'hidden'
          }
        }}
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#FFDE42]/20 via-amber-900/10 to-transparent border-b border-white/10 p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFDE42]/5 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FFDE42] to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Wallet className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Cổng Nạp Tiền</h2>
                <p className="text-slate-400 text-sm mt-0.5">An toàn · Nhanh chóng · Tiện lợi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-semibold">Bảo Mật SSL</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Số Dư Hiện Tại</div>
                <div className="text-[#FFDE42] font-bold text-lg">{user.balance}</div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-2 mt-5">
            {['Chọn Phương Thức', 'Nhập Số Tiền', 'Xác Nhận'].map((step, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 ${i + 1 <= depositStep ? 'text-[#FFDE42]' : 'text-slate-600'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i + 1 < depositStep ? 'bg-[#FFDE42] border-[#FFDE42] text-slate-900' :
                    i + 1 === depositStep ? 'border-[#FFDE42] text-[#FFDE42]' :
                    'border-slate-700 text-slate-600'
                  }`}>{i + 1 < depositStep ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}</div>
                  <span className="text-xs font-medium whitespace-nowrap hidden sm:block">{step}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 mx-1 rounded-full ${i + 1 < depositStep ? 'bg-[#FFDE42]' : 'bg-slate-800'}`} />}
              </div>
            ))}
          </div>
        </div>

        <DialogContent sx={{ p: 0, overflowX: 'hidden' }}>
          {/* STEP 1: Choose Method */}
          {depositStep === 1 && (
            <div className="p-6 space-y-4">
              <h3 className="text-white font-semibold mb-4">Chọn phương thức nạp tiền</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'bank', icon: Building2, label: 'Chuyển Khoản Ngân Hàng', sub: 'Vietcombank, Techcombank, MB Bank...', time: '5-30 phút', color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-900/10', border: 'border-blue-500/30', limit: 'Tối thiểu: $10' },
                  { id: 'card', icon: CreditCard, label: 'Thẻ Tín Dụng / Ghi Nợ', sub: 'Visa, Mastercard, JCB', time: '1-5 phút', color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-900/10', border: 'border-purple-500/30', limit: 'Tối thiểu: $20' },
                  { id: 'ewallet', icon: Smartphone, label: 'Ví Điện Tử', sub: 'MoMo, ZaloPay, VNPay', time: 'Tức thì', color: 'text-pink-400', bg: 'from-pink-500/20 to-pink-900/10', border: 'border-pink-500/30', limit: 'Tối thiểu: $5' },
                  { id: 'crypto', icon: Bitcoin, label: 'Tiền Điện Tử', sub: 'USDT (TRC20), BTC, ETH', time: '10-30 phút', color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-900/10', border: 'border-amber-500/30', limit: 'Tối thiểu: $50' },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setDepositMethod(method.id)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                      depositMethod === method.id
                        ? `bg-gradient-to-br ${method.bg} ${method.border} shadow-lg`
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {depositMethod === method.id && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-[#FFDE42] rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-slate-900" />
                      </div>
                    )}
                    <method.icon className={`w-8 h-8 mb-3 ${method.color}`} />
                    <div className="text-white font-semibold text-sm mb-1">{method.label}</div>
                    <div className="text-slate-400 text-xs mb-2">{method.sub}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-400 font-medium">⚡ {method.time}</span>
                      <span className="text-xs text-slate-500">{method.limit}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Info Alert */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
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
                <div className="w-10 h-10 bg-[#FFDE42]/10 rounded-lg flex items-center justify-center">
                  {depositMethod === 'bank' && <Building2 className="w-5 h-5 text-blue-400" />}
                  {depositMethod === 'card' && <CreditCard className="w-5 h-5 text-purple-400" />}
                  {depositMethod === 'ewallet' && <Smartphone className="w-5 h-5 text-pink-400" />}
                  {depositMethod === 'crypto' && <Bitcoin className="w-5 h-5 text-amber-400" />}
                </div>
                <div>
                  <div className="text-white font-bold">
                    {depositMethod === 'bank' && 'Chuyển Khoản Ngân Hàng'}
                    {depositMethod === 'card' && 'Thẻ Tín Dụng / Ghi Nợ'}
                    {depositMethod === 'ewallet' && 'Ví Điện Tử'}
                    {depositMethod === 'crypto' && 'Tiền Điện Tử (USDT)'}
                  </div>
                  <div className="text-slate-400 text-sm">Điền thông tin nạp tiền bên dưới</div>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Số Tiền Muốn Nạp (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    value={depositAmountInput}
                    onChange={(e) => setDepositAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-white text-xl font-bold placeholder-slate-600 focus:outline-none focus:border-[#FFDE42]/60 focus:ring-1 focus:ring-[#FFDE42]/30 transition-all"
                  />
                </div>
                {/* Quick Amount Buttons */}
                <div className="flex gap-2 mt-3">
                  {['50', '100', '200', '500', '1000'].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setDepositAmountInput(amt)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                        depositAmountInput === amt
                          ? 'bg-[#FFDE42] text-slate-900 border-[#FFDE42]'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:border-[#FFDE42]/40 hover:text-white'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Details Based on Method */}
              {depositMethod === 'bank' && (
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-white font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-400" /> Thông Tin Tài Khoản</h4>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Đang Hoạt Động</span>
                  </div>
                  {[
                    { label: 'Ngân Hàng', value: 'Vietcombank (VCB)' },
                    { label: 'Số Tài Khoản', value: '1020 4857 2934 8800', copy: true },
                    { label: 'Chủ Tài Khoản', value: 'CONG TY TNHH RACING VN' },
                    { label: 'Chi Nhánh', value: 'TP. Hồ Chí Minh' },
                    { label: 'Nội Dung CK', value: `NAP ${user.name.replace(' ', '').toUpperCase()} ${depositAmountInput || '___'}USD`, copy: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-slate-400 text-sm">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{item.value}</span>
                        {item.copy && (
                          <button className="p-1 hover:bg-white/10 rounded transition-colors" title="Sao chép">
                            <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-[#FFDE42]" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {depositMethod === 'ewallet' && (
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2"><Smartphone className="w-4 h-4 text-pink-400" /> Chọn Ví Điện Tử</h4>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {['MoMo', 'ZaloPay', 'VNPay'].map(w => (
                      <button key={w} className="bg-slate-700/50 hover:bg-[#FFDE42]/10 border border-white/10 hover:border-[#FFDE42]/40 rounded-lg py-3 text-white text-sm font-medium transition-all">
                        {w}
                      </button>
                    ))}
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                    <div className="w-24 h-24 bg-white rounded-lg mx-auto mb-3 flex items-center justify-center">
                      <div className="text-slate-900 text-xs font-mono text-center">QR Code<br/>Preview</div>
                    </div>
                    <p className="text-slate-400 text-xs">Mở app ví và quét mã QR hoặc nhập số điện thoại: <span className="text-white font-semibold">0909.888.777</span></p>
                  </div>
                </div>
              )}

              {depositMethod === 'crypto' && (
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5 space-y-3">
                  <h4 className="text-white font-semibold flex items-center gap-2"><Bitcoin className="w-4 h-4 text-amber-400" /> Địa Chỉ Nạp USDT (TRC20)</h4>
                  <div className="bg-slate-900 rounded-lg p-4 flex items-center justify-between gap-2">
                    <span className="text-emerald-400 font-mono text-xs break-all">TRX7YmK9...4xPQm8NvL2sW</span>
                    <button className="p-1.5 hover:bg-white/10 rounded-lg flex-shrink-0"><Copy className="w-4 h-4 text-slate-400 hover:text-[#FFDE42]" /></button>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300">
                    ⚠️ Chỉ gửi <strong>USDT TRC20</strong>. Gửi sai mạng sẽ mất tiền vĩnh viễn. Tối thiểu $50.
                  </div>
                </div>
              )}

              {depositMethod === 'card' && (
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5 space-y-4">
                  <h4 className="text-white font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4 text-purple-400" /> Thông Tin Thẻ</h4>
                  {['Số Thẻ (16 chữ số)', 'Tên Chủ Thẻ', 'Ngày Hết Hạn (MM/YY)', 'Mã CVV'].map((ph, i) => (
                    <div key={i} className="relative">
                      <input type={i === 3 ? 'password' : 'text'} placeholder={ph}
                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm" />
                    </div>
                  ))}
                </div>
              )}

              {/* Important Notice */}
              <div className="bg-[#FFDE42]/5 border border-[#FFDE42]/20 rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-[#FFDE42] flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1.5">
                    <div className="text-[#FFDE42] font-semibold">Lưu Ý Quan Trọng</div>
                    <ul className="text-slate-400 space-y-1 list-disc list-inside text-xs">
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
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 mt-2">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Yêu Cầu Đã Gửi!</h3>
                <p className="text-slate-400 max-w-sm mx-auto">Chúng tôi đã nhận được yêu cầu nạp <span className="text-[#FFDE42] font-bold">${depositAmountInput}</span> của bạn. Hệ thống sẽ xử lý trong vài phút.</p>
              </div>
              <div className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-5 text-left space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Mã Giao Dịch</span>
                  <span className="text-white font-mono font-semibold">TRX-{Date.now().toString().slice(-8)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Số Tiền</span>
                  <span className="text-[#FFDE42] font-bold">${depositAmountInput}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Trạng Thái</span>
                  <span className="text-amber-400 font-semibold">Đang Xử Lý</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Thời Gian</span>
                  <span className="text-white">{new Date().toLocaleTimeString('vi-VN')}</span>
                </div>
              </div>
              <button
                onClick={() => { setDepositPortalOpen(false); setDepositStep(1); setDepositAmountInput(''); setActiveTab('deposit-history'); }}
                className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
              >
                Xem Lịch Sử Nạp Tiền →
              </button>
            </div>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.07)', gap: 1 }}>
          {depositStep > 1 && depositStep < 3 && (
            <Button onClick={() => setDepositStep(s => s - 1)} sx={{ color: '#94a3b8', textTransform: 'none' }}>
              ← Quay Lại
            </Button>
          )}
          <div className="flex-1" />
          <Button
            onClick={() => { setDepositPortalOpen(false); setDepositStep(1); setDepositAmountInput(''); }}
            sx={{ color: '#64748b', textTransform: 'none' }}
          >
            {depositStep === 3 ? 'Đóng' : 'Hủy'}
          </Button>
          {depositStep < 3 && (
            <Button
              variant="contained"
              disabled={depositStep === 2 && !depositAmountInput}
              onClick={() => setDepositStep(s => s + 1)}
              sx={{
                background: 'linear-gradient(135deg, #FFDE42 0%, #E6C21E 100%)',
                color: '#1B0C0C',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '10px',
                px: 3,
                '&:hover': { background: 'linear-gradient(135deg, #FFE866 0%, #FFDE42 100%)' },
                '&:disabled': { background: 'rgba(100,116,139,0.3)', color: '#64748b' }
              }}
            >
              {depositStep === 1 ? 'Tiếp Theo →' : 'Xác Nhận Nạp Tiền'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}
