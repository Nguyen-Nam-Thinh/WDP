import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Dog, User } from 'lucide-react';
import { toast } from 'sonner';
import { raceApi, type Race, type Registration } from '../../api/race';
import { tournamentApi, type Tournament } from '../../api/tournament';

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  closed: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  pre_check: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  running: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  finished: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};
const STATUS_LABEL: Record<string, string> = {
  open: 'Mở ĐK', closed: 'Đóng ĐK', pre_check: 'Kiểm tra',
  running: 'Đang đua', finished: 'Kết thúc', cancelled: 'Đã hủy',
};

const REG_STATUS_COLOR: Record<string, string> = { 
  active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', 
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', 
  disqualified: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
};
const REG_STATUS_LABEL: Record<string, string> = { active: 'Đang hoạt động', cancelled: 'Đã hủy', disqualified: 'Bị loại' };

const PRECHECK_COLOR: Record<string, string> = { 
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', 
  passed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', 
  failed: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
};
const PRECHECK_LABEL: Record<string, string> = { pending: 'Chờ', passed: 'Đạt', failed: 'Không đạt' };

export default function RaceManagement() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filterTournament, setFilterTournament] = useState('');
  const [search, setSearch] = useState('');
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [loadingRegs, setLoadingRegs] = useState(false);

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
      setSelectedRace(prev => {
        if (prev && res.races.some(r => r._id === prev._id)) return prev;
        return res.races[0] ?? null;
      });
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
  useEffect(() => { if (selectedRace) loadRegistrations(selectedRace._id); }, [selectedRace, loadRegistrations]);

  const filteredRaces = races.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (typeof r.tournamentId === 'object' && r.tournamentId.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Chi tiết cuộc đua & Đăng ký
        </h2>
        <button
          onClick={loadRaces}
          className="inline-flex items-center justify-center gap-2.5 rounded-md border border-slate-300 bg-white py-2 px-4 text-center font-medium text-black hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw size={18} className={loadingRaces ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5 lg:grid-cols-12">
        {/* ── Left: Race list ── */}
        <div className="col-span-12 lg:col-span-4 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1c2434] p-5">
          <div className="mb-5 flex flex-col gap-3">
            <div className="relative z-20 bg-transparent w-full">
              <span className="absolute top-1/2 left-3 -translate-y-1/2">
                <Search size={16} className="text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Tìm cuộc đua..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded border border-slate-300 bg-transparent py-2 pl-9 pr-3 outline-none focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800/50 text-sm"
              />
            </div>
            
            <div className="relative z-20 bg-transparent w-full">
              <select
                value={filterTournament}
                onChange={e => setFilterTournament(e.target.value)}
                className="relative z-20 w-full appearance-none rounded border border-slate-300 bg-transparent py-2 px-3 outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800/50 text-sm"
              >
                <option value="">Tất cả giải đấu</option>
                {tournaments.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {loadingRaces ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="animate-spin text-blue-500" size={28} />
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredRaces.length === 0 ? (
                <p className="text-center text-slate-500 py-6 text-sm">Không có cuộc đua</p>
              ) : filteredRaces.map(race => {
                const isSelected = selectedRace?._id === race._id;
                return (
                  <div
                    key={race._id}
                    onClick={() => setSelectedRace(race)}
                    className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm dark:border-slate-700 dark:bg-[#1c2434] dark:hover:border-slate-600'
                    }`}
                  >
                    <h5 className="font-semibold text-black dark:text-white mb-1 leading-tight">{race.name}</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
                      {typeof race.tournamentId === 'object' ? race.tournamentId.name : '-'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-block rounded border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {race.grade}
                      </span>
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[race.status] || ''}`}>
                        {STATUS_LABEL[race.status]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Registrations ── */}
        <div className="col-span-12 lg:col-span-8">
          {selectedRace ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1c2434] p-5 sm:p-7">
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold text-black dark:text-white">{selectedRace.name}</h3>
                  <span className="inline-block rounded border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {selectedRace.grade}
                  </span>
                  <span className={`inline-block rounded px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[selectedRace.status] || ''}`}>
                    {STATUS_LABEL[selectedRace.status]}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-4 sm:gap-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏁</span>
                    <div>
                      <p className="text-xs text-slate-500">Cự ly</p>
                      <p className="text-sm font-semibold text-black dark:text-white">{selectedRace.distance}m</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <div>
                      <p className="text-xs text-slate-500">Tổng thưởng</p>
                      <p className="text-sm font-semibold text-black dark:text-white">${selectedRace.purse?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📋</span>
                    <div>
                      <p className="text-xs text-slate-500">Phí ĐK</p>
                      <p className="text-sm font-semibold text-black dark:text-white">${selectedRace.registrationFee?.toLocaleString()}</p>
                    </div>
                  </div>
                  {typeof selectedRace.refereeId === 'object' && selectedRace.refereeId && (
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👤</span>
                      <div>
                        <p className="text-xs text-slate-500">Trọng tài</p>
                        <p className="text-sm font-semibold text-black dark:text-white">{selectedRace.refereeId.fullName}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <h4 className="text-lg font-semibold text-black dark:text-white mb-4">
                Danh sách đăng ký <span className="text-sm font-normal text-slate-500 ml-2">({registrations.length} / {selectedRace.maxCapacity} ngựa)</span>
              </h4>

              {loadingRegs ? (
                <div className="flex justify-center py-10">
                  <RefreshCw className="animate-spin text-blue-500" size={32} />
                </div>
              ) : (
                <div className="max-w-full overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-slate-50 text-left dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <th className="min-w-[180px] py-4 px-4 font-semibold text-sm text-black dark:text-white xl:pl-5">Ngựa</th>
                        <th className="min-w-[150px] py-4 px-4 font-semibold text-sm text-black dark:text-white">Chủ sở hữu</th>
                        <th className="min-w-[150px] py-4 px-4 font-semibold text-sm text-black dark:text-white">Jockey</th>
                        <th className="min-w-[100px] py-4 px-4 font-semibold text-sm text-black dark:text-white">Phí</th>
                        <th className="min-w-[100px] py-4 px-4 font-semibold text-sm text-black dark:text-white text-center">KT ngựa</th>
                        <th className="min-w-[120px] py-4 px-4 font-semibold text-sm text-black dark:text-white text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-500">Chưa có đăng ký</td>
                        </tr>
                      ) : registrations.map(reg => (
                        <tr key={reg._id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4 xl:pl-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                                <Dog size={20} />
                              </div>
                              <div>
                                <p className="font-medium text-black dark:text-white text-sm">
                                  {typeof reg.horseId === 'object' ? reg.horseId.name : '-'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {typeof reg.horseId === 'object' ? reg.horseId.currentGrade : ''}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-black dark:text-white">
                              {typeof reg.ownerId === 'object' ? reg.ownerId.fullName : '-'}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            {typeof reg.jockeyId === 'object' && reg.jockeyId ? (
                              <div className="flex items-center gap-1.5">
                                <User size={14} className="text-slate-400" />
                                <span className="text-sm text-black dark:text-white">{reg.jockeyId.fullName}</span>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-amber-500">Chưa gán</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm font-semibold text-black dark:text-white">${reg.feePaid?.toLocaleString()}</p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${PRECHECK_COLOR[reg.preCheckResult?.status || ''] || PRECHECK_COLOR.pending}`}>
                              {PRECHECK_LABEL[reg.preCheckResult?.status || 'pending']}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${REG_STATUS_COLOR[reg.status] || ''}`}>
                              {REG_STATUS_LABEL[reg.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-[#1c2434] h-full flex flex-col items-center justify-center min-h-[400px]">
              <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Dog className="text-slate-400" size={32} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-lg">Chọn một cuộc đua từ danh sách bên trái để xem đăng ký</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
