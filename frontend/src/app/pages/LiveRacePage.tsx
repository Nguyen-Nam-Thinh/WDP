import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Trophy, Clock, Medal, Star, ChevronLeft, Activity,
  CheckCircle, XCircle, Coins, Play, Flag, Users, Zap,
} from 'lucide-react';
import { Chip } from '@mui/material';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useAuth } from '../hooks/useAuth';
import { useRaceSocket, type SocketPosition, type SocketResult } from '../hooks/useRaceSocket';
import { raceApi, type Race, type RaceResultEntry } from '../api/race';
import { betApi, type Bet } from '../api/bet';
import { RaceTrack, HORSE_COLORS, type TrackHorse } from '../components/RaceTrack';

// ─── helpers ────────────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  G1: '#fbbf24', G2: '#60a5fa', G3: '#34d399', Maiden: '#94a3b8',
};

function positionBadge(pos: number) {
  const base = 'w-10 h-10 flex items-center justify-center rounded-xl font-bold text-white text-sm shrink-0';
  if (pos === 1) return `${base} bg-amber-500`;
  if (pos === 2) return `${base} bg-slate-400`;
  if (pos === 3) return `${base} bg-orange-500`;
  return `${base} bg-slate-700 text-slate-300`;
}

function formatMs(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = ((ms % 60000) / 1000).toFixed(1);
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

// ─── Podium ───────────────────────────────────────────────────────────────────

function Podium({ results }: { results: Array<{ position: number; horseName: string; prizeAmount: number }> }) {
  const top3 = results.slice(0, 3);
  // Visual order: 2nd (left) · 1st (center) · 3rd (right)
  const display = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = [76, 100, 60];

  return (
    <div className="flex items-end justify-center gap-3 pt-4 pb-2">
      {display.map((r: any, i) => {
        if (!r) return null;
        return (
          <div key={r.position} className="flex flex-col items-center gap-2">
            <div className="text-center">
              <div className="text-white font-bold text-sm">{r.horseName}</div>
              {r.prizeAmount > 0 && (
                <div className="text-[#FFDE42] text-xs font-semibold">+{r.prizeAmount.toLocaleString()}</div>
              )}
            </div>
            <div
              className={`w-24 rounded-t-xl flex items-end justify-center ${r.position === 1 ? 'bg-amber-500' : r.position === 2 ? 'bg-slate-400' : 'bg-orange-500'}`}
              style={{ height: `${heights[i]}px` }}
            >
              <span className="text-3xl mb-2">
                {r.position === 1 ? '🥇' : r.position === 2 ? '🥈' : '🥉'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function LiveRacePage() {
  const { raceId } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [race, setRace] = useState<Race | null>(null);
  const [lineup, setLineup] = useState<Array<{ horseId: string; horseName: string; jockeyName?: string | null }>>([]);
  const [dbResults, setDbResults] = useState<RaceResultEntry[]>([]);
  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [colorMap, setColorMap] = useState<Record<string, number>>({});
  const confettiFired = useRef(false);

  const { phase, horses, positions, results: socketResults, elapsed, total } =
    useRaceSocket(raceId ?? '', token);

  // ── Assign stable colors when we first know the full lineup ──
  useEffect(() => {
    const list = horses.length > 0 ? horses : lineup;
    if (list.length > 0 && Object.keys(colorMap).length === 0) {
      const map: Record<string, number> = {};
      list.forEach((h, i) => { map[h.horseId] = i; });
      setColorMap(map);
    }
  }, [horses, lineup, colorMap]);

  // ── Load race metadata + user bets ──
  useEffect(() => {
    if (!raceId || !token) return;
    setLoading(true);
    Promise.all([
      raceApi.getRaceById(token, raceId),
      betApi.getMyBets(token, { raceId, limit: 20 }),
    ])
      .then(([raceData, betsData]) => {
        setRace(raceData);
        setMyBets(betsData.bets ?? []);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [raceId, token]);

  // ── Load lineup ──
  useEffect(() => {
    if (!raceId || !token) return;
    raceApi.getRaceHorses(token, raceId).then((data) => {
      setLineup(data.horses.map((h) => ({
        horseId: h.horseId,
        horseName: h.horseName,
        jockeyName: h.jockeyName ?? null,
      })));
    }).catch(() => {});
  }, [raceId, token]);

  // ── On finish: load DB results + confetti ──
  useEffect(() => {
    if (phase !== 'finished' || !raceId || !token) return;

    raceApi.getRaceResults(token, raceId).then(({ results }) => setDbResults(results));

    const myBetHorseIds = myBets.filter(b => b.status === 'pending').map(b => b.horseId._id);
    const userWon = socketResults.some(r =>
      myBetHorseIds.includes(r.horseId) &&
      myBets.some(b => {
        const p = r.position;
        return b.horseId._id === r.horseId &&
          ((b.betType === 'win' && p === 1) ||
           (b.betType === 'place' && p <= 2) ||
           (b.betType === 'show' && p <= 3));
      })
    );

    if (userWon && !confettiFired.current) {
      confettiFired.current = true;
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
      toast.success('🎉 Chúc mừng! Bạn đã thắng cược!');
    }
  }, [phase, raceId, token, socketResults, myBets]);

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  const handleForceSimulate = async () => {
    if (!raceId || !token) return;
    setSimulating(true);
    try {
      await raceApi.forceSimulate(token, raceId);
      toast.success('Cuộc đua đã bắt đầu, đang cập nhật kết quả...');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSimulating(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────────

  const myBetHorseIds = new Set(myBets.map(b => b.horseId._id));

  // displayResults must be declared BEFORE trackHorses (used inside it)
  const displayResults: Array<{
    position: number; horseName: string; jockeyName: string | null;
    prizeAmount: number; pointsEarned: number; horseId: string; finishTime: number;
  }> = dbResults.length > 0
    ? dbResults.map(r => ({
        position: r.position,
        horseName: typeof r.horseId === 'object' ? r.horseId.name : '',
        jockeyName: r.jockeyId?.fullName ?? null,
        prizeAmount: r.prizeAmount,
        pointsEarned: r.pointsEarned,
        horseId: typeof r.horseId === 'object' ? r.horseId._id : '',
        finishTime: r.finishTime,
      }))
    : socketResults.map(r => ({
        position: r.position,
        horseName: r.horseName,
        jockeyName: r.jockeyName,
        prizeAmount: r.prizeAmount,
        pointsEarned: r.pointsEarned,
        horseId: r.horseId,
        finishTime: r.finishTime,
      }));

  // Build TrackHorse list based on current phase
  const trackHorses: TrackHorse[] = (() => {
    const assignColor = (horseId: string, idx: number) =>
      colorMap[horseId] ?? idx;

    if (phase === 'finished') {
      return displayResults.map((r, i) => ({
        horseId: r.horseId,
        horseName: r.horseName,
        progressPct: 100 * (1 - (r.position - 1) / Math.max(displayResults.length, 1) * 0.05),
        colorIdx: assignColor(r.horseId, i),
        currentRank: r.position,
        isMyBet: myBetHorseIds.has(r.horseId),
      }));
    }

    if (phase === 'racing' && positions.length > 0) {
      return positions.map((p: SocketPosition, i) => ({
        horseId: p.horseId,
        horseName: p.horseName,
        progressPct: p.progressPct,
        colorIdx: assignColor(p.horseId, i),
        currentRank: p.rank,
        isMyBet: myBetHorseIds.has(p.horseId),
      }));
    }

    // pre / started — all horses at starting line
    const list = horses.length > 0
      ? horses.map((h, i) => ({ horseId: h.horseId, horseName: h.horseName, idx: i }))
      : lineup.map((h, i) => ({ horseId: h.horseId, horseName: h.horseName, idx: i }));

    return list.map((h) => ({
      horseId: h.horseId,
      horseName: h.horseName,
      progressPct: 0,
      colorIdx: assignColor(h.horseId, h.idx),
      currentRank: h.idx + 1,
      isMyBet: myBetHorseIds.has(h.horseId),
    }));
  })();

  const progressPct = total > 0 ? Math.round((elapsed / total) * 100) : 0;
  const hasTrackData = trackHorses.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1B0C0C] via-slate-950 to-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#FFDE42] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B0C0C] via-slate-950 to-slate-900 text-white">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/spectator')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Quay lại</span>
          </button>

          <div className="text-center">
            <h1 className="text-white font-bold text-sm sm:text-base truncate max-w-44 sm:max-w-64">
              {race?.name ?? 'Đang tải...'}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              {race && (
                <span className="text-xs font-medium" style={{ color: GRADE_COLORS[race.grade] }}>
                  {race.grade}
                </span>
              )}
              {race && <span className="text-xs text-slate-500">{race.distance}m</span>}
            </div>
          </div>

          {/* Phase badge */}
          <div className="flex items-center">
            {phase === 'pre' && race?.status === 'running' && (
              <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-amber-300 text-xs font-medium">Chuẩn bị</span>
              </div>
            )}
            {(phase === 'started' || phase === 'racing') && (
              <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-300 text-xs font-medium">TRỰC TIẾP</span>
              </div>
            )}
            {phase === 'finished' && (
              <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-3 py-1">
                <Flag className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300 text-xs font-medium">Kết thúc</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">

        {/* ════════════════════════════════════════════════════════════
            OVAL TRACK — always rendered once we know the horses
        ════════════════════════════════════════════════════════════ */}
        {hasTrackData && (
          <RaceTrack
            horses={trackHorses}
            raceName={race?.name}
            distance={race?.distance}
          />
        )}

        {/* ════════════════════════════════════════════════════════════
            RACE TIMER — only while racing
        ════════════════════════════════════════════════════════════ */}
        {phase === 'racing' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-400" />
                <span className="text-white text-sm font-semibold">Tiến trình đường đua</span>
              </div>
              <div className="text-red-400 text-sm font-mono font-bold">{elapsed}s / {total}s</div>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-amber-400 rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PHASE: pre — waiting for race to start
        ════════════════════════════════════════════════════════════ */}
        {phase === 'pre' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Play className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h2 className="text-white font-bold">Cuộc đua sắp bắt đầu</h2>
                <p className="text-slate-400 text-xs">Các ngựa đang chờ tín hiệu xuất phát</p>
              </div>
            </div>
            {(user?.role as string) === 'admin' && (
              <button
                onClick={handleForceSimulate}
                disabled={simulating}
                className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold text-sm hover:bg-amber-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                {simulating ? 'Đang khởi động...' : 'Chạy Mô Phỏng (Admin)'}
              </button>
            )}
            {lineup.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Danh sách thi đấu ({lineup.length} ngựa)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {lineup.map((h, i) => (
                    <div
                      key={h.horseId}
                      className={`flex items-center gap-3 p-2.5 rounded-xl ${myBetHorseIds.has(h.horseId) ? 'bg-yellow-500/10 border border-[#FFDE42]/25' : 'bg-slate-800/40'}`}
                    >
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: HORSE_COLORS[(colorMap[h.horseId] ?? i) % HORSE_COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{h.horseName}</div>
                        {h.jockeyName && <div className="text-slate-400 text-xs">{h.jockeyName}</div>}
                      </div>
                      {myBetHorseIds.has(h.horseId) && (
                        <Star className="w-3.5 h-3.5 text-[#FFDE42] fill-[#FFDE42] shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PHASE: started — race just kicked off
        ════════════════════════════════════════════════════════════ */}
        {phase === 'started' && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-5 text-center">
            <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Play className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-white font-bold text-lg">Xuất phát!</h2>
            <p className="text-slate-400 text-sm mt-1">{horses.length} ngựa đã rời cổng — theo dõi trên đường đua</p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PHASE: racing — live leaderboard
        ════════════════════════════════════════════════════════════ */}
        {phase === 'racing' && positions.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-red-400" />
              <h3 className="text-white font-semibold text-sm">Bảng xếp hạng trực tiếp</h3>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-auto" />
            </div>
            <div className="space-y-2">
              {positions.map((pos: SocketPosition) => {
                const colorIdx = colorMap[pos.horseId] ?? 0;
                const color = HORSE_COLORS[colorIdx % HORSE_COLORS.length];
                const isMyBet = myBetHorseIds.has(pos.horseId);
                return (
                  <div
                    key={pos.horseId}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isMyBet ? 'bg-yellow-500/10 border border-[#FFDE42]/25' : 'bg-slate-800/40'}`}
                  >
                    {/* Rank badge */}
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-white text-sm shrink-0 ${pos.rank === 1 ? 'bg-amber-500' : pos.rank === 2 ? 'bg-slate-400' : pos.rank === 3 ? 'bg-orange-500' : 'bg-slate-700'}`}>
                      {pos.rank}
                    </div>
                    {/* Color dot */}
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <span className="text-white font-medium text-sm truncate block">{pos.horseName}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-28 sm:w-40 shrink-0">
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${Math.max(pos.progressPct, 2)}%`,
                            backgroundColor: isMyBet ? '#FFDE42' : color,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 w-10 text-right shrink-0">
                      {pos.progressPct.toFixed(0)}%
                    </div>
                    {isMyBet && <Star className="w-4 h-4 text-[#FFDE42] fill-[#FFDE42] shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PHASE: finished — podium + full results
        ════════════════════════════════════════════════════════════ */}
        {phase === 'finished' && displayResults.length > 0 && (
          <div className="space-y-5">
            {/* Podium */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 justify-center mb-1">
                <Trophy className="w-5 h-5 text-[#FFDE42]" />
                <h3 className="text-white font-bold text-lg">Kết quả chung cuộc</h3>
              </div>
              <Podium results={displayResults} />
            </div>

            {/* Full results table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
                <Medal className="w-4 h-4 text-slate-400" />
                <h3 className="text-white font-semibold text-sm">Bảng xếp hạng đầy đủ</h3>
              </div>
              <div className="divide-y divide-white/5">
                {displayResults.map((r) => {
                  const colorIdx = colorMap[r.horseId] ?? 0;
                  const color = HORSE_COLORS[colorIdx % HORSE_COLORS.length];
                  const isMyHorse = myBetHorseIds.has(r.horseId);
                  const myBet = myBets.find(b => b.horseId._id === r.horseId);
                  const betWon = myBet &&
                    ((myBet.betType === 'win' && r.position === 1) ||
                     (myBet.betType === 'place' && r.position <= 2) ||
                     (myBet.betType === 'show' && r.position <= 3));

                  return (
                    <div
                      key={r.horseId}
                      className={`flex items-center gap-3 px-5 py-3.5 ${isMyHorse ? 'bg-yellow-500/5' : 'hover:bg-white/5'} transition-colors`}
                    >
                      <div className={positionBadge(r.position)}>{r.position}</div>
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold text-sm">{r.horseName}</span>
                          {isMyHorse && (
                            <Chip label="Cược của bạn" size="small" sx={{ bgcolor: 'rgba(255,222,66,0.15)', color: '#FFDE42', fontSize: '0.62rem', height: '18px' }} />
                          )}
                        </div>
                        {r.jockeyName && <div className="text-slate-400 text-xs">{r.jockeyName}</div>}
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        {r.finishTime > 0 && (
                          <div className="text-slate-400 text-xs">{formatMs(r.finishTime)}</div>
                        )}
                        {r.prizeAmount > 0 && (
                          <div className="text-[#FFDE42] text-xs font-semibold flex items-center gap-0.5 justify-end">
                            <Coins className="w-3 h-3" />{r.prizeAmount.toLocaleString()}
                          </div>
                        )}
                        {r.pointsEarned > 0 && (
                          <div className="text-blue-400 text-xs">+{r.pointsEarned} pts</div>
                        )}
                      </div>
                      {isMyHorse && (
                        betWon
                          ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                          : <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My bets summary */}
            {myBets.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-[#FFDE42]" /> Cược của bạn
                </h3>
                <div className="space-y-2">
                  {myBets.map((bet) => {
                    const result = displayResults.find(r => r.horseId === bet.horseId._id);
                    const pos = result?.position;
                    const won = pos !== undefined &&
                      ((bet.betType === 'win' && pos === 1) ||
                       (bet.betType === 'place' && pos <= 2) ||
                       (bet.betType === 'show' && pos <= 3));
                    return (
                      <div
                        key={bet._id}
                        className={`flex items-center gap-3 p-3 rounded-xl ${won ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}
                      >
                        {won
                          ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                          : <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium">{bet.horseId.name}</div>
                          <div className="text-slate-400 text-xs">
                            {bet.betType === 'win' ? 'Thắng' : bet.betType === 'place' ? 'Hạng 2' : 'Hạng 3'}
                            {' '}— {bet.amount.toLocaleString()} × {bet.multiplier}x
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {won
                            ? <div className="text-emerald-400 font-bold text-sm">+{Math.floor(bet.amount * bet.multiplier).toLocaleString()}</div>
                            : <div className="text-red-400 text-sm">-{bet.amount.toLocaleString()}</div>
                          }
                          {pos !== undefined && <div className="text-slate-500 text-xs">Về #{pos}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/spectator')}
              className="w-full py-3 rounded-xl bg-[#FFDE42] text-[#1B0C0C] font-bold hover:bg-[#E6C21E] transition-colors"
            >
              Quay lại trang chủ
            </button>
          </div>
        )}

        {/* ── My bets panel (while race is active) ── */}
        {phase !== 'finished' && myBets.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-[#FFDE42]" /> Cược của bạn trong race này
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {myBets.map((bet) => (
                <div key={bet._id} className="flex items-center gap-3 p-3 bg-yellow-500/5 border border-[#FFDE42]/20 rounded-xl">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: HORSE_COLORS[(colorMap[bet.horseId._id] ?? 0) % HORSE_COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{bet.horseId.name}</div>
                    <div className="text-slate-400 text-xs">
                      {bet.betType === 'win' ? 'Thắng' : bet.betType === 'place' ? 'Hạng 2' : 'Hạng 3'}
                      {' '}· {bet.amount.toLocaleString()} coins
                    </div>
                  </div>
                  <div className="text-[#FFDE42] text-sm font-bold shrink-0">
                    ×{bet.multiplier}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
