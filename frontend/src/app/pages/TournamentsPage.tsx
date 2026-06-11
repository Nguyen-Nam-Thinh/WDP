import { useState, useEffect } from 'react';
import { PublicShell } from '../components/layout/PublicShell';
import { GradeBadge } from '../components/shared/GradeBadge';
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
    case 'ongoing':   return { label: 'TRỰC TIẾP', badge: 'bg-secondary', dot: true };
    case 'upcoming':  return { label: 'SẮP DIỄN RA', badge: 'bg-primary', dot: false };
    case 'finished':  return { label: 'ĐÃ KẾT THÚC', badge: 'bg-[#7A7468]', dot: false };
    case 'cancelled': return { label: 'ĐÃ HỦY', badge: 'bg-destructive', dot: false };
  }
}

// Heritage accent per status (dùng cho icon/nút chi tiết)
function accentFor(status: Tournament['status']): string {
  switch (status) {
    case 'ongoing':   return '#8C2F1B';
    case 'upcoming':  return '#1F3D2B';
    case 'finished':  return '#7A7468';
    case 'cancelled': return '#B42318';
  }
}

function raceStatusCls(s: Race['status']): { label: string; cls: string } {
  switch (s) {
    case 'running':   return { label: 'TRỰC TIẾP', cls: 'bg-secondary text-white' };
    case 'pre_check': return { label: 'Chuẩn Bị', cls: 'bg-gold text-foreground' };
    case 'open':      return { label: 'Mở', cls: 'bg-primary text-primary-foreground' };
    case 'closed':    return { label: 'Đóng', cls: 'bg-muted text-muted-foreground' };
    case 'finished':  return { label: 'Hoàn Thành', cls: 'bg-[#7A7468] text-white' };
    case 'cancelled': return { label: 'Đã Hủy', cls: 'border border-destructive text-destructive' };
  }
}

// ─── Tournament Detail ────────────────────────────────────────────────────────

