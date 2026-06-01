import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { raceService } from '../../services/api/race.service';
import { Race, RaceHorse } from '../../types';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

const POLL_INTERVAL = 5000;

function LiveRaceCard({ race }: { race: Race }) {
  const [horses, setHorses] = useState<RaceHorse[]>([]);

  useEffect(() => {
    raceService.getRaceHorses(race._id).then((res) => setHorses(res.horses ?? [])).catch(() => {});
  }, [race._id]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={styles.grade}>{race.grade}</Text>
        </View>
      </View>

      <Text style={styles.raceName} numberOfLines={1}>{race.name}</Text>
      <Text style={styles.raceMeta}>{race.distance}m · Giải: ${race.purse?.toLocaleString()}</Text>

      {/* Horses leaderboard */}
      {horses.length > 0 && (
        <View style={styles.leaderboard}>
          <Text style={styles.leaderboardTitle}>🏇 Các Ngựa Tham Gia</Text>
          {horses.slice(0, 8).map((h, idx) => (
            <View key={h._id} style={styles.horseRow}>
              <View style={[styles.positionBadge,
                idx === 0 ? styles.pos1 : idx === 1 ? styles.pos2 : idx === 2 ? styles.pos3 : styles.posOther
              ]}>
                <Text style={styles.positionText}>#{idx + 1}</Text>
              </View>
              <View style={styles.horseInfo}>
                <Text style={styles.horseName}>{h.horseId.name}</Text>
                {h.jockeyId && <Text style={styles.jockeyName}>{h.jockeyId.fullName}</Text>}
              </View>
              <Text style={styles.horseGrade}>{h.horseId.currentGrade ?? '—'}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function LiveScreen() {
  const [liveRaces, setLiveRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLive = useCallback(async () => {
    try {
      const res = await raceService.getRaces({ status: 'running', limit: 10 });
      setLiveRaces(res.races ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
    intervalRef.current = setInterval(fetchLive, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={colors.danger} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.liveHeaderIndicator}>
          <View style={styles.liveDotLarge} />
          <Text style={styles.pageTitle}>Đang Trực Tiếp</Text>
        </View>
        <Text style={styles.pollNote}>Cập nhật mỗi 5s</Text>
      </View>

      <FlatList
        data={liveRaces}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLive(); }} tintColor={colors.danger} />}
        renderItem={({ item }) => <LiveRaceCard race={item} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="radio-outline" size={64} color={colors.textSubtle} />
            <Text style={styles.emptyTitle}>Không Có Cuộc Đua Trực Tiếp</Text>
            <Text style={styles.emptyDesc}>Kéo xuống để làm mới hoặc quay lại sau</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, marginBottom: spacing.md,
  },
  liveHeaderIndicator: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  liveDotLarge: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text },
  pollNote: { fontSize: fontSize.xs, color: colors.textSubtle },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.danger + '40',
    borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm,
    shadowColor: colors.danger, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  liveText: { fontSize: fontSize.xs, fontWeight: fontWeight.extrabold, color: colors.danger, letterSpacing: 1.5 },
  cardHeaderRight: {},
  grade: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.warning },
  raceName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  raceMeta: { fontSize: fontSize.xs, color: colors.textMuted },
  leaderboard: { marginTop: 4, gap: 6 },
  leaderboardTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textMuted, marginBottom: 4 },
  horseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.surfaceHover, borderRadius: radius.sm },
  positionBadge: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  pos1: { backgroundColor: '#fbbf24' },
  pos2: { backgroundColor: '#9ca3af' },
  pos3: { backgroundColor: '#cd7c2f' },
  posOther: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  positionText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: '#fff' },
  horseInfo: { flex: 1 },
  horseName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  jockeyName: { fontSize: fontSize.xs, color: colors.textMuted },
  horseGrade: { fontSize: fontSize.xs, color: colors.warning, fontWeight: fontWeight.medium },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  emptyDesc: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
});
