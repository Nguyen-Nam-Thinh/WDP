import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Medal,
  Calendar,
  Trophy,
  TrendingUp,
  LogOut,
  Menu,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Award,
  MapPin,
  Flame,
  Activity,
  ShieldAlert,
  ChevronRight,
  Wallet,
  Target,
  Crosshair,
  AlertTriangle,
  Image as ImageIcon,
  Ban,
} from 'lucide-react';
import { 
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  Avatar, LinearProgress, Box, Typography 
} from '@mui/material';
import {
  AreaChart, Area, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart
} from 'recharts';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { useAuth } from '../hooks/useAuth';
import { invitationApi, JockeyInvitation } from '../api/invitation';
import { toast } from 'sonner';

const GRADE_COLORS: Record<string, string> = {
  Maiden: '#64748b',
  G3: '#3b82f6',
  G2: '#8b5cf6',
  G1: '#f59e0b',
};

export function JockeyDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  const [activeTab, setActiveTab] = useState('invitations');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [horseInfoOpen, setHorseInfoOpen] = useState(false);
  const [selectedHorse, setSelectedHorse] = useState<any>(null);
  const [viewHorseActiveImage, setViewHorseActiveImage] = useState<string>('');

  // Invitations — real API
  const [invitations, setInvitations] = useState<JockeyInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [scheduleSubTab, setScheduleSubTab] = useState<'accepted' | 'rejected'>('accepted');

  const [acceptedInvitations, setAcceptedInvitations] = useState<JockeyInvitation[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const [rejectedInvitations, setRejectedInvitations] = useState<JockeyInvitation[]>([]);
  const [loadingRejected, setLoadingRejected] = useState(false);

  const loadInvitations = async () => {
    if (!token) return;
    setLoadingInvitations(true);
    try {
      const result = await invitationApi.getInvitations(token, { status: 'pending', limit: 50 });
      setInvitations(result.invitations);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải danh sách lời mời');
    } finally {
      setLoadingInvitations(false);
    }
  };

  const loadSchedule = async () => {
    if (!token) return;
    setLoadingSchedule(true);
    try {
      const result = await invitationApi.getInvitations(token, { status: 'accepted', limit: 100 });
      setAcceptedInvitations(result.invitations);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải lịch đua');
    } finally {
      setLoadingSchedule(false);
    }
  };

  const loadRejected = async () => {
    if (!token) return;
    setLoadingRejected(true);
    try {
      const result = await invitationApi.getInvitations(token, { status: 'rejected', limit: 100 });
      setRejectedInvitations(result.invitations);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải lời mời đã từ chối');
    } finally {
      setLoadingRejected(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'schedule') {
      loadSchedule();
      loadRejected();
    }
  }, [activeTab, token]);

  const handleAccept = async (invitationId: string) => {
    if (!token) return;
    setProcessingId(invitationId);
    try {
      await invitationApi.acceptInvitation(token, invitationId);
      toast.success('Đã chấp nhận lời mời');
      setInvitations((prev) => prev.filter((i) => i._id !== invitationId));
      loadSchedule();
    } catch (err: any) {
      toast.error(err.message || 'Không thể chấp nhận lời mời');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invitationId: string) => {
    if (!token) return;
    setProcessingId(invitationId);
    try {
      await invitationApi.rejectInvitation(token, invitationId);
      toast.success('Đã từ chối lời mời');
      setInvitations((prev) => prev.filter((i) => i._id !== invitationId));
    } catch (err: any) {
      toast.error(err.message || 'Không thể từ chối lời mời');
    } finally {
      setProcessingId(null);
    }
  };

  const recentResults = [
    { race: 'Spring Classic', date: '2026-05-15', horse: 'Thunder Strike', position: 1, prize: '$5,000', points: 100, violations: 0 },
    { race: 'Victory Cup', date: '2026-05-10', horse: 'Storm Runner', position: 2, prize: '$3,000', points: 75, violations: 0 },
    { race: 'Elite Championship', date: '2026-05-05', horse: 'Wild Fire', position: 1, prize: '$5,000', points: 100, violations: 1 },
    { race: 'Grand Prix', date: '2026-04-28', horse: 'Thunder Strike', position: 3, prize: '$2,000', points: 50, violations: 0 },
  ];

  const performanceData = [
    { month: 'Jan', winRate: 35, finishes: 8 },
    { month: 'Feb', winRate: 38, finishes: 10 },
    { month: 'Mar', winRate: 42, finishes: 12 },
    { month: 'Apr', winRate: 45, finishes: 15 },
    { month: 'May', winRate: 48, finishes: 14 },
  ];

  const radarData = [
    { subject: 'Tốc Độ Nước Rút', A: 90, fullMark: 100 },
    { subject: 'Sức Bền', A: 85, fullMark: 100 },
    { subject: 'Điều Khiển Roi', A: 88, fullMark: 100 },
    { subject: 'Qua Cua', A: 92, fullMark: 100 },
    { subject: 'An Toàn', A: 95, fullMark: 100 },
    { subject: 'Chiến Thuật', A: 80, fullMark: 100 },
  ];

  const stats = [
    { label: 'Tổng Số Cuộc Đua', value: '145', icon: Calendar, color: 'from-[#FFDE42] to-[#1B0C0C]' },
    { label: 'Chiến Thắng Sự Nghiệp', value: '58', icon: Trophy, color: 'from-[#FFDE42] to-[#E6C21E]' },
    { label: 'Tỷ Lệ Thắng', value: '40%', icon: TrendingUp, color: 'from-teal-400 to-teal-600' },
    { label: 'Tổng Thu Nhập', value: '$89K', icon: Wallet, color: 'from-[#E6C21E] to-[#1B0C0C]' },
  ];

  const horseData = {
    name: 'Thunder Strike',
    breed: 'Thoroughbred',
    age: 4,
    weight: '520 kg',
    grade: 'G1',
    totalWins: 12,
    points: 1500,
    compatibility: 85,
    recentForm: [1, 2, 1, 1, 3]
  };

  const handleViewHorse = (horse: any) => {
    setSelectedHorse(horse);
    const images: string[] = horse.imageUrls?.length
      ? horse.imageUrls
      : horse.primaryImageUrl ? [horse.primaryImageUrl] : [];
    setViewHorseActiveImage(images[0] ?? '');
    setHorseInfoOpen(true);
  };

  function LinearProgressWithLabel(props: any) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>{`${Math.round(props.value)}%`}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-300">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <img src="/images/logo.png" alt="RaceTrack Logo" className="w-12 h-12 object-contain drop-shadow-md" />
            </div>
            <div>
              <div className="text-white font-semibold flex items-center gap-2">
                Cổng Kỵ Sĩ
                <Chip label="Hạng A" size="small" sx={{ height: '18px', fontSize: '0.65rem', bgcolor: 'rgba(255, 222, 66, 0.2)', color: '#FFDE42', fontWeight: 'bold' }} />
              </div>
              <div className="text-sm text-slate-400">Giấy Phép: JCK-8821 • Top 10%</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <ProfileDropdown />
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <div className="pt-28 max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-[#FFDE42]/30 transition-all hover:shadow-[0_0_20px_rgba(255,222,66,0.1)] group">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-400 font-medium mb-1">{stat.label}</div>
                  <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'invitations', label: 'Lời Mời Đua', icon: Clock, badge: invitations.length || null },
            { id: 'schedule', label: 'Lịch Đua', icon: Calendar },
            { id: 'results', label: 'Kết Quả Quá Khứ', icon: Trophy }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === tab.id
                  ? 'bg-[#FFDE42] text-slate-950 shadow-[0_0_15px_rgba(255,222,66,0.4)] border border-[#FFDE42]'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white border border-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && (
                <span className={`ml-2 text-xs py-0.5 px-2 rounded-full font-bold ${activeTab === tab.id ? 'bg-slate-900 text-[#FFDE42]' : 'bg-[#FFDE42] text-slate-950'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content: Ride Offers (Invitations) */}
        {activeTab === 'invitations' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Lời Mời Đua Đang Chờ</h2>
                <p className="text-slate-400 text-sm">Xem xét điều khoản hợp đồng và chấp nhận lời mời từ Chủ Ngựa</p>
              </div>
            </div>

            {loadingInvitations ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <div className="w-6 h-6 border-2 border-[#FFDE42]/30 border-t-[#FFDE42] rounded-full animate-spin mr-3" />
                Đang tải lời mời...
              </div>
            ) : invitations.length > 0 ? (
              <div className="space-y-5">
                {invitations.map(invitation => {
                  const horse = invitation.horseId;
                  const owner = invitation.ownerId;
                  const race = invitation.raceId;
                  if (!race || !horse || !owner) return null;
                  const scheduledDate = new Date(race.scheduledTime);
                  const isProcessing = processingId === invitation._id;
                  return (
                    <div key={invitation._id} className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-[#FFDE42]/50 transition-all group">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-5">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-[#FFDE42]/50 transition-colors overflow-hidden">
                                {horse.imageUrl
                                  ? <img src={horse.imageUrl} alt={horse.name} className="w-full h-full object-cover" />
                                  : <Star className="w-7 h-7 text-[#FFDE42]" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-xl font-bold text-white">{horse.name}</h3>
                                  <Chip label={horse.currentGrade} size="small" sx={{ height: '22px', fontSize: '0.7rem', bgcolor: '#f59e0b', color: 'white', fontWeight: 'bold' }} />
                                </div>
                                <div className="text-sm text-slate-400">Được mời bởi <span className="text-[#FFDE42] font-medium">{owner.fullName}</span></div>
                              </div>
                            </div>
                            {/* Race grade badge */}
                            <div className="text-right hidden sm:block bg-[#FFDE42]/10 border border-[#FFDE42]/20 px-4 py-2 rounded-xl">
                              <div className="text-[#FFDE42] font-bold text-lg">{race.grade}</div>
                              <div className="text-[10px] text-[#FFDE42]/70 uppercase font-bold tracking-wider">{race.name}</div>
                            </div>
                          </div>

                          {/* Info grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-5">
                            <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                              <div className="text-slate-500 text-xs uppercase font-bold mb-1 flex items-center gap-1"><Trophy className="w-3 h-3"/> Giải Đấu</div>
                              <div className="text-white font-medium truncate">{race.tournamentId?.name ?? '—'}</div>
                            </div>
                            <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                              <div className="text-slate-500 text-xs uppercase font-bold mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Ngày Đua</div>
                              <div className="text-white font-medium">{scheduledDate.toLocaleDateString('vi-VN')}</div>
                            </div>
                            <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                              <div className="text-slate-500 text-xs uppercase font-bold mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Giờ Đua</div>
                              <div className="text-white font-medium">{scheduledDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <div className="flex items-center justify-center">
                              <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => handleViewHorse(horse)}
                                sx={{
                                  borderColor: 'rgba(255,222,66,0.3)', color: '#FFDE42', textTransform: 'none', height: '100%', borderRadius: '12px',
                                  '&:hover': { borderColor: '#FFDE42', background: 'rgba(255,222,66,0.05)' }
                                }}
                              >
                                Hồ Sơ Ngựa
                              </Button>
                            </div>
                          </div>

                          {/* Message */}
                          {invitation.message && (
                            <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5 mb-6 relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFDE42]"></div>
                              <div className="text-xs text-slate-500 uppercase font-bold mb-1">Lời Nhắn Từ Chủ Ngựa</div>
                              <p className="text-slate-300 italic text-sm">"{invitation.message}"</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-4">
                            <Button
                              variant="contained"
                              disabled={isProcessing}
                              startIcon={<CheckCircle className="w-5 h-5" />}
                              onClick={() => handleAccept(invitation._id)}
                              sx={{
                                background: '#FFDE42', color: '#1B0C0C', textTransform: 'none', fontWeight: 700, px: 4, py: 1.5, borderRadius: '10px',
                                '&:hover': { background: '#E6C21E' },
                                '&.Mui-disabled': { background: '#334155', color: '#64748b' },
                              }}
                            >
                              {isProcessing ? 'Đang xử lý...' : 'Chấp Nhận'}
                            </Button>
                            <Button
                              variant="outlined"
                              disabled={isProcessing}
                              startIcon={<XCircle className="w-5 h-5" />}
                              onClick={() => handleReject(invitation._id)}
                              sx={{
                                borderColor: 'rgba(244,63,94,0.3)', color: '#f43f5e', textTransform: 'none', fontWeight: 600, px: 4, py: 1.5, borderRadius: '10px',
                                '&:hover': { borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.1)' },
                                '&.Mui-disabled': { borderColor: 'rgba(255,255,255,0.05)', color: '#475569' },
                              }}
                            >
                              Từ Chối
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-16 text-center backdrop-blur-md">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <Clock className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Không có lời mời đang chờ</h3>
                <p className="text-slate-400 max-w-md mx-auto">Khi Chủ Ngựa mời bạn cưỡi ngựa của họ, các điều khoản hợp đồng sẽ xuất hiện tại đây.</p>
              </div>
            )}
          </div>
        )}

        {/* Content: Schedule + Rejected (merged) */}
        {activeTab === 'schedule' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header + sub-tab toggle */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Lịch Đua</h2>
                <p className="text-slate-400 text-sm">Quản lý lịch đua và lời mời đã từ chối</p>
              </div>
              <button
                onClick={() => { loadSchedule(); loadRejected(); }}
                className="text-slate-400 hover:text-[#FFDE42] transition-colors p-2 rounded-lg hover:bg-white/5"
              >
                <Activity className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tab buttons */}
            <div className="flex gap-2 mb-6 bg-slate-900/60 p-1.5 rounded-xl border border-white/5 w-fit">
              <button
                onClick={() => setScheduleSubTab('accepted')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  scheduleSubTab === 'accepted'
                    ? 'bg-[#FFDE42] text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Đã Xác Nhận
                {acceptedInvitations.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${scheduleSubTab === 'accepted' ? 'bg-slate-900/40 text-slate-950' : 'bg-[#FFDE42]/20 text-[#FFDE42]'}`}>
                    {acceptedInvitations.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setScheduleSubTab('rejected')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  scheduleSubTab === 'rejected'
                    ? 'bg-red-500/20 text-red-400 shadow-sm border border-red-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Ban className="w-4 h-4" />
                Đã Từ Chối
                {rejectedInvitations.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${scheduleSubTab === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-400'}`}>
                    {rejectedInvitations.length}
                  </span>
                )}
              </button>
            </div>

            {/* Sub-tab: Accepted */}
            {scheduleSubTab === 'accepted' && (
              loadingSchedule ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <div className="w-6 h-6 border-2 border-[#FFDE42]/30 border-t-[#FFDE42] rounded-full animate-spin mr-3" />
                  Đang tải lịch đua...
                </div>
              ) : acceptedInvitations.length > 0 ? (
                <div className="space-y-4">
                  {acceptedInvitations.map(inv => {
                    const race = inv.raceId;
                    const horse = inv.horseId;
                    const owner = inv.ownerId;
                    if (!race || !horse || !owner) return null;
                    const scheduledDate = new Date(race.scheduledTime);
                    const raceStatus = race.status ?? 'open';
                    const isUpcoming = scheduledDate > new Date();

                    const raceStatusLabel: Record<string, string> = {
                      open: 'Đang Mở', closed: 'Đã Đóng', pre_check: 'Kiểm Tra',
                      running: 'Đang Chạy', finished: 'Đã Kết Thúc', cancelled: 'Đã Hủy',
                    };
                    const raceStatusColor: Record<string, string> = {
                      open: '#10b981', closed: '#f59e0b', pre_check: '#8b5cf6',
                      running: '#3b82f6', finished: '#64748b', cancelled: '#f43f5e',
                    };

                    return (
                      <div key={inv._id} className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-[#FFDE42]/30 transition-all">
                        <div className="flex flex-col md:flex-row md:items-start gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-5 border-b border-white/5 pb-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isUpcoming ? 'bg-[#FFDE42]/10 border-[#FFDE42]/30 text-[#FFDE42]' : 'bg-slate-700/50 border-white/10 text-slate-400'}`}>
                                <Flame className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-white mb-1 truncate">{race.tournamentId?.name ?? race.name}</h3>
                                <div className="text-slate-400 text-sm flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-slate-300">
                                    {scheduledDate.toLocaleDateString('vi-VN')} • {scheduledDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className="text-[#FFDE42] font-medium">{race.name}</span>
                                </div>
                              </div>
                              <Chip
                                label={raceStatusLabel[raceStatus] ?? raceStatus}
                                size="small"
                                sx={{
                                  ml: 'auto', height: '24px', fontWeight: 'bold', flexShrink: 0,
                                  backgroundColor: `${raceStatusColor[raceStatus] ?? '#64748b'}22`,
                                  color: raceStatusColor[raceStatus] ?? '#64748b',
                                  border: `1px solid ${raceStatusColor[raceStatus] ?? '#64748b'}55`,
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/50 p-4 rounded-xl border border-white/5">
                              <div>
                                <div className="text-slate-500 text-xs uppercase font-bold mb-1">Ngựa</div>
                                <div className="text-white font-medium flex items-center gap-2">
                                  {horse.name}
                                  <Chip label={horse.currentGrade} size="small" sx={{ height: '16px', fontSize: '0.6rem', bgcolor: GRADE_COLORS[horse.currentGrade] ?? '#475569', color: 'white', fontWeight: 'bold' }} />
                                </div>
                              </div>
                              <div>
                                <div className="text-slate-500 text-xs uppercase font-bold mb-1">Chủ Ngựa</div>
                                <div className="text-white font-medium">{owner.fullName}</div>
                              </div>
                              <div>
                                <div className="text-slate-500 text-xs uppercase font-bold mb-1">Hạng Đua</div>
                                <div className="font-bold" style={{ color: GRADE_COLORS[race.grade] ?? '#64748b' }}>{race.grade}</div>
                              </div>
                              <div className="flex items-center justify-end">
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={() => handleViewHorse(horse)}
                                  endIcon={<ChevronRight className="w-4 h-4" />}
                                  sx={{ color: '#FFDE42', textTransform: 'none', fontWeight: 600, '&:hover': { background: 'rgba(255,222,66,0.1)' } }}
                                >
                                  Chi Tiết Ngựa
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-16 text-center backdrop-blur-md">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Calendar className="w-10 h-10 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Chưa có lịch đua</h3>
                  <p className="text-slate-400 max-w-md mx-auto">Chấp nhận lời mời từ Chủ Ngựa để thấy lịch đua xuất hiện tại đây.</p>
                </div>
              )
            )}

            {/* Sub-tab: Rejected */}
            {scheduleSubTab === 'rejected' && (
              loadingRejected ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <div className="w-6 h-6 border-2 border-[#FFDE42]/30 border-t-[#FFDE42] rounded-full animate-spin mr-3" />
                  Đang tải...
                </div>
              ) : rejectedInvitations.length > 0 ? (
                <div className="space-y-4">
                  {rejectedInvitations.map(inv => {
                    const horse = inv.horseId;
                    const owner = inv.ownerId;
                    const race = inv.raceId;
                    if (!race || !horse || !owner) return null;
                    const scheduledDate = new Date(race.scheduledTime);
                    return (
                      <div key={inv._id} className="bg-slate-900/80 backdrop-blur-md border border-red-900/20 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <XCircle className="w-6 h-6 text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-lg font-bold text-white">{horse.name}</h3>
                              <Chip label={horse.currentGrade} size="small" sx={{ height: '18px', fontSize: '0.65rem', bgcolor: GRADE_COLORS[horse.currentGrade] ?? '#475569', color: 'white', fontWeight: 'bold' }} />
                              <span className="text-slate-500 text-sm">từ <span className="text-slate-300">{owner.fullName}</span></span>
                            </div>
                            <div className="text-slate-400 text-sm flex items-center gap-3 flex-wrap mb-3">
                              <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-[#FFDE42]" /> {race.tournamentId?.name ?? '—'}</span>
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {scheduledDate.toLocaleDateString('vi-VN')}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {scheduledDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="font-medium" style={{ color: GRADE_COLORS[race.grade] ?? '#64748b' }}>{race.grade} — {race.name}</span>
                            </div>
                            {inv.rejectionNote && (
                              <div className="bg-slate-950/60 border border-red-900/20 rounded-lg px-3 py-2 text-sm text-slate-400 italic">
                                Lý do: "{inv.rejectionNote}"
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 whitespace-nowrap flex-shrink-0">
                            {new Date(inv.createdAt ?? '').toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-16 text-center backdrop-blur-md">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Ban className="w-10 h-10 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Chưa từ chối lời mời nào</h3>
                  <p className="text-slate-400 max-w-md mx-auto">Các lời mời bạn từ chối sẽ được lưu lại tại đây.</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Content: Results */}
        {activeTab === 'results' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-6">Kết Quả Đua Đã Xác Minh</h2>

            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-950/80 border-b border-white/10">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Sự Kiện & Ngày</th>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Ngựa</th>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Vị Trí</th>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Thu Nhập</th>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Điểm Xếp Hạng</th>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Vi Phạm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentResults.map((result, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-white font-bold">{result.race}</div>
                          <div className="text-xs text-slate-400 mt-1">{result.date}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-medium">{result.horse}</td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm border
                            ${result.position === 1 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                              result.position === 2 ? 'bg-slate-300/10 text-slate-300 border-slate-400/30' : 
                              'bg-orange-700/20 text-orange-400 border-orange-700/30'}`}
                          >
                            {result.position}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#FFDE42] font-bold">{result.prize}</td>
                        <td className="px-6 py-4 text-teal-400 font-bold">+{result.points}</td>
                        <td className="px-6 py-4">
                          {result.violations > 0 ? (
                            <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-400/10 px-2 py-1 rounded-md w-fit border border-red-400/20">
                              <ShieldAlert className="w-3 h-3" /> {result.violations}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-sm font-medium">Sạch</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Horse Info Dialog */}
      <Dialog 
        open={horseInfoOpen} 
        onClose={() => setHorseInfoOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ style: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backgroundImage: 'linear-gradient(to bottom right, rgba(16,185,129,0.05), transparent)' } }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Thông Tin Chi Tiết Ngựa
          <button onClick={() => setHorseInfoOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '24px !important' }}>
          {selectedHorse && (
            <div className="space-y-6">
              {/* Image */}
              <div className="flex flex-col items-center">
                <div className="w-full max-w-sm aspect-[4/3] rounded-xl border-2 border-slate-700 overflow-hidden mb-4 bg-slate-900 flex items-center justify-center relative shadow-lg">
                  {viewHorseActiveImage ? (
                    <>
                      <div className="absolute inset-0 opacity-40 blur-xl scale-110" style={{ backgroundImage: `url(${viewHorseActiveImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      <img src={viewHorseActiveImage} alt={selectedHorse.name} className="relative z-10 w-full h-full object-contain drop-shadow-2xl" />
                    </>
                  ) : (
                    <ImageIcon className="relative z-10 w-16 h-16 text-slate-600" />
                  )}
                </div>

                {(() => {
                  const images: string[] = selectedHorse.imageUrls?.length
                    ? selectedHorse.imageUrls
                    : selectedHorse.primaryImageUrl ? [selectedHorse.primaryImageUrl] : [];
                  if (images.length <= 1) return null;
                  return (
                    <div className="flex gap-3 mb-4 overflow-x-auto max-w-full pb-2 justify-center">
                      {images.map((imgUrl: string, idx: number) => (
                        <button key={idx} onClick={() => setViewHorseActiveImage(imgUrl)}
                          className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${viewHorseActiveImage === imgUrl ? 'border-[#FFDE42] scale-105' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'}`}>
                          <img src={imgUrl} alt="thumbnail" className="w-full h-full object-cover bg-slate-800" />
                        </button>
                      ))}
                    </div>
                  );
                })()}

                <h3 className="text-2xl font-bold text-white text-center">{selectedHorse.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  {selectedHorse.isActive !== undefined && (
                    <Chip label={selectedHorse.isActive ? 'Hoạt Động' : 'Không Hoạt Động'} size="small"
                      sx={{ backgroundColor: selectedHorse.isActive ? '#10b981' : '#64748b', color: 'white', fontWeight: 500 }} />
                  )}
                  {selectedHorse.currentGrade && (
                    <Chip label={selectedHorse.currentGrade} size="small"
                      sx={{ backgroundColor: GRADE_COLORS[selectedHorse.currentGrade] ?? '#f59e0b', color: 'white', fontWeight: 600 }} />
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Thể Chất</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between"><span className="text-slate-500">Giới tính:</span> <span className="text-white font-medium">{selectedHorse.gender === 'male' ? 'Đực' : selectedHorse.gender === 'female' ? 'Cái' : '—'}</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Giống:</span> <span className="text-white font-medium">{selectedHorse.breed || '—'}</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Màu sắc:</span> <span className="text-white font-medium">{selectedHorse.color || '—'}</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Cân nặng:</span> <span className="text-white font-medium">{selectedHorse.weight ? `${selectedHorse.weight} kg` : '—'}</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Ngày sinh:</span> <span className="text-white font-medium">{selectedHorse.birthDate ? new Date(selectedHorse.birthDate).toLocaleDateString('vi-VN') : '—'}</span></li>
                  </ul>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Sự Nghiệp</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between"><span className="text-slate-500">Tổng số trận:</span> <span className="text-white font-medium">{selectedHorse.raceCount ?? 0} trận</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Số trận thắng:</span> <span className="text-[#FFDE42] font-bold">{selectedHorse.winCount ?? 0} trận</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Tỷ lệ thắng:</span> <span className="text-white font-medium">{selectedHorse.raceCount > 0 ? Math.round((selectedHorse.winCount / selectedHorse.raceCount) * 100) : 0}%</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Tổng điểm:</span> <span className="text-emerald-400 font-bold">{selectedHorse.totalPoints ?? 0} pts</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Tiền thưởng:</span> <span className="text-[#10b981] font-bold">${(selectedHorse.totalEarnings ?? 0).toLocaleString()}</span></li>
                  </ul>
                </div>
              </div>

              {/* Violations */}
              {selectedHorse.violations?.length > 0 && (
                <div className="bg-red-950/30 p-4 rounded-xl border border-red-900/50">
                  <h4 className="text-sm font-semibold text-red-400 mb-3 uppercase tracking-wider flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Lịch Sử Vi Phạm
                  </h4>
                  <div className="space-y-3">
                    {selectedHorse.violations.map((v: any, i: number) => (
                      <div key={i} className="text-sm border-l-2 border-red-500/50 pl-3">
                        <div className="text-white font-medium">{v.name}</div>
                        <div className="text-slate-400 text-xs mt-1">
                          {v.handling && `Xử lý: ${v.handling}`}
                          {v.penaltyDate && ` • Phạt: ${new Date(v.penaltyDate).toLocaleDateString('vi-VN')}`}
                        </div>
                        {v.note && <div className="text-slate-500 text-xs italic mt-1">Ghi chú: {v.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px' }}>
          <Button onClick={() => setHorseInfoOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600 }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}