import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, UserPlus, Calendar, Clock, CheckCircle, ShieldCheck, X, Users, AlertCircle, ChevronLeft, ChevronRight, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { raceApi, type Race } from '../../api/race';
import { refereeAdminApi, type AdminUser } from '../../api/user';

// ── Shared Modal Wrapper ───────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition rounded-md hover:bg-slate-200 p-1">
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

export default function RefereeAssignment() {
  // Race list
  const [races, setRaces] = useState<Race[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);

  // Race list search + pagination
  const [racePage, setRacePage] = useState(1);
  const [raceSearch, setRaceSearch] = useState('');
  const RACES_PER_PAGE = 10;

  // Referees list
  const [referees, setReferees] = useState<AdminUser[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  // Assign dialog
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedRefId, setSelectedRefId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [refSearch, setRefSearch] = useState('');

  const loadRaces = useCallback(async () => {
    setLoadingRaces(true);
    try {
      const res = await raceApi.list({ limit: 100 });
      const active = res.races.filter(r => !['finished', 'cancelled'].includes(r.status));
      setRaces(active);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingRaces(false);
    }
  }, []);

  const loadReferees = useCallback(async () => {
    setLoadingRefs(true);
    try {
      const res = await refereeAdminApi.listReferees();
      setReferees(res.users);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingRefs(false);
    }
  }, []);

  useEffect(() => { loadRaces(); loadReferees(); }, [loadRaces, loadReferees]);

  const handleOpenAssign = (race: Race) => {
    setSelectedRace(race);
    setSelectedRefId((race.refereeId as any)?._id || '');
    setRefSearch('');
    setAssignDialog(true);
  };

  const handleAssign = async () => {
    if (!selectedRace) {
      toast.error('Vui lòng chọn một cuộc đua trước');
      return;
    }
    if (!selectedRefId) {
      toast.error('Vui lòng chọn trọng tài cần phân công');
      return;
    }
    setAssigning(true);
    try {
      await raceApi.assignReferee(selectedRace._id, selectedRefId);
      toast.success('Phân công trọng tài thành công');
      setAssignDialog(false);
      setSelectedRefId('');
      loadRaces();
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi phân công trọng tài');
    } finally {
      setAssigning(false);
    }
  };

  const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

  const filteredRaces = raceSearch
    ? races.filter(r =>
        r.name.toLowerCase().includes(raceSearch.toLowerCase()) ||
        r.grade.toLowerCase().includes(raceSearch.toLowerCase()) ||
        (typeof r.tournamentId === 'object' && r.tournamentId.name.toLowerCase().includes(raceSearch.toLowerCase()))
      )
    : races;
  const raceTotalPages = Math.ceil(filteredRaces.length / RACES_PER_PAGE);
  const pagedRaces = filteredRaces.slice((racePage - 1) * RACES_PER_PAGE, racePage * RACES_PER_PAGE);

  const assignedCount = races.filter(r => r.refereeId).length;
  const unassignedCount = races.length - assignedCount;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Phân công Trọng tài
          </h2>
          <p className="text-sm text-slate-500 mt-1">Điều phối nhân sự trọng tài cho các chặng đua đang mở</p>
        </div>
        <button
          onClick={() => { loadRaces(); loadReferees(); }}
          disabled={loadingRaces || loadingRefs}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white py-2 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={(loadingRaces || loadingRefs) ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6 mb-6">
        {/* Card 1 */}
        <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
              <Calendar size={18} />
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200 shadow-sm">
              <TrendingUp size={12} /> Tổng
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">
            {loadingRaces ? <span className="text-slate-300">...</span> : races.length}
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng chặng đua</p>
        </div>

        {/* Card 2 */}
        <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
              <CheckCircle size={18} />
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200 shadow-sm">
              <TrendingUp size={12} /> Đã gán
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">
            {loadingRaces ? <span className="text-slate-300">...</span> : assignedCount}
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đã phân công</p>
        </div>

        {/* Card 3 */}
        <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm ${unassignedCount > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
              <AlertCircle size={18} />
            </div>
            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border shadow-sm ${unassignedCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
              {unassignedCount > 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              {unassignedCount > 0 ? 'Cần xử lý' : 'Hoàn tất'}
            </span>
          </div>
          <p className={`text-2xl font-bold mb-1 ${unassignedCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {loadingRaces ? <span className="text-slate-300">...</span> : unassignedCount}
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chưa phân công</p>
        </div>

        {/* Card 4 */}
        <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-100 shadow-sm">
              <ShieldCheck size={18} />
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200 shadow-sm">
              <TrendingUp size={12} /> Nhân sự
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">
            {loadingRefs ? <span className="text-slate-300">...</span> : referees.length}
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng trọng tài</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm chặng đua..."
              value={raceSearch}
              onChange={e => { setRaceSearch(e.target.value); setRacePage(1); }}
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {filteredRaces.length} Cuộc đua
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/20">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
              <tr>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-slate-400 text-xs border-b border-slate-200">Tên Chặng Đua</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-slate-400 text-xs border-b border-slate-200">Giải Đấu</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-slate-400 text-xs border-b border-slate-200">Hạng / Lịch trình</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-slate-400 text-xs border-b border-slate-200">Trọng tài phụ trách</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-slate-400 text-xs border-b border-slate-200 text-center">Trạng thái gán</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-slate-400 text-xs border-b border-slate-200 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingRaces ? (
                <tr><td colSpan={6} className="text-center py-20"><RefreshCw className="animate-spin text-slate-300 mx-auto" size={32} /></td></tr>
              ) : pagedRaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search size={32} className="mb-3 text-slate-300" />
                      Không tìm thấy chặng đua phù hợp
                    </div>
                  </td>
                </tr>
              ) : (
                pagedRaces.map(race => {
                  const hasReferee = !!(typeof race.refereeId === 'object' && race.refereeId);
                  const refereeName = hasReferee ? (race.refereeId as any).fullName : 'Chưa gán';
                  const refereeInitials = hasReferee ? refereeName.charAt(0) : '?';
                  const tournamentName = typeof race.tournamentId === 'object' ? race.tournamentId.name : '-';

                  return (
                    <tr key={race._id} className="hover:bg-slate-50/50 bg-white transition-colors group">
                      <td className="py-4 px-5">
                        <p className="font-semibold text-slate-900 text-[13px]">{race.name}</p>
                      </td>
                      <td className="py-4 px-5">
                        <p className="font-semibold text-slate-700 text-[13px]">{tournamentName}</p>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm">
                            {race.grade}
                          </span>
                          <span className="text-[12px] font-medium text-slate-600">{race.distance}m</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                          <Clock size={12} /> {fmtDateTime(race.scheduledTime)}
                        </p>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold border shadow-sm ${hasReferee ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                            {refereeInitials}
                          </div>
                          <span className={`font-semibold text-[13px] ${hasReferee ? 'text-slate-800' : 'text-slate-400'}`}>
                            {refereeName}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                          hasReferee 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {hasReferee ? 'Đã phân công' : 'Cần xử lý'}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end">
                          <button 
                            onClick={() => handleOpenAssign(race)} 
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border rounded transition shadow-sm ${
                              hasReferee 
                                ? 'border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50 bg-white' 
                                : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            <UserPlus size={14} /> 
                            {hasReferee ? 'Đổi trọng tài' : 'Phân công'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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

      {/* Assign Modal */}
      <Modal open={assignDialog} onClose={() => setAssignDialog(false)} title={`Phân công cho: ${selectedRace?.name}`} maxWidth="max-w-2xl">
        <div className="flex flex-col gap-5">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-wrap gap-4 justify-between items-center">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Thời gian</p>
              <p className="text-sm font-semibold text-slate-800">{selectedRace && fmtDateTime(selectedRace.scheduledTime)}</p>
            </div>
            <div>
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Thông số</p>
               <p className="text-sm font-semibold text-slate-800">{selectedRace?.grade} - {selectedRace?.distance}m</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800 block mb-2">Chọn Trọng tài</label>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={refSearch}
                onChange={e => setRefSearch(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
              />
            </div>
            
            <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
              <div className="max-h-60 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                {loadingRefs ? (
                  <div className="p-8 text-center text-slate-400"><RefreshCw className="animate-spin mx-auto" size={24} /></div>
                ) : referees.filter(r => r.fullName.toLowerCase().includes(refSearch.toLowerCase()) || r.email.toLowerCase().includes(refSearch.toLowerCase())).length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm font-medium">Không tìm thấy trọng tài phù hợp</div>
                ) : (
                  referees.filter(r => r.fullName.toLowerCase().includes(refSearch.toLowerCase()) || r.email.toLowerCase().includes(refSearch.toLowerCase())).map(ref => (
                    <button
                      key={ref._id}
                      onClick={() => setSelectedRefId(ref._id)}
                      className={`w-full flex items-center justify-between p-3 transition-colors text-left hover:bg-slate-50 ${
                        selectedRefId === ref._id ? 'bg-blue-50/50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-4 w-4 rounded-full border items-center justify-center shrink-0 ${
                          selectedRefId === ref._id ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'
                        }`}>
                          {selectedRefId === ref._id && <div className="h-1.5 w-1.5 bg-white rounded-full"></div>}
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border shadow-sm ${selectedRefId === ref._id ? 'bg-white border-blue-200 text-blue-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                            {ref.fullName.charAt(0)}
                          </div>
                          <div>
                            <h5 className={`font-semibold text-[13px] ${selectedRefId === ref._id ? 'text-blue-800' : 'text-slate-800'}`}>
                              {ref.fullName}
                            </h5>
                            <p className="text-[11px] font-medium text-slate-500">{ref.email}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 -mx-6 mt-6 rounded-b-xl">
          <button
            onClick={() => setAssignDialog(false)}
            disabled={assigning}
            className="rounded-md border border-slate-300 bg-white py-2 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50 transition"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedRefId || assigning}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 py-2 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {assigning && <RefreshCw className="animate-spin" size={16} />}
            Xác nhận Phân công
          </button>
        </div>
      </Modal>
    </>
  );
}
