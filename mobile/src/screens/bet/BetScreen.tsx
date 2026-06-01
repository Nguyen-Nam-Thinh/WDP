import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Modal,
  TextInput, Alert, ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { raceService } from '../../services/api/race.service';
import { betService } from '../../services/api/bet.service';
import { Race, RaceHorse, Bet, BetType } from '../../types';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';
import { BET_MULTIPLIERS, BET_TYPE_LABEL, RACE_STATUS_LABEL } from '../../constants/api';
import Ionicons from '@expo/vector-icons/Ionicons';

const GRADE_COLORS: Record<string, string> = {
  G1: '#fbbf24', G2: '#a78bfa', G3: '#60a5fa', Maiden: '#34d399',
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
  const [horses, setHorses] = useState<RaceHorse[]>([]);
  const [loadingHorses, setLoadingHorses] = useState(false);
  const [selectedHorse, setSelectedHorse] = useState('');
  const [betType, setBetType] = useState<BetType>('win');
  const [amount, setAmount] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!visible || !race) return;
    setSelectedHorse('');
    setBetType('win');
    setAmount('');
    setLoadingHorses(true);
    raceService.getRaceHorses(race._id)
      .then((res) => setHorses(res.horses ?? []))
      .catch(() => {})
      .finally(() => setLoadingHorses(false));
  }, [visible, race]);

  const handlePlace = async () => {
    if (!race || !selectedHorse) { Alert.alert('Lỗi', 'Chọn ngựa trước'); return; }
    const amt = Number(amount);
    if (!amt || amt < 1) { Alert.alert('Lỗi', 'Số tiền tối thiểu là 1'); return; }
    setPlacing(true);
    try {
      await betService.place({ raceId: race._id, horseId: selectedHorse, betType, amount: amt });
      const potential = Math.floor(amt * BET_MULTIPLIERS[betType]);
      Alert.alert('✅ Đặt Cược Thành Công', `Tiềm năng nhận: ${potential} coins`);
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Đặt cược thất bại');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <View style={modal.header}>
            <Text style={modal.title}>Đặt Cược</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>
          {race && <Text style={modal.raceName} numberOfLines={1}>{race.name}</Text>}

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {/* Horse list */}
            <Text style={modal.label}>Chọn Ngựa</Text>
            {loadingHorses
              ? <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.md }} />
              : horses.length === 0
                ? <Text style={modal.empty}>Chưa có ngựa đăng ký</Text>
                : horses.map((h) => (
                  <TouchableOpacity
                    key={h._id}
                    style={[modal.horseRow, selectedHorse === h.horseId._id && modal.horseRowSelected]}
                    onPress={() => setSelectedHorse(h.horseId._id)}
                  >
                    <View style={modal.horseLeft}>
                      <Text style={modal.horseName}>{h.horseId.name}</Text>
                      {h.jockeyId && <Text style={modal.jockeyName}>🏇 {h.jockeyId.fullName}</Text>}
                    </View>
                    <View style={[modal.gradeBadge, { borderColor: (GRADE_COLORS[h.horseId.currentGrade ?? 'Maiden'] ?? '#fff') + '60' }]}>
                      <Text style={[modal.gradeText, { color: GRADE_COLORS[h.horseId.currentGrade ?? 'Maiden'] ?? '#fff' }]}>
                        {h.horseId.currentGrade ?? '—'}
                      </Text>
                    </View>
                    {selectedHorse === h.horseId._id && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
                  </TouchableOpacity>
                ))
            }

            {/* Bet type */}
            <Text style={[modal.label, { marginTop: spacing.md }]}>Loại Cược</Text>
            <View style={modal.betTypeRow}>
              {(['win', 'place', 'show'] as BetType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[modal.betTypeBtn, betType === t && modal.betTypeBtnActive]}
                  onPress={() => setBetType(t)}
                >
                  <Text style={[modal.betTypeBtnText, betType === t && modal.betTypeBtnTextActive]}>
                    {t === 'win' ? 'Thắng 3x' : t === 'place' ? 'Top2 2x' : 'Top3 1.5x'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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

            {/* Potential payout */}
            {!!amount && Number(amount) > 0 && (
              <View style={modal.payoutBox}>
                <Text style={modal.payoutLabel}>Tiềm năng nhận:</Text>
                <Text style={modal.payoutValue}>{Math.floor(Number(amount) * BET_MULTIPLIERS[betType])} coins</Text>
              </View>
            )}

            <TouchableOpacity style={modal.placeBtn} onPress={handlePlace} disabled={placing}>
              {placing
                ? <ActivityIndicator color="#000" />
                : <Text style={modal.placeBtnText}>Xác Nhận Đặt Cược</Text>
              }
            </TouchableOpacity>
            <View style={{ height: spacing.xxl }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#111111', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%', paddingHorizontal: spacing.lg, paddingTop: spacing.md,
  },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  raceName: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textMuted, marginBottom: spacing.sm },
  empty: { color: colors.textSubtle, fontSize: fontSize.sm, textAlign: 'center', paddingVertical: spacing.md },
  horseRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, marginBottom: spacing.sm,
  },
  horseRowSelected: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  horseLeft: { flex: 1 },
  horseName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  jockeyName: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  gradeBadge: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  gradeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  betTypeRow: { flexDirection: 'row', gap: spacing.sm },
  betTypeBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center',
  },
  betTypeBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  betTypeBtnText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.medium },
  betTypeBtnTextActive: { color: colors.accent },
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
  payoutValue: { color: colors.success, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  placeBtn: {
    backgroundColor: colors.accent, borderRadius: radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg,
  },
  placeBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: '#000' },
});

