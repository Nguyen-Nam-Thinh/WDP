import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';

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

const ROW_HEIGHT = 34;

function LanesTrack({
  horses,
  raceName,
  distance,
}: {
  horses: TrackHorse[];
  raceName?: string;
  distance?: number;
}) {
  const stableHorses = React.useMemo(() => {
    return [...horses].sort((a, b) => a.horseId.localeCompare(b.horseId));
  }, [horses.length]);

  const animatedTopsRef = React.useRef<Record<string, Animated.Value>>({});
  const lastTargetsRef = React.useRef<Record<string, number>>({});

  // Initialize animated values for stable positions
  stableHorses.forEach((horse, index) => {
    if (!animatedTopsRef.current[horse.horseId]) {
      const currentRank = horse.currentRank ?? (index + 1);
      const initialTranslate = (currentRank - 1 - index) * ROW_HEIGHT;
      animatedTopsRef.current[horse.horseId] = new Animated.Value(initialTranslate);
      lastTargetsRef.current[horse.horseId] = initialTranslate;
    }
  });

  // Animate translations smoothly on rank changes
  React.useEffect(() => {
    stableHorses.forEach((horse, index) => {
      const latestHorse = horses.find(h => h.horseId === horse.horseId);
      if (!latestHorse) return;

      const currentRank = latestHorse.currentRank ?? (index + 1);
      const targetTranslate = (currentRank - 1 - index) * ROW_HEIGHT;

      if (lastTargetsRef.current[horse.horseId] !== targetTranslate) {
        lastTargetsRef.current[horse.horseId] = targetTranslate;
        
        const anim = animatedTopsRef.current[horse.horseId];
        if (anim) {
          Animated.timing(anim, {
            toValue: targetTranslate,
            duration: 1200, // Slow, pleasant slide transition
            useNativeDriver: true,
          }).start();
        }
      }
    });
  }, [horses, stableHorses]);

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
        {stableHorses.map((horse) => {
          const latestHorse = horses.find(h => h.horseId === horse.horseId) || horse;
          const color = HORSE_COLORS[latestHorse.colorIdx % HORSE_COLORS.length];
          const rank = latestHorse.currentRank;
          const isTop3 = rank !== undefined && rank <= 3;
          const rankColor = rank ? (rankColors[rank] ?? color) : color;
          const pct = Math.max(0, Math.min(100, latestHorse.progressPct));
          const animTranslateY = animatedTopsRef.current[horse.horseId];

          return (
            <Animated.View
              key={horse.horseId}
              style={[
                laneStyles.row,
                latestHorse.isMyBet && laneStyles.rowMyBet,
                isTop3 && laneStyles.rowTop3,
                {
                  transform: [{ translateY: animTranslateY }],
                }
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
                  {horse.isMyBet ? '★ ' : ''}{latestHorse.horseName ?? 'Ngựa'}
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
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

export function RaceTrack({
  horses,
  raceName,
  distance,
}: {
  horses: TrackHorse[];
  raceName?: string;
  distance?: number;
}) {
  return (
    <View style={trackStyles.container}>
      <LanesTrack horses={horses} raceName={raceName} distance={distance} />
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
});

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
