import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { raceService } from '../../services/api/race.service';
import { Race } from '../../types';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

const GRADE_COLORS: Record<string, string> = {
  G1: '#8F7318', G2: '#8C2F1B', G3: '#1F3D2B', Maiden: '#7A7468',
};

function ResultRaceCard({ race }: { race: Race }) {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('LiveTab', { screen: 'LiveDetail', params: { raceId: race._id } })}
      style={styles.cardWrapper}
    >
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.gradeBadge, { borderColor: GRADE_COLORS[race.grade] + '50', backgroundColor: GRADE_COLORS[race.grade] + '15' }]}>
            <Text style={[styles.gradeText, { color: GRADE_COLORS[race.grade] }]}>{race.grade}</Text>
          </View>
          <View style={[styles.statusBadge, race.status === 'cancelled' ? styles.statusCancelled : styles.statusOfficial]}>
            <Text style={[styles.statusText, race.status === 'cancelled' ? { color: colors.danger } : { color: colors.primary }]}>
              {race.status === 'cancelled' ? 'Đã Hủy' : 'Official'}
            </Text>
          </View>
        </View>

        <Text style={styles.raceName} numberOfLines={1}>{race.name}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="flag-outline" size={13} color={colors.textMuted} />
            <Text style={styles.infoText}>{race.distance}m</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
            <Text style={styles.infoText}>{new Date(race.scheduledTime).toLocaleDateString('vi-VN')}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Ionicons name="trophy-outline" size={13} color={colors.gold} />
            <Text style={[styles.infoText, { color: colors.gold, fontWeight: 'bold' }]}>
              {race.purse?.toLocaleString()} coins
            </Text>
          </View>
        </View>

        <View style={styles.viewDetailRow}>
          <Text style={styles.viewDetailText}>Xem bảng xếp hạng & chi tiết</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ResultsScreen() {
  const navigation = useNavigation();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      // Fetch both finished (official) and cancelled races
      const [finishedRes, cancelledRes] = await Promise.all([
        raceService.getRaces({ status: 'finished', isOfficial: true, limit: 50 }),
        raceService.getRaces({ status: 'cancelled', limit: 20 }),
      ]);
      setRaces([...(finishedRes.races ?? []), ...(cancelledRes.races ?? [])]);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRaces = races.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return r.name.toLowerCase().includes(q) || r.grade.toLowerCase().includes(q);
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 Kết Quả Chung Cuộc</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textSubtle} style={styles.searchIcon} />
        <TextInput
          placeholder="Tìm kiếm cuộc đua..."
          placeholderTextColor={colors.textSubtle}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredRaces}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ResultRaceCard race={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="trophy-outline" size={48} color={colors.textSubtle} />
              <Text style={styles.emptyText}>Chưa có cuộc đua chính thức nào</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    marginHorizontal: spacing.lg, marginTop: spacing.md, paddingHorizontal: spacing.sm, paddingVertical: 8,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: fontSize.sm, color: colors.text, paddingVertical: 4 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md, paddingTop: spacing.md },
  cardWrapper: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
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
  statusOfficial: { backgroundColor: colors.successDim, borderColor: colors.success + '30' },
  statusCancelled: { backgroundColor: colors.dangerDim, borderColor: colors.danger + '30' },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  raceName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  infoRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, marginTop: 2 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: fontSize.xs, color: colors.textMuted },
  infoDivider: { width: 1, height: 12, backgroundColor: colors.border },
  viewDetailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border + '60', paddingTop: spacing.sm, marginTop: spacing.xs },
  viewDetailText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.semibold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
});
