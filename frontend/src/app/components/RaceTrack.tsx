import { motion } from 'motion/react'; // kept for pulse glow only

// ─── Track geometry ────────────────────────────────────────────────────────────
const SVG_W = 700;
const SVG_H = 360;
const CX = 350, CY = 180;
const OUTER_RX = 290, OUTER_RY = 148;
const INNER_RX = 198, INNER_RY = 86;
const LANE_RX = 244, LANE_RY = 117; // horses run on this ellipse

// ─── Colors ────────────────────────────────────────────────────────────────────
export const HORSE_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#a855f7', '#14b8a6', '#eab308',
];

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface TrackHorse {
  horseId: string;
  horseName: string;
  progressPct: number;  // 0–100, one full lap = 100
  colorIdx: number;
  currentRank?: number;
  isMyBet?: boolean;
}

// ─── Math helpers ──────────────────────────────────────────────────────────────
// Each horse runs on a slightly different radius lane to avoid perfect overlap
function getXY(progressPct: number, laneShift = 0) {
  // Counter-clockwise: start at rightmost point, go up then left
  const angle = -(progressPct / 100) * 2 * Math.PI;
  return {
    x: CX + (LANE_RX + laneShift) * Math.cos(angle),
    y: CY + (LANE_RY + laneShift * 0.48) * Math.sin(angle),
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function RaceTrack({
  horses,
  raceName,
  distance,
}: {
  horses: TrackHorse[];
  raceName?: string;
  distance?: number;
}) {
  const n = horses.length;

  // Sort so leader renders on top
  const sorted = [...horses].sort((a, b) => a.progressPct - b.progressPct);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Checkered pattern for start/finish line */}
          <pattern id="sf-checker" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="white" />
            <rect x="4" y="4" width="4" height="4" fill="white" />
            <rect x="4" y="0" width="4" height="4" fill="#111" />
            <rect x="0" y="4" width="4" height="4" fill="#111" />
          </pattern>
          {/* Grass gradient */}
          <radialGradient id="grass-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2d5c1a" />
            <stop offset="100%" stopColor="#1a3a0e" />
          </radialGradient>
          {/* Track gradient */}
          <radialGradient id="track-grad" cx="50%" cy="50%" r="50%">
            <stop offset="50%" stopColor="#b89560" />
            <stop offset="100%" stopColor="#8a6020" />
          </radialGradient>
        </defs>

        {/* ── Background ── */}
        <rect width={SVG_W} height={SVG_H} fill="#0c1a0c" />
        <ellipse cx={CX} cy={CY} rx={OUTER_RX + 35} ry={OUTER_RY + 35} fill="#122010" />

        {/* ── Track surface ── */}
        <ellipse cx={CX} cy={CY} rx={OUTER_RX} ry={OUTER_RY} fill="url(#track-grad)" />

        {/* ── Inner grass ── */}
        <ellipse cx={CX} cy={CY} rx={INNER_RX} ry={INNER_RY} fill="url(#grass-grad)" />
        <ellipse cx={CX} cy={CY} rx={INNER_RX - 14} ry={INNER_RY - 10} fill="#2e6318" opacity="0.7" />

        {/* ── Track boundary lines ── */}
        <ellipse cx={CX} cy={CY} rx={OUTER_RX} ry={OUTER_RY} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        <ellipse cx={CX} cy={CY} rx={INNER_RX} ry={INNER_RY} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />

        {/* ── Lane divider lines (dashed) ── */}
        {[18, 36].map((shift, i) => (
          <ellipse
            key={i}
            cx={CX} cy={CY}
            rx={INNER_RX + shift}
            ry={INNER_RY + shift * 0.48}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
            strokeDasharray="14,10"
          />
        ))}

        {/* ── Outer decorative rail ── */}
        <ellipse cx={CX} cy={CY} rx={OUTER_RX + 8} ry={OUTER_RY + 6} fill="none" stroke="#5c3d10" strokeWidth="6" />

        {/* ── Center text ── */}
        <text x={CX} y={CY - 10} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="13" fontWeight="bold" letterSpacing="2">
          {(raceName ?? '').toUpperCase().slice(0, 18)}
        </text>
        {distance && (
          <text x={CX} y={CY + 8} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="10">
            {distance}m
          </text>
        )}
        <text x={CX} y={CY + 24} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="8">
          ↺
        </text>

        {/* ── Start / Finish line ── */}
        {/* White line */}
        <line
          x1={CX + INNER_RX}
          y1={CY}
          x2={CX + OUTER_RX}
          y2={CY}
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Checkered strip above the line */}
        <rect
          x={CX + INNER_RX}
          y={CY - 9}
          width={OUTER_RX - INNER_RX}
          height={9}
          fill="url(#sf-checker)"
          opacity="0.75"
        />
        {/* S/F label */}
        <text
          x={CX + OUTER_RX + 6}
          y={CY + 4}
          fill="rgba(255,255,255,0.65)"
          fontSize="8"
          fontWeight="bold"
        >
          S/F
        </text>

        {/* ── Horse dots ── */}
        {sorted.map((horse, renderIdx) => {
          const horseIdx = horses.findIndex(h => h.horseId === horse.horseId);
          // Scale lane spread to always fit within track width (~85px usable),
          // and scale dot size down for larger fields to reduce overlap
          const laneStep = n > 1 ? Math.min(4.5, 85 / (n - 1)) : 0;
          const laneShift = n > 1 ? (horseIdx - (n - 1) / 2) * laneStep : 0;
          const { x, y } = getXY(horse.progressPct, laneShift);
          const color = HORSE_COLORS[horse.colorIdx % HORSE_COLORS.length];
          const baseR = n <= 8 ? 9 : n <= 14 ? 7 : 6;
          const r = horse.isMyBet ? baseR + 3 : baseR;

          return (
            // No transition — positions update at 60fps via rAF, direct SVG transform
            <g
              key={horse.horseId}
              transform={`translate(${x}, ${y})`}
            >
              {/* Pulsing glow for user's bet horse */}
              {horse.isMyBet && (
                <motion.circle
                  r={20}
                  fill={color}
                  opacity={0.22}
                  animate={{ r: [18, 24, 18], opacity: [0.22, 0.1, 0.22] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* Shadow */}
              <circle r={r + 1} fill="rgba(0,0,0,0.4)" cy={2} />

              {/* Main horse dot */}
              <circle
                r={r}
                fill={color}
                stroke={horse.isMyBet ? '#FFDE42' : 'rgba(255,255,255,0.85)'}
                strokeWidth={horse.isMyBet ? 2.5 : 1.5}
              />

              {/* Rank number inside the dot */}
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={horse.isMyBet ? '8' : '6'}
                fontWeight="bold"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {horse.currentRank ?? horseIdx + 1}
              </text>

              {/* Name label: always for my bet, only top-3 for others */}
              {horse.isMyBet ? (
                <text
                  y={-(r + 7)}
                  textAnchor="middle"
                  fill="#FFDE42"
                  fontSize="8"
                  fontWeight="bold"
                  stroke="#0c1a0c"
                  strokeWidth="3"
                  paintOrder="stroke"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  ★ {horse.horseName.slice(0, 10)}
                </text>
              ) : (horse.currentRank ?? 99) <= 3 ? (
                <text
                  y={-(r + 6)}
                  textAnchor="middle"
                  fill="white"
                  fontSize="7"
                  stroke="#0c1a0c"
                  strokeWidth="2.5"
                  paintOrder="stroke"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {horse.horseName.slice(0, 9)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* ── Color legend — horizontal scroll, pill chips ── */}
      <div className="relative bg-slate-900/70 border-t border-white/5">
        {/* Right fade hint — indicates more content on scroll */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 z-10"
          style={{ background: 'linear-gradient(to left, rgba(15,23,42,0.85), transparent)' }} />

        <div
          className="flex gap-1.5 px-3 py-2.5 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Gate order kept stable — rank badge updates in place */}
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
                {/* Rank badge */}
                {rank !== undefined && (
                  <span
                    className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{
                      background: isTop3
                        ? `radial-gradient(circle, ${rankColor}33, ${rankColor}11)`
                        : 'rgba(255,255,255,0.07)',
                      border: `1px solid ${isTop3 ? rankColor + '66' : 'rgba(255,255,255,0.12)'}`,
                      color: isTop3 ? rankColor : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {rank}
                  </span>
                )}

                {/* Color dot */}
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}` }}
                />

                {/* Horse name */}
                <span className="max-w-[72px] truncate">{horse.horseName}</span>

                {horse.isMyBet && (
                  <span className="text-[#FFDE42] text-[10px] shrink-0">★</span>
                )}
              </div>
            );
          })}
          {/* Spacer so last chip isn't hidden under the fade */}
          <div className="shrink-0 w-6" />
        </div>
      </div>
    </div>
  );
}
