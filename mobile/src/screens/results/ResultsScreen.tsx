import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator,
  TouchableOpacity, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { raceService } from '../../services/api/race.service';
import { betService } from '../../services/api/bet.service';
import { Race, Bet } from '../../types';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

const GRADE_COLORS: Record<string, string> = {
  G1: '#8F7318', G2: '#8C2F1B', G3: '#1F3D2B', Maiden: '#7A7468',
};

function formatFinishTime(ms: number): string {
  if (!ms || !isFinite(ms)) return '—';
  return `${(ms / 1000).toFixed(2)}s`;
}

function PositionBadge({ position, disqualified }: { position: number | null; disqualified?: boolean }) {
  if (disqualified) {
    return (
      <View style={[styles.posBadge, { backgroundColor: '#f43f5e22', borderColor: '#f43f5e55' }]}>
        <Text style={[styles.posBadgeText, { color: '#f43f5e' }]}>DQ</Text>
      </View>
    );
  }
  const colors_map: Record<number, [string, string]> = {
    1: ['#f59e0b22', '#f59e0b'],
    2: ['#94a3b822', '#94a3b8'],
    3: ['#c2410c22', '#c2410c'],
  };
  const [bg, color] = colors_map[position ?? 0] ?? ['#33333322', '#888'];
  return (
    <View style={[styles.posBadge, { backgroundColor: bg, borderColor: color + '55' }]}>
      <Text style={[styles.posBadgeText, { color }]}>{position ?? '—'}</Text>
    </View>
  );
}

