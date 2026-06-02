import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity, ArrowLeft, CheckCircle, XCircle, Clock,
  Filter, Search, TrendingUp, Coins, Trophy, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { betApi, type Bet, type BetStatus } from '../api/bet';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; bg: string; color: string; icon: any }> = {
  won:       { label: 'Thắng',   bg: 'rgba(255,222,66,0.15)',  color: '#FFDE42', icon: CheckCircle },
  lost:      { label: 'Thua',    bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', icon: XCircle },
  pending:   { label: 'Chờ KQ', bg: 'rgba(100,116,139,0.3)', color: '#94a3b8', icon: Clock },
  cancelled: { label: 'Đã hủy', bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc', icon: XCircle },
  refunded:  { label: 'Đã hoàn', bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', icon: CheckCircle },
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

  const totalBet  = bets.reduce((s, b) => s + (b.amount || 0), 0);
  const totalWon  = bets.filter(b => b.status === 'won').reduce((s, b) => s + (b.payoutAmount || 0), 0);
  const winCount  = bets.filter(b => b.status === 'won').length;
  const settled   = bets.filter(b => ['won', 'lost'].includes(b.status)).length;
  const winRate   = settled > 0 ? Math.round((winCount / settled) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/spectator')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Quay Lại</span>
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold leading-none">Lịch Sử Cược</div>
              <div className="text-slate-400 text-xs mt-0.5">{user?.fullName} · {user?.email}</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tổng Số Cược', value: bets.length, icon: Activity, color: 'from-purple-500 to-purple-700', sub: 'giao dịch' },
            { label: 'Tổng Tiền Đặt', value: `$${totalBet.toLocaleString()}`, icon: Coins, color: 'from-[#FFDE42] to-amber-600', sub: 'đã đặt cược' },
            { label: 'Tổng Tiền Thắng', value: `$${totalWon.toLocaleString()}`, icon: TrendingUp, color: 'from-emerald-500 to-emerald-700', sub: 'nhận về' },
            { label: 'Tỷ Lệ Thắng', value: `${winRate}%`, icon: Trophy, color: 'from-blue-500 to-blue-700', sub: `${winCount}/${settled} cược` },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200">
              <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">{s.value}</div>
              <div className="text-sm text-slate-400 font-medium">{s.label}</div>
              <div className="text-xs text-slate-600 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên cuộc đua, ngựa..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FFDE42]/50 transition-all" />
          </div>
          <div className="relative">
            <button onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2.5 text-slate-300 text-sm font-medium transition-all">
              <Filter className="w-4 h-4" />
              {filterStatus === 'all' ? 'Tất Cả' : (statusConfig[filterStatus]?.label || filterStatus)}
              <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden min-w-36">
                {[{ v: 'all', l: 'Tất Cả' }, { v: 'pending', l: 'Chờ KQ' }, { v: 'won', l: 'Thắng' }, { v: 'lost', l: 'Thua' }, { v: 'cancelled', l: 'Đã Hủy' }].map(opt => (
                  <button key={opt.v} onClick={() => { setFilterStatus(opt.v); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filterStatus === opt.v ? 'bg-[#FFDE42]/10 text-[#FFDE42]' : 'text-slate-300 hover:bg-white/5'}`}>
                    {opt.l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/60 border-b border-white/5">
                <tr>
                  {['Cuộc Đua', 'Ngựa', 'Loại Cược', 'Số Tiền', 'Hệ Số', 'Trạng Thái', 'Thực Nhận', 'Thời Gian', ''].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-5 py-16 text-center">
                    <div className="w-8 h-8 border-2 border-[#FFDE42] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-16 text-center">
                    <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <div className="text-slate-500 font-medium">{bets.length === 0 ? 'Chưa có cược nào' : 'Không tìm thấy kết quả'}</div>
                  </td></tr>
                ) : filtered.map(bet => {
                  const cfg = statusConfig[bet.status] || statusConfig.pending;
                  const Icon = cfg.icon;
                  const race = bet.raceId as any;
                  const horse = bet.horseId as any;
                  return (
                    <tr key={bet._id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <div className="text-white font-medium text-sm">{race?.name || '-'}</div>
                        <div className="text-slate-500 text-xs">{race?.grade}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-white text-sm font-semibold">{horse?.name || '-'}</div>
                        <div className="text-slate-500 text-xs">{horse?.currentGrade}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium border border-blue-500/20">
                          {BET_TYPE_LABEL[bet.betType] || bet.betType}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-white font-semibold text-sm">${bet.amount.toLocaleString()}</td>
                      <td className="px-5 py-4 text-slate-400 text-sm font-mono">{bet.multiplier}x</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg w-fit" style={{ backgroundColor: cfg.bg }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                          <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {bet.status === 'won' ? (
                          <span className="text-[#FFDE42] font-bold text-sm">+${(bet.payoutAmount || 0).toLocaleString()}</span>
                        ) : bet.status === 'lost' ? (
                          <span className="text-slate-600 text-sm">-${bet.amount.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-500 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
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
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-slate-500 text-sm">Hiển thị {filtered.length} / {bets.length} giao dịch</span>
              <div className="flex items-center gap-4">
                {['won','lost','pending'].map(s => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusConfig[s]?.color }} />
                    <span className="text-xs text-slate-400">{statusConfig[s]?.label}: {bets.filter(b => b.status === s).length}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
