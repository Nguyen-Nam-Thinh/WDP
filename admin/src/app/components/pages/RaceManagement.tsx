import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, RefreshCw, Dog, ChevronLeft, ChevronRight, Filter, Eye, MoreHorizontal, FileText, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { raceApi, type Race, type Registration } from '../../api/race';
import { tournamentApi, type Tournament } from '../../api/tournament';

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-blue-50 text-blue-700 border border-blue-200',
  closed: 'bg-amber-50 text-amber-700 border border-amber-200',
  pre_check: 'bg-amber-50 text-amber-700 border border-amber-200',
  running: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  finished: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Mở ĐK', closed: 'Đóng ĐK', pre_check: 'Kiểm tra',
  running: 'Đang đua', finished: 'Kết thúc', cancelled: 'Đã hủy',
};

const REG_STATUS_COLOR: Record<string, string> = { 
  active: 'bg-emerald-50 text-emerald-700 border border-emerald-200', 
  cancelled: 'bg-slate-50 text-slate-700 border border-slate-200', 
  disqualified: 'bg-red-50 text-red-700 border border-red-200' 
};
const REG_STATUS_LABEL: Record<string, string> = { active: 'Hợp lệ', cancelled: 'Đã hủy', disqualified: 'Bị loại' };

const PRECHECK_COLOR: Record<string, string> = { 
  pending: 'bg-slate-50 text-slate-600 border border-slate-200', 
  passed: 'bg-emerald-50 text-emerald-700 border border-emerald-200', 
  failed: 'bg-red-50 text-red-700 border border-red-200' 
};
const PRECHECK_LABEL: Record<string, string> = { pending: 'Chờ', passed: 'Đạt', failed: 'Không đạt' };

// ── Shared Modal Wrapper ───────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition rounded-md hover:bg-slate-200 p-1 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 pb-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Shared Action Menu ───────────────────────────────────────────────────────
function ActionMenu({ race, onOpenDetails }: { race: Race; onOpenDetails: (r: Race) => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
      >
        <MoreHorizontal size={18} />
      </button>
      
      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-lg bg-white shadow-lg border border-slate-200 py-1 z-20">
          <button
            onClick={() => { setOpen(false); onOpenDetails(race); }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            <Eye size={15} className="text-blue-500" />
            Xem Chi tiết & Đăng ký
          </button>
        </div>
      )}
    </div>
  );
}

