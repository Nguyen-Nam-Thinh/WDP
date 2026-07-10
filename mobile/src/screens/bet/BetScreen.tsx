import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Modal,
  TextInput, Alert, ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { raceService } from '../../services/api/race.service';
import { betService, RaceOddsResponse } from '../../services/api/bet.service';
import { Race, RaceHorse, Bet } from '../../types';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';
import { RACE_STATUS_LABEL } from '../../constants/api';
import Ionicons from '@expo/vector-icons/Ionicons';

const GRADE_COLORS: Record<string, string> = {
  G1: '#8F7318', G2: '#8C2F1B', G3: '#1F3D2B', Maiden: '#7A7468',
};

// ── Place Bet Modal ──────────────────────────────────────────────────────────
function PlaceBetModal({
  visible, race, onClose, onSuccess,
}: {
  visible: boolean;
  race: Race | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [horses, setHorses] = useState<RaceHorse[]>([]);
  const [loadingHorses, setLoadingHorses] = useState(false);
  const [selectedHorse, setSelectedHorse] = useState('');
  const [amount, setAmount] = useState('');
  const [placing, setPlacing] = useState(false);
  const [myPredictions, setMyPredictions] = useState<Bet[]>([]);
  const [raceOdds, setRaceOdds] = useState<RaceOddsResponse | null>(null);

  /** Lấy estimated multiplier của ngựa từ pool hiện tại */
  const getHorseOdds = (horseId: string) => {
    const horse = raceOdds?.horses?.find((h) => h.horseId === horseId);
    return horse?.estimatedMultiplier ?? raceOdds?.horses?.length
      ? (raceOdds!.totalPool === 0 ? 3 : 3)  // fallback default
      : 3;
  };

  const getHorseWinProb = (horseId: string) => {
    const horse = raceOdds?.horses?.find((h) => h.horseId === horseId);
    return horse?.winProb ?? null;
  };

  const loadPredictions = async () => {
    if (!race) return;
    try {
      const res = await betService.getMyBets({ raceId: race._id, limit: 50 });
      setMyPredictions(res.bets ?? []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (!visible || !race) return;
    setSelectedHorse('');
    setAmount('');
    setLoadingHorses(true);
    setMyPredictions([]);
    setRaceOdds(null);

    raceService.getRaceHorses(race._id)
      .then((res) => setHorses(res.horses ?? []))
      .catch(() => {})
      .finally(() => setLoadingHorses(false));

    betService.getRaceOdds(race._id)
      .then((res) => setRaceOdds(res))
      .catch(() => setRaceOdds(null));

    loadPredictions();
  }, [visible, race]);

  const handlePlace = async () => {
    if (!race || !selectedHorse) { Alert.alert('Lỗi', 'Chọn ngựa trước'); return; }
    const amt = Number(amount);
    if (!amt || amt < 1) { Alert.alert('Lỗi', 'Số tiền tối thiểu là 1'); return; }
    setPlacing(true);
    try {
      const result = await betService.place({ raceId: race._id, horseId: selectedHorse, amount: amt });
      const estimated = result.estimatedMultiplier ?? getHorseOdds(selectedHorse);
      Alert.alert(
        '✅ Dự Đoán Thành Công',
        `Odds ước tính: x${estimated}\n⚠️ Odds thực tế sẽ được tính khi race kết thúc`,
      );
      onSuccess();
      loadPredictions();
      setSelectedHorse('');
      setAmount('');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Dự đoán thất bại');
    } finally {
      setPlacing(false);
    }
  };

  const estimatedPayout = (() => {
    if (!amount || Number(amount) <= 0 || !selectedHorse) return null;
    const odds = getHorseOdds(selectedHorse);
    return Math.floor(Number(amount) * odds);
  })();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={[modal.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={modal.handle} />
          <View style={modal.header}>
            <Text style={modal.title}>Dự Đoán</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>
          {race && <Text style={modal.raceName} numberOfLines={1}>{race.name}</Text>}

          {/* Pool info */}
          {raceOdds && (
            <View style={modal.poolInfo}>
              <Ionicons name="wallet-outline" size={13} color={colors.textMuted} />
              <Text style={modal.poolText}>
                Pool hiện tại: <Text style={{ color: colors.gold, fontWeight: 'bold' }}>{raceOdds.totalPool.toLocaleString()} coins</Text>
                {'  '}·  Rake 10%
              </Text>
            </View>
          )}

          <View style={{ flex: 1, overflow: 'hidden' }}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {/* My Predictions */}
              {myPredictions.length > 0 && (
                <View style={modal.myBetsContainer}>
                  <Text style={modal.myBetsTitle}>🌟 Dự đoán của bạn trong cuộc đua này:</Text>
                  {myPredictions.map((b) => {
                    const hid = typeof b.horseId === 'object' ? b.horseId?._id : b.horseId;
                    const hname = typeof b.horseId === 'object' ? b.horseId?.name : '';
                    const hr = horses.find(h => (typeof h.horseId === 'object' ? h.horseId?._id : h.horseId) === hid);
                    const gateNo = hr ? (hr.gateNumber || (horses.indexOf(hr) + 1)) : '?';
                    return (
                      <View key={b._id} style={modal.myBetItem}>
                        <Text style={modal.myBetText}>
                          Ngựa số {gateNo} ({hname})
                        </Text>
                        <Text style={modal.myBetAmount}>{b.amount} coins</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Horse list */}
              <Text style={modal.label}>Chọn Ngựa</Text>
              {loadingHorses
                ? <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.md }} />
                : horses.length === 0
                  ? <Text style={modal.empty}>Chưa có ngựa đăng ký</Text>
                  : horses.map((h, idx) => {
                    const hid = typeof h.horseId === 'object' ? h.horseId?._id : h.horseId;
                    const hname = typeof h.horseId === 'object' ? h.horseId?.name : h.horseName;
                    const jname = typeof h.jockeyId === 'object' ? h.jockeyId?.fullName : h.jockeyName;
                    const currentGrade = typeof h.horseId === 'object' ? h.horseId?.currentGrade : (h.currentGrade ?? 'Maiden');
                    const horseKey = h._id || h.registrationId || hid || String(idx);

                    const winRate = typeof h.horseId === 'object' ? (h.horseId as any)?.winRate : h.winRate;
                    const totalPoints = typeof h.horseId === 'object' ? (h.horseId as any)?.totalPoints : h.totalPoints;
                    const jockeyExp = typeof h.jockeyId === 'object' ? (h.jockeyId as any)?.jockeyProfile?.experienceYears : h.jockeyExperience;
                    const breed = typeof h.horseId === 'object' ? (h.horseId as any)?.breed : h.breed;
                    const winRatePct = winRate != null ? `${Math.round(winRate)}%` : null;

                    const estimatedMult = hid ? getHorseOdds(hid) : 3;
                    const winProb = hid ? getHorseWinProb(hid) : null;

                    return (
                      <TouchableOpacity
                        key={horseKey}
                        style={[modal.horseRow, selectedHorse === hid && modal.horseRowSelected]}
                        onPress={() => { if (hid) setSelectedHorse(hid); }}
                      >
                        <View style={modal.horseLeft}>
                          <View style={modal.horseTopRow}>
                            <Text style={modal.horseName}>
                              Ngựa số {h.gateNumber || (idx + 1)} — {hname}
                            </Text>
                            <View style={modal.oddsTag}>
                              <Text style={modal.oddsTagText}>x{estimatedMult}</Text>
                            </View>
                            <View style={[modal.gradeBadge, { borderColor: (GRADE_COLORS[currentGrade || 'Maiden'] ?? '#fff') + '60' }]}>
                              <Text style={[modal.gradeText, { color: GRADE_COLORS[currentGrade || 'Maiden'] ?? '#fff' }]}>
                                {currentGrade}
                              </Text>
                            </View>
                          </View>
                          <View style={modal.statsRow}>
                            {totalPoints != null && (
                              <Text style={modal.statChip}>🏅 {totalPoints} điểm</Text>
                            )}
                            {winRatePct && (
                              <Text style={modal.statChip}>🏆 {winRatePct}</Text>
                            )}
                            {winProb != null && (
                              <Text style={modal.statChip}>📊 {winProb}% thắng</Text>
                            )}
                            {breed ? (
                              <Text style={modal.statChip}>{breed}</Text>
                            ) : null}
                          </View>
                          {jname ? (
                            <Text style={modal.jockeyName}>
                              🏇 {jname}{jockeyExp != null ? ` · ${jockeyExp} năm KN` : ''}
                            </Text>
                          ) : null}
                        </View>
                        {selectedHorse === hid && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
                      </TouchableOpacity>
                    );
                  })
              }

              {/* Amount */}
              <Text style={[modal.label, { marginTop: spacing.md }]}>Số Tiền (coins)</Text>
              <View style={modal.amountRow}>
                <Ionicons name="cash-outline" size={18} color={colors.textSubtle} />
                <TextInput
                  style={modal.amountInput}
                  value={amount}
                  onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
                  placeholder="Nhập số tiền..."
                  placeholderTextColor={colors.textSubtle}
                  keyboardType="number-pad"
                />
              </View>

              {/* Quick amounts */}
              <View style={modal.quickRow}>
                {[10, 50, 100, 500].map((v) => (
                  <TouchableOpacity key={v} style={modal.quickBtn} onPress={() => setAmount(String(v))}>
                    <Text style={modal.quickBtnText}>+{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Estimated payout */}
              {estimatedPayout !== null && (
                <View style={modal.payoutBox}>
                  <View>
                    <Text style={modal.payoutLabel}>Ước tính nhận (nếu thắng):</Text>
                    <Text style={modal.payoutNote}>⚠️ Odds thực tế tính sau khi race kết thúc</Text>
                  </View>
                  <Text style={modal.payoutValue}>~{estimatedPayout} coins</Text>
                </View>
              )}

              <TouchableOpacity style={modal.placeBtn} onPress={handlePlace} disabled={placing}>
                {placing
                  ? <ActivityIndicator color="#000" />
                  : <Text style={modal.placeBtnText}>Xác Nhận Dự Đoán</Text>
                }
              </TouchableOpacity>
              <View style={{ height: 120 }} />
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    height: '80%', paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  raceName: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2, marginBottom: 4 },
  poolInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceHover, borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 5, marginBottom: spacing.md, alignSelf: 'flex-start',
  },
  poolText: { fontSize: fontSize.xs, color: colors.textMuted },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textMuted, marginBottom: spacing.sm },
  empty: { color: colors.textSubtle, fontSize: fontSize.sm, textAlign: 'center', paddingVertical: spacing.md },
  horseRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, marginBottom: spacing.sm,
  },
  horseRowSelected: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  horseLeft: { flex: 1 },
  horseTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', marginBottom: 3 },
  horseName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text, flexShrink: 1 },
  oddsTag: {
    backgroundColor: colors.accent + '25', borderRadius: radius.sm,
    paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: colors.accent + '60',
  },
  oddsTagText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.accent },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center', marginBottom: 3 },
  statChip: { fontSize: fontSize.xs, color: colors.textMuted, backgroundColor: colors.surfaceHover, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  jockeyName: { fontSize: fontSize.xs, color: colors.textMuted },
  gradeBadge: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  gradeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  amountRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50,
  },
  amountInput: { flex: 1, color: colors.text, fontSize: fontSize.md },
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  quickBtn: {
    flex: 1, paddingVertical: 8, borderRadius: radius.md,
    backgroundColor: colors.surfaceHover, alignItems: 'center',
  },
  quickBtnText: { fontSize: fontSize.xs, color: colors.textMuted },
  payoutBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.successDim, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md,
  },
  payoutLabel: { color: colors.textMuted, fontSize: fontSize.sm },
  payoutNote: { color: colors.textSubtle, fontSize: fontSize.xs, marginTop: 2 },
  payoutValue: { color: colors.success, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  placeBtn: {
    backgroundColor: colors.accent, borderRadius: radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg,
  },
  placeBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: '#FFFFFF' },
  myBetsContainer: {
    backgroundColor: colors.surfaceHover, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  myBetsTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.xs },
  myBetItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  myBetText: { fontSize: fontSize.xs, color: colors.text },
  myBetAmount: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.gold },
});

const getRemainingTimeText = (scheduledTime: string | Date): string => {
  const diffMs = new Date(scheduledTime).getTime() - new Date().getTime();
  if (diffMs <= 0) return 'Đã bắt đầu';
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return `Còn ${diffDays} ngày ${diffHours % 24}g`;
  if (diffHours > 0) return `Còn ${diffHours}g ${diffMins % 60}p`;
  return `Còn ${diffMins}p`;
};

// ── Bet Card ─────────────────────────────────────────────────────────────────
function BetCard({ bet, onCancel }: { bet: Bet; onCancel: (id: string) => void }) {
  const navigation = useNavigation<any>();
  const statusColor = bet.status === 'won' ? colors.success
    : bet.status === 'lost' ? colors.danger
    : bet.status === 'pending' ? colors.warning
    : colors.textMuted;

  const statusLabel: Record<string, string> = {
    pending: 'Đang Chờ', won: 'Thắng 🎉', lost: 'Thua', cancelled: 'Đã Hủy', refunded: 'Hoàn Tiền',
  };

  const raceId = typeof bet.raceId === 'object' ? bet.raceId._id : bet.raceId;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        if (raceId) {
          navigation.navigate('LiveTab', { screen: 'LiveDetail', params: { raceId } });
        }
      }}
    >
      <View style={betCard.card}>
        <View style={betCard.top}>
          <Text style={betCard.raceName} numberOfLines={1}>{(bet.raceId as any)?.name ?? '—'}</Text>
          <View style={[betCard.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '40' }]}>
            <Text style={[betCard.statusText, { color: statusColor }]}>{statusLabel[bet.status]}</Text>
          </View>
        </View>
        <Text style={betCard.horseName}>🐎 {(bet.horseId as any)?.name ?? '—'}</Text>
        <View style={betCard.row}>
          <Text style={betCard.meta}>
            {bet.status === 'pending'
              ? 'Chờ kết quả race...'
              : bet.multiplier > 0
                ? `x${bet.multiplier} (parimutuel)`
                : 'Hoàn tiền'}
          </Text>
          <Text style={betCard.amount}>{bet.amount} coins</Text>
        </View>
        {bet.status === 'won' && (
          <Text style={betCard.payout}>+{bet.payoutAmount} coins nhận được</Text>
        )}
        {bet.status === 'pending' && (
          <TouchableOpacity style={betCard.cancelBtn} onPress={() => onCancel(bet._id)}>
            <Text style={betCard.cancelText}>Hủy Dự Đoán</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const betCard = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md, gap: 6,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  raceName: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text, marginRight: spacing.sm },
  statusBadge: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  horseName: { fontSize: fontSize.sm, color: colors.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: fontSize.xs, color: colors.textSubtle },
  amount: { fontSize: fontSize.sm, color: colors.gold, fontWeight: 'bold' },
  payout: { fontSize: fontSize.sm, color: colors.success, fontWeight: fontWeight.semibold },
  cancelBtn: {
    borderWidth: 1, borderColor: colors.danger + '60', borderRadius: radius.sm,
    paddingVertical: 6, alignItems: 'center', marginTop: 4,
  },
  cancelText: { color: colors.danger, fontSize: fontSize.xs, fontWeight: fontWeight.medium },
});

