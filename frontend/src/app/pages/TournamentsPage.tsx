import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import {
  Trophy, Calendar, MapPin, Search, Clock, X,
  Shield, Award, Flag, Info, Play, ArrowRight, ChevronRight, Loader2, Activity,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { tournamentApi, type Tournament } from '../api/tournament';
import { raceApi, type Race } from '../api/race';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusMeta(status: Tournament['status']) {
  switch (status) {
    case 'ongoing':   return { label: 'TRỰC TIẾP', badge: 'bg-red-500', dot: true };
    case 'upcoming':  return { label: 'SẮP DIỄN RA', badge: 'bg-blue-600/90', dot: false };
    case 'finished':  return { label: 'ĐÃ KẾT THÚC', badge: 'bg-slate-600/90', dot: false };
    case 'cancelled': return { label: 'ĐÃ HỦY', badge: 'bg-red-900/80', dot: false };
  }
}

function gradientFor(status: Tournament['status']): { from: string; to: string } {
  switch (status) {
    case 'ongoing':   return { from: '#F59E0B', to: '#EF4444' };
    case 'upcoming':  return { from: '#3B82F6', to: '#06B6D4' };
    case 'finished':  return { from: '#64748B', to: '#475569' };
    case 'cancelled': return { from: '#7F1D1D', to: '#450A0A' };
  }
}

function raceStatusCls(s: Race['status']): { label: string; cls: string } {
  switch (s) {
    case 'running':   return { label: 'TRỰC TIẾP', cls: 'bg-red-500 text-white' };
    case 'pre_check': return { label: 'Chuẩn Bị', cls: 'bg-amber-500 text-slate-900' };
    case 'open':      return { label: 'Mở', cls: 'bg-emerald-600/80 text-white' };
    case 'closed':    return { label: 'Đóng', cls: 'bg-slate-600 text-white' };
    case 'finished':  return { label: 'Hoàn Thành', cls: 'bg-slate-700 text-slate-300' };
    case 'cancelled': return { label: 'Đã Hủy', cls: 'bg-red-900/70 text-red-300' };
  }
}

// ─── Tournament Detail ────────────────────────────────────────────────────────

function TournamentDetail({ t, token, onClose }: { t: Tournament; token: string | null; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'races'>('overview');
  const [races, setRaces] = useState<Race[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const g = gradientFor(t.status);
  const sm = statusMeta(t.status);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (activeTab !== 'races' || !token) return;
    setLoadingRaces(true);
    raceApi.getRaces(token, { tournamentId: t._id, limit: 50 })
      .then(r => setRaces(r.races ?? []))
      .catch(() => setRaces([]))
      .finally(() => setLoadingRaces(false));
  }, [activeTab, token, t._id]);

  return (
    <div className="min-h-screen bg-[#09090F] text-slate-200" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-50 border-b border-white/8" style={{ backgroundColor: '#09090FEE', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between gap-4">
          <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/8 transition-all group">
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            Danh Sách Giải Đấu
          </button>
          <div className="flex items-center gap-3 truncate">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-white ${sm.badge}`}>
              {sm.dot && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              {sm.label}
            </span>
            <span className="font-black text-white text-base truncate hidden sm:inline">{t.name}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/8 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Hero */}
        <div className="relative overflow-hidden h-64 md:h-80" style={{ background: `linear-gradient(135deg, ${g.from}35, ${g.to}15)` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090F] via-[#09090F]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-2">{t.name}</h1>
            {t.description && <p className="text-slate-300 text-sm md:text-base max-w-2xl line-clamp-2">{t.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm text-slate-400 flex-wrap">
              {t.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{t.location}</span>}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(t.startDate).toLocaleDateString('vi-VN')} — {new Date(t.endDate).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/8 mt-4">
          {([['overview', 'Tổng Quan', Info], ['races', 'Cuộc Đua', Flag]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all uppercase tracking-wider ${activeTab === key ? '' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              style={activeTab === key ? { borderBottomColor: g.from, color: g.from } : {}}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="py-8">
          {activeTab === 'overview' && (
            <div className="max-w-3xl space-y-6">
              {t.description && (
                <div className="p-6 rounded-2xl bg-white/3 border border-white/6">
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Mô Tả</h3>
                  <p className="text-slate-300 leading-relaxed">{t.description}</p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: MapPin, label: 'Địa Điểm', value: t.location || 'Chưa cập nhật' },
                  { icon: Calendar, label: 'Bắt Đầu', value: new Date(t.startDate).toLocaleDateString('vi-VN') },
                  { icon: Calendar, label: 'Kết Thúc', value: new Date(t.endDate).toLocaleDateString('vi-VN') },
                  { icon: Shield, label: 'Trạng Thái', value: sm.label },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-4 bg-white/3 rounded-xl border border-white/6">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: g.from + '20' }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: g.from }} />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</div>
                      <div className="text-sm text-white font-medium">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'races' && (
            !token ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Flag className="w-12 h-12 mb-4 opacity-30" />
                <p>Đăng nhập để xem danh sách cuộc đua</p>
              </div>
            ) : loadingRaces ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-violet-400" /></div>
            ) : races.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Flag className="w-12 h-12 mb-4 opacity-30" />
                <p>Chưa có cuộc đua nào trong giải đấu này</p>
              </div>
            ) : (
              <div className="space-y-3">
                {races.map(race => {
                  const rs = raceStatusCls(race.status);
                  return (
                    <div key={race._id} className="p-5 rounded-2xl border border-white/8 bg-white/3 hover:border-white/15 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-white">{race.name}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${rs.cls}`}>{rs.label}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded border text-slate-400 border-white/10">{race.grade}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{race.distance}m</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(race.scheduledTime).toLocaleString('vi-VN')}</span>
                            <span className="flex items-center gap-1" style={{ color: g.from }}>
                              <Award className="w-3 h-3" />{race.purse.toLocaleString()} coins
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tournament Card ──────────────────────────────────────────────────────────

function TournamentCard({ t, onClick }: { t: Tournament; onClick: () => void }) {
  const g = gradientFor(t.status);
  const sm = statusMeta(t.status);

  return (
    <div className="group relative bg-[#111118] border border-white/8 rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1.5 hover:border-white/20 transition-all duration-300"
      onClick={onClick} style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      {/* Gradient hero */}
      <div className="relative h-44 overflow-hidden" style={{ background: `linear-gradient(135deg, ${g.from}30, ${g.to}15)` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-[#111118]/20 to-transparent" />
        <div className="absolute top-4 left-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-white ${sm.badge}`}>
            {sm.dot && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            {sm.label}
          </span>
        </div>
        <div className="absolute bottom-4 right-4 opacity-15">
          <Trophy className="w-20 h-20" style={{ color: g.from }} />
        </div>
        <div className="absolute bottom-4 left-4 right-20">
          <h3 className="text-lg font-black text-white line-clamp-2 leading-tight">{t.name}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {t.description && <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{t.description}</p>}
        <div className="space-y-2 mb-4">
          {t.location && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: g.from }} />
              <span className="truncate">{t.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: g.from }} />
            <span>{new Date(t.startDate).toLocaleDateString('vi-VN')} — {new Date(t.endDate).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="text-[10px] text-slate-600 uppercase tracking-widest">Giải đấu</div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all hover:gap-3"
            style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})`, boxShadow: `0 4px 15px ${g.from}30` }}
            onClick={e => { e.stopPropagation(); onClick(); }}
          >
            {t.status === 'ongoing' ? <><Play className="w-3.5 h-3.5" /> Xem Live</> : <><ArrowRight className="w-3.5 h-3.5" /> Chi Tiết</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { label: 'Tất Cả', value: 'all' },
  { label: 'Đang Diễn Ra', value: 'ongoing' },
  { label: 'Sắp Tới', value: 'upcoming' },
  { label: 'Đã Kết Thúc', value: 'finished' },
];

export function TournamentsPage() {
  const { token } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailTournament, setDetailTournament] = useState<Tournament | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    tournamentApi.getTournaments(token, 1, 100)
      .then(r => setTournaments(r.tournaments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = tournaments.filter(t => {
    const matchStatus = selectedStatus === 'all' || t.status === selectedStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) ||
      (t.description ?? '').toLowerCase().includes(q) ||
      (t.location ?? '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const liveCount = tournaments.filter(t => t.status === 'ongoing').length;

  if (detailTournament) {
    return <TournamentDetail t={detailTournament} token={token} onClose={() => setDetailTournament(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#09090F] text-slate-200" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Navbar />

      {/* Header */}
      <div className="relative pt-28 pb-12 px-6 border-b border-white/5">
        <div className="absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-amber-950/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Giải Đấu</span>
            </div>
            {liveCount > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-bold text-red-400">{liveCount} đang diễn ra</span>
              </div>
            )}
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
            Các Giải Đấu<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Đua Ngựa 2026</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Theo dõi tất cả giải đấu — từ giải đang diễn ra đến các giải sắp tới.
          </p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-[72px] z-30 bg-[#09090F]/90 backdrop-blur-xl border-b border-white/5 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-slate-900 rounded-xl p-1 border border-white/8 gap-1 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button key={f.value} onClick={() => setSelectedStatus(f.value)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${selectedStatus === f.value ? 'bg-amber-500/90 text-slate-900' : 'text-slate-500 hover:text-white'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Tìm giải đấu..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-all" />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {!token ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Trophy className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Đăng nhập để xem danh sách giải đấu</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Trophy className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-semibold mb-2">
              {searchQuery || selectedStatus !== 'all' ? 'Không tìm thấy giải đấu phù hợp' : 'Chưa có giải đấu nào'}
            </p>
            {(searchQuery || selectedStatus !== 'all') && (
              <button onClick={() => { setSearchQuery(''); setSelectedStatus('all'); }} className="mt-3 text-sm text-amber-400 hover:text-amber-300 transition-colors">
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-6">{filtered.length} giải đấu</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(t => (
                <TournamentCard key={t._id} t={t} onClick={() => setDetailTournament(t)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
