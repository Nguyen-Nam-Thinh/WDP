import { useNavigate } from 'react-router';
import {
  Timer,
  Star,
  Play,
  Eye,
  ArrowRight,
  Flame,
  BarChart3,
  Lock,
  Globe,
  Headphones,
  Check
} from 'lucide-react';
import { Button } from '@mui/material';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAuth } from '../hooks/useAuth';
import { PublicShell } from '../components/layout/PublicShell';
import { GradeBadge } from '../components/shared/GradeBadge';
import { useEffect, useState } from 'react';
import { publicApi, type PlatformStats } from '../api/public';
import { motion } from 'motion/react';
import useEmblaCarousel from 'embla-carousel-react';

const RANK_COLORS = ['bg-gold text-foreground', 'bg-[#9A937F] text-white', 'bg-[#A85C32] text-white', 'bg-primary text-primary-foreground', 'bg-primary text-primary-foreground'];

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
  return n > 0 ? `${n}+` : '0';
}

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 3500);
    return () => clearInterval(interval);
  }, [emblaApi]);

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
    s === 'running' ? 'bg-secondary' : 'bg-gold';

  return (
    <PublicShell>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline
            poster="https://images.unsplash.com/photo-1764333672837-e490785e8306?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            className="w-full h-full object-cover">
            <source src="/video/banner.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#F7F3EA]/85 via-[#F7F3EA]/70 to-background" />
        </div>

        <div className="relative z-10 pt-24 pb-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              {/* Live badge */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-primary/30 rounded-full mb-8">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                {featuredRace ? (
                  <span className="text-sm font-medium text-primary">
                    {statusLabel(featuredRace.status)}: {featuredRace.name}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-primary">Mùa Giải 2026 Đang Diễn Ra</span>
                )}
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="font-serif text-5xl md:text-7xl font-bold mb-8 text-foreground tracking-tight leading-[1.1]">
                Trải Nghiệm <br />
                <span className="italic text-secondary">Cảm Giác Đua Ngựa</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl">
                Nền tảng tất cả trong một cho quản lý đua ngựa. Từ vận hành chuồng ngựa đến tương tác khán giả trực tiếp, được hỗ trợ bởi công nghệ tiên tiến.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row items-start gap-4 mb-16">
                <Button variant="contained" size="large" onClick={() => navigate(user ? '/spectator' : '/register')} endIcon={<ArrowRight />}
                  sx={{ background: '#1F3D2B', color: '#F7F3EA', padding: '16px 40px', fontSize: '17px', textTransform: 'none', fontWeight: 600, borderRadius: 0, boxShadow: 'none', '&:hover': { background: '#172D20', boxShadow: 'none' } }}>
                  {user ? 'Vào Dashboard' : 'Bắt Đầu Miễn Phí'}
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate('/tournaments')} startIcon={<Play className="w-4 h-4" />}
                  sx={{ borderColor: '#1F3D2B', color: '#1F3D2B', padding: '16px 40px', fontSize: '17px', textTransform: 'none', fontWeight: 600, borderRadius: 0, '&:hover': { borderColor: '#1F3D2B', backgroundColor: 'rgba(31, 61, 43, 0.06)' } }}>
                  Xem Giải Đấu
                </Button>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 border border-secondary/30 rounded-full mb-6">
              <span className="text-sm font-medium uppercase tracking-[0.15em] text-secondary">Tại Sao Chọn The Paddock</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight" style={{ textWrap: 'balance' }}>
              Mọi Thứ Bạn Cần Để <br className="hidden md:block" />
              Quản Lý Đua Ngựa Chuyên Nghiệp
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Xây dựng cho chủ ngựa, kỵ sĩ, trọng tài và khán giả. Một hệ sinh thái hoàn chỉnh được hỗ trợ bởi công nghệ hiện đại.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 mb-16">
            {features.map((feature, idx) => (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.1 }} key={idx} className="group flex items-start gap-5 bg-background border border-border p-6 hover:border-primary transition-colors">
                <div className="w-14 h-14 bg-primary/10 flex items-center justify-center shrink-0 border border-primary/15 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-foreground mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="overflow-hidden border border-border bg-card" ref={emblaRef}>
            <div className="flex">
              {[
                { src: "https://images.unsplash.com/photo-1760041870925-0a6ed8220ce4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", title: "Cơ Sở Vật Chất Đẳng Cấp Thế Giới", sub: "Đua Ngựa Chuyên Nghiệp" },
                { src: "https://images.unsplash.com/photo-1546700990-7b6416f2d90c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", title: "Kỵ Sĩ Hàng Đầu", sub: "Vận Động Viên Ưu Tú" },
                { src: "https://images.unsplash.com/photo-1613085411234-9c83af5562d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", title: "Đường Đua Rực Lửa", sub: "Trải Nghiệm Trực Tiếp" },
                { src: "https://images.unsplash.com/photo-1766170449400-be0022117c24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920", title: "Giải Đấu Toàn Cầu", sub: "Sự Kiện Thường Niên" }
              ].map((img, i) => (
                <div key={i} className="relative flex-[0_0_100%] min-w-0 md:flex-[0_0_60%] lg:flex-[0_0_50%] h-[400px] group border-r border-border cursor-grab active:cursor-grabbing">
                  <ImageWithFallback src={img.src} alt={img.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#23201A]/80 via-[#23201A]/10 to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <div className="text-gold font-medium mb-2 text-sm uppercase tracking-[0.15em]">{img.sub}</div>
                    <h3 className="font-serif text-2xl font-bold text-white">{img.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Racing & Top Performers Section */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row items-end justify-between mb-12">
            <div>
              {featuredRace ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex items-center gap-2 text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wide ${statusBg(featuredRace.status)}`}>
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      {statusLabel(featuredRace.status)}
                    </div>
                    <span className="text-muted-foreground text-sm">{featuredRace.tournamentName}</span>
                  </div>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">{featuredRace.name}</h2>
                  <p className="text-muted-foreground">
                    Cự ly {featuredRace.distance}m · Giải thưởng {featuredRace.purse.toLocaleString()} coins
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
                    Trực Tiếp &amp; Sắp Diễn Ra
                  </h2>
                  <p className="text-lg text-muted-foreground">Theo dõi các cuộc đua và ngựa hàng đầu hệ thống.</p>
                </>
              )}
            </div>
            {stats?.liveRaces && stats.liveRaces.length > 1 && (
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                {stats.liveRaces.slice(1).map(r => (
                  <span key={r._id} className="px-3 py-1.5 bg-card border border-border text-xs text-muted-foreground font-medium">
                    {r.name}
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 lg:items-start">
            {/* Live Player */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="lg:col-span-2 relative group overflow-hidden border border-border bg-card">
              <div className="aspect-[16/9] w-full relative">
                <ImageWithFallback src="https://images.unsplash.com/photo-1613085411234-9c83af5562d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" alt="Đua Ngựa Trực Tiếp" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#23201A]/85 via-[#23201A]/20 to-transparent" />

                <div className="absolute top-6 left-6 flex items-center gap-3">
                  {featuredRace ? (
                    <div className={`text-white text-xs font-bold px-3 py-1.5 flex items-center gap-2 uppercase tracking-wide ${statusBg(featuredRace.status)}`}>
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      {statusLabel(featuredRace.status)}
                    </div>
                  ) : (
                    <div className="bg-secondary text-white text-xs font-bold px-3 py-1.5 flex items-center gap-2 uppercase tracking-wide">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Live
                    </div>
                  )}
                  <div className="bg-[#23201A]/60 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 flex items-center gap-2 border border-white/20">
                    <Eye className="w-4 h-4" /> {formatCount(stats?.totalSpectators ?? 0)}
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <button type="button" onClick={() => navigate(user ? '/spectator' : '/register')} className="w-20 h-20 bg-[#F7F3EA]/90 text-primary rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-[#F7F3EA] hover:scale-110 transition-all duration-300">
                    <Play className="w-8 h-8 ml-1 fill-current" />
                  </button>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div>
                    <div className="text-gold font-medium mb-1 flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      {featuredRace ? `Cự Ly: ${featuredRace.distance}m` : 'Cự Ly: 2400m'}
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-white">
                      {featuredRace?.name ?? 'Chung Kết Vô Địch'}
                    </h3>
                  </div>
                  {featuredRace && (
                    <div className="text-right hidden sm:block">
                      <div className="text-white/70 text-sm mb-1">Giải Thưởng</div>
                      <div className="text-gold font-bold">{featuredRace.purse.toLocaleString()} coins</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Top Performers Board */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-card border border-border p-6 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                  <Flame className="w-5 h-5 text-secondary" />
                  Ngựa Xuất Sắc Nhất
                </h3>
                <span className="text-xs font-medium text-secondary border border-secondary/30 px-2 py-1">Top {Math.min(stats?.topHorses?.length ?? 3, 3)}</span>
              </div>

              <div className="flex-1 space-y-3">
                {loadingStats ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-background border border-border p-4 animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-2 bg-muted rounded w-full" />
                    </div>
                  ))
                ) : stats?.topHorses && stats.topHorses.length > 0 ? (
                  stats.topHorses.slice(0, 3).map((horse) => (
                    <div key={horse._id} className="bg-background border border-border p-3 hover:border-primary transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold ${RANK_COLORS[horse.rank - 1] ?? 'bg-primary text-primary-foreground'}`}>
                            {horse.rank}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">{horse.name}</div>
                            <GradeBadge grade={horse.currentGrade} />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gold tabular-nums">{horse.totalPoints}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Điểm</div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{horse.winCount}/{horse.raceCount} thắng</span>
                          <span className="text-foreground font-medium tabular-nums">{horse.winRate}%</span>
                        </div>
                        <div className="h-1.5 bg-muted overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${horse.winRate}%` }} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">Chưa có dữ liệu</div>
                )}
              </div>

              <Button variant="contained" fullWidth onClick={() => navigate('/rankings')}
                sx={{ mt: 3, background: '#1F3D2B', color: '#F7F3EA', textTransform: 'none', fontWeight: 700, py: 1.5, borderRadius: 0, boxShadow: 'none', '&:hover': { background: '#172D20', boxShadow: 'none' } }}>
                Xem Toàn Bộ Xếp Hạng
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-background">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-6xl mx-auto relative overflow-hidden">
          <div className="absolute inset-0">
            <ImageWithFallback src="https://images.unsplash.com/photo-1766170449400-be0022117c24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920" alt="Giải Vô Địch Đua Ngựa" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#1F3D2B]/95 via-[#1F3D2B]/90 to-[#8C2F1B]/90" />
          </div>

          <div className="relative z-10 text-center p-12 md:p-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-white/30 rounded-full mb-8 backdrop-blur-sm">
              <Star className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-[#F7F3EA]">Được Tin Tưởng Bởi Các Chuyên Gia Đua Ngựa</span>
            </div>

            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Sẵn Sàng Tham Gia Tương Lai?</h2>
            <p className="text-xl text-[#F7F3EA]/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Tham gia cùng{' '}
              <span className="text-gold font-bold">{loadingStats ? '...' : formatCount(stats?.totalSpectators ?? 0)}</span>{' '}
              khán giả, kỵ sĩ và chủ ngựa đã sử dụng The Paddock để quản lý và trải nghiệm đua ngựa chưa từng có.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="contained" size="large" onClick={() => navigate(user ? '/spectator' : '/register')} endIcon={<ArrowRight />}
                sx={{ background: '#F7F3EA', color: '#1F3D2B', padding: '16px 48px', fontSize: '18px', fontWeight: 700, textTransform: 'none', borderRadius: 0, boxShadow: 'none', '&:hover': { background: '#FFFFFF', boxShadow: 'none' } }}>
                {user ? 'Vào Dashboard' : 'Bắt Đầu Miễn Phí'}
              </Button>
              {!user && (
                <Button variant="outlined" size="large" onClick={() => navigate('/login')}
                  sx={{ borderColor: 'rgba(247,243,234,0.5)', color: '#F7F3EA', padding: '16px 48px', fontSize: '18px', fontWeight: 600, textTransform: 'none', borderRadius: 0, '&:hover': { borderColor: '#F7F3EA', backgroundColor: 'rgba(247, 243, 234, 0.1)' } }}>
                  Đăng Nhập
                </Button>
              )}
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-[#F7F3EA]">
              <div className="flex items-center gap-2"><Check className="w-5 h-5 text-gold" /><span>Không cần thẻ tín dụng</span></div>
              <div className="hidden sm:flex items-center gap-2"><Check className="w-5 h-5 text-gold" /><span>Miễn phí mãi mãi</span></div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="/images/logo.png" alt="The Paddock" className="w-16 h-16 object-contain" />
                <span className="font-serif text-xl font-bold text-primary">The Paddock</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Nền tảng tất cả trong một cho quản lý đua ngựa chuyên nghiệp và tương tác khán giả.</p>
            </div>
            <div>
              <h4 className="font-serif text-foreground font-bold mb-4">Nền Tảng</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-secondary transition-colors">Chủ Ngựa</a></li>
                <li><a href="#" className="hover:text-secondary transition-colors">Kỵ Sĩ</a></li>
                <li><a href="#" className="hover:text-secondary transition-colors">Trọng Tài</a></li>
                <li><a href="#" className="hover:text-secondary transition-colors">Khán Giả</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif text-foreground font-bold mb-4">Tài Nguyên</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-secondary transition-colors">Tài Liệu</a></li>
                <li><a href="#" className="hover:text-secondary transition-colors">Tham Chiếu API</a></li>
                <li><a href="#" className="hover:text-secondary transition-colors">Hướng Dẫn</a></li>
                <li><a href="#" className="hover:text-secondary transition-colors">Hỗ Trợ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif text-foreground font-bold mb-4">Công Ty</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-secondary transition-colors">Về Chúng Tôi</a></li>
                <li><a href="#" className="hover:text-secondary transition-colors">Tuyển Dụng</a></li>
                <li><a href="#" className="hover:text-secondary transition-colors">Chính Sách Bảo Mật</a></li>
                <li><a href="#" className="hover:text-secondary transition-colors">Điều Khoản Dịch Vụ</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2026 The Paddock. Đã đăng ký bản quyền.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-secondary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-secondary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-secondary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </PublicShell>
  );
}