// ── BetScreen ─────────────────────────────────────────────────────────────────
type Tab = 'open' | 'history';

export function BetScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;
  const tabHeight = 60 + bottomPadding;

  const [tab, setTab] = useState<Tab>('open');
  const [openRaces, setOpenRaces] = useState<Race[]>([]);
  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: {
        display: modalVisible ? 'none' : 'flex',
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        paddingBottom: bottomPadding,
        paddingTop: 8,
        height: tabHeight,
      }
    });
  }, [modalVisible, navigation, bottomPadding, tabHeight]);

  const loadData = useCallback(async () => {
    try {
      const [racesRes, betsRes] = await Promise.all([
        raceService.getRaces({ status: 'open', limit: 50 }),
        betService.getMyBets({ limit: 50 }),
      ]);
      setOpenRaces(racesRes.races ?? []);
      setMyBets(betsRes.bets ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const handleCancelBet = (id: string) => {
    Alert.alert('Hủy Dự Đoán', 'Bạn sẽ được hoàn 100% tiền. Tiếp tục?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy Dự Đoán', style: 'destructive', onPress: async () => {
          try {
            await betService.cancel(id);
            loadData();
          } catch (err: any) {
            Alert.alert('Lỗi', err?.message || 'Hủy dự đoán thất bại');
          }
        },
      },
    ]);
  };

  const openBetModal = (race: Race) => {
    setSelectedRace(race);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>🎯 Dự Đoán</Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['open', 'history'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'open' ? `Đang Mở (${openRaces.length})` : `Lịch Sử (${myBets.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'open' ? (
        <FlatList
          data={openRaces}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.accent} />}
          renderItem={({ item }) => {
            const bettingCutoff = new Date(new Date(item.scheduledTime).getTime() - 60 * 60 * 1000);
            const canBet = new Date() < bettingCutoff;
            return (
              <View style={styles.raceCard}>
                <View style={styles.raceCardTop}>
                  <View style={[styles.gradeBadge, { borderColor: (GRADE_COLORS[item.grade] ?? '#fff') + '60', backgroundColor: (GRADE_COLORS[item.grade] ?? '#fff') + '20' }]}>
                    <Text style={[styles.gradeText, { color: GRADE_COLORS[item.grade] ?? '#fff' }]}>{item.grade}</Text>
                  </View>
                  <Text style={styles.raceTime}>{new Date(item.scheduledTime).toLocaleString('vi-VN')} ({getRemainingTimeText(item.scheduledTime)})</Text>
                </View>
                <Text style={styles.raceName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.raceMeta}>{item.distance}m · Giải: ${item.purse?.toLocaleString()}</Text>

                {/* Parimutuel info badge */}
                <View style={styles.parimutuelBadge}>
                  <Ionicons name="people-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.parimutuelText}>Parimutuel · Odds thực tế tính sau race</Text>
                </View>

                <TouchableOpacity
                  style={[styles.betBtn, !canBet && styles.betBtnDisabled]}
                  disabled={!canBet}
                  onPress={() => openBetModal(item)}
                >
                  <Ionicons name="trophy-outline" size={16} color={canBet ? '#FFF' : colors.textSubtle} />
                  <Text style={[styles.betBtnText, !canBet && { color: colors.textSubtle }]}>
                    {canBet ? 'Dự Đoán Ngay' : 'Đã Hết Hạn Dự Đoán'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="trophy-outline" size={48} color={colors.textSubtle} />
              <Text style={styles.emptyText}>Không có cuộc đua đang mở</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={myBets}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.accent} />}
          renderItem={({ item }) => <BetCard bet={item} onCancel={handleCancelBet} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="receipt-outline" size={48} color={colors.textSubtle} />
              <Text style={styles.emptyText}>Chưa có lịch sử dự đoán</Text>
            </View>
          }
        />
      )}

      <PlaceBetModal
        visible={modalVisible}
        race={selectedRace}
        onClose={() => setModalVisible(false)}
        onSuccess={loadData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text, paddingHorizontal: spacing.lg, paddingTop: spacing.md, marginBottom: spacing.md },
  tabRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  tabBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center',
  },
  tabBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  tabText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.medium },
  tabTextActive: { color: colors.accent, fontWeight: fontWeight.semibold },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  raceCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm,
  },
  raceCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gradeBadge: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  gradeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  raceTime: { fontSize: fontSize.xs, color: colors.textMuted },
  raceName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  raceMeta: { fontSize: fontSize.xs, color: colors.textMuted },
  parimutuelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceHover, borderRadius: radius.sm,
    paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start',
  },
  parimutuelText: { fontSize: fontSize.xs, color: colors.textMuted },
  betBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 12, marginTop: 4,
  },
  betBtnDisabled: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  betBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
});
