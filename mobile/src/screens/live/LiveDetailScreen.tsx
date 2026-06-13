import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { raceService } from '../../services/api/race.service';
import { betService } from '../../services/api/bet.service';
import { useRaceSocket } from '../../hooks/useRaceSocket';
import { RaceTrack } from '../../components/common/RaceTrack';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

const GRADE_COLORS: Record<string, string> = {
  G1: '#8F7318', G2: '#8C2F1B', G3: '#1F3D2B', Maiden: '#7A7468',
};

export function LiveDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { raceId } = route.params;
  const { accessToken } = useAuthStore();

  const [race, setRace] = useState<any>(null);
  const [lineup, setLineup] = useState<any[]>([]);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [dbResults, setDbResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Connect socket
  const {
    phase,
    horses,
    positions,
    results: socketResults,
    elapsed,
    total,
  } = useRaceSocket(raceId, accessToken);

  // Load race data & user's bets for this race
  useEffect(() => {
    if (!raceId) return;
    setLoading(true);

    Promise.all([
      raceService.getRaceById(raceId),
      raceService.getRaceHorses(raceId),
      betService.getMyBets({ limit: 100 }),
    ])
      .then(async ([raceData, horsesData, betsData]) => {
        setRace(raceData);
        setLineup(horsesData.horses ?? []);
        
        // Filter bets for this race
        const filtered = (betsData.bets ?? []).filter((b: any) => {
          const bid = typeof b.raceId === 'object' ? b.raceId._id : b.raceId;
          return bid === raceId;
        });
        setMyBets(filtered);

        // If race is already finished, fetch historical results
        if (raceData.status === 'finished') {
          try {
            const resultsRes = await raceService.getRaceResults(raceId);
            setDbResults(resultsRes.results ?? []);
          } catch (err) {
            // silent
          }
        }
      })
      .catch((err) => {
        Alert.alert('Lỗi', err?.message || 'Không thể tải chi tiết cuộc đua');
      })
      .finally(() => setLoading(false));
  }, [raceId]);

  // Load results from backend if the phase changes to finished via socket
  useEffect(() => {
    if (phase === 'finished' && race?.status !== 'finished') {
      raceService.getRaceResults(raceId)
        .then((res) => setDbResults(res.results ?? []))
        .catch(() => {});
    }
  }, [phase]);

  // Handle visual effects when finished (win notifications)
  const isFinished = phase === 'finished' || race?.status === 'finished';
  const displayResults = dbResults.length > 0 ? dbResults : socketResults;
  const showPodium = isFinished && displayResults.length > 0;
  const hasBets = myBets.length > 0;

  useEffect(() => {
    if (isFinished && displayResults.length > 0 && hasBets) {
      // Check if user won
      const pendingBets = myBets.filter((b) => b.status === 'pending');
      if (pendingBets.length === 0) return; // already processed or loaded as finished

      const wonBet = pendingBets.find((b) => {
        const result = displayResults.find((r) => (r.horseId?._id || r.horseId) === (b.horseId?._id || b.horseId));
        if (!result) return false;
        const pos = result.position;
        return (
          (b.betType === 'win' && pos === 1) ||
          (b.betType === 'place' && pos <= 2) ||
          (b.betType === 'show' && pos <= 3)
        );
      });

      if (wonBet) {
        Alert.alert('🎉 CHÚC MỪNG!', `Bạn đã đặt cược thắng cho chú ngựa! Hãy kiểm tra ví để xem tiền thưởng.`);
      }
    }
  }, [isFinished, dbResults, socketResults]);

  // Map horses for RaceTrack component
  const trackHorses = (() => {
    if (isFinished && displayResults.length > 0) {
      return displayResults.map((r, i) => {
        const horseId = r.horseId?._id || r.horseId;
        const horseName = typeof r.horseId === 'object' ? r.horseId.name : (r.horseName || 'Ngựa');
        return {
          horseId: horseId,
          horseName: horseName,
          progressPct: 100,
          colorIdx: i,
          currentRank: r.position,
          isMyBet: myBets.some(b => {
            const bid = b.horseId?._id || b.horseId;
            return bid === horseId;
          }),
        };
      });
    }

    if (phase === 'racing' && positions.length > 0) {
      return positions.map((p, i) => ({
        horseId: p.horseId,
        horseName: p.horseName,
        progressPct: p.progressPct,
        colorIdx: i,
        currentRank: p.rank,
        isMyBet: myBets.some(b => {
          const bid = b.horseId?._id || b.horseId;
          return bid === p.horseId;
        }),
      }));
    }

    // Default pre-race
    return lineup.map((h, i) => {
      const hid = typeof h.horseId === 'object' ? h.horseId?._id : h.horseId;
      const hname = typeof h.horseId === 'object' ? h.horseId?.name : h.horseName;
      return {
        horseId: hid,
        horseName: hname || 'Ngựa',
        progressPct: 0,
        colorIdx: i,
        currentRank: i + 1,
        isMyBet: myBets.some(b => {
          const bid = b.horseId?._id || b.horseId;
          return bid === hid;
        }),
      };
    });
  })();

  const progressPct = total > 0 ? (elapsed / total) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle} numberOfLines={1}>{race?.name ?? 'Chi Tiết Trực Tiếp'}</Text>
          <View style={styles.metaRow}>
            {race && (
              <Text style={[styles.gradeText, { color: GRADE_COLORS[race.grade] }]}>
                {race.grade}
              </Text>
            )}
            <Text style={styles.metaDivider}>·</Text>
            <Text style={styles.distanceText}>{race?.distance}m</Text>
          </View>
        </View>
        <View style={styles.phaseBadge}>
          {race?.status === 'finished' || phase === 'finished' ? (
            <View style={[styles.badgeContainer, { backgroundColor: colors.successDim, borderColor: colors.success + '30' }]}>
              <Ionicons name="flag" size={10} color={colors.success} />
              <Text style={[styles.badgeText, { color: colors.success }]}>Kết thúc</Text>
            </View>
          ) : phase === 'racing' ? (
            <View style={[styles.badgeContainer, { backgroundColor: colors.dangerDim, borderColor: colors.danger + '30' }]}>
              <View style={[styles.badgeDot, { backgroundColor: colors.danger }]} />
              <Text style={[styles.badgeText, { color: colors.danger }]}>TRỰC TIẾP</Text>
            </View>
          ) : (
            <View style={[styles.badgeContainer, { backgroundColor: colors.accentDim, borderColor: colors.accentBorder }]}>
              <View style={[styles.badgeDot, { backgroundColor: colors.gold }]} />
              <Text style={[styles.badgeText, { color: colors.gold }]}>Chuẩn bị</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Race Track */}
        <View style={styles.trackCard}>
          <RaceTrack
            horses={trackHorses}
            raceName={race?.name}
            distance={race?.distance}
          />
        </View>

        {/* Live Timer */}
        {phase === 'racing' && race?.status !== 'finished' && (
          <View style={styles.timerCard}>
            <View style={styles.timerHeader}>
              <View style={styles.timerTitleRow}>
                <Ionicons name="time" size={16} color={colors.secondary} />
                <Text style={styles.timerTitle}>Tiến trình cuộc đua</Text>
              </View>
              <Text style={styles.timerText}>{elapsed}s / {total}s</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
          </View>
        )}

        {/* Podium section */}
        {showPodium && (
          <View style={styles.podiumCard}>
            <Text style={styles.sectionTitle}>🏆 Kết Quả Chung Cuộc</Text>
            <View style={styles.podiumRow}>
              {/* 2nd Place */}
              {displayResults[1] && (
                <View style={styles.podiumCol}>
                  <Text style={styles.podiumHorseName} numberOfLines={1}>
                    {typeof displayResults[1].horseId === 'object' ? displayResults[1].horseId.name : (displayResults[1].horseName || 'Ngựa')}
                  </Text>
                  <Text style={styles.podiumPrize}>+{displayResults[1].prizeAmount?.toLocaleString() ?? 0} xu</Text>
                  <View style={[styles.podiumBlock, styles.podiumSilver]}>
                    <Text style={styles.podiumRankText}>2</Text>
                    <Text style={styles.podiumLabel}>HẠNG 2</Text>
                  </View>
                </View>
              )}

              {/* 1st Place */}
              {displayResults[0] && (
                <View style={[styles.podiumCol, { marginTop: -16 }]}>
                  <Ionicons name="trophy" size={24} color={colors.gold} style={{ marginBottom: 4 }} />
                  <Text style={[styles.podiumHorseName, { fontWeight: 'bold' }]} numberOfLines={1}>
                    {typeof displayResults[0].horseId === 'object' ? displayResults[0].horseId.name : (displayResults[0].horseName || 'Ngựa')}
                  </Text>
                  <Text style={[styles.podiumPrize, { color: colors.gold, fontWeight: 'bold' }]}>
                    +{displayResults[0].prizeAmount?.toLocaleString() ?? 0} xu
                  </Text>
                  <View style={[styles.podiumBlock, styles.podiumGold]}>
                    <Text style={styles.podiumRankText}>1</Text>
                    <Text style={[styles.podiumLabel, { color: '#6A5310' }]}>VÔ ĐỊCH</Text>
                  </View>
                </View>
              )}

              {/* 3rd Place */}
              {displayResults[2] && (
                <View style={styles.podiumCol}>
                  <Text style={styles.podiumHorseName} numberOfLines={1}>
                    {typeof displayResults[2].horseId === 'object' ? displayResults[2].horseId.name : (displayResults[2].horseName || 'Ngựa')}
                  </Text>
                  <Text style={styles.podiumPrize}>+{displayResults[2].prizeAmount?.toLocaleString() ?? 0} xu</Text>
                  <View style={[styles.podiumBlock, styles.podiumBronze]}>
                    <Text style={styles.podiumRankText}>3</Text>
                    <Text style={styles.podiumLabel}>HẠNG 3</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Dynamic Leaderboard or Lineup list */}
        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>
            {isFinished ? '🏁 Bảng Xếp Hạng Đầy Đủ' : phase === 'racing' ? '🏃 Bảng Xếp Hạng Trực Tiếp' : '👥 Danh Sách Đua'}
          </Text>

          {phase === 'racing' && positions.length > 0 && !isFinished ? (
            <View style={styles.leaderboardList}>
              {positions.map((pos) => {
                const isMyHorse = myBets.some((b) => (b.horseId?._id || b.horseId) === pos.horseId);
                return (
                  <View key={pos.horseId} style={[styles.leaderboardRow, isMyHorse && styles.rowMyBet]}>
                    <View style={[styles.rankBox, pos.rank <= 3 ? styles.rankTop3 : styles.rankDefault]}>
                      <Text style={[styles.rankText, pos.rank <= 3 && { color: '#FFF' }]}>{pos.rank}</Text>
                    </View>
                    <Text style={styles.rowHorseEmoji}>🐎</Text>
                    <Text style={[styles.rowHorseName, isMyHorse && { fontWeight: 'bold', color: colors.secondary }]} numberOfLines={1}>
                      {pos.horseName}
                    </Text>
                    {isMyHorse && <Text style={styles.starHighlight}>★</Text>}
                    <View style={styles.pctWrapper}>
                      <View style={styles.miniProgress}>
                        <View style={[styles.miniProgressFill, { width: `${pos.progressPct}%` }]} />
                      </View>
                      <Text style={styles.pctLabel}>{pos.progressPct.toFixed(0)}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : isFinished && displayResults.length > 0 ? (
            <View style={styles.leaderboardList}>
              {displayResults.map((r) => {
                const rHorseId = r.horseId?._id || r.horseId;
                const rHorseName = typeof r.horseId === 'object' ? r.horseId.name : (r.horseName || 'Ngựa');
                const isMyHorse = myBets.some((b) => (b.horseId?._id || b.horseId) === rHorseId);
                return (
                  <View key={rHorseId} style={[styles.leaderboardRow, isMyHorse && styles.rowMyBet]}>
                    <View style={[
                      styles.rankBox,
                      r.position === 1 ? styles.rank1 : r.position === 2 ? styles.rank2 : r.position === 3 ? styles.rank3 : styles.rankDefault
                    ]}>
                      <Text style={[styles.rankText, r.position <= 3 && { color: '#FFF' }]}>{r.position}</Text>
                    </View>
                    <Text style={styles.rowHorseEmoji}>🐎</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.rowHorseName, isMyHorse && { fontWeight: 'bold', color: colors.secondary }]} numberOfLines={1}>
                        {rHorseName}
                      </Text>
                      {r.jockeyId?.fullName || r.jockeyName ? (
                        <Text style={styles.rowJockeyName}>{r.jockeyId?.fullName || r.jockeyName}</Text>
                      ) : null}
                    </View>
                    {isMyHorse && <Text style={[styles.starHighlight, { marginRight: spacing.sm }]}>★</Text>}
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.finishTimeText}>
                        {r.finishTime > 0 ? `${(r.finishTime / 1000).toFixed(2)}s` : '—'}
                      </Text>
                      {r.prizeAmount > 0 ? (
                        <Text style={styles.prizeAmountText}>+{r.prizeAmount.toLocaleString()} xu</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            /* Pre race lineup */
            <View style={styles.leaderboardList}>
              {lineup.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có ngựa đăng ký tham gia</Text>
              ) : (
                lineup.map((h, i) => {
                  const hid = typeof h.horseId === 'object' ? h.horseId?._id : h.horseId;
                  const hname = typeof h.horseId === 'object' ? h.horseId?.name : h.horseName;
                  const jname = typeof h.jockeyId === 'object' ? h.jockeyId?.fullName : h.jockeyName;
                  const currentGrade = typeof h.horseId === 'object' ? h.horseId?.currentGrade : h.currentGrade;
                  const horseKey = h._id || h.registrationId || hid || String(i);

                  const isMyHorse = myBets.some((b) => {
                    const bid = b.horseId?._id || b.horseId;
                    return bid === hid;
                  });

                  return (
                    <View key={horseKey} style={[styles.leaderboardRow, isMyHorse && styles.rowMyBet]}>
                      <View style={[styles.rankBox, styles.rankDefault]}>
                        <Text style={styles.rankText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.rowHorseEmoji}>🐎</Text>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.rowHorseName, isMyHorse && { fontWeight: 'bold', color: colors.secondary }]} numberOfLines={1}>
                          {hname}
                        </Text>
                        {jname ? <Text style={styles.rowJockeyName}>{jname}</Text> : null}
                      </View>
                      <View style={styles.badgeLabelContainer}>
                        <Text style={styles.gradeBadgeText}>{currentGrade ?? 'Maiden'}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* User's Bets list */}
        {hasBets && (
          <View style={styles.listCard}>
            <Text style={styles.sectionTitle}>⭐ Cược của bạn</Text>
            {myBets.map((bet) => {
              const rHorseId = bet.horseId?._id || bet.horseId;
              const result = displayResults.find((r) => (r.horseId?._id || r.horseId) === rHorseId);
              const pos = result?.position;
              
              // Determine status
              const betWon = pos !== undefined && (
                (bet.betType === 'win' && pos === 1) ||
                (bet.betType === 'place' && pos <= 2) ||
                (bet.betType === 'show' && pos <= 3)
              );

              const betStatus = bet.status === 'refunded' ? 'REFUND' : bet.status === 'cancelled' ? 'CANCELLED' : isFinished ? (betWon ? 'THẮNG' : 'THUA') : 'ĐANG CHỜ';
              const betStatusColor = bet.status === 'refunded' ? colors.warning : bet.status === 'cancelled' ? colors.textMuted : betWon ? colors.success : colors.danger;

              return (
                <View key={bet._id} style={styles.betItem}>
                  <View style={styles.betTop}>
                    <Text style={styles.betHorseName}>
                      🐎 {typeof bet.horseId === 'object' ? bet.horseId?.name : (bet.horseName || 'Ngựa')}
                    </Text>
                    <View style={[
                      styles.outcomeBadge,
                      { backgroundColor: betStatus === 'THẮNG' ? colors.successDim : betStatus === 'THUA' ? colors.dangerDim : colors.warningDim }
                    ]}>
                      <Text style={[styles.outcomeText, { color: betStatusColor }]}>
                        {betStatus}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.betBottom}>
                    <Text style={styles.betMeta}>
                      Loại: {bet.betType === 'win' ? 'Thắng' : bet.betType === 'place' ? 'Top 2' : 'Top 3'}
                    </Text>
                    <Text style={styles.betAmount}>Cược: {bet.amount} coins</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  backBtn: { padding: 4 },
  titleWrapper: { flex: 1, marginHorizontal: spacing.md },
  headerTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  gradeText: { fontSize: 11, fontWeight: fontWeight.bold },
  metaDivider: { color: colors.textSubtle, marginHorizontal: 4 },
  distanceText: { fontSize: 11, color: colors.textMuted },
  phaseBadge: { alignSelf: 'center' },
  badgeContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 9, fontWeight: fontWeight.bold },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },

  trackCard: {},
  timerCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  timerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
  timerText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.secondary, fontFamily: 'monospace' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.bgSecondary, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.secondary },

  // List Views
  listCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.md, fontFamily: 'serif' },
  leaderboardList: { gap: spacing.sm },
  leaderboardRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.bg,
  },
  rowMyBet: { backgroundColor: colors.accentDim, marginHorizontal: -spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.sm },
  rankBox: { width: 22, height: 22, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  rankTop3: { backgroundColor: colors.secondary },
  rankDefault: { backgroundColor: colors.bgSecondary },
  rankText: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.text },
  rowHorseEmoji: { fontSize: 14 },
  rowHorseName: { fontSize: fontSize.sm, flex: 1, color: colors.text },
  rowJockeyName: { fontSize: 10, color: colors.textSubtle, marginTop: 2 },
  starHighlight: { color: colors.gold, fontSize: 14 },
  badgeLabelContainer: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  gradeBadgeText: { fontSize: 9, color: colors.textMuted },
  emptyText: { textAlign: 'center', color: colors.textSubtle, paddingVertical: spacing.md },

  // Racing specific elements
  pctWrapper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  miniProgress: { width: 40, height: 4, backgroundColor: colors.bgSecondary, borderRadius: 2, overflow: 'hidden' },
  miniProgressFill: { height: '100%', backgroundColor: colors.primary },
  pctLabel: { width: 26, textAlign: 'right', fontSize: 9, fontFamily: 'monospace', color: colors.textSubtle },

  // Finished specific elements
  rank1: { backgroundColor: '#C9A227' },
  rank2: { backgroundColor: '#7A7468' },
  rank3: { backgroundColor: '#8C2F1B' },
  finishTimeText: { fontSize: 10, color: colors.textSubtle, fontFamily: 'monospace' },
  prizeAmountText: { fontSize: 10, color: colors.gold, fontWeight: fontWeight.bold, marginTop: 2 },

  // Podium
  podiumCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  podiumRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', marginTop: spacing.md, paddingBottom: spacing.sm },
  podiumCol: { alignItems: 'center', width: 90 },
  podiumHorseName: { fontSize: 11, color: colors.text, maxWidth: 84, textAlign: 'center', marginBottom: 2 },
  podiumPrize: { fontSize: 10, color: colors.textMuted, marginBottom: 6 },
  podiumBlock: { width: 80, borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm, alignItems: 'center', paddingTop: 8 },
  podiumGold: { height: 72, backgroundColor: '#E5C95A' },
  podiumSilver: { height: 52, backgroundColor: '#A39C8C' },
  podiumBronze: { height: 38, backgroundColor: '#DCA17A' },
  podiumRankText: { fontSize: 16, fontWeight: fontWeight.extrabold, color: '#FFF' },
  podiumLabel: { fontSize: 8, color: '#FFFFFF', fontWeight: fontWeight.bold, marginTop: 4, letterSpacing: 0.5 },

  // User bets
  betItem: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  betTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  betHorseName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  outcomeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  outcomeText: { fontSize: 9, fontWeight: fontWeight.bold },
  betBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  betMeta: { fontSize: fontSize.xs, color: colors.textSubtle },
  betAmount: { fontSize: fontSize.xs, color: colors.textMuted },
});
