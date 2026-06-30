import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router';
import { Eye, DollarSign, Play, Zap, Trophy, RefreshCw, X, AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import { raceApi, type Race, type Registration } from '../../api/race';
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
  pending: 'bg-amber-50 text-amber-700 border border-amber-200', 
  won: 'bg-emerald-50 text-emerald-700 border border-emerald-200', 
  lost: 'bg-red-50 text-red-700 border border-red-200', 
  cancelled: 'bg-slate-50 text-slate-700 border border-slate-200', 
  refunded: 'bg-blue-50 text-blue-700 border border-blue-200' 
};
const STATUS_LABEL: Record<string, string> = { pending: 'Chờ', won: 'Thắng', lost: 'Thua', cancelled: 'Hủy', refunded: 'Hoàn' };

const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  open:      { label: 'Mở ĐK',    color: 'bg-blue-50 text-blue-700 border border-blue-200' },
  closed:    { label: 'Đóng ĐK',  color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  pre_check: { label: 'Chuẩn bị', color: 'bg-purple-50 text-purple-700 border border-purple-200' },
  running:   { label: 'Đang chạy',color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl', extraHeader = null }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex flex-1 items-center justify-between mr-4">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {extraHeader}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition rounded-md hover:bg-slate-200 p-1 shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 pb-2 bg-slate-50/30">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPublishing() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'sim' | 'finished'>('sim');

  const [finishedRaces, setFinishedRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishedSearch, setFinishedSearch] = useState('');

  const [simRaces, setSimRaces] = useState<Race[]>([]);
  const [loadingSim, setLoadingSim] = useState(true);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [raceBets, setRaceBets] = useState<BetSummary[]>([]);
  const [raceRegs, setRaceRegs] = useState<Registration[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [settling, setSettling] = useState(false);

  const [simPage, setSimPage] = useState(1);
  const SIM_PER_PAGE = 10;
  const simTotalPages = Math.ceil(simRaces.length / SIM_PER_PAGE);
  const pagedSimRaces = simRaces.slice((simPage - 1) * SIM_PER_PAGE, simPage * SIM_PER_PAGE);

  const [finPage, setFinPage] = useState(1);
  const FIN_PER_PAGE = 10;
  const filteredFinished = finishedSearch
    ? finishedRaces.filter(r =>
        r.name.toLowerCase().includes(finishedSearch.toLowerCase()) ||
        r.grade.toLowerCase().includes(finishedSearch.toLowerCase()) ||
        (typeof r.tournamentId === 'object' && r.tournamentId.name.toLowerCase().includes(finishedSearch.toLowerCase()))
      )
    : finishedRaces;
  const finTotalPages = Math.ceil(filteredFinished.length / FIN_PER_PAGE);
  const pagedFinished = filteredFinished.slice((finPage - 1) * FIN_PER_PAGE, finPage * FIN_PER_PAGE);

  const loadFinishedRaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await raceApi.list({ status: 'finished', limit: 100 });
      const sorted = [...res.races].sort(
        (a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()
      );
      setFinishedRaces(sorted);
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

  useEffect(() => {
    const openRaceId = (location.state as any)?.openRaceId;
    if (!openRaceId || loading) return;
    const race = finishedRaces.find(r => r._id === openRaceId);
    if (race) {
      setActiveTab('finished');
      handleViewDetails(race);
    }
  }, [finishedRaces, loading, location.state]);

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

  const [betPage, setBetPage] = useState(1);
  const BETS_PER_PAGE = 10;
  const betTotalPages = Math.ceil(raceBets.length / BETS_PER_PAGE);
  const pagedBets = raceBets.slice((betPage - 1) * BETS_PER_PAGE, betPage * BETS_PER_PAGE);

  const openDetail = (race: Race) => {
    setBetPage(1);
    handleViewDetails(race);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-6">
      {/* Header & Tabs */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kết quả &amp; Quyết toán</h1>
          <p className="text-sm text-slate-500 mt-1">Mô phỏng chặng đua và quyết toán tiền cược</p>
        </div>
        <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('sim')}
            className={`flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold transition-all ${
              activeTab === 'sim'
                ? 'bg-white text-blue-700 shadow border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Zap size={16} className={activeTab === 'sim' ? 'text-blue-600' : ''} />
            Chờ Mô phỏng
            {simRaces.length > 0 && (
              <span className={`ml-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${activeTab === 'sim' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                {simRaces.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('finished')}
            className={`flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold transition-all ${
              activeTab === 'finished'
                ? 'bg-white text-blue-700 shadow border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Trophy size={16} className={activeTab === 'finished' ? 'text-amber-500' : ''} />
            Đã kết thúc
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        {/* ── TAB: SIM ── */}
        {activeTab === 'sim' && (
          <div className="flex flex-col flex-1 h-full">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <Zap size={16} className="text-amber-500" /> Danh sách chặng đua chờ mô phỏng
              </h3>
              <button
                onClick={loadSimRaces}
                disabled={loadingSim}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white py-1.5 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50 uppercase tracking-wider"
              >
                <RefreshCw size={14} className={loadingSim ? 'animate-spin' : ''} />
                Làm mới
              </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                  <tr>
                    <th className="py-3 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200">Chặng đua</th>
                    <th className="py-3 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200">Thông số</th>
                    <th className="py-3 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 text-right">Thưởng</th>
                    <th className="py-3 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 text-center">Trạng thái</th>
                    <th className="py-3 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingSim ? (
                    <tr><td colSpan={5} className="text-center py-12"><RefreshCw className="animate-spin text-slate-400 mx-auto" size={24} /></td></tr>
                  ) : simRaces.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16">
                        <div className="mx-auto h-12 w-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-3">
                          <Zap className="text-slate-300" size={24} />
                        </div>
                        <p className="text-slate-500 font-medium text-sm">Không có chặng đua nào đang chờ mô phỏng</p>
                      </td>
                    </tr>
                  ) : pagedSimRaces.map(race => {
                    const badge = STATUS_BADGE[race.status] ?? { label: race.status, color: 'bg-slate-100 text-slate-600' };
                    const isRunning = simulatingId === race._id;
                    const tournamentName = typeof race.tournamentId === 'object' ? race.tournamentId.name : '-';
                    return (
                      <tr key={race._id} className="hover:bg-slate-50/50 bg-white transition-colors group">
                        <td className="py-3 px-5">
                          <p className="font-bold text-slate-900 text-[14px] mb-0.5">{race.name}</p>
                          <p className="text-[11px] font-medium text-slate-500 truncate max-w-[250px]">{tournamentName}</p>
                        </td>
                        <td className="py-3 px-5">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">{race.grade}</span>
                            <span className="inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">{race.distance}m</span>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-right font-bold text-emerald-600 text-[13px]">
                          {race.purse.toLocaleString('vi-VN')} $
                        </td>
                        <td className="py-3 px-5 text-center">
                          <span className={`inline-block rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <div className="flex items-center justify-end">
                            <button
                              disabled={isRunning || race.status === 'running'}
                              onClick={() => handleForceSimulate(race)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition shadow-sm border ${
                                race.status === 'running'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed'
                                  : isRunning
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 cursor-wait'
                                  : 'bg-white text-slate-700 border-slate-200 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200'
                              }`}
                            >
                              {race.status === 'running' ? (
                                <><RefreshCw className="animate-spin" size={14} /> Đang chạy...</>
                              ) : isRunning ? (
                                <><RefreshCw className="animate-spin" size={14} /> Đang khởi động</>
                              ) : (
                                <><Play fill="currentColor" size={12} /> Chạy Mô Phỏng</>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {simTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
                <p className="text-xs font-medium text-slate-500">
                  Trang <span className="font-bold text-slate-900">{simPage}</span> / {simTotalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setSimPage(p => p - 1)} disabled={simPage === 1} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"><ChevronLeft size={14} /></button>
                  {Array.from({ length: Math.min(5, simTotalPages) }, (_, i) => {
                    let p = i + 1;
                    if (simTotalPages > 5) {
                      if (simPage <= 3) p = i + 1;
                      else if (simPage >= simTotalPages - 2) p = simTotalPages - 4 + i;
                      else p = simPage - 2 + i;
                    }
                    return <button key={p} onClick={() => setSimPage(p)} className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition shadow-sm ${simPage === p ? 'bg-blue-600 text-white border-blue-600' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{p}</button>;
                  })}
                  <button onClick={() => setSimPage(p => p + 1)} disabled={simPage >= simTotalPages} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: FINISHED ── */}
        {activeTab === 'finished' && (
          <div className="flex flex-col flex-1 h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4 gap-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <Trophy size={16} className="text-amber-500" /> Danh sách chặng đua đã kết thúc
                {finishedRaces.length > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 ml-1">{finishedRaces.length}</span>
                )}
              </h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm chặng đua..."
                    value={finishedSearch}
                    onChange={e => { setFinishedSearch(e.target.value); setFinPage(1); }}
                    className="w-full sm:w-56 rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition"
                  />
                </div>
                <button
                  onClick={loadFinishedRaces}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white py-1.5 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50 uppercase tracking-wider"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  Làm mới
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                  <tr>
                    <th className="py-3 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200">Chặng đua</th>
                    <th className="py-3 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200">Thời gian</th>
                    <th className="py-3 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 text-right">Thưởng</th>
                    <th className="py-3 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 text-center">Trạng thái</th>
                    <th className="py-3 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-12"><RefreshCw className="animate-spin text-slate-400 mx-auto" size={24} /></td></tr>
                  ) : filteredFinished.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16">
                        <div className="mx-auto h-12 w-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-3">
                          <Trophy className="text-slate-300" size={24} />
                        </div>
                        <p className="text-slate-500 font-medium text-sm">Không tìm thấy chặng đua phù hợp</p>
                      </td>
                    </tr>
                  ) : pagedFinished.map(race => {
                    const tName = typeof race.tournamentId === 'object' ? race.tournamentId.name : '-';
                    return (
                      <tr key={race._id} className="hover:bg-slate-50/50 bg-white transition-colors group">
                        <td className="py-3 px-5">
                          <p className="font-bold text-slate-900 text-[14px] mb-0.5">{race.name}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block rounded border border-slate-200 bg-slate-50 px-1.5 py-0 text-[10px] font-bold text-slate-600 uppercase">{race.grade}</span>
                            <p className="text-[11px] font-medium text-slate-500 truncate max-w-[200px]">{tName}</p>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-slate-600 text-[13px] font-medium">{fmtDateTime(race.scheduledTime)}</td>
                        <td className="py-3 px-5 text-right font-bold text-emerald-600 text-[13px]">{race.purse?.toLocaleString('vi-VN')} $</td>
                        <td className="py-3 px-5 text-center">
                          <span className="inline-block rounded bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 shadow-sm">
                            Đã kết thúc
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => openDetail(race)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition shadow-sm bg-white text-slate-600 border border-slate-200 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye size={14} /> Kết quả
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {finTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
                <p className="text-xs font-medium text-slate-500">
                  Trang <span className="font-bold text-slate-900">{finPage}</span> / {finTotalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setFinPage(p => p - 1)} disabled={finPage === 1} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"><ChevronLeft size={14} /></button>
                  {Array.from({ length: Math.min(5, finTotalPages) }, (_, i) => {
                    let p = i + 1;
                    if (finTotalPages > 5) {
                      if (finPage <= 3) p = i + 1;
                      else if (finPage >= finTotalPages - 2) p = finTotalPages - 4 + i;
                      else p = finPage - 2 + i;
                    }
                    return <button key={p} onClick={() => setFinPage(p)} className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition shadow-sm ${finPage === p ? 'bg-blue-600 text-white border-blue-600' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{p}</button>;
                  })}
                  <button onClick={() => setFinPage(p => p + 1)} disabled={finPage >= finTotalPages} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selectedRace?.name}
        maxWidth="max-w-5xl"
        extraHeader={
          pendingBets > 0 ? (
            <button
              onClick={handleSettleBets}
              disabled={settling}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 py-1.5 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow ml-4"
            >
              {settling ? <RefreshCw className="animate-spin" size={16} /> : <DollarSign size={16} />}
              Quyết toán TOÀN BỘ ({pendingBets} cược)
            </button>
          ) : (
            <span className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 py-1.5 px-4 text-sm font-bold shadow-sm ml-4">
              <Trophy size={16} /> Đã quyết toán xong
            </span>
          )
        }
      >
        {loadingDetail ? (
          <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-slate-400" size={32} /></div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-slate-800 mb-1">{raceBets.length}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Cược</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-slate-800 mb-1">{totalBetAmount.toLocaleString('vi-VN')} $</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Tiền Cược</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-emerald-600 mb-1">{totalPayout.toLocaleString('vi-VN')} $</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiền Đã Trả</p>
              </div>
              <div className={`rounded-xl border p-4 text-center shadow-sm ${pendingBets > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-2xl font-bold mb-1 ${pendingBets > 0 ? 'text-amber-700' : 'text-slate-500'}`}>{pendingBets}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cược Chờ QT</p>
              </div>
            </div>

            {pendingBets > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
                <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-500" />
                <p className="text-[13px] font-medium">Có <strong>{pendingBets}</strong> cược chưa được quyết toán. Bấm nút "Quyết toán TOÀN BỘ" ở góc trên để xử lý.</p>
              </div>
            )}

            {/* Registrations */}
            {raceRegs.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                  <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider">Ngựa Tham Gia</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto text-sm">
                    <thead>
                      <tr className="bg-white text-left border-b border-slate-200">
                        <th className="py-2.5 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider">Ngựa</th>
                        <th className="py-2.5 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider">Jockey</th>
                        <th className="py-2.5 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {raceRegs.map(reg => (
                        <tr key={reg._id} className="bg-white">
                          <td className="py-2.5 px-5 font-semibold text-slate-900 text-[13px]">{typeof reg.horseId === 'object' ? reg.horseId.name : '-'}</td>
                          <td className="py-2.5 px-5 text-slate-600 text-[13px] font-medium">{typeof reg.jockeyId === 'object' && reg.jockeyId ? reg.jockeyId.fullName : 'N/A'}</td>
                          <td className="py-2.5 px-5 text-center">
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${reg.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
                              {reg.status === 'active' ? 'Hợp lệ' : 'Đã hủy'}
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
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider">Chi tiết Cược ({raceBets.length})</h4>
              </div>
              {raceBets.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-medium text-slate-500">Không có lượt cược nào cho chặng đua này</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto text-sm">
                      <thead>
                        <tr className="bg-white text-left border-b border-slate-200">
                          <th className="py-2.5 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider">Người Cược</th>
                          <th className="py-2.5 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider">Ngựa</th>
                          <th className="py-2.5 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider">Loại</th>
                          <th className="py-2.5 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider text-right">Số Tiền</th>
                          <th className="py-2.5 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider text-right">Hệ Số</th>
                          <th className="py-2.5 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider text-center">Trạng Thái</th>
                          <th className="py-2.5 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider text-right">Tiền Nhận</th>
                          <th className="py-2.5 px-5 font-bold text-slate-400 text-[11px] uppercase tracking-wider text-right">Thời Gian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pagedBets.map(bet => (
                          <tr key={bet._id} className="hover:bg-slate-50/50 bg-white">
                            <td className="py-2.5 px-5 font-semibold text-slate-900 text-[13px]">{typeof bet.spectatorId === 'object' ? bet.spectatorId.fullName : '-'}</td>
                            <td className="py-2.5 px-5 text-slate-700 text-[13px] font-medium">{typeof bet.horseId === 'object' ? bet.horseId.name : '-'}</td>
                            <td className="py-2.5 px-5">
                              <span className="inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm">{BET_TYPE_LABEL[bet.betType] || bet.betType}</span>
                            </td>
                            <td className="py-2.5 px-5 font-bold text-slate-800 text-[13px] text-right">{bet.amount.toLocaleString('vi-VN')} $</td>
                            <td className="py-2.5 px-5 text-slate-600 text-[13px] font-medium text-right">{bet.multiplier}x</td>
                            <td className="py-2.5 px-5 text-center">
                              <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[bet.status] || ''}`}>{STATUS_LABEL[bet.status] || bet.status}</span>
                            </td>
                            <td className="py-2.5 px-5 text-right text-[13px]">
                              {bet.status === 'won' ? (
                                <span className="font-bold text-emerald-600">{bet.payoutAmount?.toLocaleString('vi-VN')} $</span>
                              ) : (
                                <span className="text-slate-400 font-medium">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-5 text-[11px] font-medium text-slate-500 text-right">{fmtDateTime(bet.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {betTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
                      <p className="text-xs font-medium text-slate-500">Trang <span className="font-bold text-slate-900">{betPage}</span> / {betTotalPages}</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setBetPage(p => p - 1)} disabled={betPage === 1} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"><ChevronLeft size={14} /></button>
                        {Array.from({ length: Math.min(5, betTotalPages) }, (_, i) => {
                          let p = i + 1;
                          if (betTotalPages > 5) {
                            if (betPage <= 3) p = i + 1;
                            else if (betPage >= betTotalPages - 2) p = betTotalPages - 4 + i;
                            else p = betPage - 2 + i;
                          }
                          return <button key={p} onClick={() => setBetPage(p)} className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition shadow-sm ${betPage === p ? 'bg-blue-600 text-white border-blue-600' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{p}</button>;
                        })}
                        <button onClick={() => setBetPage(p => p + 1)} disabled={betPage >= betTotalPages} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"><ChevronRight size={14} /></button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 -mx-6 mt-6 rounded-b-xl">
          <button onClick={() => setDetailOpen(false)} className="rounded-md border border-slate-300 bg-white py-2 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
            Đóng
          </button>
        </div>
      </Modal>
    </div>
  );
}
