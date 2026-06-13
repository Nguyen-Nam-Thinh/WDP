import { useState, useEffect, useCallback, useMemo } from 'react';
import { Pagination } from '../components/Pagination';
import { useNavigate } from 'react-router';
import {
  Activity, ArrowLeft, CheckCircle, XCircle, Clock,
  Filter, Search, TrendingUp, Coins, Trophy, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { betApi, type Bet, type BetStatus } from '../api/bet';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; bg: string; color: string; icon: any }> = {
  won:       { label: 'Thắng',   bg: 'rgba(31,61,43,0.12)',  color: '#C9A227', icon: CheckCircle },
  lost:      { label: 'Thua',    bg: 'rgba(180,35,24,0.12)',   color: '#B42318', icon: XCircle },
  pending:   { label: 'Chờ KQ', bg: 'rgba(122,116,104,0.18)', color: '#7A7468', icon: Clock },
  cancelled: { label: 'Đã hủy', bg: 'rgba(140,47,27,0.12)', color: '#8C2F1B', icon: XCircle },
  refunded:  { label: 'Đã hoàn', bg: 'rgba(201,162,39,0.15)', color: '#8F7318', icon: CheckCircle },
};

const BET_TYPE_LABEL: Record<string, string> = { win: 'Thắng (Hạng 1)', place: 'Hạng 2', show: 'Hạng 3' };

