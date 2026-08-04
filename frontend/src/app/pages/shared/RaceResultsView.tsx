import { useEffect, useState, useCallback } from 'react';
import { raceApi, type Race, type RaceResultEntry } from '../../api/race';
import { betApi, type Bet } from '../../api/bet';
import { toast } from 'sonner';
import { 
  Trophy, Medal, Calendar, Flag, Clock, Coins, 
  Search, ChevronDown, ChevronUp, AlertCircle, 
  CheckCircle2, XCircle, Sparkles, Filter 
} from 'lucide-react';

function formatFinishTime(ms: number): string {
  if (!ms || !Number.isFinite(ms)) return '—';
  const seconds = ms / 1000;
  return `${seconds.toFixed(2)}s`;
}

interface RaceDetailCache {
  results: RaceResultEntry[];
  bets: Bet[];
  loading: boolean;
}

export function RaceResultsView({ token }: { token: string }) {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  
  // Expanded race IDs
  const [expandedRaceId, setExpandedRaceId] = useState<string | null>(null);
  
  // Cache for detailed results & bets of expanded races to avoid repeating API calls
  const [cache, setCache] = useState<Record<string, RaceDetailCache>>({});

  const loadRaces = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Fetch both finished and cancelled races
      const res = await raceApi.getRaces(token, { status: 'finished,cancelled', limit: 100 });
      // Only show official finished races or cancelled races
      const officialRaces = (res.races || []).filter(
        (r) => r.isOfficial === true || r.status === 'cancelled'
      );
      setRaces(officialRaces);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải danh sách cuộc đua');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRaces();
  }, [loadRaces]);

  const handleToggleExpand = async (raceId: string) => {
    if (expandedRaceId === raceId) {
      setExpandedRaceId(null);
      return;
    }

    setExpandedRaceId(raceId);

    // If already in cache, do not reload
    if (cache[raceId]) return;

    // Set loading in cache
    setCache(prev => ({
      ...prev,
      [raceId]: { results: [], bets: [], loading: true }
    }));

    try {
      // Load race results and bets in parallel
      const [resultsRes, betsRes] = await Promise.all([
        raceApi.getRaceResults(token, raceId),
        betApi.getMyBets(token, { raceId, limit: 10 }).catch(() => ({ bets: [] }))
      ]);

      setCache(prev => ({
        ...prev,
        [raceId]: {
          results: resultsRes.results || [],
          bets: betsRes.bets || [],
          loading: false
        }
      }));
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải chi tiết kết quả cuộc đua');
      setCache(prev => ({
        ...prev,
        [raceId]: { results: [], bets: [], loading: false }
      }));
    }
  };

  const filteredRaces = races.filter((race) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = race.name.toLowerCase().includes(query) || race.grade.toLowerCase().includes(query);
    const matchesGrade = gradeFilter === 'All' || race.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const getGradeBadgeClass = (grade: string) => {
    switch (grade) {
      case 'G1': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'G2': return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      case 'G3': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-card border border-border p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-gold" /> Kết Quả Cuộc Đua Chung Cuộc
          </h2>
          <p className="text-sm text-muted-foreground">Tra cứu bảng xếp hạng, bục danh vọng và kết quả dự đoán của các cuộc đua đã hoàn thành</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm tên trận / hạng đua..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full md:w-64 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Grade Selector */}
          <div className="flex items-center gap-2 bg-background border border-border px-3 py-2 text-sm text-foreground">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="All">Tất cả hạng</option>
              <option value="G1">Hạng G1</option>
              <option value="G2">Hạng G2</option>
              <option value="G3">Hạng G3</option>
              <option value="Maiden">Hạng Maiden</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRaces.length === 0 ? (
        <div className="bg-card border border-border p-12 text-center text-muted-foreground">
          <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-semibold">Không tìm thấy cuộc đua nào</p>
          <p className="text-xs mt-1">Vui lòng thử lại với từ khóa hoặc hạng đua khác</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRaces.map((race) => {
            const isExpanded = expandedRaceId === race._id;
            const detail = cache[race._id];

            return (
              <div 
                key={race._id} 
                className={`bg-card border border-border transition-all overflow-hidden ${
                  isExpanded ? 'border-primary/30 shadow-md shadow-primary/5' : 'hover:border-primary/25'
                }`}
              >
                {/* Race Card Header */}
                <button
                  type="button"
                  onClick={() => handleToggleExpand(race._id)}
                  className="w-full text-left p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded ${getGradeBadgeClass(race.grade)}`}>
                        {race.grade}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-foreground hover:text-primary transition-colors">
                        {race.name}
                      </h3>
                      {race.status === 'cancelled' && (
                        <span className="bg-rose-500/10 text-rose-500 border border-rose-500/25 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                          Đã Hủy
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Flag className="w-3.5 h-3.5 text-muted-foreground" /> {race.distance}m
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-border" />
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> {new Date(race.scheduledTime).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-border" />
                      <span className="flex items-center gap-1 text-[#8F7318] font-semibold">
                        <Coins className="w-3.5 h-3.5 text-[#8F7318]" /> Giải thưởng: {race.purse?.toLocaleString('vi-VN')} xu
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
                    <div className="text-xs text-right hidden md:block">
                      <span className="text-muted-foreground block">Trạng thái</span>
                      <span className={`font-semibold ${race.status === 'cancelled' ? 'text-rose-500' : 'text-primary'}`}>
                        {race.status === 'cancelled' ? 'Hủy bỏ' : 'Hoàn tất'}
                      </span>
                    </div>
                    <div className="p-2 hover:bg-muted rounded transition-colors text-muted-foreground">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </button>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-border bg-background/30 p-6 space-y-6">
                    {race.status === 'cancelled' ? (
                      <div className="bg-rose-500/5 border border-rose-500/20 p-6 text-center rounded">
                        <AlertCircle className="w-10 h-10 text-rose-500/60 mx-auto mb-2" />
                        <h4 className="font-bold text-foreground">Cuộc đua đã bị hủy bỏ</h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                          Trận đấu này không được diễn ra do sự cố kỹ thuật hoặc điều kiện thời tiết. Mọi chi phí cược (nếu có) đã được hoàn trả lại tài khoản người dùng.
                        </p>
                      </div>
                    ) : detail?.loading ? (
                      <div className="flex justify-center items-center py-10">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* 1. Stunning Podium Display */}
                        {detail.results.length > 0 && (
                          <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
                            <h4 className="font-serif text-base font-bold text-foreground text-center mb-6 flex items-center justify-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-gold animate-pulse" /> BỤC VINH QUANG TRẬN ĐẤU
                            </h4>
                            
                            <div className="flex items-end justify-center gap-3 max-w-xl mx-auto pt-6 pb-2">
                              {/* 2ND PLACE (SILVER) */}
                              {detail.results.find(r => r.position === 2) && (
                                <div className="flex flex-col items-center w-1/3">
                                  <div className="text-center mb-2 px-1">
                                    <span className="text-xs font-bold text-foreground block truncate max-w-[110px]" title={detail.results.find(r => r.position === 2)!.horseId.name}>
                                      {detail.results.find(r => r.position === 2)!.horseId.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block truncate max-w-[100px]">
                                      {detail.results.find(r => r.position === 2)!.jockeyId?.fullName || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-400/20 border-t border-x border-slate-400/30 rounded-t-lg h-24 flex flex-col justify-between items-center py-3 shadow-inner">
                                    <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center font-bold text-slate-800 text-sm shadow">
                                      2
                                    </div>
                                    <span className="text-[9px] font-extrabold tracking-wide text-slate-400 uppercase">HẠNG NHÌ</span>
                                  </div>
                                </div>
                              )}

                              {/* 1ST PLACE (GOLD) */}
                              {detail.results.find(r => r.position === 1) && (
                                <div className="flex flex-col items-center w-1/3">
                                  <Trophy className="w-6 h-6 text-gold mb-1 animate-bounce" />
                                  <div className="text-center mb-2 px-1">
                                    <span className="text-sm font-extrabold text-foreground block truncate max-w-[120px]" title={detail.results.find(r => r.position === 1)!.horseId.name}>
                                      {detail.results.find(r => r.position === 1)!.horseId.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block truncate max-w-[100px]">
                                      {detail.results.find(r => r.position === 1)!.jockeyId?.fullName || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="w-full bg-amber-500/20 border-t border-x border-amber-500/30 rounded-t-lg h-32 flex flex-col justify-between items-center py-3 shadow-[inset_0_4px_12px_rgba(251,191,36,0.15)] relative">
                                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
                                    <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center font-black text-white text-base shadow-lg ring-4 ring-amber-500/20">
                                      1
                                    </div>
                                    <span className="text-[10px] font-black tracking-widest text-[#8F7318] uppercase">VÔ ĐỊCH</span>
                                  </div>
                                </div>
                              )}

                              {/* 3RD PLACE (BRONZE) */}
                              {detail.results.find(r => r.position === 3) && (
                                <div className="flex flex-col items-center w-1/3">
                                  <div className="text-center mb-2 px-1">
                                    <span className="text-xs font-bold text-foreground block truncate max-w-[110px]" title={detail.results.find(r => r.position === 3)!.horseId.name}>
                                      {detail.results.find(r => r.position === 3)!.horseId.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block truncate max-w-[100px]">
                                      {detail.results.find(r => r.position === 3)!.jockeyId?.fullName || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="w-full bg-orange-700/10 border-t border-x border-orange-700/20 rounded-t-lg h-20 flex flex-col justify-between items-center py-3 shadow-inner">
                                    <div className="w-8 h-8 bg-orange-800/20 rounded-full flex items-center justify-center font-bold text-orange-700 text-sm shadow">
                                      3
                                    </div>
                                    <span className="text-[9px] font-extrabold tracking-wide text-orange-700 uppercase">HẠNG BA</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 2. Personal Prediction Outcomes */}
                        <div className="bg-card border border-border p-5 rounded-lg">
                          <h4 className="text-sm font-bold text-foreground border-b border-border pb-2.5 mb-3 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-gold" /> Kết Quả Dự Đoán Của Bạn
                          </h4>

                          {detail.bets.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-2 text-center">Bạn không tham gia dự đoán trong cuộc đua này.</p>
                          ) : (
                            <div className="space-y-3">
                              {detail.bets.map((bet) => {
                                const matchedResult = detail.results.find(
                                  (r) => r.horseId._id === (bet.horseId?._id || bet.horseId)
                                );
                                const isWinner = matchedResult?.position === 1;
                                const isRefunded = bet.status === 'refunded';
                                const isCancelled = bet.status === 'cancelled';
                                const isLost = bet.status === 'lost' || (matchedResult && matchedResult.position !== 1);
                                
                                return (
                                  <div 
                                    key={bet._id} 
                                    className={`p-4 border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                                      isWinner 
                                        ? 'bg-emerald-500/5 border-emerald-500/25' 
                                        : isLost 
                                          ? 'bg-rose-500/5 border-rose-500/25' 
                                          : 'bg-slate-500/5 border-slate-500/25'
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                                        🐎 Ngựa: {typeof bet.horseId === 'object' ? bet.horseId.name : 'Chưa biết'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Tiền đặt: <span className="text-foreground font-semibold">{bet.amount.toLocaleString('vi-VN')} xu</span> · Hệ số: <span className="text-[#8F7318] font-semibold">{bet.multiplier}x</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      {isWinner ? (
                                        <>
                                          <div className="text-right">
                                            <span className="text-[10px] uppercase text-emerald-500 block font-bold">Thắng</span>
                                            <span className="text-sm font-bold text-emerald-500 tabular-nums">+{Math.floor(bet.amount * bet.multiplier).toLocaleString('vi-VN')} xu</span>
                                          </div>
                                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                        </>
                                      ) : isRefunded ? (
                                        <>
                                          <div className="text-right">
                                            <span className="text-[10px] uppercase text-amber-500 block font-bold">Hoàn Tiền</span>
                                            <span className="text-sm font-bold text-amber-500 tabular-nums">+{bet.amount.toLocaleString('vi-VN')} xu</span>
                                          </div>
                                          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                        </>
                                      ) : isCancelled ? (
                                        <>
                                          <div className="text-right">
                                            <span className="text-[10px] uppercase text-muted-foreground block font-bold">Đã Hủy</span>
                                            <span className="text-sm font-semibold text-muted-foreground tabular-nums">{bet.amount.toLocaleString('vi-VN')} xu</span>
                                          </div>
                                          <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                                        </>
                                      ) : (
                                        <>
                                          <div className="text-right">
                                            <span className="text-[10px] uppercase text-rose-500 block font-bold">Thua</span>
                                            <span className="text-sm font-bold text-rose-500 tabular-nums">-{bet.amount.toLocaleString('vi-VN')} xu</span>
                                          </div>
                                          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 3. Full Placement Rankings Table */}
                        <div className="bg-card border border-border overflow-hidden">
                          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                              <Medal className="w-4 h-4 text-muted-foreground" /> Bảng Xếp Hạng Đầy Đủ
                            </h4>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center w-16">Hạng</th>
                                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Ngựa Đua</th>
                                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Kỵ Sĩ</th>
                                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Thời Gian</th>
                                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Thưởng Hạng</th>
                                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right w-24">Tích Lũy</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {detail.results.map((r) => {
                                  const position = r.position;
                                  
                                  const positionBadge = (pos: number | null) => {
                                    if (r.disqualified) return 'bg-rose-500/20 text-rose-500 border border-rose-500/30 font-extrabold';
                                    if (pos === 1) return 'bg-amber-500/20 text-[#8F7318] border border-amber-500/30 font-extrabold';
                                    if (pos === 2) return 'bg-slate-400/20 text-slate-400 border border-slate-400/20 font-bold';
                                    if (pos === 3) return 'bg-orange-700/10 text-orange-600 border border-orange-700/20 font-bold';
                                    return 'bg-muted text-muted-foreground border border-border';
                                  };

                                  return (
                                    <tr key={r._id} className="hover:bg-muted/30 transition-colors">
                                      <td className="px-5 py-3.5 text-center">
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${positionBadge(position)}`}>
                                          {r.disqualified ? 'DQ' : (position || '—')}
                                        </span>
                                      </td>
                                      <td className="px-5 py-3.5">
                                        <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                                          {r.horseId.name}
                                          {r.disqualified && (
                                            <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide">
                                              Bị loại
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{r.horseId.breed || 'Chưa phân loại'}</div>
                                        {r.disqualified && r.dqReason && (
                                          <div className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" /> Lý do: {r.dqReason}
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-5 py-3.5 text-sm text-foreground">
                                        {r.jockeyId?.fullName || 'Không có kỵ sĩ'}
                                      </td>
                                      <td className="px-5 py-3.5 text-sm text-right tabular-nums font-mono text-muted-foreground">
                                        {formatFinishTime(r.finishTime)}
                                      </td>
                                      <td className="px-5 py-3.5 text-sm text-right tabular-nums font-semibold text-[#8F7318]">
                                        {r.prizeAmount > 0 ? `${r.prizeAmount.toLocaleString('vi-VN')} xu` : '—'}
                                      </td>
                                      <td className="px-5 py-3.5 text-sm text-right tabular-nums text-primary font-bold">
                                        {r.pointsEarned > 0 ? `+${r.pointsEarned} pts` : '—'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
