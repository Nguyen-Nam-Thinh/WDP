import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Ellipse, Line, Rect, Text as SvgText, Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';

// ─── Track geometry (oval) ──────────────────────────────────────────────────
const SVG_W = 700;
const SVG_H = 360;
const CX = 350, CY = 180;
const OUTER_RX = 290, OUTER_RY = 148;
const INNER_RX = 198, INNER_RY = 86;
const LANE_RX = 244, LANE_RY = 117;

const ADAPTIVE_THRESHOLD = 8; // ≤ this → oval, > this → lanes

export const HORSE_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#a855f7', '#14b8a6', '#eab308',
];

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

// ─── Legend chips ──────────────────────────────────────────────────────────
function LegendChips({ horses }: { horses: TrackHorse[] }) {
  return (
    <View style={legendStyles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={legendStyles.scrollContent}
      >
        {horses.map((horse) => {
          const color = HORSE_COLORS[horse.colorIdx % HORSE_COLORS.length];
          const rank = horse.currentRank;
          const isTop3 = rank !== undefined && rank <= 3;
          const rankColors: Record<number, string> = { 1: '#C9A227', 2: '#7A7468', 3: '#8C2F1B' };
          const rankColor = rank ? (rankColors[rank] ?? colors.textSubtle) : colors.textSubtle;
          
          return (
            <View
              key={horse.horseId}
              style={[
                legendStyles.chip,
                horse.isMyBet
                  ? legendStyles.chipMyBet
                  : isTop3
                  ? legendStyles.chipTop3
                  : legendStyles.chipDefault
              ]}
            >
              {rank !== undefined && (
                <View
                  style={[
                    legendStyles.rankBadge,
                    {
                      borderColor: isTop3 ? rankColor : colors.border,
                      backgroundColor: isTop3 ? rankColor + '15' : 'transparent'
                    }
                  ]}
                >
                  <Text style={[legendStyles.rankText, { color: isTop3 ? rankColor : colors.textMuted }]}>
                    {rank}
                  </Text>
                </View>
              )}
              <View style={[legendStyles.dot, { backgroundColor: color }]} />
              <Text
                style={[
                  legendStyles.name,
                  horse.isMyBet ? { color: colors.secondary, fontWeight: 'bold' } : { color: colors.text }
                ]}
                numberOfLines={1}
              >
                {horse.horseName}
              </Text>
              {horse.isMyBet && <Text style={legendStyles.star}>★</Text>}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const legendStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipMyBet: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accentBorder,
  },
  chipTop3: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
  },
  chipDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
  },
  rankBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    fontSize: fontSize.xs,
    maxWidth: 80,
  },
  star: {
    color: colors.gold,
    fontSize: 10,
  },
});

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
    <View style={trackStyles.svgWrapper}>
      <Svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={trackStyles.svg} width="100%" height={210}>
        <Defs>
          <RadialGradient id="grass-grad" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#2e6318" />
            <Stop offset="100%" stopColor="#1a3a0e" />
          </RadialGradient>
          <RadialGradient id="track-grad" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="50%" stopColor="#b89560" />
            <Stop offset="100%" stopColor="#8a6020" />
          </RadialGradient>
        </Defs>

        {/* Dirt boundary */}
        <Ellipse cx={CX} cy={CY} rx={OUTER_RX + 35} ry={OUTER_RY + 35} fill="#122010" />
        {/* Main dirt track */}
        <Ellipse cx={CX} cy={CY} rx={OUTER_RX} ry={OUTER_RY} fill="url(#track-grad)" />
        {/* Inner grass field */}
        <Ellipse cx={CX} cy={CY} rx={INNER_RX} ry={INNER_RY} fill="url(#grass-grad)" />
        <Ellipse cx={CX} cy={CY} rx={INNER_RX - 14} ry={INNER_RY - 10} fill="#2e6318" opacity="0.7" />
        {/* Rails */}
        <Ellipse cx={CX} cy={CY} rx={OUTER_RX} ry={OUTER_RY} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        <Ellipse cx={CX} cy={CY} rx={INNER_RX} ry={INNER_RY} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
        {/* Lane dashes */}
        {[18, 36].map((shift, i) => (
          <Ellipse key={i} cx={CX} cy={CY} rx={INNER_RX + shift} ry={INNER_RY + shift * 0.48}
            fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="14,10" />
        ))}
        <Ellipse cx={CX} cy={CY} rx={OUTER_RX + 8} ry={OUTER_RY + 6} fill="none" stroke="#5c3d10" strokeWidth="6" />

        {/* Text indicators */}
        <SvgText x={CX} y={CY - 10} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="13" fontWeight="bold" letterSpacing="2">
          {(raceName ?? '').toUpperCase().slice(0, 18)}
        </SvgText>
        {distance ? (
          <SvgText x={CX} y={CY + 8} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="10">{distance}m</SvgText>
        ) : null}
        <SvgText x={CX} y={CY + 24} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="8">↺</SvgText>

        {/* Start / Finish line */}
        <Line x1={CX + INNER_RX} y1={CY} x2={CX + OUTER_RX} y2={CY} stroke="white" strokeWidth="4" />
        {/* Simple finish checkerboard line */}
        <Rect x={CX + INNER_RX} y={CY - 6} width={OUTER_RX - INNER_RX} height={6} fill="white" opacity="0.6" />
        <SvgText x={CX + OUTER_RX + 10} y={CY + 3} fill="rgba(255,255,255,0.65)" fontSize="9" fontWeight="bold">S/F</SvgText>

        {/* Render horses */}
        {sorted.map((horse) => {
          const horseIdx = horses.findIndex(h => h.horseId === horse.horseId);
          const laneStep = n > 1 ? Math.min(4.5, 85 / (n - 1)) : 0;
          const laneShift = n > 1 ? (horseIdx - (n - 1) / 2) * laneStep : 0;
          const { x, y } = getXY(horse.progressPct, laneShift);
          const color = HORSE_COLORS[horse.colorIdx % HORSE_COLORS.length];
          const r = horse.isMyBet ? (n <= 8 ? 14 : 12) : (n <= 8 ? 12 : 10);
          const emojiSize = horse.isMyBet ? (n <= 8 ? 14 : 12) : (n <= 8 ? 12 : 10);
          const badgeR = n <= 8 ? 5.5 : 4.5;
          const rank = horse.currentRank ?? horseIdx + 1;

          return (
            <G key={horse.horseId} transform={`translate(${x}, ${y})`}>
              {/* Outer glow for my bet */}
              {horse.isMyBet ? (
                <Circle r={r + 6} fill={color} opacity={0.3} />
              ) : null}

              {/* Main circle */}
              <Circle r={r} fill="#0f172a" stroke={horse.isMyBet ? colors.gold : color} strokeWidth={horse.isMyBet ? 2.5 : 2} />
              <SvgText textAnchor="middle" y={emojiSize * 0.38} fontSize={emojiSize}>🐎</SvgText>
              
              {/* Rank indicator badge on horse */}
              <Circle cx={r - badgeR} cy={-(r - badgeR)} r={badgeR} fill={color} />
              <SvgText x={r - badgeR} y={-(r - badgeR) + badgeR * 0.4} textAnchor="middle" fill="white"
                fontSize={badgeR * 1.3} fontWeight="900">{rank}</SvgText>
              
              {/* Text tag above horse */}
              {horse.isMyBet ? (
                <SvgText y={-(r + 7)} textAnchor="middle" fill={colors.gold} fontSize="9" fontWeight="bold"
                  stroke="#0c1a0c" strokeWidth="2.5">
                  ★ {(horse.horseName ?? 'Ngựa').slice(0, 10)}
                </SvgText>
              ) : rank <= 3 ? (
                <SvgText y={-(r + 6)} textAnchor="middle" fill="white" fontSize="8"
                  stroke="#0c1a0c" strokeWidth="2">
                  {(horse.horseName ?? 'Ngựa').slice(0, 8)}
                </SvgText>
              ) : null}
            </G>
          );
        })}
      </Svg>
    </View>
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
  // Sort by rank ascending
  const sorted = [...horses].sort((a, b) => {
    const ra = a.currentRank ?? (101 - a.progressPct);
    const rb = b.currentRank ?? (101 - b.progressPct);
    return ra - rb;
  });

  const rankColors: Record<number, string> = { 1: '#C9A227', 2: '#7A7468', 3: '#8C2F1B' };

  return (
    <View style={laneStyles.container}>
      {/* Header bar */}
      <View style={laneStyles.header}>
        <Text style={laneStyles.sideText}>XUẤT PHÁT</Text>
        <View style={laneStyles.centerHeader}>
          <Text style={laneStyles.raceNameText}>{raceName}</Text>
          {distance ? <Text style={laneStyles.distanceText}>{distance}m</Text> : null}
        </View>
        <Text style={laneStyles.sideText}>ĐÍCH →</Text>
      </View>

      {/* Lane rows */}
      <View style={laneStyles.list}>
        {sorted.map((horse) => {
          const color = HORSE_COLORS[horse.colorIdx % HORSE_COLORS.length];
          const rank = horse.currentRank;
          const isTop3 = rank !== undefined && rank <= 3;
          const rankColor = rank ? (rankColors[rank] ?? color) : color;
          const pct = Math.max(0, Math.min(100, horse.progressPct));

          return (
            <View
              key={horse.horseId}
              style={[
                laneStyles.row,
                horse.isMyBet && laneStyles.rowMyBet,
                isTop3 && laneStyles.rowTop3
              ]}
            >
              {/* Rank badge */}
              <View
                style={[
                  laneStyles.rankBadge,
                  {
                    borderColor: isTop3 ? rankColor : colors.border,
                    backgroundColor: isTop3 ? rankColor + '22' : 'rgba(0,0,0,0.03)'
                  }
                ]}
              >
                <Text style={[laneStyles.rankText, { color: isTop3 ? rankColor : colors.textSubtle }]}>
                  {rank ?? '?'}
                </Text>
              </View>

              {/* Name */}
              <View style={laneStyles.nameContainer}>
                <Text style={laneStyles.horseEmoji}>🐎</Text>
                <Text
                  style={[
                    laneStyles.horseName,
                    horse.isMyBet ? { color: colors.secondary, fontWeight: 'bold' } : isTop3 ? { color: colors.text } : { color: colors.textMuted }
                  ]}
                  numberOfLines={1}
                >
                  {horse.isMyBet ? '★ ' : ''}{horse.horseName}
                </Text>
              </View>

              {/* Progress bar */}
              <View style={laneStyles.progressBarWrapper}>
                <View style={laneStyles.progressBarBg}>
                  <View
                    style={[
                      laneStyles.progressBarFill,
                      {
                        width: `${pct}%`,
                        backgroundColor: color,
                      }
                    ]}
                  >
                    {/* Floating emoji indicator */}
                    <Text style={laneStyles.progressEmoji}>🐎</Text>
                  </View>
                </View>
              </View>

              {/* Progress % */}
              <Text style={[laneStyles.pctText, isTop3 && { color: rankColor }]}>
                {pct.toFixed(0)}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const laneStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sideText: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  centerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  raceNameText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  distanceText: {
    fontSize: 10,
    color: colors.textSubtle,
  },
  list: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    height: 34,
    borderBottomWidth: 1,
    borderBottomColor: '#F2ECDC',
  },
  rowMyBet: {
    backgroundColor: colors.accentDim,
  },
  rowTop3: {
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  rankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  nameContainer: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  horseEmoji: {
    fontSize: 12,
  },
  horseName: {
    fontSize: 10,
    flex: 1,
  },
  progressBarWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bgSecondary,
    overflow: 'visible',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    position: 'relative',
  },
  progressEmoji: {
    position: 'absolute',
    right: -6,
    top: -4,
    fontSize: 11,
  },
  pctText: {
    width: 32,
    textAlign: 'right',
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textSubtle,
  },
});

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
    <View style={trackStyles.container}>
      {useLanes ? (
        <LanesTrack horses={horses} raceName={raceName} distance={distance} />
      ) : (
        <OvalTrack horses={horses} raceName={raceName} distance={distance} />
      )}
      <LegendChips horses={horses} />
    </View>
  );
}

const trackStyles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  svgWrapper: {
    backgroundColor: '#0c1a0c',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  svg: {
    maxWidth: '100%',
  },
});
