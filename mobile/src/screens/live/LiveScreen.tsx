import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { raceService } from '../../services/api/race.service';
import { Race, RaceHorse } from '../../types';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';
import { LiveStackParamList } from '../../navigation/MainNavigator';
import Ionicons from '@expo/vector-icons/Ionicons';

type NavigationProp = NativeStackNavigationProp<LiveStackParamList, 'LiveList'>;

const POLL_INTERVAL = 5000;

function LiveRaceCard({ race }: { race: Race }) {
  const navigation = useNavigation<NavigationProp>();
  const [horses, setHorses] = useState<RaceHorse[]>([]);

  useEffect(() => {
    raceService.getRaceHorses(race._id).then((res) => setHorses(res.horses ?? [])).catch(() => {});
  }, [race._id]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('LiveDetail', { raceId: race._id })}
      style={styles.cardWrapper}
    >
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={[styles.grade, { color: colors.gold }]}>{race.grade}</Text>
          </View>
        </View>

        <Text style={styles.raceName} numberOfLines={1}>{race.name}</Text>
        <Text style={styles.raceMeta}>{race.distance}m · Giải: {race.purse?.toLocaleString()} coins</Text>

        {/* Horses leaderboard */}
        {horses.length > 0 && (
          <View style={styles.leaderboard}>
            <Text style={styles.leaderboardTitle}>🏇 Các Ngựa Tham Gia</Text>
            {horses.slice(0, 4).map((h, idx) => {
              const horseId = typeof h.horseId === 'object' ? h.horseId?._id : h.horseId;
              const horseName = typeof h.horseId === 'object' ? h.horseId?.name : h.horseName;
              const jockeyName = typeof h.jockeyId === 'object' ? h.jockeyId?.fullName : h.jockeyName;
              const currentGrade = typeof h.horseId === 'object' ? h.horseId?.currentGrade : h.currentGrade;
              const horseKey = h._id || h.registrationId || horseId || String(idx);

              return (
                <View key={horseKey} style={styles.horseRow}>
                  <View style={[styles.positionBadge,
                    idx === 0 ? styles.pos1 : idx === 1 ? styles.pos2 : idx === 2 ? styles.pos3 : styles.posOther
                  ]}>
                    <Text style={styles.positionText}>#{idx + 1}</Text>
                  </View>
                  <View style={styles.horseInfo}>
                    <Text style={styles.horseName}>{horseName}</Text>
                    {jockeyName ? <Text style={styles.jockeyName}>{jockeyName}</Text> : null}
                  </View>
                  <Text style={styles.horseGrade}>{currentGrade ?? '—'}</Text>
                </View>
              );
            })}
            {horses.length > 4 ? (
              <Text style={styles.moreHorsesText}>...và {horses.length - 4} chú ngựa khác</Text>
            ) : null}
          </View>
        )}

        <View style={styles.watchLiveBtn}>
          <Ionicons name="play-circle-outline" size={16} color="#FFFFFF" />
          <Text style={styles.watchLiveText}>Vào Xem Trực Tiếp</Text>
        </View>
      </View>
    </TouchableOpacity>
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
  cardWrapper: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  liveText: { fontSize: fontSize.xs, fontWeight: fontWeight.extrabold, color: colors.danger, letterSpacing: 1.5 },
  cardHeaderRight: {},
  grade: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  raceName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  raceMeta: { fontSize: fontSize.xs, color: colors.textMuted },
  leaderboard: { marginTop: 4, gap: 6 },
  leaderboardTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textMuted, marginBottom: 4 },
  horseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.bg, borderRadius: radius.sm },
  positionBadge: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  pos1: { backgroundColor: '#C9A227' },
  pos2: { backgroundColor: '#7A7468' },
  pos3: { backgroundColor: '#8C2F1B' },
  posOther: { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border },
  positionText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: '#fff' },
  horseInfo: { flex: 1 },
  horseName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  jockeyName: { fontSize: fontSize.xs, color: colors.textMuted },
  horseGrade: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.medium },
  moreHorsesText: { fontSize: 10, color: colors.textSubtle, textAlign: 'center', marginVertical: 2 },
  watchLiveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.secondary, borderRadius: radius.md, paddingVertical: 10, marginTop: spacing.xs,
  },
  watchLiveText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  emptyDesc: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
});
