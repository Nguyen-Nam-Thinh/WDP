import { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, DollarSign, X,
  TrendingUp, TrendingDown, CheckCircle, Clock, BarChart3,
  ChevronLeft, ChevronRight, Filter, Coins,
} from 'lucide-react';
import { toast } from 'sonner';
import { betAdminApi, type Bet, BET_TYPE_LABEL, BET_STATUS_LABEL, type BetStatus } from '../../api/bet';
import { raceApi, type Race } from '../../api/race';

const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('vi-VN') : '-';

const BET_TYPE_COLOR: Record<string, string> = {
  win:   'bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  place: 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  show:  'bg-cyan-50 text-cyan-600 border border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
};

const STATUS_PILL: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  won:       'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  lost:      'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  cancelled: 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  refunded:  'bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
};

export default function BetManagement() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterRaceId, setFilterRaceId] = useState('');
  const [search, setSearch] = useState('');
  const [races, setRaces] = useState<Race[]>([]);

  const [settleDialog, setSettleDialog] = useState(false);
  const [settlingRaceId, setSettlingRaceId] = useState('');
  const [settling, setSettling] = useState(false);
  const [settleSearch, setSettleSearch] = useState('');

  const [stats, setStats] = useState({ totalAmount: 0, totalPayout: 0, pending: 0, total: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const loadBets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await betAdminApi.getAllBets({
        page, limit: 20,
        status: filterStatus as BetStatus || undefined,
        raceId: filterRaceId || undefined,
      });
      setBets(res.bets ?? []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [page, filterStatus, filterRaceId]);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await betAdminApi.getAllBets({
        page: 1, limit: 10000,
        status: filterStatus as BetStatus || undefined,
        raceId: filterRaceId || undefined,
      });
      const all = res.bets ?? [];
      setStats({
        total: res.total,
        totalAmount: all.reduce((s, b) => s + b.amount, 0),
        totalPayout: all.filter(b => b.status === 'won').reduce((s, b) => s + b.payoutAmount, 0),
        pending: all.filter(b => b.status === 'pending').length,
      });
    } catch { /* ignore */ } finally { setLoadingStats(false); }
  }, [filterStatus, filterRaceId]);

  const loadRaces = useCallback(async () => {
    try {
      const res = await raceApi.list({ limit: 100 });
      setRaces(res.races ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadBets(); }, [loadBets]);
  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadRaces(); }, [loadRaces]);
  useEffect(() => { setPage(1); }, [filterStatus, filterRaceId]);

  const handleSettle = async () => {
    if (!settlingRaceId) return;
    setSettling(true);
    try {
      const result = await betAdminApi.settleBets(settlingRaceId);
      toast.success(`Quyết toán ${result.settled} cược: ${result.won} thắng, ${result.lost} thua`);
      setSettleDialog(false);
      setSettlingRaceId('');
      loadBets();
      loadStats();
    } catch (err: any) { toast.error(err.message); }
    finally { setSettling(false); }
  };

  const filteredBets = search
    ? bets.filter(b => {
        const race = b.raceId as any;
        const horse = b.horseId as any;
        const spectator = b.spectatorId as any;
        return (
          (race?.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (horse?.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (spectator?.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
          (spectator?.email || '').toLowerCase().includes(search.toLowerCase())
        );
      })
    : bets;

  const finishedRaces = races.filter(r => r.status === 'finished');
  const filteredSettleRaces = settleSearch
    ? finishedRaces.filter(r =>
        r.name.toLowerCase().includes(settleSearch.toLowerCase()) ||
        r.grade.toLowerCase().includes(settleSearch.toLowerCase())
      )
    : finishedRaces;

  return (
    <>
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">Quản lý cược</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Theo dõi và quyết toán toàn bộ lịch sử đặt cược
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { setSettleSearch(''); setSettlingRaceId(''); setSettleDialog(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 py-2.5 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <DollarSign size={16} />
            Quyết toán cược
          </button>
          <button
            onClick={() => { loadBets(); loadStats(); }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition dark:border-slate-600 dark:bg-[#1c2434] dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6 mb-6">
        {/* Card 1 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1c2434]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
              <BarChart3 size={22} className="text-blue-500" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <TrendingUp size={11} /> Hệ thống
            </span>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white mb-1">
            {loadingStats ? <span className="text-slate-400 text-xl animate-pulse">...</span> : stats.total.toLocaleString('vi-VN')}
          </p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Tổng số cược</p>
          <p className="text-xs text-slate-400 mt-0.5">tất cả cược trong hệ thống</p>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1c2434]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
              <Coins size={22} className="text-amber-500" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <TrendingUp size={11} /> Đang hoạt động
            </span>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white mb-1">
            {loadingStats ? <span className="text-slate-400 text-xl animate-pulse">...</span> : stats.totalAmount.toLocaleString('vi-VN')}
          </p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Tổng tiền đặt cược</p>
          <p className="text-xs text-slate-400 mt-0.5">tổng coins đã đặt</p>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1c2434]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
              <CheckCircle size={22} className="text-emerald-500" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <TrendingUp size={11} /> Đã chi trả
            </span>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white mb-1">
            {loadingStats ? <span className="text-slate-400 text-xl animate-pulse">...</span> : stats.totalPayout.toLocaleString('vi-VN')}
          </p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Tổng tiền trả thưởng</p>
          <p className="text-xs text-slate-400 mt-0.5">coins đã chi trả người thắng</p>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1c2434]">
          <div className="flex items-start justify-between mb-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stats.pending > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
              <Clock size={22} className={stats.pending > 0 ? 'text-red-500' : 'text-slate-400'} />
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              stats.pending > 0
                ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {stats.pending > 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
              {stats.pending > 0 ? 'Cần theo dõi' : 'Ổn định'}
            </span>
          </div>
          <p className={`text-3xl font-bold mb-1 ${stats.pending > 0 ? 'text-red-500 dark:text-red-400' : 'text-black dark:text-white'}`}>
            {loadingStats ? <span className="text-slate-400 text-xl animate-pulse">...</span> : stats.pending.toLocaleString('vi-VN')}
          </p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Cược đang chờ</p>
          <p className="text-xs text-slate-400 mt-0.5">chưa được quyết toán</p>
        </div>
      </div>

      {/* ── Filter + Table Card ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1c2434]">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm cuộc đua, ngựa, người dùng..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white transition dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400 shrink-0" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm outline-none focus:border-blue-400 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Trạng thái: Tất cả</option>
              {['pending', 'won', 'lost', 'cancelled', 'refunded'].map(s => (
                <option key={s} value={s}>{BET_STATUS_LABEL[s as keyof typeof BET_STATUS_LABEL]}</option>
              ))}
            </select>

            <select
              value={filterRaceId}
              onChange={e => setFilterRaceId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm outline-none focus:border-blue-400 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white max-w-[220px]"
            >
              <option value="">Cuộc đua: Tất cả</option>
              {races.map(r => <option key={r._id} value={r._id}>{r.name} ({r.grade})</option>)}
            </select>
          </div>

          <span className="ml-auto text-xs text-slate-400">
            {total.toLocaleString('vi-VN')} bản ghi
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="animate-spin text-blue-500" size={28} />
            <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <BarChart3 size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">Không có dữ liệu</p>
            <p className="text-sm text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="py-3.5 px-5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Người cược</th>
                  <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cuộc đua</th>
                  <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ngựa</th>
                  <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Loại</th>
                  <th className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tiền cược</th>
                  <th className="py-3.5 px-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Hệ số</th>
                  <th className="py-3.5 px-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tiền thắng</th>
                  <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredBets.map((bet) => {
                  const spectator = bet.spectatorId as any;
                  const race = bet.raceId as any;
                  const horse = bet.horseId as any;
                  return (
                    <tr key={bet._id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-5">
                        <p className="font-semibold text-black dark:text-white leading-tight">{spectator?.fullName || '-'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{spectator?.email || ''}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-black dark:text-white leading-tight">{race?.name || '-'}</p>
                        {race?.grade && (
                          <span className="inline-block mt-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                            {race.grade}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-black dark:text-white leading-tight">{horse?.name || '-'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{horse?.currentGrade || ''}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${BET_TYPE_COLOR[bet.betType] || 'bg-slate-100 text-slate-600'}`}>
                          {BET_TYPE_LABEL[bet.betType as keyof typeof BET_TYPE_LABEL] || bet.betType}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <p className="font-bold text-black dark:text-white">{bet.amount.toLocaleString('vi-VN')}</p>
                        <p className="text-xs text-slate-400">coins</p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                          {bet.multiplier}x
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${STATUS_PILL[bet.status] || 'bg-slate-100 text-slate-500'}`}>
                          {BET_STATUS_LABEL[bet.status as keyof typeof BET_STATUS_LABEL] || bet.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {bet.status === 'won' ? (
                          <div>
                            <p className="font-bold text-emerald-500">+{bet.payoutAmount?.toLocaleString('vi-VN')}</p>
                            <p className="text-xs text-slate-400">coins</p>
                          </div>
                        ) : (
                          <p className="text-slate-300 dark:text-slate-600">—</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(bet.createdAt)}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-6 py-4">
            <p className="text-sm text-slate-500">
              Trang <span className="font-semibold text-black dark:text-white">{page}</span> / {totalPages}
              <span className="hidden sm:inline text-slate-400"> · {total.toLocaleString('vi-VN')} cược</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5) {
                  if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                      page === p
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Settle Dialog ── */}
      {settleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-[#1c2434] border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Dialog header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                  <DollarSign size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-black dark:text-white">Quyết Toán Cược</h3>
                  <p className="text-xs text-slate-400">Theo cuộc đua đã kết thúc</p>
                </div>
              </div>
              <button
                onClick={() => setSettleDialog(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Dialog body */}
            <div className="px-6 py-5">
              <p className="text-sm text-slate-500 mb-5">
                Chọn cuộc đua đã kết thúc để quyết toán. Hệ thống tự động tính toán dựa trên kết quả chính thức.
              </p>

              {/* Search */}
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tên cuộc đua..."
                  value={settleSearch}
                  onChange={e => setSettleSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white transition dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Race list */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                  {finishedRaces.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <Clock size={20} className="text-slate-300" />
                      <p className="text-sm text-slate-400">Chưa có cuộc đua nào kết thúc</p>
                    </div>
                  ) : filteredSettleRaces.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <Search size={20} className="text-slate-300" />
                      <p className="text-sm text-slate-400">Không tìm thấy cuộc đua phù hợp</p>
                    </div>
                  ) : (
                    filteredSettleRaces.map(r => (
                      <button
                        key={r._id}
                        onClick={() => setSettlingRaceId(r._id)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                          settlingRaceId === r._id
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full shrink-0 ${settlingRaceId === r._id ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                          <span className={`font-medium truncate ${settlingRaceId === r._id ? 'text-blue-700 dark:text-blue-400' : 'text-black dark:text-white'}`}>
                            {r.name}
                          </span>
                        </div>
                        <span className="ml-2 shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                          {r.grade}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {settlingRaceId && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 dark:bg-emerald-900/20">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Đã chọn: <strong>{races.find(r => r._id === settlingRaceId)?.name}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Dialog footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
              <button
                onClick={() => setSettleDialog(false)}
                disabled={settling}
                className="rounded-xl border border-slate-300 bg-white py-2 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition dark:border-slate-600 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSettle}
                disabled={!settlingRaceId || settling}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 py-2 px-5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              >
                {settling && <RefreshCw className="animate-spin" size={15} />}
                {settling ? 'Đang quyết toán...' : 'Xác nhận Quyết Toán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
