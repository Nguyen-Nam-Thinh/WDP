import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { raceService } from '../../services/api/race.service';
import { Race } from '../../types';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';
import { RACE_STATUS_LABEL } from '../../constants/api';
import Ionicons from '@expo/vector-icons/Ionicons';

const GRADE_COLORS: Record<string, string> = {
  G1: '#fbbf24', G2: '#a78bfa', G3: '#60a5fa', Maiden: '#34d399',
};

function RaceCard({ race }: { race: Race }) {
  const bettingCutoff = new Date(new Date(race.scheduledTime).getTime() - 60 * 60 * 1000);
  const cutoffPassed = new Date() > bettingCutoff;
  const canBet = race.status === 'open' && !cutoffPassed;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.gradeBadge, { borderColor: GRADE_COLORS[race.grade] + '60', backgroundColor: GRADE_COLORS[race.grade] + '20' }]}>
          <Text style={[styles.gradeText, { color: GRADE_COLORS[race.grade] }]}>{race.grade}</Text>
        </View>
        <View style={[styles.statusBadge, canBet ? styles.statusOpen : styles.statusClosed]}>
          <Text style={[styles.statusText, canBet ? { color: colors.success } : { color: colors.textMuted }]}>
            {RACE_STATUS_LABEL[race.status] ?? race.status}
          </Text>
        </View>
      </View>

      <Text style={styles.raceName} numberOfLines={1}>{race.name}</Text>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={13} color={colors.textSubtle} />
          <Text style={styles.infoLabel}>{new Date(race.scheduledTime).toLocaleDateString('vi-VN')}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="flag-outline" size={13} color={colors.textSubtle} />
          <Text style={styles.infoLabel}>{race.distance}m</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="trophy-outline" size={13} color={colors.accent} />
          <Text style={[styles.infoLabel, { color: colors.accent }]}>${race.purse?.toLocaleString()}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={13} color={cutoffPassed ? colors.danger : colors.success} />
          <Text style={[styles.infoLabel, { color: cutoffPassed ? colors.danger : colors.success }]}>
            {cutoffPassed ? 'Hết hạn cược' : 'Còn cược'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function HomeScreen() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [openRes, closedRes] = await Promise.all([
        raceService.getRaces({ status: 'open', limit: 30 }),
        raceService.getRaces({ status: 'closed', limit: 10 }),
      ]);
      setRaces([...(openRes.races ?? []), ...(closedRes.races ?? [])]);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>🏇 Giải Đấu</Text>
        <Text style={styles.pageSubtitle}>{races.length} cuộc đua</Text>
      </View>

      <FlatList
        data={races}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <RaceCard race={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="trophy-outline" size={48} color={colors.textSubtle} />
            <Text style={styles.emptyText}>Chưa có cuộc đua nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text },
  pageSubtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md, paddingTop: spacing.sm },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gradeBadge: {
    borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  gradeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  statusBadge: {
    borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  statusOpen: { backgroundColor: colors.successDim, borderColor: colors.success + '40' },
  statusClosed: { backgroundColor: colors.surface, borderColor: colors.border },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  raceName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 2 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
});