function RaceDetailExpanded({ raceId, isOfficial }: { raceId: string; isOfficial?: boolean }) {
  const [results, setResults] = useState<any[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      raceService.getRaceResults(raceId),
      betService.getMyBets({ raceId, limit: 10 }).catch(() => ({ bets: [] })),
    ])
      .then(([res, betsRes]) => {
        const raw: any[] = res.results || [];
        // 1. Deduplicate: keep one entry per horse — prefer fastest finishTime
        const seen = new Map<string, any>();
        for (const r of raw) {
          const hid = r.horseId?._id ?? r.horseId ?? r._id;
          const prev = seen.get(hid);
          if (!prev) {
            seen.set(hid, r);
          } else {
            const prevTime = prev.finishTime ?? 999999;
            const curTime  = r.finishTime  ?? 999999;
            if (curTime < prevTime) {
              seen.set(hid, r);
            }
          }
        }
        const unique = Array.from(seen.values());

        // 2. Sort strictly: non-disqualified first ordered by finishTime ascending, DQ last
        const sorted = [...unique].sort((a, b) => {
          if (a.disqualified && !b.disqualified) return 1;
          if (!a.disqualified && b.disqualified) return -1;
          if (a.disqualified && b.disqualified) return 0;

          const timeA = a.finishTime ?? 999999;
          const timeB = b.finishTime ?? 999999;
          if (timeA !== timeB) return timeA - timeB;
          return (a.position ?? 999) - (b.position ?? 999);
        });

        // 3. Assign clean sequential display ranks (1, 2, 3, 4...)
        let rankCounter = 1;
        const ranked = sorted.map((r, idx, arr) => {
          if (r.disqualified) {
            return { ...r, displayRank: null };
          }
          let rank = rankCounter;
          if (idx > 0 && !arr[idx - 1].disqualified) {
            const prevTime = arr[idx - 1].finishTime;
            const curTime = r.finishTime;
            if (prevTime && curTime && Math.abs(curTime - prevTime) < 10) {
              rank = arr[idx - 1].displayRank;
            } else {
              rankCounter = idx + 1;
              rank = rankCounter;
            }
          } else {
            rankCounter = 1;
            rank = 1;
          }
          return { ...r, displayRank: rank };
        });

        setResults(ranked);
        setBets(betsRes.bets || []);
      })
      .catch(() => {
        setResults([]);
        setBets([]);
      })
      .finally(() => setLoading(false));
  }, [raceId]);

  if (loading) {
    return (
      <View style={styles.detailCenter}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const top1 = results.find((r) => r.displayRank === 1 && !r.disqualified);
  const top2 = results.find((r) => r.displayRank === 2 && !r.disqualified);
  const top3 = results.find((r) => r.displayRank === 3 && !r.disqualified);

  return (
    <View style={styles.detailContainer}>
      {/* Status banner */}
      {!isOfficial ? (
        <View style={styles.provisionalBanner}>
          <Ionicons name="time-outline" size={16} color="#f59e0b" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.provisionalTitle}>Kết quả tạm thời — chưa phải kết quả chung cuộc</Text>
            <Text style={styles.provisionalSub}>Báo cáo trọng tài đang chờ Admin duyệt. Kết quả chính thức sẽ được xác nhận sau khi Admin phê duyệt.</Text>
          </View>
        </View>
      ) : (
        <View style={styles.officialBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
          <Text style={[styles.provisionalTitle, { color: '#22c55e', marginLeft: 8, flex: 1 }]}>Kết quả chung cuộc — đã được Admin xác nhận chính thức</Text>
        </View>
      )}

      {/* Podium */}
      {(top1 || top2 || top3) && (
        <View style={styles.podiumSection}>
          <Text style={styles.sectionTitle}>
            {isOfficial ? '🏆 BỤC VINH QUANG CHUNG CUỘC' : '⏱ XẾP HẠNG TẠM THỜI'}
          </Text>
          <View style={styles.podium}>
            {/* 2nd */}
            {top2 ? (
              <View style={styles.podiumSlot}>
                <Text style={styles.podiumName} numberOfLines={2}>{top2.horseId?.name}</Text>
                <Text style={styles.podiumJockey} numberOfLines={1}>{top2.jockeyId?.fullName || 'N/A'}</Text>
                <View style={[styles.podiumBar, { height: 64, backgroundColor: '#94a3b820', borderColor: '#94a3b840' }]}>
                  <View style={[styles.podiumNumCircle, { backgroundColor: '#94a3b8' }]}>
                    <Text style={styles.podiumNum}>2</Text>
                  </View>
                  <Text style={[styles.podiumLabel, { color: '#94a3b8' }]}>HẠNG NHÌ</Text>
                </View>
              </View>
            ) : <View style={styles.podiumSlot} />}

            {/* 1st */}
            {top1 ? (
              <View style={styles.podiumSlot}>
                <Ionicons name="trophy" size={20} color={colors.gold} style={{ alignSelf: 'center', marginBottom: 4 }} />
                <Text style={[styles.podiumName, { fontWeight: '700' }]} numberOfLines={2}>{top1.horseId?.name}</Text>
                <Text style={styles.podiumJockey} numberOfLines={1}>{top1.jockeyId?.fullName || 'N/A'}</Text>
                <View style={[styles.podiumBar, { height: 88, backgroundColor: '#f59e0b18', borderColor: '#f59e0b40' }]}>
                  <View style={[styles.podiumNumCircle, { backgroundColor: colors.gold, width: 32, height: 32 }]}>
                    <Text style={[styles.podiumNum, { fontSize: 15 }]}>1</Text>
                  </View>
                  <Text style={[styles.podiumLabel, { color: colors.gold, fontWeight: '900' }]}>VÔ ĐỊCH</Text>
                </View>
              </View>
            ) : <View style={styles.podiumSlot} />}

            {/* 3rd */}
            {top3 ? (
              <View style={styles.podiumSlot}>
                <Text style={styles.podiumName} numberOfLines={2}>{top3.horseId?.name}</Text>
                <Text style={styles.podiumJockey} numberOfLines={1}>{top3.jockeyId?.fullName || 'N/A'}</Text>
                <View style={[styles.podiumBar, { height: 48, backgroundColor: '#c2410c12', borderColor: '#c2410c30' }]}>
                  <View style={[styles.podiumNumCircle, { backgroundColor: '#c2410c80' }]}>
                    <Text style={styles.podiumNum}>3</Text>
                  </View>
                  <Text style={[styles.podiumLabel, { color: '#c2410c' }]}>HẠNG BA</Text>
                </View>
              </View>
            ) : <View style={styles.podiumSlot} />}
          </View>
        </View>
      )}

      {/* Personal Prediction Outcomes */}
      <View style={styles.betsSection}>
        <Text style={styles.sectionTitle}>✨ KẾT QUẢ DỰ ĐOÁN CỦA BẠN</Text>
        {bets.length === 0 ? (
          <Text style={styles.noBetsText}>Bạn không tham gia dự đoán trong cuộc đua này.</Text>
        ) : (
          bets.map((bet) => {
            const matchedResult = results.find(
              (r) => (r.horseId?._id ?? r.horseId) === (typeof bet.horseId === 'object' ? bet.horseId._id : bet.horseId)
            );
            const isWinner = matchedResult?.displayRank === 1 || bet.status === 'won';
            const isRefunded = bet.status === 'refunded';
            const isCancelled = bet.status === 'cancelled';
            const isLost = bet.status === 'lost' || (matchedResult && matchedResult.displayRank !== 1);

            const horseName = typeof bet.horseId === 'object' ? bet.horseId.name : 'Ngựa đua';

            return (
              <View
                key={bet._id}
                style={[
                  styles.betCard,
                  isWinner ? styles.betWinner : isLost ? styles.betLost : styles.betNeutral,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.betHorseName}>🐎 Ngựa: {horseName}</Text>
                  <Text style={styles.betDetailText}>
                    Tiền đặt: <Text style={{ color: colors.text, fontWeight: '700' }}>{bet.amount.toLocaleString('vi-VN')} xu</Text>
                    {' · '}Hệ số: <Text style={{ color: colors.gold, fontWeight: '700' }}>{bet.multiplier > 0 ? `${bet.multiplier}x` : '—'}</Text>
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 6 }}>
                  {isWinner ? (
                    <>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.betStatusBadgeText, { color: '#22c55e' }]}>THẮNG</Text>
                        <Text style={[styles.betPayoutText, { color: '#22c55e' }]}>
                          +{Math.floor(bet.amount * (bet.multiplier || 1)).toLocaleString('vi-VN')} xu
                        </Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                    </>
                  ) : isRefunded ? (
                    <>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.betStatusBadgeText, { color: '#f59e0b' }]}>HOÀN TIỀN</Text>
                        <Text style={[styles.betPayoutText, { color: '#f59e0b' }]}>
                          +{bet.amount.toLocaleString('vi-VN')} xu
                        </Text>
                      </View>
                      <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                    </>
                  ) : isCancelled ? (
                    <>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.betStatusBadgeText, { color: colors.textMuted }]}>ĐÃ HỦY</Text>
                        <Text style={[styles.betPayoutText, { color: colors.textMuted }]}>
                          {bet.amount.toLocaleString('vi-VN')} xu
                        </Text>
                      </View>
                      <Ionicons name="alert-circle" size={20} color={colors.textMuted} />
                    </>
                  ) : (
                    <>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.betStatusBadgeText, { color: '#f43f5e' }]}>THUA</Text>
                        <Text style={[styles.betPayoutText, { color: '#f43f5e' }]}>
                          -{bet.amount.toLocaleString('vi-VN')} xu
                        </Text>
                      </View>
                      <Ionicons name="close-circle" size={20} color="#f43f5e" />
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Full Rankings Table */}
      {results.length > 0 && (
        <View style={styles.tableSection}>
          <Text style={styles.sectionTitle}>📋 Bảng Xếp Hạng Đầy Đủ</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: 40, textAlign: 'center' }]}>Hạng</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Ngựa</Text>
            <Text style={[styles.tableHeaderCell, { width: 70, textAlign: 'right' }]}>Thời Gian</Text>
            <Text style={[styles.tableHeaderCell, { width: 70, textAlign: 'right' }]}>Thưởng</Text>
          </View>
          {results.map((r) => (
            <View key={r._id} style={styles.tableRow}>
              <View style={{ width: 40, alignItems: 'center' }}>
                <PositionBadge position={r.displayRank ?? r.position} disqualified={r.disqualified} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.tableHorseName} numberOfLines={1}>{r.horseId?.name || '—'}</Text>
                <Text style={styles.tableJockeyName} numberOfLines={1}>{r.jockeyId?.fullName || 'Không có kỵ sĩ'}</Text>
                {r.disqualified && (
                  <Text style={styles.dqLabel}>Bị loại{r.dqReason ? ` — ${r.dqReason}` : ''}</Text>
                )}
              </View>
              <Text style={[styles.tableCell, { width: 70 }]}>{formatFinishTime(r.finishTime)}</Text>
              <Text style={[styles.tableCell, { width: 70, color: colors.gold }]}>
                {r.prizeAmount > 0 ? `${(r.prizeAmount / 1000).toFixed(0)}K` : '—'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {results.length === 0 && (
        <View style={styles.detailCenter}>
          <Text style={styles.emptyText}>Chưa có kết quả</Text>
        </View>
      )}
    </View>
  );
}

function ResultRaceCard({ race }: { race: Race }) {
  const [expanded, setExpanded] = useState(false);
  const isOfficial = race.isOfficial === true;
  const isCancelled = race.status === 'cancelled';

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setExpanded((v) => !v)}
        style={[styles.card, expanded && styles.cardExpanded]}
      >
        {/* Top row: grade + status */}
        <View style={styles.cardTop}>
          <View style={[styles.gradeBadge, { borderColor: GRADE_COLORS[race.grade] + '50', backgroundColor: GRADE_COLORS[race.grade] + '18' }]}>
            <Text style={[styles.gradeText, { color: GRADE_COLORS[race.grade] }]}>{race.grade}</Text>
          </View>

          <View style={styles.cardTopRight}>
            {isCancelled ? (
              <View style={styles.badgeCancelled}>
                <Text style={[styles.badgeText, { color: colors.danger }]}>Đã Hủy</Text>
              </View>
            ) : isOfficial ? (
              <View style={styles.badgeOfficial}>
                <Ionicons name="checkmark-circle" size={11} color="#22c55e" />
                <Text style={[styles.badgeText, { color: '#22c55e', marginLeft: 3 }]}>Chung Cuộc</Text>
              </View>
            ) : (
              <View style={styles.badgeProvisional}>
                <Ionicons name="time-outline" size={11} color="#f59e0b" />
                <Text style={[styles.badgeText, { color: '#f59e0b', marginLeft: 3 }]}>Tạm Thời</Text>
              </View>
            )}
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
          </View>
        </View>

        {/* Race name */}
        <Text style={styles.raceName} numberOfLines={1}>{race.name}</Text>

        {/* Info row */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="flag-outline" size={12} color={colors.textMuted} />
            <Text style={styles.infoText}>{race.distance}m</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={styles.infoText}>{new Date(race.scheduledTime).toLocaleDateString('vi-VN')}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={12} color={colors.gold} />
            <Text style={[styles.infoText, { color: colors.gold, fontWeight: '600' }]}>
              {race.purse?.toLocaleString()} xu
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Inline expanded detail */}
      {expanded && !isCancelled && (
        <RaceDetailExpanded raceId={race._id} isOfficial={isOfficial} />
      )}
      {expanded && isCancelled && (
        <View style={styles.cancelledDetail}>
          <Ionicons name="alert-circle-outline" size={28} color="#f43f5e80" />
          <Text style={styles.cancelledTitle}>Cuộc đua đã bị hủy bỏ</Text>
          <Text style={styles.cancelledSub}>Mọi chi phí cược (nếu có) đã được hoàn trả lại tài khoản.</Text>
        </View>
      )}
    </View>
  );
}