function TournamentDetail({ t, token, onClose }: { t: Tournament; token: string | null; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'races'>('overview');
  const [races, setRaces] = useState<Race[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const accent = accentFor(t.status);
  const sm = statusMeta(t.status);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (activeTab !== 'races') return;
    setLoadingRaces(true);
    raceApi.getRaces(token, { tournamentId: t._id, limit: 50 })
      .then(r => setRaces(r.races ?? []))
      .catch(() => setRaces([]))
      .finally(() => setLoadingRaces(false));
  }, [activeTab, token, t._id]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-50 border-b-2 border-primary bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-[64px] flex items-center justify-between gap-4">
          <button type="button" onClick={onClose} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-muted transition-all group">
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            Danh Sách Giải Đấu
          </button>
          <div className="flex items-center gap-3 truncate">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-white ${sm.badge}`}>
              {sm.dot && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              {sm.label}
            </span>
            <span className="font-serif font-bold text-foreground text-base truncate hidden sm:inline">{t.name}</span>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Hero */}
        <div className="relative overflow-hidden h-64 md:h-80 border-b border-border" style={{ background: `linear-gradient(135deg, ${accent}14, transparent)` }}>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground leading-tight mb-2">{t.name}</h1>
            {t.description && <p className="text-muted-foreground text-sm md:text-base max-w-2xl line-clamp-2">{t.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
              {t.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{t.location}</span>}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(t.startDate).toLocaleDateString('vi-VN')} — {new Date(t.endDate).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mt-4">
          {([['overview', 'Tổng Quan', Info], ['races', 'Cuộc Đua', Flag]] as const).map(([key, label, Icon]) => (
            <button type="button" key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all uppercase tracking-wider ${activeTab === key ? '' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              style={activeTab === key ? { borderBottomColor: accent, color: accent } : {}}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="py-8">
          {activeTab === 'overview' && (
            <div className="max-w-3xl space-y-6">
              {t.description && (
                <div className="p-6 bg-card border border-border">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Mô Tả</h3>
                  <p className="text-foreground leading-relaxed">{t.description}</p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: MapPin, label: 'Địa Điểm', value: t.location || 'Chưa cập nhật' },
                  { icon: Calendar, label: 'Bắt Đầu', value: new Date(t.startDate).toLocaleDateString('vi-VN') },
                  { icon: Calendar, label: 'Kết Thúc', value: new Date(t.endDate).toLocaleDateString('vi-VN') },
                  { icon: Shield, label: 'Trạng Thái', value: sm.label },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-4 bg-card border border-border">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ backgroundColor: accent + '1A' }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</div>
                      <div className="text-sm text-foreground font-medium">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'races' && (
            loadingRaces ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : races.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Flag className="w-12 h-12 mb-4 opacity-30" />
                <p>Chưa có cuộc đua nào trong giải đấu này</p>
              </div>
            ) : (
              <div className="space-y-3">
                {races.map(race => {
                  const rs = raceStatusCls(race.status);
                  return (
                    <div key={race._id} className="p-5 border border-border bg-card hover:border-primary transition-all">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-serif font-bold text-foreground">{race.name}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase ${rs.cls}`}>{rs.label}</span>
                            <GradeBadge grade={race.grade} />
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{race.distance}m</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(race.scheduledTime).toLocaleString('vi-VN')}</span>
                            <span className="flex items-center gap-1 text-gold font-semibold">
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
  const accent = accentFor(t.status);
  const sm = statusMeta(t.status);

  return (
    <div className="group relative bg-card border border-border overflow-hidden cursor-pointer hover:-translate-y-1.5 hover:border-primary transition-all duration-300"
      onClick={onClick}>
      {/* Tinted hero */}
      <div className="relative h-44 overflow-hidden border-b border-border" style={{ background: `linear-gradient(135deg, ${accent}1F, ${accent}08)` }}>
        <div className="absolute top-4 left-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-white ${sm.badge}`}>
            {sm.dot && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            {sm.label}
          </span>
        </div>
        <div className="absolute bottom-4 right-4 opacity-20">
          <Trophy className="w-20 h-20" style={{ color: accent }} />
        </div>
        <div className="absolute bottom-4 left-4 right-20">
          <h3 className="font-serif text-lg font-bold text-foreground line-clamp-2 leading-tight">{t.name}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {t.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{t.description}</p>}
        <div className="space-y-2 mb-4">
          {t.location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
              <span className="truncate">{t.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
            <span>{new Date(t.startDate).toLocaleDateString('vi-VN')} — {new Date(t.endDate).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Giải đấu</div>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:gap-3"
            style={{ background: accent }}
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
    <PublicShell>
      {/* Header */}
      <div className="relative pt-14 pb-12 px-6 border-b border-border bg-card">
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-primary/30 rounded-full">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Giải Đấu</span>
            </div>
            {liveCount > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-secondary/30 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <span className="text-sm font-bold text-secondary">{liveCount} đang diễn ra</span>
              </div>
            )}
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
            Các Giải Đấu<br />
            <span className="italic text-secondary">Đua Ngựa 2026</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Theo dõi tất cả giải đấu — từ giải đang diễn ra đến các giải sắp tới.
          </p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-[64px] z-30 bg-background/95 backdrop-blur-sm border-b border-border py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-card p-1 border border-border gap-1 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button type="button" key={f.value} onClick={() => setSelectedStatus(f.value)}
                className={`px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${selectedStatus === f.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Tìm giải đấu..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all" />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Trophy className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-semibold mb-2">
              {searchQuery || selectedStatus !== 'all' ? 'Không tìm thấy giải đấu phù hợp' : 'Chưa có giải đấu nào'}
            </p>
            {(searchQuery || selectedStatus !== 'all') && (
              <button type="button" onClick={() => { setSearchQuery(''); setSelectedStatus('all'); }} className="mt-3 text-sm text-secondary hover:text-secondary/80 transition-colors">
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">{filtered.length} giải đấu</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(t => (
                <TournamentCard key={t._id} t={t} onClick={() => setDetailTournament(t)} />
              ))}
            </div>
          </>
        )}
      </div>
    </PublicShell>
  );
}
