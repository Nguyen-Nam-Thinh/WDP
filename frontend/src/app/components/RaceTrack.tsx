import { motion } from 'motion/react';

// ─── Track geometry (oval) ──────────────────────────────────────────────────
const SVG_W = 700;
const SVG_H = 360;
const CX = 350, CY = 180;
const OUTER_RX = 290, OUTER_RY = 148;
const INNER_RX = 198, INNER_RY = 86;
const LANE_RX = 244, LANE_RY = 117;

const ADAPTIVE_THRESHOLD = 10; // ≤ this → oval, > this → lanes

// ─── Colors ────────────────────────────────────────────────────────────────
export const HORSE_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#a855f7', '#14b8a6', '#eab308',
];

// ─── Types ─────────────────────────────────────────────────────────────────
export interface TrackHorse {
  horseId: string;
  horseName: string;
  progressPct: number;  // 0–100
  colorIdx: number;
  currentRank?: number;
  isMyBet?: boolean;
}

// ─── Oval math ─────────────────────────────────────────────────────────────
function getXY(progressPct: number, laneShift = 0) {
  const angle = -(progressPct / 100) * 2 * Math.PI;
  return {
    x: CX + (LANE_RX + laneShift) * Math.cos(angle),
    y: CY + (LANE_RY + laneShift * 0.48) * Math.sin(angle),
  };
}

