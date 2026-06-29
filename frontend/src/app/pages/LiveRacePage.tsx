import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Clock,
  Medal,
  Star,
  ChevronLeft,
  Activity,
  CheckCircle,
  XCircle,
  Coins,
  Play,
  Flag,
  Users,
  Zap,
} from "lucide-react";
import { Chip } from "@mui/material";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useAuth } from "../hooks/useAuth";
import {
  useRaceSocket,
  type SocketPosition,
  type SocketResult,
} from "../hooks/useRaceSocket";
import { raceApi, type Race, type RaceResultEntry } from "../api/race";
import { betApi, type Bet } from "../api/bet";
import {
  RaceTrack,
  HORSE_COLORS,
  type TrackHorse,
} from "../components/RaceTrack";

// ─── helpers ────────────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  G1: "#8F7318",
  G2: "#8C2F1B",
  G3: "#1F3D2B",
  Maiden: "#7A7468",
};

function positionBadge(pos: number) {
  const base =
    "w-10 h-10 flex items-center justify-center font-bold text-sm shrink-0";
  if (pos === 1) return `${base} bg-gold text-foreground`;
  if (pos === 2) return `${base} bg-[#9A937F] text-white`;
  if (pos === 3) return `${base} bg-[#A85C32] text-white`;
  return `${base} bg-muted text-muted-foreground`;
}