// ── Bet Card ─────────────────────────────────────────────────────────────────
function BetCard({ bet, onCancel }: { bet: Bet; onCancel: (id: string) => void }) {
  const statusColor = bet.status === 'won' ? colors.success
    : bet.status === 'lost' ? colors.danger
    : bet.status === 'pending' ? colors.warning
    : colors.textMuted;

  const statusLabel: Record<string, string> = {
    pending: 'Đang Chờ', won: 'Thắng 🎉', lost: 'Thua', cancelled: 'Đã Hủy', refunded: 'Hoàn Tiền',
  };

  return (
    <View style={betCard.card}>
      <View style={betCard.top}>
        <Text style={betCard.raceName} numberOfLines={1}>{(bet.raceId as any)?.name ?? '—'}</Text>
        <View style={[betCard.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '40' }]}>
          <Text style={[betCard.statusText, { color: statusColor }]}>{statusLabel[bet.status]}</Text>
        </View>
      </View>
      <Text style={betCard.horseName}>🐎 {(bet.horseId as any)?.name ?? '—'}</Text>
      <View style={betCard.row}>
        <Text style={betCard.meta}>{BET_TYPE_LABEL[bet.betType]}</Text>
        <Text style={betCard.amount}>{bet.amount} coins</Text>
      </View>
      {bet.status === 'won' && (
        <Text style={betCard.payout}>+{bet.payoutAmount} coins nhận được</Text>
      )}
      {bet.status === 'pending' && (
        <TouchableOpacity style={betCard.cancelBtn} onPress={() => onCancel(bet._id)}>
          <Text style={betCard.cancelText}>Hủy Cược</Text>
        </TouchableOpacity>
      )}
    </View>
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
  amount: { fontSize: fontSize.sm, color: colors.accent, fontWeight: fontWeight.semibold },
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
  const [tab, setTab] = useState<Tab>('open');
  const [openRaces, setOpenRaces] = useState<Race[]>([]);
  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
    Alert.alert('Hủy Cược', 'Bạn sẽ được hoàn 100% tiền. Tiếp tục?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy Cược', style: 'destructive', onPress: async () => {
          try {
            await betService.cancel(id);
            loadData();
          } catch (err: any) {
            Alert.alert('Lỗi', err?.message || 'Hủy cược thất bại');
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
      <Text style={styles.pageTitle}>🎯 Đặt Cược</Text>

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
                  <Text style={styles.raceTime}>{new Date(item.scheduledTime).toLocaleString('vi-VN')}</Text>
                </View>
                <Text style={styles.raceName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.raceMeta}>{item.distance}m · Giải: ${item.purse?.toLocaleString()}</Text>
                <TouchableOpacity
                  style={[styles.betBtn, !canBet && styles.betBtnDisabled]}
                  disabled={!canBet}
                  onPress={() => openBetModal(item)}
                >
                  <Ionicons name="trophy-outline" size={16} color={canBet ? '#000' : colors.textSubtle} />
                  <Text style={[styles.betBtnText, !canBet && { color: colors.textSubtle }]}>
                    {canBet ? 'Đặt Cược Ngay' : 'Đã Hết Hạn Cược'}
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
              <Text style={styles.emptyText}>Chưa có lịch sử cược</Text>
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
  betBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 12, marginTop: 4,
  },
  betBtnDisabled: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  betBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
});