// ─── Legend chips (shared) ─────────────────────────────────────────────────
function LegendChips({ horses }: { horses: TrackHorse[] }) {
  return (
    <div className="relative bg-slate-900/70 border-t border-white/5">
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-10 z-10"
        style={{ background: 'linear-gradient(to left, rgba(15,23,42,0.85), transparent)' }}
      />
      <div
        className="flex gap-1.5 px-3 py-2.5 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {horses.map((horse) => {
          const color = HORSE_COLORS[horse.colorIdx % HORSE_COLORS.length];
          const rank = horse.currentRank;
          const isTop3 = rank !== undefined && rank <= 3;
          const rankColors: Record<number, string> = { 1: '#FBBF24', 2: '#94A3B8', 3: '#F97316' };
          const rankColor = rank ? (rankColors[rank] ?? 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.4)';
          return (
            <div
              key={horse.horseId}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full shrink-0 border text-xs font-medium transition-all ${
                horse.isMyBet
                  ? 'bg-[#FFDE42]/10 border-[#FFDE42]/40 text-[#FFDE42]'
                  : isTop3
                  ? 'bg-white/8 border-white/15 text-white'
                  : 'bg-white/5 border-white/8 text-slate-400'
              }`}
            >
              {rank !== undefined && (
                <span
                  className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                  style={{
                    background: isTop3 ? `radial-gradient(circle, ${rankColor}33, ${rankColor}11)` : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${isTop3 ? rankColor + '66' : 'rgba(255,255,255,0.12)'}`,
                    color: isTop3 ? rankColor : 'rgba(255,255,255,0.35)',
                  }}
                >
                  {rank}
                </span>
              )}
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}` }} />
              <span className="max-w-[72px] truncate">{horse.horseName}</span>
              {horse.isMyBet && <span className="text-[#FFDE42] text-[10px] shrink-0">★</span>}
            </div>
          );
        })}
        <div className="shrink-0 w-6" />
      </div>
    </div>
  );
}

// ─── Oval track (≤ ADAPTIVE_THRESHOLD horses) ──────────────────────────────
function OvalTrack({
  horses,
  raceName,
  distance,
}: {
  horses: TrackHorse[];
  raceName?: string;
  distance?: number;
}) {
  const n = horses.length;
  const sorted = [...horses].sort((a, b) => a.progressPct - b.progressPct);

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="sf-checker" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="white" />
          <rect x="4" y="4" width="4" height="4" fill="white" />
          <rect x="4" y="0" width="4" height="4" fill="#111" />
          <rect x="0" y="4" width="4" height="4" fill="#111" />
        </pattern>
        <radialGradient id="grass-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2d5c1a" />
          <stop offset="100%" stopColor="#1a3a0e" />
        </radialGradient>
        <radialGradient id="track-grad" cx="50%" cy="50%" r="50%">
          <stop offset="50%" stopColor="#b89560" />
          <stop offset="100%" stopColor="#8a6020" />
        </radialGradient>
      </defs>

      <rect width={SVG_W} height={SVG_H} fill="#0c1a0c" />
      <ellipse cx={CX} cy={CY} rx={OUTER_RX + 35} ry={OUTER_RY + 35} fill="#122010" />
      <ellipse cx={CX} cy={CY} rx={OUTER_RX} ry={OUTER_RY} fill="url(#track-grad)" />
      <ellipse cx={CX} cy={CY} rx={INNER_RX} ry={INNER_RY} fill="url(#grass-grad)" />
      <ellipse cx={CX} cy={CY} rx={INNER_RX - 14} ry={INNER_RY - 10} fill="#2e6318" opacity="0.7" />
      <ellipse cx={CX} cy={CY} rx={OUTER_RX} ry={OUTER_RY} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
      <ellipse cx={CX} cy={CY} rx={INNER_RX} ry={INNER_RY} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
      {[18, 36].map((shift, i) => (
        <ellipse key={i} cx={CX} cy={CY} rx={INNER_RX + shift} ry={INNER_RY + shift * 0.48}
          fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="14,10" />
      ))}
      <ellipse cx={CX} cy={CY} rx={OUTER_RX + 8} ry={OUTER_RY + 6} fill="none" stroke="#5c3d10" strokeWidth="6" />

      <text x={CX} y={CY - 10} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="13" fontWeight="bold" letterSpacing="2">
        {(raceName ?? '').toUpperCase().slice(0, 18)}
      </text>
      {distance && (
        <text x={CX} y={CY + 8} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="10">{distance}m</text>
      )}
      <text x={CX} y={CY + 24} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="8">↺</text>

      <line x1={CX + INNER_RX} y1={CY} x2={CX + OUTER_RX} y2={CY} stroke="white" strokeWidth="5" strokeLinecap="round" />
      <rect x={CX + INNER_RX} y={CY - 9} width={OUTER_RX - INNER_RX} height={9} fill="url(#sf-checker)" opacity="0.75" />
      <text x={CX + OUTER_RX + 6} y={CY + 4} fill="rgba(255,255,255,0.65)" fontSize="8" fontWeight="bold">S/F</text>

      {sorted.map((horse) => {
        const horseIdx = horses.findIndex(h => h.horseId === horse.horseId);
        const laneStep = n > 1 ? Math.min(4.5, 85 / (n - 1)) : 0;
        const laneShift = n > 1 ? (horseIdx - (n - 1) / 2) * laneStep : 0;
        const { x, y } = getXY(horse.progressPct, laneShift);
        const color = HORSE_COLORS[horse.colorIdx % HORSE_COLORS.length];
        const r = horse.isMyBet ? (n <= 8 ? 15 : 13) : (n <= 8 ? 13 : 11);
        const emojiSize = horse.isMyBet ? (n <= 8 ? 16 : 14) : (n <= 8 ? 14 : 12);
        const badgeR = n <= 8 ? 5.5 : 4.5;
        const rank = horse.currentRank ?? horseIdx + 1;

        return (
          <g key={horse.horseId} transform={`translate(${x}, ${y})`}>
            {horse.isMyBet && (
              <motion.circle r={r + 7} fill={color} opacity={0.22}
                animate={{ r: [r + 5, r + 10, r + 5], opacity: [0.22, 0.08, 0.22] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <circle r={r} fill="#0f172a" stroke={horse.isMyBet ? '#FFDE42' : color} strokeWidth={horse.isMyBet ? 2.5 : 2} />
            <text textAnchor="middle" y={emojiSize * 0.38} fontSize={emojiSize} style={{ pointerEvents: 'none', userSelect: 'none' }}>🐎</text>
            <circle cx={r - badgeR + 1} cy={-(r - badgeR + 1)} r={badgeR} fill={color} />
            <text x={r - badgeR + 1} y={-(r - badgeR + 1) + badgeR * 0.42} textAnchor="middle" fill="white"
              fontSize={badgeR * 1.3} fontWeight="900" style={{ pointerEvents: 'none', userSelect: 'none' }}>{rank}</text>
            {horse.isMyBet ? (
              <text y={-(r + 7)} textAnchor="middle" fill="#FFDE42" fontSize="8" fontWeight="bold"
                stroke="#0c1a0c" strokeWidth="3" paintOrder="stroke" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                ★ {horse.horseName.slice(0, 10)}
              </text>
            ) : rank <= 3 ? (
              <text y={-(r + 6)} textAnchor="middle" fill="white" fontSize="7"
                stroke="#0c1a0c" strokeWidth="2.5" paintOrder="stroke" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                {horse.horseName.slice(0, 9)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Lanes track (> ADAPTIVE_THRESHOLD horses) ─────────────────────────────
function LanesTrack({
  horses,
  raceName,
  distance,
}: {
  horses: TrackHorse[];
  raceName?: string;
  distance?: number;
}) {
  // Sort by rank ascending (leader at top), fallback to progressPct desc
  const sorted = [...horses].sort((a, b) => {
    const ra = a.currentRank ?? (101 - a.progressPct);
    const rb = b.currentRank ?? (101 - b.progressPct);
    return ra - rb;
  });

  const rankColors: Record<number, string> = { 1: '#FBBF24', 2: '#94A3B8', 3: '#F97316' };

  return (
    <div className="w-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0a150a] border-b border-[#1e3a1e]">
        <span className="text-[10px] font-bold tracking-widest text-[#4b7a3c] uppercase">Start</span>
        <div className="text-center">
          <span className="text-xs font-bold text-white/40">{raceName}</span>
          {distance && <span className="ml-2 text-[10px] text-white/20">{distance}m</span>}
        </div>
        <span className="text-[10px] font-bold tracking-widest text-[#4b7a3c] uppercase">Finish →</span>
      </div>

      {/* Lane rows */}
      <div className="divide-y divide-white/[0.04]">
        {sorted.map((horse) => {
          const color = HORSE_COLORS[horse.colorIdx % HORSE_COLORS.length];
          const rank = horse.currentRank;
          const isTop3 = rank !== undefined && rank <= 3;
          const rankColor = rank ? (rankColors[rank] ?? color) : color;
          const pct = Math.max(0, Math.min(100, horse.progressPct));

          return (
            <div
              key={horse.horseId}
              className={`flex items-center gap-2 px-3 py-0 h-[30px] transition-colors ${
                horse.isMyBet ? 'bg-[#FFDE42]/5' : isTop3 ? 'bg-white/[0.02]' : ''
              }`}
            >
              {/* Rank badge */}
              <div
                className="shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-black"
                style={{
                  background: isTop3 ? `${rankColor}22` : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${isTop3 ? rankColor + '66' : 'rgba(255,255,255,0.1)'}`,
                  color: isTop3 ? rankColor : 'rgba(255,255,255,0.3)',
                }}
              >
                {rank ?? '?'}
              </div>

              {/* Gate number + name */}
              <div className="shrink-0 w-[110px] flex items-center gap-1.5 min-w-0">
                <span className="text-sm leading-none" style={{ filter: horse.isMyBet ? 'drop-shadow(0 0 4px #FFDE42)' : undefined }}>🐎</span>
                <span
                  className={`text-[11px] truncate font-medium ${horse.isMyBet ? 'text-[#FFDE42]' : isTop3 ? 'text-white' : 'text-slate-400'}`}
                >
                  {horse.isMyBet ? '★ ' : ''}{horse.horseName}
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex-1 relative h-[8px] rounded-full bg-white/5 overflow-visible">
                <div
                  className="h-full rounded-full transition-none relative"
                  style={{
                    width: `${pct}%`,
                    background: horse.isMyBet
                      ? `linear-gradient(to right, ${color}88, #FFDE42)`
                      : `linear-gradient(to right, ${color}66, ${color})`,
                    boxShadow: isTop3 ? `0 0 6px ${color}88` : undefined,
                  }}
                >
                  {/* Horse emoji at tip of bar */}
                  <span
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-[13px] leading-none select-none pointer-events-none"
                    style={{ filter: horse.isMyBet ? 'drop-shadow(0 0 5px #FFDE42)' : undefined }}
                  >
                    🐎
                  </span>
                </div>
              </div>

              {/* Progress % */}
              <div className="shrink-0 w-[36px] text-right text-[10px] font-mono" style={{ color: isTop3 ? rankColor : 'rgba(255,255,255,0.25)' }}>
                {pct.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main export — adaptive switch ─────────────────────────────────────────
export function RaceTrack({
  horses,
  raceName,
  distance,
}: {
  horses: TrackHorse[];
  raceName?: string;
  distance?: number;
}) {
  const useLanes = horses.length > ADAPTIVE_THRESHOLD;

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
      {useLanes ? (
        <div className="bg-[#0c1a0c]">
          <LanesTrack horses={horses} raceName={raceName} distance={distance} />
        </div>
      ) : (
        <OvalTrack horses={horses} raceName={raceName} distance={distance} />
      )}
      <LegendChips horses={horses} />
    </div>
  );
}
