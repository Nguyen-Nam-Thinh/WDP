import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, UserPlus, Calendar, Clock, CheckCircle, ShieldCheck, X, Users, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { raceApi, type Race } from '../../api/race';
import { refereeAdminApi, type AdminUser } from '../../api/user';

// ── Shared Modal Wrapper ───────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-xl bg-white shadow-2xl dark:bg-[#1c2434] border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <h3 className="text-xl font-semibold text-black dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-black dark:hover:text-white transition">
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

export default function RefereeAssignment() {
  const [tab, setTab] = useState(0);

  // Race list
  const [races, setRaces] = useState<Race[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);

  // Race list pagination
  const [racePage, setRacePage] = useState(1);
  const RACES_PER_PAGE = 8;

  // Referees list
  const [referees, setReferees] = useState<AdminUser[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  // Assign dialog
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedRefId, setSelectedRefId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadRaces = useCallback(async () => {
    setLoadingRaces(true);
    try {
      const res = await raceApi.list({ limit: 100 });
      const active = res.races.filter(r => !['finished', 'cancelled'].includes(r.status));
      setRaces(active);
      if (!selectedRace && active.length) setSelectedRace(active[0]);
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
      const updated = await raceApi.assignReferee(selectedRace._id, selectedRefId);
      toast.success('Phân công trọng tài thành công');
      setSelectedRace(updated);
      setAssignDialog(false);
      setSelectedRefId('');
      loadRaces();
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi phân công trọng tài');
    } finally {
      setAssigning(false);
    }
  };

  const assignedRef = selectedRace && typeof selectedRace.refereeId === 'object' && selectedRace.refereeId
    ? referees.find(r => r._id === (selectedRace.refereeId as any)?._id) || selectedRace.refereeId
    : null;

  const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

  // Pagination for race list
  const raceTotalPages = Math.ceil(races.length / RACES_PER_PAGE);
  const pagedRaces = races.slice((racePage - 1) * RACES_PER_PAGE, racePage * RACES_PER_PAGE);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Phân công trọng tài
        </h2>
        <button
          onClick={() => { loadRaces(); loadReferees(); }}
          className="inline-flex items-center justify-center gap-2.5 rounded-md border border-slate-300 bg-white py-2 px-4 text-center font-medium text-black hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw size={18} />
          Làm mới
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1c2434] mb-6 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setTab(0)}
            className={`flex items-center gap-2 py-4 px-6 text-sm font-medium transition-colors ${tab === 0 ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            <Calendar size={18} />
            Phân công theo cuộc đua
          </button>
          <button
            onClick={() => setTab(1)}
            className={`flex items-center gap-2 py-4 px-6 text-sm font-medium transition-colors ${tab === 1 ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            <Users size={18} />
            Danh sách trọng tài
          </button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* ── Tab 0: Assign by race ── */}
          {tab === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Race list */}
              <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-[#243045]">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Danh sách cuộc đua (Chưa chạy)</h3>
                
              {loadingRaces ? (
                  <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-blue-500" size={28} /></div>
                ) : races.length === 0 ? (
                  <div className="text-center py-10">
                    <AlertCircle className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                    <p className="text-slate-500 text-sm">Không có cuộc đua nào đang hoạt động</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 pr-2 custom-scrollbar">
                      {pagedRaces.map(race => {
                        const hasReferee = !!(typeof race.refereeId === 'object' && race.refereeId);
                        const isSelected = selectedRace?._id === race._id;
                        return (
                          <div
                            key={race._id}
                            onClick={() => setSelectedRace(race)}
                            className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                              isSelected 
                                ? 'border-blue-500 bg-white shadow-sm dark:bg-[#1c2434]' 
                                : 'border-transparent bg-white hover:border-slate-300 hover:shadow-sm dark:bg-[#1c2434] dark:hover:border-slate-600'
                            }`}
                          >
                            <h4 className="font-semibold text-black dark:text-white mb-1">{race.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
                              {typeof race.tournamentId === 'object' ? race.tournamentId.name : '-'}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                              <Clock size={14} className="text-slate-400" /> {fmtDateTime(race.scheduledTime)}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-block rounded border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {race.grade}
                              </span>
                              <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${
                                hasReferee 
                                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                  : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {hasReferee ? '✓ Đã phân công' : '⚠ Chưa phân công'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Race list pagination */}
                    {raceTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => setRacePage(p => Math.max(1, p - 1))}
                          disabled={racePage === 1}
                          className="flex items-center gap-1 rounded bg-slate-100 py-1 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                        >
                          <ChevronLeft size={14} /> Trước
                        </button>
                        <span className="text-xs text-slate-500">{racePage} / {raceTotalPages}</span>
                        <button
                          onClick={() => setRacePage(p => Math.min(raceTotalPages, p + 1))}
                          disabled={racePage >= raceTotalPages}
                          className="flex items-center gap-1 rounded bg-slate-100 py-1 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                        >
                          Sau <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Detail panel */}
              <div className="lg:col-span-7">
                {selectedRace ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1c2434] h-full">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 pb-5 dark:border-slate-700">
                      <div>
                        <h3 className="text-xl font-bold text-black dark:text-white mb-1">{selectedRace.name}</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {fmtDateTime(selectedRace.scheduledTime)} <span className="mx-2">•</span> {selectedRace.distance}m <span className="mx-2">•</span> {selectedRace.grade}
                        </p>
                      </div>
                      <button
                        onClick={() => { setSelectedRefId(''); setAssignDialog(true); }}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 transition"
                      >
                        <UserPlus size={16} />
                        {assignedRef ? 'Đổi trọng tài' : 'Gán trọng tài'}
                      </button>
                    </div>

                    <div className="mb-8">
                      <h4 className="text-base font-semibold text-black dark:text-white mb-4">Trọng tài được phân công</h4>
                      {assignedRef ? (
                        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-900/20">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-lg">
                              {(typeof assignedRef === 'object' && 'fullName' in assignedRef ? assignedRef.fullName : '?')[0]}
                            </div>
                            <div>
                              <h5 className="font-semibold text-black dark:text-white">
                                {typeof assignedRef === 'object' && 'fullName' in assignedRef ? assignedRef.fullName : '-'}
                              </h5>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {typeof assignedRef === 'object' && 'email' in assignedRef ? assignedRef.email : '-'}
                              </p>
                            </div>
                          </div>
                          <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                            <CheckCircle size={14} /> Đã phân công
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
                          <p className="text-slate-500 dark:text-slate-400">Chưa phân công trọng tài cho cuộc đua này</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-semibold text-black dark:text-white mb-4">Trọng tài sẵn sàng</h4>
                      {loadingRefs ? (
                        <div className="flex justify-center py-6"><RefreshCw className="animate-spin text-blue-500" size={24} /></div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {referees
                            .filter(r => {
                              const assignedId = typeof selectedRace.refereeId === 'object' && selectedRace.refereeId
                                ? (selectedRace.refereeId as any)._id
                                : selectedRace.refereeId;
                              return r._id !== assignedId;
                            })
                            .map(referee => (
                              <div key={referee._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-[#243045] dark:hover:border-slate-600">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                                    {referee.fullName[0]}
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-black dark:text-white">{referee.fullName}</h5>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      {referee.refereeProfile?.yearsOfService ?? 0} năm kinh nghiệm <span className="mx-1">•</span> GPLX: {referee.refereeProfile?.licenseNumber || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  disabled={assigning}
                                  onClick={async () => {
                                    setAssigning(true);
                                    try {
                                      const updated = await raceApi.assignReferee(selectedRace._id, referee._id);
                                      toast.success(`Đã phân công ${referee.fullName}`);
                                      setSelectedRace(updated);
                                      loadRaces();
                                    } catch (err: any) {
                                      toast.error(err.message);
                                    } finally {
                                      setAssigning(false);
                                    }
                                  }}
                                  className="shrink-0 rounded-md border border-slate-300 py-1.5 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 transition"
                                >
                                  Phân công ngay
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-[#1c2434] h-full flex flex-col items-center justify-center min-h-[400px]">
                    <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                      <ShieldCheck className="text-slate-400" size={32} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Chọn một cuộc đua để xem chi tiết</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab 1: All Referees ── */}
          {tab === 1 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Danh sách toàn bộ trọng tài</h3>
              {loadingRefs ? (
                <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-blue-500" size={32} /></div>
              ) : referees.length === 0 ? (
                <div className="text-center py-12 text-slate-500">Không có trọng tài nào</div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {referees.map(referee => (
                    <div key={referee._id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#243045] flex flex-col items-center text-center">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-md mb-4">
                        {referee.fullName[0]}
                      </div>
                      <h4 className="text-lg font-semibold text-black dark:text-white mb-1">{referee.fullName}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{referee.email}</p>
                      
                      <div className="w-full flex items-center justify-center gap-4 rounded-lg bg-slate-50 py-3 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Kinh nghiệm</p>
                          <p className="font-medium text-black dark:text-white">{referee.refereeProfile?.yearsOfService ?? 0} năm</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Giấy phép</p>
                          <p className="font-medium text-black dark:text-white">{referee.refereeProfile?.licenseNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assign Dialog Modal */}
      <Modal open={assignDialog} onClose={() => setAssignDialog(false)} title={`Phân công: ${selectedRace?.name}`} maxWidth="max-w-md">
        <div className="mb-6">
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Chọn trọng tài</label>
          <div className="relative z-20 bg-transparent">
            <select
              value={selectedRefId}
              onChange={e => setSelectedRefId(e.target.value)}
              className="relative z-20 w-full appearance-none rounded border border-slate-300 bg-transparent py-3 px-4 outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800"
            >
              <option value="">-- Chọn trọng tài --</option>
              {referees.map(r => (
                <option key={r._id} value={r._id}>
                  {r.fullName} ({r.refereeProfile?.yearsOfService ?? 0} năm KN)
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
          <button onClick={() => setAssignDialog(false)} disabled={assigning} className="rounded border border-slate-300 py-2 px-5 font-medium text-black hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800 disabled:opacity-50 transition">
            Hủy
          </button>
          <button onClick={handleAssign} disabled={!selectedRefId || assigning} className="flex items-center justify-center rounded bg-blue-600 py-2 px-5 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition min-w-[150px]">
            {assigning ? <RefreshCw className="animate-spin mr-2" size={18} /> : null}
            Xác nhận
          </button>
        </div>
      </Modal>
    </>
  );
}
