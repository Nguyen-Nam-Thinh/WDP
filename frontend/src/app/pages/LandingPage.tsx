import { useNavigate } from 'react-router';
import {
  Trophy,
  Users,
  Timer,
  TrendingUp,
  Shield,
  ChevronRight,
  Medal,
  Star,
  Activity,
  Sparkles,
  Play,
  Eye,
  ArrowRight,
  Flame,
  Zap,
  BarChart3,
  Lock,
  Globe,
  Headphones,
  Check
} from 'lucide-react';
import { Button } from '@mui/material';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAuth } from '../hooks/useAuth';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { useEffect, useState } from 'react';
import { publicApi, type PlatformStats } from '../api/public';

const RANK_COLORS = ['bg-amber-500', 'bg-slate-400', 'bg-orange-700', 'bg-slate-700', 'bg-slate-700'];
const GRADE_COLOR: Record<string, string> = {
  G1: 'text-[#FFDE42] border-[#FFDE42]/40 bg-[#FFDE42]/10',
  G2: 'text-purple-300 border-purple-500/40 bg-purple-500/10',
  G3: 'text-blue-300 border-blue-500/40 bg-blue-500/10',
  Maiden: 'text-slate-400 border-slate-600/40 bg-slate-700/20',
};

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
  return n > 0 ? `${n}+` : '0';
}

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'spectator') {
      const rolePath = user.role === 'owner' ? 'horse-owner' : user.role;
      navigate(`/${rolePath}`, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    publicApi.getPlatformStats()
      .then(setStats)
      .catch(() => {/* silently use fallback UI */})
      .finally(() => setLoadingStats(false));
  }, []);

  const features = [
    { icon: BarChart3, title: 'Phân Tích Thời Gian Thực', description: 'Theo dõi mọi cuộc đua với thống kê nâng cao, tỷ lệ cược trực tiếp và dữ liệu hiệu suất toàn diện.' },
    { icon: Lock, title: 'An Toàn & Minh Bạch', description: 'Kết quả được xác minh, giao dịch mã hóa và nhật ký kiểm toán đầy đủ.' },
    { icon: Globe, title: 'Phạm Vi Toàn Cầu', description: 'Truy cập giải đấu trên toàn thế giới với hỗ trợ đa ngôn ngữ và thanh toán đa dạng.' },
    { icon: Headphones, title: 'Hỗ Trợ 24/7', description: 'Hỗ trợ chuyên nghiệp mọi lúc, mọi nơi với đội ngũ chuyên trách cho tất cả người dùng.' },
  ];

  // Live race to highlight (first running, else pre_check, else closed)
  const featuredRace = stats?.liveRaces?.find(r => r.status === 'running')
    ?? stats?.liveRaces?.find(r => r.status === 'pre_check')
    ?? stats?.liveRaces?.[0]
    ?? null;

  const statusLabel = (s: string) =>
    s === 'running' ? 'TRỰC TIẾP' : s === 'pre_check' ? 'Chuẩn Bị' : 'Sắp Bắt Đầu';
  const statusBg = (s: string) =>
    s === 'running' ? 'bg-red-500' : 'bg-amber-500';

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-0 flex items-center justify-between h-[72px]">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/images/logo.png" alt="RaceTrack Pro" className="w-12 h-12 object-contain" />
            <span className="text-lg font-extrabold text-white tracking-tight">
              Race<span className="text-[#FFDE42]">Track</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[#FFDE42] bg-[#FFDE42]/10 transition-all">
              Trang Chủ
            </button>
            <button onClick={() => navigate('/tournaments')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all">
              <Trophy className="w-4 h-4 text-[#FFDE42]" /> Giải Đấu
            </button>
            <button onClick={() => navigate('/rankings')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all">
              <Medal className="w-4 h-4 text-[#FFDE42]" /> Bảng Xếp Hạng
            </button>
            <button onClick={() => navigate('/predictions')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all">
              <TrendingUp className="w-4 h-4 text-[#FFDE42]" /> Dự Đoán
              <span className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 text-[9px] font-bold rounded uppercase tracking-wide">TRỰC TIẾP</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <ProfileDropdown />
            ) : (
              <>
                <Button variant="text" onClick={() => navigate('/login')} sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600, fontSize: '14px', px: 2, '&:hover': { color: '#FFDE42', backgroundColor: 'transparent' } }}>
                  Đăng Nhập
                </Button>
                <Button variant="contained" onClick={() => navigate('/register')} sx={{ background: 'linear-gradient(135deg, #FFDE42 0%, #B8860B 100%)', color: '#1a0a00', textTransform: 'none', fontWeight: 700, fontSize: '14px', borderRadius: '10px', px: 3, py: 1, boxShadow: '0 4px 14px 0 rgba(255, 222, 66, 0.35)', '&:hover': { background: 'linear-gradient(135deg, #FFE862 0%, #D4A420 100%)', boxShadow: '0 6px 20px 0 rgba(255, 222, 66, 0.5)', transform: 'translateY(-1px)' } }}>
                  Bắt Đầu Ngay
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline
            poster="https://images.unsplash.com/photo-1764333672837-e490785e8306?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            className="w-full h-full object-cover">
            <source src="https://assets.mixkit.co/videos/preview/mixkit-horse-racing-track-and-horses-running-43306-large.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/20 to-slate-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-transparent to-slate-950/50" />
        </div>

        <div className="relative z-10 pt-32 pb-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              {/* Live badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFDE42]/20 border border-[#FFDE42]/30 rounded-full mb-8 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {featuredRace ? (
                  <span className="text-sm font-medium text-[#FFDE42]">
                    {statusLabel(featuredRace.status)}: {featuredRace.name}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-[#FFDE42]">Mùa Giải 2026 Đang Diễn Ra</span>
                )}
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold mb-8 text-white tracking-tight leading-tight">
                Trải Nghiệm <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFDE42] via-[#E6C21E] to-[#C29D13]">
                  Cảm Giác Đua Ngựa
                </span>
              </h1>

              <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl">
                Nền tảng tất cả trong một cho quản lý đua ngựa. Từ vận hành chuồng ngựa đến tương tác khán giả trực tiếp, được hỗ trợ bởi công nghệ tiên tiến.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 mb-16">
                <Button variant="contained" size="large" onClick={() => navigate(user ? '/spectator' : '/register')} endIcon={<ArrowRight />}
                  sx={{ background: 'linear-gradient(135deg, #FFDE42 0%, #1B0C0C 100%)', padding: '16px 40px', fontSize: '17px', textTransform: 'none', fontWeight: 600, borderRadius: '12px', boxShadow: '0 10px 30px -5px rgba(255, 222, 66, 0.5)', '&:hover': { background: 'linear-gradient(135deg, #FFDE42 0%, #4C5C2D 100%)', boxShadow: '0 15px 40px -5px rgba(255, 222, 66, 0.6)' } }}>
                  {user ? 'Vào Dashboard' : 'Bắt Đầu Miễn Phí'}
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate('/tournaments')} startIcon={<Play className="w-4 h-4" />}
                  sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white', padding: '16px 40px', fontSize: '17px', textTransform: 'none', fontWeight: 600, borderRadius: '12px', backdropFilter: 'blur(10px)', '&:hover': { borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}>
                  Xem Giải Đấu
                </Button>
              </div>

              {/* Quick Benefits — real API data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { icon: Sparkles, value: loadingStats ? '...' : formatCount(stats?.totalHorses ?? 0), label: 'Ngựa Đã Đăng Ký' },
                  { icon: Trophy, value: loadingStats ? '...' : formatCount(stats?.ongoingTournaments ?? 0), label: 'Giải Đang Diễn Ra' },
                  { icon: Users, value: loadingStats ? '...' : formatCount(stats?.totalSpectators ?? 0), label: 'Khán Giả Đã Tham Gia' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-emerald-500/30">
                      <b.icon className="w-5 h-5 text-[#FFDE42]" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">{b.value}</div>
                      <div className="text-sm text-slate-400">{b.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats Bar */}
      <section className="bg-slate-900/80 border-y border-white/5 py-6 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Trophy, label: 'Giải Đang Diễn Ra', value: loadingStats ? '—' : String(stats?.ongoingTournaments ?? 0) },
            { icon: Sparkles, label: 'Ngựa Đã Đăng Ký', value: loadingStats ? '—' : formatCount(stats?.totalHorses ?? 0) },
            { icon: Medal, label: 'Kỵ Sĩ Chuyên Nghiệp', value: loadingStats ? '—' : formatCount(stats?.totalJockeys ?? 0) },
            { icon: Users, label: 'Khán Giả Đã Tham Gia', value: loadingStats ? '—' : formatCount(stats?.totalSpectators ?? 0) },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFDE42]/10 rounded-xl flex items-center justify-center shrink-0">
                <s.icon className="w-5 h-5 text-[#FFDE42]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 bg-[#FFDE42]/10 border border-[#FFDE42]/20 rounded-full mb-6">
              <span className="text-sm font-medium text-[#FFDE42]">Tại Sao Chọn RaceTrack</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Mọi Thứ Bạn Cần Để <br className="hidden md:block" />
              Quản Lý Đua Ngựa Chuyên Nghiệp
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Xây dựng cho chủ ngựa, kỵ sĩ, trọng tài và khán giả. Một hệ sinh thái hoàn chỉnh được hỗ trợ bởi công nghệ hiện đại.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-slate-950/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-[#FFDE42]/30 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-[#FFDE42]/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20">
                  <feature.icon className="w-6 h-6 text-[#FFDE42]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 relative group rounded-2xl overflow-hidden border border-white/10 h-96">
              <ImageWithFallback src="https://images.unsplash.com/photo-1760041870925-0a6ed8220ce4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" alt="Sân Đua Ngựa" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <div className="text-[#FFDE42] font-medium mb-2 text-sm">Đua Ngựa Chuyên Nghiệp</div>
                <h3 className="text-2xl font-bold text-white">Cơ Sở Vật Chất Đẳng Cấp Thế Giới</h3>
              </div>
            </div>
            <div className="relative group rounded-2xl overflow-hidden border border-white/10 h-96">
              <ImageWithFallback src="https://images.unsplash.com/photo-1546700990-7b6416f2d90c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" alt="Kỵ Sĩ Chuyên Nghiệp" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <div className="text-[#FFDE42] font-medium mb-2 text-sm">Vận Động Viên Ưu Tú</div>
                <h3 className="text-xl font-bold text-white">Kỵ Sĩ Hàng Đầu</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Racing & Top Performers Section */}
      <section className="py-24 px-6 bg-slate-950 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12">
            <div>
              {featuredRace ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex items-center gap-2 text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide ${statusBg(featuredRace.status)}`}>
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      {statusLabel(featuredRace.status)}
                    </div>
                    <span className="text-slate-400 text-sm">{featuredRace.tournamentName}</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{featuredRace.name}</h2>
                  <p className="text-slate-400">
                    Cự ly {featuredRace.distance}m · Giải thưởng {featuredRace.purse.toLocaleString()} coins
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    Trực Tiếp & Sắp Diễn Ra
                  </h2>
                  <p className="text-lg text-slate-400">Theo dõi các cuộc đua và ngựa hàng đầu hệ thống.</p>
                </>
              )}
            </div>
            {stats?.liveRaces && stats.liveRaces.length > 1 && (
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                {stats.liveRaces.slice(1).map(r => (
                  <span key={r._id} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400 font-medium">
                    {r.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Live Player */}
            <div className="md:col-span-2 relative group rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl">
              <div className="aspect-[16/9] relative">
                <ImageWithFallback src="https://images.unsplash.com/photo-1613085411234-9c83af5562d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" alt="Đua Ngựa Trực Tiếp" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                <div className="absolute top-6 left-6 flex items-center gap-3">
                  {featuredRace ? (
                    <div className={`text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-2 uppercase tracking-wide ${statusBg(featuredRace.status)}`}>
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      {statusLabel(featuredRace.status)}
                    </div>
                  ) : (
                    <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-2 uppercase tracking-wide">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Live
                    </div>
                  )}
                  <div className="bg-slate-900/60 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-2 border border-white/10">
                    <Eye className="w-4 h-4" /> {formatCount(stats?.totalSpectators ?? 0)}
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <button onClick={() => navigate(user ? '/spectator' : '/register')} className="w-20 h-20 bg-[#FFDE42]/90 text-white rounded-full flex items-center justify-center backdrop-blur-sm shadow-[0_0_30px_rgba(255,222,66,0.5)] hover:bg-[#E6C21E] hover:scale-110 transition-all duration-300">
                    <Play className="w-8 h-8 ml-1 fill-current" />
                  </button>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div>
                    <div className="text-[#FFDE42] font-medium mb-1 flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      {featuredRace ? `Cự Ly: ${featuredRace.distance}m` : 'Cự Ly: 2400m'}
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {featuredRace?.name ?? 'Chung Kết Vô Địch'}
                    </h3>
                  </div>
                  {featuredRace && (
                    <div className="text-right hidden sm:block">
                      <div className="text-slate-300 text-sm mb-1">Giải Thưởng</div>
                      <div className="text-[#FFDE42] font-bold">{featuredRace.purse.toLocaleString()} coins</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Performers Board */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Ngựa Xuất Sắc Nhất
                </h3>
                <span className="text-xs font-medium text-[#FFDE42] bg-[#FFDE42]/10 px-2 py-1 rounded">Top {stats?.topHorses?.length ?? 5}</span>
              </div>

              <div className="flex-1 space-y-3">
                {loadingStats ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-slate-900/50 border border-white/5 rounded-xl p-4 animate-pulse">
                      <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                      <div className="h-2 bg-slate-800 rounded w-full" />
                    </div>
                  ))
                ) : stats?.topHorses && stats.topHorses.length > 0 ? (
                  stats.topHorses.map((horse) => (
                    <div key={horse._id} className="bg-slate-900/50 border border-white/5 rounded-xl p-3 hover:border-[#FFDE42]/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${RANK_COLORS[horse.rank - 1] ?? 'bg-slate-700'}`}>
                            {horse.rank}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm">{horse.name}</div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${GRADE_COLOR[horse.currentGrade] ?? GRADE_COLOR.Maiden}`}>
                              {horse.currentGrade}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-[#FFDE42]">{horse.totalPoints}</div>
                          <div className="text-[10px] text-slate-500 uppercase">Điểm</div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">{horse.winCount}/{horse.raceCount} thắng</span>
                          <span className="text-white font-medium">{horse.winRate}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#FFDE42] to-[#E6C21E] rounded-full transition-all" style={{ width: `${horse.winRate}%` }} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">Chưa có dữ liệu</div>
                )}
              </div>

              <Button variant="contained" fullWidth onClick={() => navigate(user ? '/spectator' : '/register')}
                sx={{ mt: 3, background: 'linear-gradient(135deg, #FFDE42 0%, #E6C21E 100%)', color: '#1B0C0C', textTransform: 'none', fontWeight: 700, py: 1.5, borderRadius: '10px', '&:hover': { background: 'linear-gradient(135deg, #FFE866 0%, #FFDE42 100%)' } }}>
                {user ? 'Xem Toàn Bộ Xếp Hạng' : 'Tham Gia Ngay'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-slate-950">
        <div className="max-w-6xl mx-auto relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0">
            <ImageWithFallback src="https://images.unsplash.com/photo-1766170449400-be0022117c24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920" alt="Giải Vô Địch Đua Ngựa" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#1B0C0C]/95 via-slate-900/90 to-[#313E17]/95" />
          </div>

          <div className="relative z-10 text-center p-12 md:p-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-8 backdrop-blur-sm">
              <Star className="w-4 h-4 text-[#FFDE42]" />
              <span className="text-sm font-medium text-[#FFDE42]">Được Tin Tưởng Bởi Các Chuyên Gia Đua Ngựa</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Sẵn Sàng Tham Gia Tương Lai?</h2>
            <p className="text-xl text-emerald-50 mb-10 max-w-2xl mx-auto leading-relaxed">
              Tham gia cùng{' '}
              <span className="text-[#FFDE42] font-bold">{loadingStats ? '...' : formatCount(stats?.totalSpectators ?? 0)}</span>{' '}
              khán giả, kỵ sĩ và chủ ngựa đã sử dụng RaceTrack để quản lý và trải nghiệm đua ngựa chưa từng có.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="contained" size="large" onClick={() => navigate(user ? '/spectator' : '/register')} endIcon={<ArrowRight />}
                sx={{ background: 'white', color: '#1B0C0C', padding: '16px 48px', fontSize: '18px', fontWeight: 700, textTransform: 'none', borderRadius: '14px', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)', '&:hover': { background: '#f8fafc', transform: 'translateY(-2px)', boxShadow: '0 15px 40px -5px rgba(0,0,0,0.4)' } }}>
                {user ? 'Vào Dashboard' : 'Bắt Đầu Miễn Phí'}
              </Button>
              {!user && (
                <Button variant="outlined" size="large" onClick={() => navigate('/login')}
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', padding: '16px 48px', fontSize: '18px', fontWeight: 600, textTransform: 'none', borderRadius: '14px', backdropFilter: 'blur(10px)', '&:hover': { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}>
                  Đăng Nhập
                </Button>
              )}
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-slate-100">
              <div className="flex items-center gap-2"><Check className="w-5 h-5 text-[#FFDE42]" /><span>Không cần thẻ tín dụng</span></div>
              <div className="hidden sm:flex items-center gap-2"><Check className="w-5 h-5 text-[#FFDE42]" /><span>Miễn phí mãi mãi</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="/images/logo.png" alt="RaceTrack Pro" className="w-16 h-16 object-contain" />
                <span className="text-xl font-bold text-white">RaceTrack<span className="text-[#FFDE42]">Pro</span></span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">Nền tảng tất cả trong một cho quản lý đua ngựa chuyên nghiệp và tương tác khán giả.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Nền Tảng</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-[#FFDE42] transition-colors">Chủ Ngựa</a></li>
                <li><a href="#" className="hover:text-[#FFDE42] transition-colors">Kỵ Sĩ</a></li>
                <li><a href="#" className="hover:text-[#FFDE42] transition-colors">Trọng Tài</a></li>
                <li><a href="#" className="hover:text-[#FFDE42] transition-colors">Khán Giả</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Tài Nguyên</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-[#FFDE42] transition-colors">Tài Liệu</a></li>
                <li><a href="#" className="hover:text-[#FFDE42] transition-colors">Tham Chiếu API</a></li>
                <li><a href="#" className="hover:text-[#FFDE42] transition-colors">Hướng Dẫn</a></li>
                <li><a href="#" className="hover:text-[#FFDE42] transition-colors">Hỗ Trợ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Công Ty</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-[#FFDE42] transition-colors">Về Chúng Tôi</a></li>
                <li><a href="#" className="hover:text-[#FFDE42] transition-colors">Tuyển Dụng</a></li>
                <li><a href="#" className="hover:text-[#FFDE42] transition-colors">Chính Sách Bảo Mật</a></li>
                <li><a href="#" className="hover:text-[#FFDE42] transition-colors">Điều Khoản Dịch Vụ</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">© 2026 RaceTrack. Đã đăng ký bản quyền.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-400 hover:text-[#FFDE42] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-[#FFDE42] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-[#FFDE42] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
