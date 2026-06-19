import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, DollarSign, X } from 'lucide-react';
import { toast } from 'sonner';
import { betAdminApi, type Bet, BET_TYPE_LABEL, BET_STATUS_LABEL, BET_STATUS_COLOR, type BetStatus } from '../../api/bet';
import { raceApi, type Race } from '../../api/race';

const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('vi-VN') : '-';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
    case 'won': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'lost': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    case 'cancelled': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    case 'refunded': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
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

  // Races for filter dropdown
  const [races, setRaces] = useState<Race[]>([]);

  // Settle dialog
  const [settleDialog, setSettleDialog] = useState(false);
  const [settlingRaceId, setSettlingRaceId] = useState('');
  const [settling, setSettling] = useState(false);

  // Stats (loaded separately to cover all pages, not just current)
  const [stats, setStats] = useState({ totalAmount: 0, totalPayout: 0, pending: 0, total: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const loadBets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await betAdminApi.getAllBets({
        page,
        limit: 20,
        status: filterStatus as BetStatus || undefined,
        raceId: filterRaceId || undefined,
      });
      setBets(res.bets ?? []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterRaceId]);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      // Fetch all bets (high limit) with same filters but no page constraint for real aggregation
      const res = await betAdminApi.getAllBets({
        page: 1,
        limit: 10000,
        status: filterStatus as BetStatus || undefined,
        raceId: filterRaceId || undefined,
      });
      const allBets = res.bets ?? [];
      setStats({
        total: res.total,
        totalAmount: allBets.reduce((s, b) => s + b.amount, 0),
        totalPayout: allBets.filter(b => b.status === 'won').reduce((s, b) => s + b.payoutAmount, 0),
        pending: allBets.filter(b => b.status === 'pending').length,
      });
    } catch { /* ignore stats errors */ } finally {
      setLoadingStats(false);
    }
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
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSettling(false);
    }
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

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Quản lý cược
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSettleDialog(true)}
            className="inline-flex items-center justify-center gap-2.5 rounded-md bg-blue-600 py-2 px-4 text-center font-medium text-white hover:bg-blue-700 transition"
          >
            <DollarSign size={18} />
            Quyết toán cược
          </button>
          <button
            onClick={loadBets}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2.5 rounded-md border border-slate-300 bg-white py-2 px-4 text-center font-medium text-black hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6 xl:gap-7.5 mb-6">
        {[
          { label: 'Tổng số cược', value: loadingStats ? '...' : stats.total.toLocaleString('vi-VN'), textColor: 'text-blue-600 dark:text-blue-400' },
          { label: 'Tổng tiền đặt', value: loadingStats ? '...' : `${stats.totalAmount.toLocaleString('vi-VN')} VNĐ`, textColor: 'text-amber-500 dark:text-amber-400' },
          { label: 'Tổng tiền đã trả', value: loadingStats ? '...' : `${stats.totalPayout.toLocaleString('vi-VN')} VNĐ`, textColor: 'text-emerald-500 dark:text-emerald-400' },
          { label: 'Cược đang chờ', value: loadingStats ? '...' : stats.pending, textColor: stats.pending > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400' },
        ].map((s, i) => (
          <div key={i} className="rounded-sm border border-slate-200 bg-white py-6 px-7.5 shadow-default dark:border-slate-700 dark:bg-[#1c2434]">
            <h4 className={`text-title-md font-bold mb-1 ${s.textColor}`}>{s.value}</h4>
            <span className="text-sm font-medium text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-sm border border-slate-200 bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-slate-700 dark:bg-[#1c2434] sm:px-7.5 xl:pb-1 mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="relative z-20 bg-transparent w-full sm:w-auto min-w-[260px]">
            <span className="absolute top-1/2 left-4 -translate-y-1/2">
              <Search size={18} className="text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Tìm cuộc đua, ngựa, người dùng..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded border border-slate-300 bg-transparent py-2 pl-10 pr-4 outline-none focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800/50"
            />
          </div>

          <div className="relative z-20 bg-transparent w-full sm:w-auto min-w-[150px]">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="relative z-20 w-full appearance-none rounded border border-slate-300 bg-transparent py-2 px-4 outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800/50"
            >
              <option value="">Trạng thái: Tất cả</option>
              {['pending', 'won', 'lost', 'cancelled', 'refunded'].map(s => (
                <option key={s} value={s}>{BET_STATUS_LABEL[s as keyof typeof BET_STATUS_LABEL]}</option>
              ))}
            </select>
          </div>

          <div className="relative z-20 bg-transparent w-full sm:w-auto min-w-[220px]">
            <select
              value={filterRaceId}
              onChange={e => setFilterRaceId(e.target.value)}
              className="relative z-20 w-full appearance-none rounded border border-slate-300 bg-transparent py-2 px-4 outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800/50"
            >
              <option value="">Cuộc đua: Tất cả</option>
              {races.map(r => <option key={r._id} value={r._id}>{r.name} ({r.grade})</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-sm border border-slate-200 bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-slate-700 dark:bg-[#1c2434] sm:px-7.5 xl:pb-1">
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-slate-50 text-left dark:bg-slate-800">
                  <th className="min-w-[150px] py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700 xl:pl-6">Người cược</th>
                  <th className="min-w-[150px] py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Cuộc đua</th>
                  <th className="min-w-[120px] py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Ngựa</th>
                  <th className="min-w-[100px] py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Loại cược</th>
                  <th className="min-w-[100px] py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700 text-right">Tiền cược</th>
                  <th className="min-w-[80px] py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700 text-center">Hệ số</th>
                  <th className="min-w-[100px] py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700 text-center">Trạng thái</th>
                  <th className="min-w-[120px] py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700 text-right">Tiền thắng</th>
                  <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {filteredBets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-500">Không có dữ liệu</td>
                  </tr>
                ) : (
                  filteredBets.map((bet) => {
                    const spectator = bet.spectatorId as any;
                    const race = bet.raceId as any;
                    const horse = bet.horseId as any;
                    return (
                      <tr key={bet._id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-4 px-4 xl:pl-6">
                          <p className="font-medium text-black dark:text-white">{spectator?.fullName || '-'}</p>
                          <p className="text-sm text-slate-500">{spectator?.email}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-black dark:text-white">{race?.name || '-'}</p>
                          {race?.grade && (
                            <span className="inline-block mt-1 rounded bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              {race.grade}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium text-black dark:text-white">{horse?.name || '-'}</p>
                          <p className="text-sm text-slate-500">{horse?.currentGrade}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-block rounded-full border border-blue-500 text-blue-500 px-2.5 py-0.5 text-xs font-medium">
                            {BET_TYPE_LABEL[bet.betType as keyof typeof BET_TYPE_LABEL] || bet.betType}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="font-semibold text-black dark:text-white">{bet.amount.toLocaleString('vi-VN')} VNĐ</p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <p className="font-semibold text-amber-500">{bet.multiplier}x</p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(bet.status)}`}>
                            {BET_STATUS_LABEL[bet.status as keyof typeof BET_STATUS_LABEL] || bet.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {bet.status === 'won'
                            ? <p className="font-bold text-emerald-500">+{bet.payoutAmount?.toLocaleString('vi-VN')} VNĐ</p>
                            : <p className="text-slate-400">—</p>}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-500">
                          {fmtDateTime(bet.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 py-4 px-4 dark:border-slate-700 xl:px-6">
            <button 
              onClick={() => setPage(p => p - 1)} 
              disabled={page === 1}
              className="rounded bg-slate-100 py-1.5 px-3 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              ← Trước
            </button>
            <p className="text-sm text-slate-500">
              Trang {page} / {totalPages} <span className="hidden sm:inline">(tổng {total})</span>
            </p>
            <button 
              onClick={() => setPage(p => p + 1)} 
              disabled={page >= totalPages}
              className="rounded bg-slate-100 py-1.5 px-3 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      {/* Settle Dialog Modal */}
      {settleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl dark:bg-[#1c2434] border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-4 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-black dark:text-white">Quyết Toán Cược Theo Cuộc Đua</h3>
              <button onClick={() => setSettleDialog(false)} className="text-slate-400 hover:text-black dark:hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-slate-500 mb-4">
                Chọn cuộc đua đã kết thúc để quyết toán cược. Hệ thống tự động tính toán dựa trên kết quả cuộc đua.
              </p>
              
              <div className="mb-4">
                <label className="mb-2.5 block font-medium text-black dark:text-white">Chọn cuộc đua đã kết thúc</label>
                <div className="relative z-20 bg-transparent">
                  <select
                    value={settlingRaceId}
                    onChange={e => setSettlingRaceId(e.target.value)}
                    className="relative z-20 w-full appearance-none rounded border border-slate-300 bg-transparent py-3 px-5 outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800"
                  >
                    <option value="">-- Chọn cuộc đua --</option>
                    {races.filter(r => r.status === 'finished').map(r => (
                      <option key={r._id} value={r._id}>{r.name} ({r.grade})</option>
                    ))}
                  </select>
                </div>
                {races.filter(r => r.status === 'finished').length === 0 && (
                  <p className="mt-2 text-sm text-red-500">Chưa có cuộc đua nào kết thúc</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setSettleDialog(false)}
                disabled={settling}
                className="rounded-md border border-slate-300 py-2 px-5 text-center font-medium text-black hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleSettle}
                disabled={!settlingRaceId || settling}
                className="flex items-center justify-center rounded-md bg-emerald-500 py-2 px-5 text-center font-medium text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {settling ? (
                  <RefreshCw className="animate-spin mr-2" size={18} />
                ) : null}
                {settling ? 'Đang quyết toán...' : 'Quyết Toán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
