import { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, DollarSign, X,
  TrendingUp, TrendingDown, CheckCircle, Clock, BarChart3,
  ChevronLeft, ChevronRight, Filter, Coins,
} from 'lucide-react';
import { toast } from 'sonner';
import { betAdminApi, type Bet, BET_STATUS_LABEL, type BetStatus } from '../../api/bet';
import { raceApi, type Race } from '../../api/race';

const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('vi-VN') : '-';

const STATUS_PILL: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  won:       'bg-emerald-50 text-emerald-700 border border-emerald-200',
  lost:      'bg-slate-50 text-slate-700 border border-slate-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
  refunded:  'bg-indigo-50 text-indigo-700 border border-indigo-200',
};

function Modal({ open, onClose, title, children, maxWidth = 'max-w-md', icon }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
                {icon}
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition rounded-md hover:bg-slate-200 p-1 shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 pb-2">
          {children}
        </div>
      </div>
    </div>
  );
}

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
  const [settleRaces, setSettleRaces] = useState<Race[]>([]);
  const [loadingSettleRaces, setLoadingSettleRaces] = useState(false);
  const [pendingByRace, setPendingByRace] = useState<Record<string, number>>({});

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

  const openSettleDialog = async () => {
    setSettleSearch('');
    setSettlingRaceId('');
    setSettleDialog(true);
    setLoadingSettleRaces(true);
    try {
      const [finishedRes, pendingRes] = await Promise.all([
        raceApi.list({ status: 'finished', limit: 100 }),
        betAdminApi.getAllBets({ status: 'pending', limit: 10000 }),
      ]);

      const counts: Record<string, number> = {};
      for (const bet of pendingRes.bets ?? []) {
        const rid = typeof bet.raceId === 'object' ? bet.raceId._id : bet.raceId;
        if (!rid) continue;
        counts[rid] = (counts[rid] || 0) + 1;
      }
      setPendingByRace(counts);

      // Chỉ hiện race đã kết thúc; ưu tiên race còn cược pending
      const finished = (finishedRes.races ?? [])
        .filter(r => r.status === 'finished')
        .sort((a, b) => {
          const pa = counts[a._id] || 0;
          const pb = counts[b._id] || 0;
          if (pb !== pa) return pb - pa;
          return new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime();
        });
      setSettleRaces(finished);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải danh sách cuộc đua');
      setSettleRaces([]);
    } finally {
      setLoadingSettleRaces(false);
    }
  };

  const handleSettle = async () => {
    if (!settlingRaceId) return;
    const race = settleRaces.find(r => r._id === settlingRaceId);
    if (!race || race.status !== 'finished') {
      toast.error('Chỉ có thể quyết toán cuộc đua đã kết thúc');
      return;
    }
    setSettling(true);
    try {
      const result = await betAdminApi.settleBets(settlingRaceId);
      const settled = result.settled ?? 0;
      const won = result.won ?? 0;
      const lost = result.lost ?? 0;
      if (settled === 0) {
        toast.success('Không còn cược chờ quyết toán');
      } else {
        toast.success(`Quyết toán ${settled} cược: ${won} thắng, ${lost} thua`);
      }
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

  const filteredSettleRaces = settleSearch
    ? settleRaces.filter(r =>
        r.name.toLowerCase().includes(settleSearch.toLowerCase()) ||
        r.grade.toLowerCase().includes(settleSearch.toLowerCase())
      )
    : settleRaces;

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Cược</h2>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi và quyết toán toàn bộ lịch sử đặt cược.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* <button
            onClick={openSettleDialog}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <DollarSign size={16} />
            Quyết toán
          </button> */}
          <button
            onClick={() => { loadBets(); loadStats(); }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white py-2 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6 mb-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
              <BarChart3 size={18} className="text-blue-600" />
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <TrendingUp size={12} /> Hệ thống
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">
            {loadingStats ? <span className="text-slate-300 text-xl animate-pulse">...</span> : stats.total.toLocaleString('vi-VN')}
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Số Dự Đoán</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 border border-amber-100">
              <Coins size={18} className="text-amber-500" />
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <TrendingUp size={12} /> Đã đặt
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">
            {loadingStats ? <span className="text-slate-300 text-xl animate-pulse">...</span> : `${stats.totalAmount.toLocaleString('vi-VN')} $`}
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Tiền Dự Đoán</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <TrendingUp size={12} /> Đã trả
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">
            {loadingStats ? <span className="text-slate-300 text-xl animate-pulse">...</span> : `${stats.totalPayout.toLocaleString('vi-VN')} $`}
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Tiền Trả Thưởng</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${stats.pending > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-200'}`}>
              <Clock size={18} className={stats.pending > 0 ? 'text-red-600' : 'text-slate-400'} />
            </div>
            <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              stats.pending > 0
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              {stats.pending > 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              {stats.pending > 0 ? 'Cần Quyết Toán' : 'Hoàn Tất'}
            </span>
          </div>
          <p className={`text-2xl font-bold mb-1 ${stats.pending > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {loadingStats ? <span className="text-slate-300 text-xl animate-pulse">...</span> : stats.pending.toLocaleString('vi-VN')}
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cược Đang Chờ</p>
        </div>
      </div>

      {/* Filter + Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col min-h-[500px]">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50/50 px-5 py-4">
          <div className="relative flex-1 min-w-[250px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm người dùng, ngựa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 shrink-0 ml-2" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-md border border-slate-200 bg-white py-2 px-3 text-sm outline-none focus:border-blue-500 shadow-sm"
            >
              <option value="">Trạng thái: Tất cả</option>
              {['pending', 'won', 'lost', 'cancelled', 'refunded'].map(s => (
                <option key={s} value={s}>{BET_STATUS_LABEL[s as keyof typeof BET_STATUS_LABEL]}</option>
              ))}
            </select>

            <select
              value={filterRaceId}
              onChange={e => setFilterRaceId(e.target.value)}
              className="rounded-md border border-slate-200 bg-white py-2 px-3 text-sm outline-none focus:border-blue-500 shadow-sm max-w-[250px]"
            >
              <option value="">Cuộc đua: Tất cả</option>
              {races.map(r => <option key={r._id} value={r._id}>{r.name} ({r.grade})</option>)}
            </select>
          </div>

          <span className="ml-auto text-xs font-bold text-slate-400 uppercase tracking-wider">
            {total.toLocaleString('vi-VN')} Kết Quả
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="animate-spin text-slate-300" size={32} />
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
              <BarChart3 size={32} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-slate-600 font-semibold mb-1">Không có dữ liệu cược</p>
              <p className="text-sm text-slate-400 font-medium">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-50 shadow-sm z-10 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-400">Người cược</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-400">Cuộc đua</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-400">Ngựa</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Tiền cược</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Hệ số</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Trạng thái</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Tiền thắng</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBets.map((bet) => {
                  const spectator = bet.spectatorId as any;
                  const race = bet.raceId as any;
                  const horse = bet.horseId as any;
                  return (
                    <tr key={bet._id} className="hover:bg-slate-50/50 bg-white transition-colors">
                      <td className="py-3 px-5">
                        <p className="font-semibold text-slate-900 text-[13px]">{spectator?.fullName || '-'}</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">{spectator?.email || ''}</p>
                      </td>
                      <td className="py-3 px-5">
                        <p className="font-semibold text-slate-900 text-[13px]">{race?.name || '-'}</p>
                        {race?.grade && (
                          <span className="inline-block mt-1 rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm">
                            {race.grade}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <p className="font-semibold text-slate-900 text-[13px]">{horse?.name || '-'}</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">{horse?.currentGrade || ''}</p>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <p className="font-bold text-slate-900 text-[13px]">{bet.amount.toLocaleString('vi-VN')} $</p>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className="inline-block rounded-md bg-white border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-600 shadow-sm">
                          {bet.multiplier}x
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm ${STATUS_PILL[bet.status] || 'bg-slate-50 border border-slate-200 text-slate-500'}`}>
                          {BET_STATUS_LABEL[bet.status as keyof typeof BET_STATUS_LABEL] || bet.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        {bet.status === 'won' ? (
                          <p className="font-bold text-emerald-600 text-[13px]">+{bet.payoutAmount?.toLocaleString('vi-VN')} $</p>
                        ) : (
                          <p className="text-slate-400 font-medium">—</p>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <p className="text-[11px] font-medium text-slate-500">{fmtDateTime(bet.createdAt)}</p>
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
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
            <p className="text-xs font-medium text-slate-500">
              Trang <span className="font-bold text-slate-900">{page}</span> / {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"
              >
                <ChevronLeft size={14} />
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
                    className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition shadow-sm ${
                      page === p
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settle Dialog */}
      <Modal
        open={settleDialog}
        onClose={() => setSettleDialog(false)}
        title="Quyết toán"
        maxWidth="max-w-lg"
        icon={<DollarSign size={18} className="text-blue-600" />}
      >
        <div className="flex flex-col gap-4">
          <p className="text-[13px] font-medium text-slate-500">
            Chỉ hiện các cuộc đua <strong className="text-slate-700">đã kết thúc</strong>. Hệ thống quyết toán dựa trên kết quả chính thức.
          </p>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên cuộc đua..."
              value={settleSearch}
              onChange={e => setSettleSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {/* Race list */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
              {loadingSettleRaces ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 bg-slate-50">
                  <RefreshCw className="animate-spin text-slate-300" size={24} />
                  <p className="text-sm font-medium text-slate-500">Đang tải cuộc đua đã kết thúc...</p>
                </div>
              ) : settleRaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 bg-slate-50">
                  <Clock size={24} className="text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">Chưa có cuộc đua nào kết thúc</p>
                </div>
              ) : filteredSettleRaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 bg-slate-50">
                  <Search size={24} className="text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">Không tìm thấy cuộc đua phù hợp</p>
                </div>
              ) : (
                filteredSettleRaces.map(r => {
                  const pendingCount = pendingByRace[r._id] || 0;
                  return (
                    <button
                      key={r._id}
                      onClick={() => setSettlingRaceId(r._id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition hover:bg-slate-50 ${
                        settlingRaceId === r._id ? 'bg-blue-50/50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-4 w-4 rounded-full border items-center justify-center shrink-0 ${settlingRaceId === r._id ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'}`}>
                          {settlingRaceId === r._id && <div className="h-1.5 w-1.5 bg-white rounded-full"></div>}
                        </div>
                        <div className="min-w-0">
                          <span className={`font-bold text-[13px] block truncate ${settlingRaceId === r._id ? 'text-blue-700' : 'text-slate-800'}`}>
                            {r.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {fmtDateTime(r.scheduledTime)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 shrink-0 flex items-center gap-1.5">
                        {pendingCount > 0 ? (
                          <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 shadow-sm">
                            {pendingCount} chờ
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 shadow-sm">
                            Đã xong
                          </span>
                        )}
                        <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm">
                          {r.grade}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {settlingRaceId && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm mt-1">
              <CheckCircle size={16} className="text-emerald-500 shrink-0" />
              <p className="text-[13px] font-medium text-emerald-800">
                Đã chọn: <strong className="font-bold">{settleRaces.find(r => r._id === settlingRaceId)?.name}</strong>
                {(pendingByRace[settlingRaceId] || 0) === 0 && (
                  <span className="text-emerald-600"> — không còn cược chờ quyết toán</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Dialog footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 -mx-6 mt-6 rounded-b-xl">
          <button
            onClick={() => setSettleDialog(false)}
            disabled={settling}
            className="rounded-md border border-slate-300 bg-white py-2 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSettle}
            disabled={!settlingRaceId || settling || (pendingByRace[settlingRaceId] || 0) === 0}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 py-2 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 transition shadow-sm"
          >
            {settling && <RefreshCw className="animate-spin" size={16} />}
            {settling ? 'Đang quyết toán...' : 'Quyết toán'}
          </button>
        </div>
      </Modal>
    </>
  );
}
