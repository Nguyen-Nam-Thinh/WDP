import { useState, useEffect, useCallback } from 'react';
import { Eye, DollarSign, Play, Zap, Trophy, RefreshCw, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { raceApi, type Race, type Registration } from '../../api/race';

// Admin-level bet API (re-use the pattern)
import { apiRequest } from '../../api/client';

interface BetSummary {
  _id: string;
  spectatorId: { _id: string; fullName: string; email: string };
  horseId: { _id: string; name: string };
  betType: 'win' | 'place' | 'show';
  amount: number;
  multiplier: number;
  status: string;
  payoutAmount: number;
  createdAt: string;
}

const BET_TYPE_LABEL: Record<string, string> = { win: 'Thắng', place: 'Hạng 2', show: 'Hạng 3' };
const STATUS_COLOR: Record<string, string> = { 
  pending: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', 
  won: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', 
  lost: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', 
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', 
  refunded: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
};
const STATUS_LABEL: Record<string, string> = { pending: 'Chờ', won: 'Thắng', lost: 'Thua', cancelled: 'Hủy', refunded: 'Hoàn' };

const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  open:      { label: 'Mở ĐK',    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  closed:    { label: 'Đóng ĐK',  color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  pre_check: { label: 'Chuẩn bị', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  running:   { label: 'Đang chạy',color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

// ── Shared Modal Wrapper ───────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl', extraHeader = null }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-xl bg-white shadow-2xl dark:bg-[#1c2434] border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex flex-1 items-center justify-between mr-4">
            <h3 className="text-xl font-semibold text-black dark:text-white">{title}</h3>
            {extraHeader}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-black dark:hover:text-white transition shrink-0">
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPublishing() {
  const [finishedRaces, setFinishedRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Simulatable races (not finished/cancelled) ──
  const [simRaces, setSimRaces] = useState<Race[]>([]);
  const [loadingSim, setLoadingSim] = useState(true);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [raceBets, setRaceBets] = useState<BetSummary[]>([]);
  const [raceRegs, setRaceRegs] = useState<Registration[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [settling, setSettling] = useState(false);

  // Pagination for sim races
  const [simPage, setSimPage] = useState(1);
  const SIM_PER_PAGE = 8;
  const simTotalPages = Math.ceil(simRaces.length / SIM_PER_PAGE);
  const pagedSimRaces = simRaces.slice((simPage - 1) * SIM_PER_PAGE, simPage * SIM_PER_PAGE);

  const loadFinishedRaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await raceApi.list({ status: 'finished', limit: 50 });
      setFinishedRaces(res.races);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSimRaces = useCallback(async () => {
    setLoadingSim(true);
    try {
      const [openRes, closedRes, preRes, runRes] = await Promise.all([
        raceApi.list({ status: 'open',      limit: 20 }),
        raceApi.list({ status: 'closed',    limit: 20 }),
        raceApi.list({ status: 'pre_check', limit: 20 }),
        raceApi.list({ status: 'running',   limit: 20 }),
      ]);
      setSimRaces([
        ...openRes.races,
        ...closedRes.races,
        ...preRes.races,
        ...runRes.races,
      ]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingSim(false);
    }
  }, []);

  const handleForceSimulate = async (race: Race) => {
    setSimulatingId(race._id);
    try {
      await raceApi.forceSimulate(race._id);
      toast.success(`Mô phỏng cuộc đua "${race.name}" đã bắt đầu`);
      loadSimRaces();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSimulatingId(null);
    }
  };

  useEffect(() => {
    loadFinishedRaces();
    loadSimRaces();
  }, [loadFinishedRaces, loadSimRaces]);

  const handleViewDetails = async (race: Race) => {
    setSelectedRace(race);
    setDetailOpen(true);
    setLoadingDetail(true);
    try {
      const [betsRes, regsRes] = await Promise.all([
        apiRequest<{ bets: BetSummary[]; total: number }>(`/bets/race/${race._id}?limit=100`),
        raceApi.getRegistrations(race._id),
      ]);
      setRaceBets(betsRes.bets ?? []);
      setRaceRegs(regsRes.registrations ?? []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSettleBets = async () => {
    if (!selectedRace) return;
    setSettling(true);
    try {
      const result = await apiRequest<{ settled: number; won: number; lost: number }>(
        `/bets/race/${selectedRace._id}/settle`,
        { method: 'POST' },
      );
      toast.success(`Đã quyết toán ${result.settled} cược: ${result.won} thắng, ${result.lost} thua`);
      // Reload bets
      const betsRes = await apiRequest<{ bets: BetSummary[]; total: number }>(`/bets/race/${selectedRace._id}?limit=100`);
      setRaceBets(betsRes.bets ?? []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSettling(false);
    }
  };

  const pendingBets = raceBets.filter(b => b.status === 'pending').length;
  const totalBetAmount = raceBets.reduce((s, b) => s + b.amount, 0);
  const totalPayout = raceBets.filter(b => b.status === 'won').reduce((s, b) => s + b.payoutAmount, 0);

  return (
    <>
      {/* ── Force Simulate Section ── */}
      <div className="mb-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-title-md2 font-semibold text-black dark:text-white flex items-center gap-2">
              <Zap className="text-amber-500" />
              Chạy Mô Phỏng Cuộc Đua
            </h2>
            <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              {simRaces.length} cuộc đua
            </span>
          </div>
          <button
            onClick={loadSimRaces}
            disabled={loadingSim}
            className="inline-flex items-center justify-center gap-2.5 rounded-md border border-slate-300 bg-white py-2 px-4 text-center font-medium text-black hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loadingSim ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        {loadingSim ? (
          <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-blue-500" size={32} /></div>
        ) : simRaces.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-slate-500 dark:text-slate-400">Không có cuộc đua nào đang chờ mô phỏng</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pagedSimRaces.map(race => {
                const badge = STATUS_BADGE[race.status] ?? { label: race.status, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' };
                const isRunning = simulatingId === race._id;
                const tournamentName = typeof race.tournamentId === 'object' ? race.tournamentId.name : '';
                
                return (
                  <div key={race._id} className={`rounded-xl border bg-white p-5 shadow-sm transition dark:bg-[#243045] ${race.status === 'running' ? 'border-emerald-500 dark:border-emerald-500 shadow-emerald-500/10' : 'border-slate-200 dark:border-slate-700 hover:shadow-md'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-lg font-bold text-black dark:text-white line-clamp-2 leading-tight pr-2">{race.name}</h4>
                      <span className={`shrink-0 inline-block rounded px-2 py-0.5 text-[10px] font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    {tournamentName && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 truncate">{tournamentName}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className="inline-block rounded border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {race.grade}
                      </span>
                      <span className="inline-block rounded border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {race.distance}m
                      </span>
                      <span className="inline-block rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400">
                        {race.purse.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>

                    <button
                      disabled={isRunning || race.status === 'running'}
                      onClick={() => handleForceSimulate(race)}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 font-medium text-white transition disabled:opacity-80 ${
                        race.status === 'running'
                          ? 'bg-emerald-500 cursor-not-allowed'
                          : isRunning
                          ? 'bg-amber-500 opacity-80 cursor-wait'
                          : 'bg-amber-500 hover:bg-amber-600'
                      }`}
                    >
                      {race.status === 'running' ? (
                        <>
                          <RefreshCw className="animate-spin" size={18} /> Đang chạy...
                        </>
                      ) : isRunning ? (
                        <>
                          <RefreshCw className="animate-spin" size={18} /> Đang khởi động
                        </>
                      ) : (
                        <>
                          <Play fill="currentColor" size={16} /> Chạy Mô Phỏng
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            {/* Pagination for sim races */}
            {simTotalPages > 1 && (
              <div className="flex items-center justify-between pt-5 mt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setSimPage(p => Math.max(1, p - 1))}
                  disabled={simPage === 1}
                  className="flex items-center gap-1.5 rounded bg-slate-100 py-1.5 px-3 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                >
                  <ChevronLeft size={15} /> Trước
                </button>
                <span className="text-sm text-slate-500">Trang {simPage} / {simTotalPages} <span className="text-xs text-slate-400">(tổng {simRaces.length} cuộc đua)</span></span>
                <button
                  onClick={() => setSimPage(p => Math.min(simTotalPages, p + 1))}
                  disabled={simPage >= simTotalPages}
                  className="flex items-center gap-1.5 rounded bg-slate-100 py-1.5 px-3 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                >
                  Sau <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Results Section ── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white flex items-center gap-2">
          Kết Quả & Quyết Toán Cược
        </h2>
        <button
          onClick={loadFinishedRaces}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2.5 rounded-md border border-slate-300 bg-white py-2 px-4 text-center font-medium text-black hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-blue-500" size={32} /></div>
      ) : finishedRaces.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm dark:border-slate-700 dark:bg-[#1c2434]">
          <Trophy className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-lg">Chưa có cuộc đua nào kết thúc</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {finishedRaces.map(race => {
            const tName = typeof race.tournamentId === 'object' ? race.tournamentId.name : '-';
            return (
              <div key={race._id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-[#243045]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-black dark:text-white mb-1">{race.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{tName}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-block rounded border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {race.grade}
                      </span>
                      <span className="inline-block rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Đã kết thúc
                      </span>
                    </div>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-500 dark:bg-amber-900/20 dark:text-amber-400 shrink-0">
                    <Trophy size={28} />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 mb-6">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    📅 {fmtDateTime(race.scheduledTime)}
                  </p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    💰 Giải thưởng: <span className="text-emerald-600 dark:text-emerald-400">{race.purse?.toLocaleString('vi-VN')} VNĐ</span>
                  </p>
                </div>
                
                <button 
                  onClick={() => handleViewDetails(race)} 
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-black hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:hover:border-blue-500 dark:hover:text-blue-400"
                >
                  <Eye size={18} /> Xem kết quả & cược
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog Modal */}
      <Modal 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        title={selectedRace?.name} 
        maxWidth="max-w-5xl"
        extraHeader={
          pendingBets > 0 && (
            <button
              onClick={handleSettleBets}
              disabled={settling}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 py-2 px-4 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition shadow-sm"
            >
              {settling ? <RefreshCw className="animate-spin" size={16} /> : <DollarSign size={16} />}
              Quyết Toán {pendingBets} Cược Chờ
            </button>
          )
        }
      >
        {loadingDetail ? (
          <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-blue-500" size={32} /></div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Bet Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{raceBets.length}</p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng Cược</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-2xl font-bold text-amber-500 dark:text-amber-400 mb-1">{totalBetAmount.toLocaleString('vi-VN')} VNĐ</p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng Tiền Cược</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400 mb-1">{totalPayout.toLocaleString('vi-VN')} VNĐ</p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tiền Đã Trả</p>
              </div>
              <div className={`rounded-lg border border-slate-200 p-4 text-center dark:border-slate-700 ${pendingBets > 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                <p className={`text-2xl font-bold mb-1 ${pendingBets > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>{pendingBets}</p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cược Chờ QT</p>
              </div>
            </div>

            {pendingBets > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
                <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-500" />
                <p className="text-sm">Có <strong>{pendingBets}</strong> cược chưa được quyết toán. Bạn có thể tự động quyết toán bằng nút ở góc trên.</p>
              </div>
            )}

            {/* Registrations */}
            {raceRegs.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-black dark:text-white mb-3">Ngựa Tham Gia Cuộc Đua</h4>
                <div className="max-w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full table-auto text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left dark:bg-slate-800">
                        <th className="py-3 px-4 font-semibold text-black dark:text-white">Ngựa</th>
                        <th className="py-3 px-4 font-semibold text-black dark:text-white">Jockey</th>
                        <th className="py-3 px-4 font-semibold text-black dark:text-white">Kết quả KT</th>
                        <th className="py-3 px-4 font-semibold text-black dark:text-white">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {raceRegs.map(reg => (
                        <tr key={reg._id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-4 font-medium text-black dark:text-white">
                            {typeof reg.horseId === 'object' ? reg.horseId.name : '-'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                            {typeof reg.jockeyId === 'object' && reg.jockeyId ? reg.jockeyId.fullName : 'N/A'}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              reg.preCheckResult?.status === 'passed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                              reg.preCheckResult?.status === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {reg.preCheckResult?.status === 'passed' ? 'Đạt' : reg.preCheckResult?.status === 'failed' ? 'Loại' : 'Chờ'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              reg.status === 'active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {reg.status === 'active' ? 'Đang HĐ' : 'Đã hủy/DQ'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bets */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-black dark:text-white">Danh Sách Cược ({raceBets.length})</h4>
              </div>
              {raceBets.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
                  <p className="text-slate-500 dark:text-slate-400">Không có cược nào cho cuộc đua này</p>
                </div>
              ) : (
                <div className="max-w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full table-auto text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left dark:bg-slate-800">
                        <th className="py-3 px-4 font-semibold text-black dark:text-white">Người Cược</th>
                        <th className="py-3 px-4 font-semibold text-black dark:text-white">Ngựa</th>
                        <th className="py-3 px-4 font-semibold text-black dark:text-white">Loại</th>
                        <th className="py-3 px-4 font-semibold text-black dark:text-white">Số Tiền</th>
                        <th className="py-3 px-4 font-semibold text-black dark:text-white">Hệ Số</th>
                        <th className="py-3 px-4 font-semibold text-black dark:text-white">Trạng Thái</th>
                        <th className="py-3 px-4 font-semibold text-black dark:text-white">Tiền Nhận</th>
                        <th className="py-3 px-4 font-semibold text-black dark:text-white">Thời Gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {raceBets.map(bet => (
                        <tr key={bet._id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-4 font-medium text-black dark:text-white">
                            {typeof bet.spectatorId === 'object' ? bet.spectatorId.fullName : '-'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                            {typeof bet.horseId === 'object' ? bet.horseId.name : '-'}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="inline-block rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {BET_TYPE_LABEL[bet.betType] || bet.betType}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-black dark:text-white">{bet.amount.toLocaleString('vi-VN')} VNĐ</td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{bet.multiplier}x</td>
                          <td className="py-2.5 px-4">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[bet.status] || ''}`}>
                              {STATUS_LABEL[bet.status] || bet.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            {bet.status === 'won' ? (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{bet.payoutAmount?.toLocaleString('vi-VN')} VNĐ</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-500">{fmtDateTime(bet.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
