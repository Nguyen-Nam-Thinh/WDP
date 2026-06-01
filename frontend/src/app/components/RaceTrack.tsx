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
          // Distribute horses into lanes based on their stable index
          const horseIdx = horses.findIndex(h => h.horseId === horse.horseId);
          const laneShift = n > 1 ? (horseIdx - (n - 1) / 2) * 4.5 : 0;

          const { x, y } = getXY(horse.progressPct, laneShift);
          const color = HORSE_COLORS[horse.colorIdx % HORSE_COLORS.length];
          const r = horse.isMyBet ? 12 : 9;

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

      {/* ── Color legend ── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2 bg-slate-900/60 border-t border-white/5">
        {horses.map((horse) => (
          <div key={horse.horseId} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: HORSE_COLORS[horse.colorIdx % HORSE_COLORS.length] }}
            />
            <span className={`text-xs truncate max-w-20 ${horse.isMyBet ? 'text-[#FFDE42] font-semibold' : 'text-slate-400'}`}>
              {horse.horseName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