export function ResultsScreen() {
  const navigation = useNavigation();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('All');

  const GRADES = ['All', 'G1', 'G2', 'G3', 'Maiden'];

  const load = useCallback(async () => {
    try {
      const [finishedRes, cancelledRes] = await Promise.all([
        raceService.getRaces({ status: 'finished', limit: 100 }),
        raceService.getRaces({ status: 'cancelled', limit: 30 }),
      ]);
      // Sort: official first, then provisional, then by scheduledTime desc
      const all = [...(finishedRes.races ?? []), ...(cancelledRes.races ?? [])].sort((a, b) => {
        return new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime();
      });
      setRaces(all);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredRaces = races.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.grade.toLowerCase().includes(q);
    const matchGrade = gradeFilter === 'All' || r.grade === gradeFilter;
    return matchSearch && matchGrade;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 Kết Quả Cuộc Đua</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color={colors.textSubtle} style={{ marginRight: 6 }} />
        <TextInput
          placeholder="Tìm tên trận / hạng đua..."
          placeholderTextColor={colors.textSubtle}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.textSubtle} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Grade filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterRow}
      >
        {GRADES.map((g) => (
          <TouchableOpacity
            key={g}
            onPress={() => setGradeFilter(g)}
            activeOpacity={0.7}
            style={[styles.filterPill, gradeFilter === g && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, gradeFilter === g && styles.filterPillTextActive]}>
              {g === 'All' ? 'Tất cả' : g === 'Maiden' ? 'Maiden' : `Hạng ${g}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
              <Text style={styles.emptyText}>Không tìm thấy cuộc đua nào</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },

  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    marginHorizontal: spacing.md, marginTop: spacing.md,
    paddingHorizontal: spacing.sm, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: fontSize.sm, color: colors.text, paddingVertical: 2 },

  // Grade filter
  filterScrollView: {
    flexGrow: 0,
    minHeight: 52,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingRight: spacing.xl,
    paddingVertical: 4,
    gap: 8,
    minHeight: 52,
  },
  filterPill: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.primary + '18',
    borderColor: colors.primary + '60',
  },
  filterPillText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  filterPillTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },

  // List
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.md, paddingTop: spacing.sm },

  // Card
  cardWrapper: {
    borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  card: { padding: spacing.md, gap: spacing.sm },
  cardExpanded: { borderBottomWidth: 0 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Badges
  gradeBadge: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2 },
  gradeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  badgeOfficial: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#22c55e12', borderWidth: 1, borderColor: '#22c55e30',
    borderRadius: radius.sm, paddingHorizontal: 7, paddingVertical: 2,
  },
  badgeProvisional: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f59e0b12', borderWidth: 1, borderColor: '#f59e0b30',
    borderRadius: radius.sm, paddingHorizontal: 7, paddingVertical: 2,
  },
  badgeCancelled: {
    backgroundColor: '#f43f5e12', borderWidth: 1, borderColor: '#f43f5e30',
    borderRadius: radius.sm, paddingHorizontal: 7, paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },

  // Race info
  raceName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  infoRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  infoText: { fontSize: fontSize.xs, color: colors.textMuted },
  infoDivider: { width: 1, height: 10, backgroundColor: colors.border },

  // Expanded detail
  detailContainer: {
    borderTopWidth: 1, borderTopColor: colors.border + '60',
    backgroundColor: colors.bg, padding: spacing.md, gap: spacing.md,
  },
  detailCenter: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg },

  // Status banners
  provisionalBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#f59e0b08', borderWidth: 1, borderColor: '#f59e0b30',
    borderRadius: radius.md, padding: spacing.sm,
  },
  officialBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#22c55e08', borderWidth: 1, borderColor: '#22c55e30',
    borderRadius: radius.md, padding: spacing.sm,
  },
  provisionalTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: '#f59e0b' },
  provisionalSub: { fontSize: 11, color: colors.textMuted, marginTop: 2, lineHeight: 15 },

  // Personal Prediction Section
  betsSection: { gap: spacing.xs },
  noBetsText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  betCard: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  betWinner: { backgroundColor: '#22c55e08', borderColor: '#22c55e30' },
  betLost: { backgroundColor: '#f43f5e08', borderColor: '#f43f5e30' },
  betNeutral: { backgroundColor: colors.surface, borderColor: colors.border },
  betHorseName: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.text },
  betDetailText: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  betStatusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  betPayoutText: { fontSize: 12, fontWeight: '800' },

  // Podium
  podiumSection: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: spacing.sm, paddingTop: spacing.sm },
  podiumSlot: { flex: 1, alignItems: 'center', gap: 4 },
  podiumName: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },
  podiumJockey: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  podiumBar: {
    width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8,
    borderWidth: 1, alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 6,
  },
  podiumNumCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#94a3b8',
  },
  podiumNum: { fontSize: 13, fontWeight: '800', color: 'white' },
  podiumLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

  // Full table
  tableSection: { gap: spacing.xs },
  tableHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, paddingVertical: 6, paddingHorizontal: 4,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
  },
  tableHeaderCell: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: colors.border + '50',
  },
  tableHorseName: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text },
  tableJockeyName: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  dqLabel: { fontSize: 10, color: '#f43f5e', fontWeight: '600', marginTop: 2 },
  tableCell: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'right' },

  // Positions
  posBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  posBadgeText: { fontSize: 11, fontWeight: '800' },

  // Cancelled detail
  cancelledDetail: {
    borderTopWidth: 1, borderTopColor: colors.border + '60',
    backgroundColor: '#f43f5e08', padding: spacing.lg, alignItems: 'center', gap: spacing.xs,
  },
  cancelledTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
  cancelledSub: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },

  // Common
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
});