export function BetHistoryPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [betPage, setBetPage] = useState(1);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await betApi.getMyBets(token, { limit: 100 });
      setBets(res.bets ?? []);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải lịch sử cược');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (betId: string) => {
    if (!token || !confirm('Hủy cược? Sẽ được hoàn 100% tiền.')) return;
    setCancellingId(betId);
    try {
      await betApi.cancel(token, betId);
      toast.success('Đã hủy cược, tiền đã hoàn trả');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Hủy cược thất bại');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = bets.filter(b => {
    const race = b.raceId as any;
    const horse = b.horseId as any;
    const matchSearch = (race?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (horse?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        b._id.includes(search);
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const BET_PAGE_SIZE = 10;
  const betTotalPages = Math.ceil(filtered.length / BET_PAGE_SIZE);
  const pagedBets = useMemo(() => filtered.slice((betPage - 1) * BET_PAGE_SIZE, betPage * BET_PAGE_SIZE), [filtered, betPage]);

  const totalBet  = bets.reduce((s, b) => s + (b.amount || 0), 0);
  const totalWon  = bets.filter(b => b.status === 'won').reduce((s, b) => s + (b.payoutAmount || 0), 0);
  const winCount  = bets.filter(b => b.status === 'won').length;
  const settled   = bets.filter(b => ['won', 'lost'].includes(b.status)).length;
  const winRate   = settled > 0 ? Math.round((winCount / settled) * 100) : 0;

  return (
    <div className="min-h-screen bg-background font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/spectator')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-card group-hover:bg-muted flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Quay Lại</span>
          </button>
          <div className="w-px h-5 bg-muted" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#1F3D2B] to-[#172D20] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-foreground font-serif font-bold leading-none text-foreground">Lịch Sử Cược</div>
              <div className="text-muted-foreground text-xs mt-0.5">{user?.fullName} · {user?.email}</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tổng Số Cược', value: bets.length, icon: Activity, color: 'from-[#1F3D2B] to-[#172D20]', sub: 'giao dịch' },
            { label: 'Tổng Tiền Đặt', value: `$${totalBet.toLocaleString()}`, icon: Coins, color: 'from-[#C9A227] to-[#8F7318]', sub: 'đã đặt cược' },
            { label: 'Tổng Tiền Thắng', value: `$${totalWon.toLocaleString()}`, icon: TrendingUp, color: 'from-[#1F3D2B] to-[#172D20]', sub: 'nhận về' },
            { label: 'Tỷ Lệ Thắng', value: `${winRate}%`, icon: Trophy, color: 'from-[#8C2F1B] to-[#6B2415]', sub: `${winCount}/${settled} cược` },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200">
              <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className="font-serif text-2xl font-bold text-foreground mb-0.5">{s.value}</div>
              <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setBetPage(1); }}
              placeholder="Tìm theo tên cuộc đua, ngựa..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-[#C9A227]/50 transition-all" />
          </div>
          <div className="relative">
            <button onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 bg-card border border-border hover:border-border rounded-xl px-4 py-2.5 text-foreground text-sm font-medium transition-all">
              <Filter className="w-4 h-4" />
              {filterStatus === 'all' ? 'Tất Cả' : (statusConfig[filterStatus]?.label || filterStatus)}
              <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden min-w-36">
                {[{ v: 'all', l: 'Tất Cả' }, { v: 'pending', l: 'Chờ KQ' }, { v: 'won', l: 'Thắng' }, { v: 'lost', l: 'Thua' }, { v: 'cancelled', l: 'Đã Hủy' }].map(opt => (
                  <button key={opt.v} onClick={() => { setFilterStatus(opt.v); setFilterOpen(false); setBetPage(1); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filterStatus === opt.v ? 'bg-[#C9A227]/10 text-[#C9A227]' : 'text-foreground hover:bg-muted'}`}>
                    {opt.l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card backdrop-blur-md border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {['Cuộc Đua', 'Ngựa', 'Loại Cược', 'Số Tiền', 'Hệ Số', 'Trạng Thái', 'Thực Nhận', 'Thời Gian', ''].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-5 py-16 text-center">
                    <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-16 text-center">
                    <Activity className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                    <div className="text-muted-foreground font-medium">{bets.length === 0 ? 'Chưa có cược nào' : 'Không tìm thấy kết quả'}</div>
                  </td></tr>
                ) : pagedBets.map(bet => {
                  const cfg = statusConfig[bet.status] || statusConfig.pending;
                  const Icon = cfg.icon;
                  const race = bet.raceId as any;
                  const horse = bet.horseId as any;
                  return (
                    <tr key={bet._id} className="border-t border-border hover:bg-muted transition-colors">
                      <td className="px-5 py-4">
                        <div className="text-foreground font-medium text-sm">{race?.name || '-'}</div>
                        <div className="text-muted-foreground text-xs">{race?.grade}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-foreground text-sm font-semibold">{horse?.name || '-'}</div>
                        <div className="text-muted-foreground text-xs">{horse?.currentGrade}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium border border-primary/20">
                          {BET_TYPE_LABEL[bet.betType] || bet.betType}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-foreground font-semibold text-sm">${bet.amount.toLocaleString()}</td>
                      <td className="px-5 py-4 text-muted-foreground text-sm font-mono">{bet.multiplier}x</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg w-fit" style={{ backgroundColor: cfg.bg }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                          <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {bet.status === 'won' ? (
                          <span className="text-[#C9A227] font-bold text-sm">+${(bet.payoutAmount || 0).toLocaleString()}</span>
                        ) : bet.status === 'lost' ? (
                          <span className="text-muted-foreground text-sm">-${bet.amount.toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(bet.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-5 py-4">
                        {bet.status === 'pending' && (
                          <button disabled={cancellingId === bet._id} onClick={() => handleCancel(bet._id)}
                            className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-1 rounded transition-colors disabled:opacity-40">
                            {cancellingId === bet._id ? '...' : 'Hủy'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-border flex flex-col gap-3">
              <Pagination page={betPage} totalPages={betTotalPages} onPageChange={setBetPage} />
              <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Hiển thị {Math.min(betPage * BET_PAGE_SIZE, filtered.length)}/{filtered.length} giao dịch</span>
              <div className="flex items-center gap-4">
                {['won','lost','pending'].map(s => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusConfig[s]?.color }} />
                    <span className="text-xs text-muted-foreground">{statusConfig[s]?.label}: {bets.filter(b => b.status === s).length}</span>
                  </div>
                ))}
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