export default function RaceManagement() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filterTournament, setFilterTournament] = useState('');
  const [search, setSearch] = useState('');
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Pagination
  const [racePage, setRacePage] = useState(1);
  const RACES_PER_PAGE = 10;

  const loadTournaments = useCallback(async () => {
    try {
      const res = await tournamentApi.list(1, 100);
      setTournaments(res.tournaments);
    } catch (err: any) {
      toast.error(err.message);
    }
  }, []);

  const loadRaces = useCallback(async () => {
    setLoadingRaces(true);
    try {
      const res = await raceApi.list({ tournamentId: filterTournament || undefined, limit: 100 });
      setRaces(res.races);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingRaces(false);
    }
  }, [filterTournament]);

  const loadRegistrations = useCallback(async (raceId: string) => {
    setLoadingRegs(true);
    try {
      const res = await raceApi.getRegistrations(raceId);
      setRegistrations(res.registrations);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingRegs(false);
    }
  }, []);

  useEffect(() => { loadTournaments(); }, [loadTournaments]);
  useEffect(() => { loadRaces(); }, [loadRaces]);

  const handleOpenDetails = (race: Race) => {
    setSelectedRace(race);
    setDetailsOpen(true);
    loadRegistrations(race._id);
  };

  const filteredRaces = races.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (typeof r.tournamentId === 'object' && r.tournamentId.name.toLowerCase().includes(search.toLowerCase()))
  );

  const raceTotalPages = Math.ceil(filteredRaces.length / RACES_PER_PAGE);
  const pagedRaces = filteredRaces.slice((racePage - 1) * RACES_PER_PAGE, racePage * RACES_PER_PAGE);

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Chặng đua</h2>
          <p className="text-sm text-slate-500 mt-1">Quản lý danh sách ngựa tham gia từng chặng đua trong hệ thống.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadRaces}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white py-2 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw size={16} className={loadingRaces ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col min-h-[500px]">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50/50 px-5 py-4">
          <div className="relative flex-1 min-w-[250px] max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm chặng đua..."
              value={search}
              onChange={e => { setSearch(e.target.value); setRacePage(1); }}
              className="w-full rounded-lg border-2 border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-0 shadow-sm transition-all hover:border-slate-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500 shrink-0 ml-2" />
            <select
              value={filterTournament}
              onChange={e => { setFilterTournament(e.target.value); setRacePage(1); }}
              className="rounded-lg border-2 border-slate-200 bg-white py-2.5 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 shadow-sm min-w-[200px] transition-all hover:border-slate-300 cursor-pointer"
            >
              <option value="">Tất cả giải đấu</option>
              {tournaments.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>

          <span className="ml-auto text-xs font-bold text-slate-400 uppercase tracking-wider">
            {filteredRaces.length} Kết quả
          </span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/20">
          {loadingRaces ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="animate-spin text-slate-300" size={32} />
            </div>
          ) : pagedRaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                <FileText size={32} className="text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-slate-600 font-semibold mb-1">Không có dữ liệu chặng đua</p>
                <p className="text-sm text-slate-400 font-medium">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-100 shadow-sm z-10 border-b-2 border-slate-200">
                <tr>
                  <th className="py-4 px-5 text-[13px] font-extrabold uppercase tracking-wider text-slate-700">Tên Chặng Đua</th>
                  <th className="py-4 px-5 text-[13px] font-extrabold uppercase tracking-wider text-slate-700">Giải Đấu</th>
                  <th className="py-4 px-5 text-[13px] font-extrabold uppercase tracking-wider text-slate-700">Hạng / Cự ly</th>
                  <th className="py-4 px-5 text-[13px] font-extrabold uppercase tracking-wider text-slate-700">Thưởng</th>
                  <th className="py-4 px-5 text-[13px] font-extrabold uppercase tracking-wider text-slate-700 text-center">Trạng Thái</th>
                  <th className="py-4 px-5 text-[13px] font-extrabold uppercase tracking-wider text-slate-700 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedRaces.map((race) => {
                  return (
                    <tr key={race._id} className="hover:bg-slate-50/50 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 group bg-white cursor-pointer">
                      <td className="py-3 px-5">
                        <p className="font-semibold text-slate-900 text-[13px]">{race.name}</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">Thời gian: {race.scheduledTime ? new Date(race.scheduledTime).toLocaleString('vi-VN') : '-'}</p>
                      </td>
                      <td className="py-3 px-5">
                        <p className="font-semibold text-slate-700 text-[13px]">{typeof race.tournamentId === 'object' ? race.tournamentId.name : '-'}</p>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <span className="inline-block rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm">
                            {race.grade}
                          </span>
                          <span className="text-[12px] font-medium text-slate-600">{race.distance}m</span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <p className="font-bold text-emerald-600 text-[13px]">{race.purse?.toLocaleString('vi-VN')}</p>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm ${STATUS_COLOR[race.status] || 'bg-slate-50 border border-slate-200 text-slate-600'}`}>
                          {STATUS_LABEL[race.status]}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center justify-end">
                          <button onClick={() => handleOpenDetails(race)} className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition shadow-sm bg-white">
                            <Eye size={12} /> Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {raceTotalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
            <p className="text-xs font-medium text-slate-500">
              Trang <span className="font-bold text-slate-900">{racePage}</span> / {raceTotalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRacePage(p => p - 1)}
                disabled={racePage === 1}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, raceTotalPages) }, (_, i) => {
                let p = i + 1;
                if (raceTotalPages > 5) {
                  if (racePage <= 3) p = i + 1;
                  else if (racePage >= raceTotalPages - 2) p = raceTotalPages - 4 + i;
                  else p = racePage - 2 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setRacePage(p)}
                    className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition shadow-sm ${
                      racePage === p
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setRacePage(p => p + 1)}
                disabled={racePage >= raceTotalPages}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Race Details & Registrations Modal ── */}
      <Modal 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        title={selectedRace?.name}
        maxWidth="max-w-5xl"
      >
        {selectedRace && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-600 shadow-sm">
                {selectedRace.grade}
              </span>
              <span className={`inline-flex items-center rounded px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${STATUS_COLOR[selectedRace.status] || ''}`}>
                {STATUS_LABEL[selectedRace.status]}
              </span>
              <p className="text-sm text-slate-500 font-medium ml-2 border-l border-slate-200 pl-4">Thuộc giải: {typeof selectedRace.tournamentId === 'object' ? selectedRace.tournamentId.name : '-'}</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 rounded-lg p-4 border border-slate-200 shadow-inner">
              <div>
                <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Cự ly</p>
                <p className="text-sm font-bold text-slate-800">{selectedRace.distance}m</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Tổng thưởng</p>
                <p className="text-sm font-bold text-amber-600">{selectedRace.purse?.toLocaleString('vi-VN')}</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Trọng tài</p>
                <p className="text-sm font-bold text-slate-800">{typeof selectedRace.refereeId === 'object' && selectedRace.refereeId ? selectedRace.refereeId.fullName : 'Chưa chỉ định'}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200 bg-slate-50">
                <h4 className="text-sm font-bold text-slate-800">
                  Danh sách Đăng ký tham gia
                </h4>
                <span className="text-xs font-semibold bg-white border border-slate-200 text-slate-600 py-1 px-2.5 rounded-full shadow-sm">
                  {registrations.length} / {selectedRace.maxCapacity} ngựa
                </span>
              </div>
              
              <div className="overflow-x-auto">
                {loadingRegs ? (
                  <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-slate-400" size={28} /></div>
                ) : (
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ngựa</th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Chủ sở hữu</th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Kỵ thủ (Jockey)</th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Kiểm tra Y Tế</th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {registrations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-slate-500 bg-slate-50/20">
                            <div className="flex flex-col items-center justify-center">
                              <Dog className="text-slate-300 mb-2" size={32} />
                              Chưa có lượt đăng ký nào
                            </div>
                          </td>
                        </tr>
                      ) : registrations.map(reg => (
                        <tr key={reg._id} className="hover:bg-slate-50/50 transition-colors bg-white">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                                <Dog size={16} />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 text-[13px]">
                                  {typeof reg.horseId === 'object' ? reg.horseId.name : '-'}
                                </p>
                                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                  Hạng: {typeof reg.horseId === 'object' ? reg.horseId.currentGrade : ''}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-700 text-[13px]">
                              {typeof reg.ownerId === 'object' ? reg.ownerId.fullName : '-'}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            {typeof reg.jockeyId === 'object' && reg.jockeyId ? (
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                  {reg.jockeyId.fullName.charAt(0)}
                                </div>
                                <span className="font-medium text-slate-700 text-[13px]">{reg.jockeyId.fullName}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase tracking-wider">Chưa gán</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border shadow-sm ${PRECHECK_COLOR[reg.preCheckResult?.status || ''] || PRECHECK_COLOR.pending}`}>
                              {PRECHECK_LABEL[reg.preCheckResult?.status || 'pending']}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border shadow-sm ${REG_STATUS_COLOR[reg.status] || ''}`}>
                              {REG_STATUS_LABEL[reg.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