function formatMs(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = ((ms % 60000) / 1000).toFixed(1);
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

// ─── Podium ───────────────────────────────────────────────────────────────────

const PODIUM_CONFIG = [
  {
    // 2nd — left
    blockH: 88,
    gradient: "linear-gradient(160deg, #9A937F 0%, #7A7468 100%)",
    ringColor: "rgba(122,116,104,0.35)",
    badgeBg: "linear-gradient(135deg, #E3DCCB, #9A937F)",
    badgeText: "#23201A",
    label: "2ND",
    labelColor: "#7A7468",
  },
  {
    // 1st — center
    blockH: 120,
    gradient: "linear-gradient(160deg, #E5C95A 0%, #C9A227 55%, #8F7318 100%)",
    ringColor: "rgba(201,162,39,0.5)",
    badgeBg: "linear-gradient(135deg, #F0E3A8, #C9A227)",
    badgeText: "#5C4A0E",
    label: "1ST",
    labelColor: "#8F7318",
  },
  {
    // 3rd — right
    blockH: 66,
    gradient: "linear-gradient(160deg, #C77B45 0%, #A85C32 100%)",
    ringColor: "rgba(168,92,50,0.35)",
    badgeBg: "linear-gradient(135deg, #E0A878, #A85C32)",
    badgeText: "#FFF7ED",
    label: "3RD",
    labelColor: "#A85C32",
  },
] as const;

function Podium({
  results,
}: {
  results: Array<{ position: number; horseName: string; prizeAmount: number }>;
}) {
  const top3 = results.slice(0, 3);
  // Visual order: 2nd (left) · 1st (center) · 3rd (right)
  const slots = [top3[1], top3[0], top3[2]];

  return (
    <div className="relative flex items-end justify-center gap-2 sm:gap-3 pt-10 pb-1">
      {/* Winner spotlight glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-56 h-40 rounded-full blur-3xl opacity-25"
        style={{
          background: "radial-gradient(circle, #C9A227 0%, transparent 70%)",
        }}
      />

      {slots.map((r, slotIdx) => {
        const cfg = PODIUM_CONFIG[slotIdx];
        const isWinner = slotIdx === 1;

        if (!r) return <div key={slotIdx} className="w-24 sm:w-28" />;

        return (
          <div key={r.position} className="flex flex-col items-center">
            {/* Horse name + prize above the block */}
            <div
              className={`text-center mb-2.5 px-1 ${isWinner ? "mb-3" : ""}`}
            >
              {isWinner && (
                <div className="flex justify-center mb-1">
                  <div
                    className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #F0E3A8, #C9A227)",
                      boxShadow: "0 0 10px rgba(201,162,39,0.6)",
                    }}
                  >
                    <img
                      src="/images/logo.png"
                      alt="logo"
                      className="w-full h-full object-contain"
                      style={{ mixBlendMode: "multiply" }}
                    />
                  </div>
                </div>
              )}
              <div
                className={`font-bold text-foreground leading-tight truncate ${isWinner ? "font-serif text-base max-w-[108px]" : "text-xs max-w-[88px]"}`}
              >
                {r.horseName}
              </div>
              {r.prizeAmount > 0 && (
                <div
                  className={`font-semibold mt-0.5 tabular-nums ${isWinner ? "text-[#8F7318] text-sm" : "text-muted-foreground text-[11px]"}`}
                >
                  +{r.prizeAmount.toLocaleString('vi-VN')} coins
                </div>
              )}
            </div>

            {/* Podium block */}
            <div
              className="relative rounded-t-2xl overflow-hidden flex flex-col items-center justify-between py-3"
              style={{
                width: isWinner ? "112px" : "88px",
                height: `${cfg.blockH}px`,
                background: cfg.gradient,
                boxShadow: `0 0 0 1.5px ${cfg.ringColor}, 0 8px 24px -4px ${cfg.ringColor}`,
              }}
            >
              {/* Shine overlay */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%)",
                }}
              />

              {/* Rank badge */}
              <div
                className="relative z-10 rounded-full flex items-center justify-center font-black shadow-md"
                style={{
                  width: isWinner ? "36px" : "28px",
                  height: isWinner ? "36px" : "28px",
                  background: cfg.badgeBg,
                  color: cfg.badgeText,
                  fontSize: isWinner ? "15px" : "12px",
                }}
              >
                {r.position}
              </div>

              {/* Rank label at bottom */}
              <span
                className="relative z-10 text-[10px] font-bold tracking-widest opacity-80"
                style={{
                  color: isWinner ? "#5C4A0E" : "rgba(255,255,255,0.85)",
                }}
              >
                {cfg.label}
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
  const [lineup, setLineup] = useState<
    Array<{ horseId: string; horseName: string; jockeyName?: string | null }>
  >([]);
  const [dbResults, setDbResults] = useState<RaceResultEntry[]>([]);
  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [colorMap, setColorMap] = useState<Record<string, number>>({});
  const confettiFired = useRef(false);

  const {
    phase,
    horses,
    positions,
    results: socketResults,
    elapsed,
    total,
    lastSegment,
    segmentHighlights,
  } = useRaceSocket(raceId ?? "", token);

  // ── Assign stable colors when we first know the full lineup ──
  useEffect(() => {
    const list = horses.length > 0 ? horses : lineup;
    if (list.length > 0 && Object.keys(colorMap).length === 0) {
      const map: Record<string, number> = {};
      list.forEach((h, i) => {
        map[h.horseId] = i;
      });
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
    raceApi
      .getRaceHorses(token, raceId)
      .then((data) => {
        setLineup(
          data.horses.map((h) => ({
            horseId: h.horseId,
            horseName: h.horseName,
            jockeyName: h.jockeyName ?? null,
          })),
        );
      })
      .catch(() => {});
  }, [raceId, token]);

  // ── On finish: load DB results + confetti ──
  useEffect(() => {
    if (phase !== "finished" || !raceId || !token) return;

    raceApi
      .getRaceResults(token, raceId)
      .then(({ results }) => setDbResults(results));

    const myBetHorseIds = myBets
      .filter((b) => b.status === "pending")
      .map((b) => b.horseId._id);
    const userWon = socketResults.some(
      (r) =>
        myBetHorseIds.includes(r.horseId) &&
        myBets.some((b) => {
          const p = r.position;
          return (
            b.horseId._id === r.horseId &&
            ((b.betType === "win" && p === 1) ||
              (b.betType === "place" && p <= 2) ||
              (b.betType === "show" && p <= 3))
          );
        }),
    );

    if (userWon && !confettiFired.current) {
      confettiFired.current = true;
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
      toast.success("🎉 Chúc mừng! Bạn đã thắng cược!");
    }
  }, [phase, raceId, token, socketResults, myBets]);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const handleForceSimulate = async () => {
    if (!raceId || !token) return;
    setSimulating(true);
    try {
      await raceApi.forceSimulate(token, raceId);
      toast.success("Cuộc đua đã bắt đầu, đang cập nhật kết quả...");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSimulating(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────────

  const myBetHorseIds = new Set(myBets.map((b) => b.horseId._id));

  // displayResults must be declared BEFORE trackHorses (used inside it)
  const displayResults: Array<{
    position: number;
    horseName: string;
    jockeyName: string | null;
    prizeAmount: number;
    pointsEarned: number;
    horseId: string;
    finishTime: number;
  }> =
    dbResults.length > 0
      ? dbResults.map((r) => ({
          position: r.position,
          horseName: typeof r.horseId === "object" ? r.horseId.name : "",
          jockeyName: r.jockeyId?.fullName ?? null,
          prizeAmount: r.prizeAmount,
          pointsEarned: r.pointsEarned,
          horseId: typeof r.horseId === "object" ? r.horseId._id : "",
          finishTime: r.finishTime,
        }))
      : socketResults.map((r) => ({
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

    if (phase === "finished") {
      return displayResults.map((r, i) => ({
        horseId: r.horseId,
        horseName: r.horseName,
        progressPct: 100,
        colorIdx: assignColor(r.horseId, i),
        currentRank: r.position,
        isMyBet: myBetHorseIds.has(r.horseId),
      }));
    }

    if (phase === "racing" && positions.length > 0) {
      return positions.map((p: SocketPosition, i) => ({
        horseId: p.horseId,
        horseName: p.horseName,
        progressPct: p.progressPct,
        colorIdx: assignColor(p.horseId, i),
        currentRank: p.rank,
        isMyBet: myBetHorseIds.has(p.horseId),
        segmentEvent: segmentHighlights[p.horseId]?.event,
      }));
    }

    // pre / started — all horses at starting line
    const list =
      horses.length > 0
        ? horses.map((h, i) => ({
            horseId: h.horseId,
            horseName: h.horseName,
            idx: i,
          }))
        : lineup.map((h, i) => ({
            horseId: h.horseId,
            horseName: h.horseName,
            idx: i,
          }));

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b-2 border-primary px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/spectator")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Quay lại</span>
          </button>

          <div className="text-center">
            <h1 className="font-serif text-foreground font-bold text-sm sm:text-base truncate max-w-44 sm:max-w-64">
              {race?.name ?? "Đang tải..."}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              {race && (
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: GRADE_COLORS[race.grade] }}
                >
                  {race.grade}
                </span>
              )}
              {race && (
                <span className="text-xs text-muted-foreground">{race.distance}m</span>
              )}
            </div>
          </div>

          {/* Phase badge */}
          <div className="flex items-center">
            {phase === "pre" && race?.status === "running" && (
              <div className="flex items-center gap-1.5 bg-gold/15 border border-gold/40 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                <span className="text-[#8F7318] text-xs font-medium">
                  Chuẩn bị
                </span>
              </div>
            )}
            {(phase === "started" || phase === "racing") && (
              <div className="flex items-center gap-1.5 bg-secondary/10 border border-secondary/30 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                <span className="text-secondary text-xs font-medium">
                  TRỰC TIẾP
                </span>
              </div>
            )}
            {phase === "finished" && (
              <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-full px-3 py-1">
                <Flag className="w-3 h-3 text-primary" />
                <span className="text-primary text-xs font-medium">
                  Kết thúc
                </span>
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

        {phase === "racing" && lastSegment && (
          <div className="bg-[#8F7318]/10 border border-[#8F7318]/40 px-4 py-2 text-sm text-[#8F7318] font-medium text-center">
            Chặng {lastSegment.segment} ({lastSegment.progressPct}%) —{" "}
            {lastSegment.horses.filter((h) => h.event === "burst" || h.event === "overtake").length > 0
              ? "Có ngựa bứt tốc / vượt mặt!"
              : "Đang tranh chấp quyết liệt"}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            RACE TIMER — only while racing
        ════════════════════════════════════════════════════════════ */}
        {phase === "racing" && (
          <div className="bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-secondary" />
                <span className="text-foreground text-sm font-semibold">
                  Tiến trình đường đua
                </span>
              </div>
              <div className="text-secondary text-sm font-mono font-bold">
                {elapsed}s / {total}s
              </div>
            </div>
            <div className="h-2 bg-muted overflow-hidden">
              <div
                className="h-full bg-secondary transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PHASE: pre — waiting for race to start
        ════════════════════════════════════════════════════════════ */}
        {phase === "pre" && (
          <div className="bg-card border border-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gold/15 flex items-center justify-center">
                <Play className="w-5 h-5 text-[#8F7318] animate-pulse" />
              </div>
              <div>
                <h2 className="font-serif text-foreground font-bold">Cuộc đua sắp bắt đầu</h2>
                <p className="text-muted-foreground text-xs">
                  Các ngựa đang chờ tín hiệu xuất phát
                </p>
              </div>
            </div>
            {(user?.role as string) === "admin" && (
              <button
                type="button"
                onClick={handleForceSimulate}
                disabled={simulating}
                className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 bg-gold/15 border border-gold/50 text-[#8F7318] font-semibold text-sm hover:bg-gold/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                {simulating ? "Đang khởi động..." : "Chạy Mô Phỏng (Admin)"}
              </button>
            )}
            {lineup.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Danh sách thi đấu (
                  {lineup.length} ngựa)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {lineup.map((h, i) => (
                    <div
                      key={h.horseId}
                      className={`flex items-center gap-3 p-2.5 border ${myBetHorseIds.has(h.horseId) ? "bg-gold/10 border-gold/40" : "bg-background border-border"}`}
                    >
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            HORSE_COLORS[
                              (colorMap[h.horseId] ?? i) % HORSE_COLORS.length
                            ],
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground text-sm font-medium truncate">
                          {h.horseName}
                        </div>
                        {h.jockeyName && (
                          <div className="text-muted-foreground text-xs">
                            {h.jockeyName}
                          </div>
                        )}
                      </div>
                      {myBetHorseIds.has(h.horseId) && (
                        <Star className="w-3.5 h-3.5 text-gold fill-[#C9A227] shrink-0" />
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
        {phase === "started" && (
          <div className="bg-secondary/8 border border-secondary/25 p-5 text-center">
            <div className="w-14 h-14 bg-secondary/15 rounded-full flex items-center justify-center mx-auto mb-3">
              <Play className="w-7 h-7 text-secondary" />
            </div>
            <h2 className="font-serif text-foreground font-bold text-lg">Xuất phát!</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {horses.length} ngựa đã rời cổng — theo dõi trên đường đua
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PHASE: racing — live leaderboard
        ════════════════════════════════════════════════════════════ */}
        {phase === "racing" && positions.length > 0 && (
          <div className="bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-secondary" />
              <h3 className="font-serif text-foreground font-bold text-sm">
                Bảng xếp hạng trực tiếp
              </h3>
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse ml-auto" />
            </div>
            <div className="space-y-2">
              {positions.map((pos: SocketPosition) => {
                const colorIdx = colorMap[pos.horseId] ?? 0;
                const color = HORSE_COLORS[colorIdx % HORSE_COLORS.length];
                const isMyBet = myBetHorseIds.has(pos.horseId);
                return (
                  <div
                    key={pos.horseId}
                    className={`flex items-center gap-3 p-3 transition-all border ${isMyBet ? "bg-gold/10 border-gold/40" : "bg-background border-border"}`}
                  >
                    {/* Rank badge */}
                    <div
                      className={`w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0 ${pos.rank === 1 ? "bg-gold text-foreground" : pos.rank === 2 ? "bg-[#9A937F] text-white" : pos.rank === 3 ? "bg-[#A85C32] text-white" : "bg-muted text-muted-foreground"}`}
                    >
                      {pos.rank}
                    </div>
                    {/* Color dot */}
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground font-medium text-sm truncate block">
                        {pos.horseName}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-28 sm:w-40 shrink-0">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${Math.max(pos.progressPct, 2)}%`,
                            backgroundColor: isMyBet ? "#C9A227" : color,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground w-10 text-right shrink-0 tabular-nums">
                      {pos.progressPct.toFixed(0)}%
                    </div>
                    {isMyBet && (
                      <Star className="w-4 h-4 text-gold fill-[#C9A227] shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PHASE: finished — podium + full results
        ════════════════════════════════════════════════════════════ */}
        {phase === "finished" && displayResults.length > 0 && (
          <div className="space-y-5">
            {/* Podium */}
            <div className="bg-card border border-border p-5">
              <div className="flex items-center gap-2 justify-center mb-1">
                <div
                  className="w-6 h-6 rounded overflow-hidden flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #F0E3A8, #C9A227)",
                  }}
                >
                  <img
                    src="/images/logo.png"
                    alt="logo"
                    className="w-full h-full object-contain"
                    style={{ mixBlendMode: "multiply" }}
                  />
                </div>
                <h3 className="font-serif text-foreground font-bold text-lg">
                  Kết quả chung cuộc
                </h3>
              </div>
              <Podium results={displayResults} />
            </div>

            {/* Full results table */}
            <div className="bg-card border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Medal className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-serif text-foreground font-bold text-sm">
                  Bảng xếp hạng đầy đủ
                </h3>
              </div>
              <div className="divide-y divide-border">
                {displayResults.map((r) => {
                  const colorIdx = colorMap[r.horseId] ?? 0;
                  const color = HORSE_COLORS[colorIdx % HORSE_COLORS.length];
                  const isMyHorse = myBetHorseIds.has(r.horseId);
                  const myBet = myBets.find((b) => b.horseId._id === r.horseId);
                  const betWon =
                    myBet &&
                    ((myBet.betType === "win" && r.position === 1) ||
                      (myBet.betType === "place" && r.position <= 2) ||
                      (myBet.betType === "show" && r.position <= 3));

                  return (
                    <div
                      key={r.horseId}
                      className={`flex items-center gap-3 px-5 py-3.5 ${isMyHorse ? "bg-gold/5" : "hover:bg-muted/40"} transition-colors`}
                    >
                      <div className={positionBadge(r.position)}>
                        {r.position}
                      </div>
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-foreground font-semibold text-sm">
                            {r.horseName}
                          </span>
                          {isMyHorse && (
                            <Chip
                              label="Cược của bạn"
                              size="small"
                              sx={{
                                bgcolor: "rgba(201,162,39,0.15)",
                                color: "#8F7318",
                                fontSize: "0.62rem",
                                height: "18px",
                              }}
                            />
                          )}
                        </div>
                        {r.jockeyName && (
                          <div className="text-muted-foreground text-xs">
                            {r.jockeyName}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        {r.finishTime > 0 && (
                          <div className="text-muted-foreground text-xs">
                            {formatMs(r.finishTime)}
                          </div>
                        )}
                        {r.prizeAmount > 0 && (
                          <div className="text-[#8F7318] text-xs font-semibold flex items-center gap-0.5 justify-end tabular-nums">
                            <Coins className="w-3 h-3" />
                            {r.prizeAmount.toLocaleString('vi-VN')} coins
                          </div>
                        )}
                        {r.pointsEarned > 0 && (
                          <div className="text-primary text-xs tabular-nums">
                            +{r.pointsEarned} pts
                          </div>
                        )}
                      </div>
                      {isMyHorse &&
                        (betWon ? (
                          <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive shrink-0" />
                        ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My bets summary */}
            {myBets.length > 0 && (
              <div className="bg-card border border-border p-5">
                <h3 className="font-serif text-foreground font-bold mb-3 flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-gold" /> Cược của bạn
                </h3>
                <div className="space-y-2">
                  {myBets.map((bet) => {
                    const result = displayResults.find(
                      (r) => r.horseId === bet.horseId._id,
                    );
                    const pos = result?.position;
                    const won =
                      pos !== undefined &&
                      ((bet.betType === "win" && pos === 1) ||
                        (bet.betType === "place" && pos <= 2) ||
                        (bet.betType === "show" && pos <= 3));
                    return (
                      <div
                        key={bet._id}
                        className={`flex items-center gap-3 p-3 border ${won ? "bg-primary/8 border-primary/25" : "bg-destructive/8 border-destructive/25"}`}
                      >
                        {won ? (
                          <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-foreground text-sm font-medium">
                            {bet.horseId.name}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {bet.betType === "win"
                              ? "Thắng"
                              : bet.betType === "place"
                                ? "Hạng 2"
                                : "Hạng 3"}{" "}
                            — {bet.amount.toLocaleString('vi-VN')} coins × {bet.multiplier}x
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {won ? (
                            <div className="text-primary font-bold text-sm tabular-nums">
                              +
                              {Math.floor(
                                bet.amount * bet.multiplier,
                              ).toLocaleString('vi-VN')} coins
                            </div>
                          ) : (
                            <div className="text-destructive text-sm tabular-nums">
                              -{bet.amount.toLocaleString('vi-VN')} coins
                            </div>
                          )}
                          {pos !== undefined && (
                            <div className="text-muted-foreground text-xs">
                              Về #{pos}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate("/spectator")}
              className="w-full py-3 bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
            >
              Quay lại trang chủ
            </button>
          </div>
        )}

        {/* ── My bets panel (while race is active) ── */}
        {phase !== "finished" && myBets.length > 0 && (
          <div className="bg-card border border-border p-4">
            <h3 className="font-serif text-foreground font-bold mb-3 flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-gold" /> Cược của bạn trong
              race này
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {myBets.map((bet) => (
                <div
                  key={bet._id}
                  className="flex items-center gap-3 p-3 bg-gold/5 border border-gold/30"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        HORSE_COLORS[
                          (colorMap[bet.horseId._id] ?? 0) % HORSE_COLORS.length
                        ],
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground text-sm font-medium truncate">
                      {bet.horseId.name}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {bet.betType === "win"
                        ? "Thắng"
                        : bet.betType === "place"
                          ? "Hạng 2"
                          : "Hạng 3"}{" "}
                      · {bet.amount.toLocaleString('vi-VN')} coins
                    </div>
                  </div>
                  <div className="text-[#8F7318] text-sm font-bold shrink-0">
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
