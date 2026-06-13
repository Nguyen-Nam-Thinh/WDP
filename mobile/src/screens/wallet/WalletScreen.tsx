import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { userService } from '../../services/api/user.service';
import { Wallet, Transaction, TransactionType } from '../../types';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';
import { WalletStackParamList } from '../../navigation/MainNavigator';
import Ionicons from '@expo/vector-icons/Ionicons';

type NavigationProp = NativeStackNavigationProp<WalletStackParamList, 'WalletHome'>;

const TX_ICONS: Record<TransactionType, { icon: string; color: string }> = {
  topup:              { icon: 'add-circle-outline',   color: colors.success },
  registration_fee:   { icon: 'document-outline',     color: '#8C2F1B' },
  registration_refund:{ icon: 'refresh-outline',      color: colors.warning },
  prize_payout:       { icon: 'trophy-outline',        color: colors.gold },
  bet_placed:         { icon: 'arrow-up-outline',     color: '#8C2F1B' },
  bet_payout:         { icon: 'arrow-down-outline',   color: colors.success },
  bet_refund:         { icon: 'refresh-circle-outline',color: colors.warning },
};

const TX_LABEL: Record<TransactionType, string> = {
  topup:              'Nạp Tiền',
  registration_fee:   'Phí Đăng Ký',
  registration_refund:'Hoàn Phí Đăng Ký',
  prize_payout:       'Tiền Thưởng',
  bet_placed:         'Đặt Cược',
  bet_payout:         'Nhận Cược',
  bet_refund:         'Hoàn Tiền Cược',
};

function TransactionItem({ tx }: { tx: Transaction }) {
  const meta = TX_ICONS[tx.type] ?? { icon: 'swap-horizontal-outline', color: colors.textMuted };
  const isPositive = tx.amount > 0;

  return (
    <View style={styles.txItem}>
      <View style={[styles.txIconBox, { backgroundColor: meta.color + '15' }]}>
        <Ionicons name={meta.icon as any} size={20} color={meta.color} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txLabel}>{TX_LABEL[tx.type] ?? tx.type}</Text>
        {tx.description ? <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text> : null}
        <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleString('vi-VN')}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: isPositive ? colors.success : '#8C2F1B' }]}>
          {isPositive ? '+' : ''}{tx.amount}
        </Text>
        <Text style={styles.txBalance}>Còn: {tx.balanceAfter}</Text>
      </View>
    </View>
  );
}

export function WalletScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [w, txRes] = await Promise.all([
        userService.getMyWallet(),
        userService.getMyTransactions(1, 50),
      ]);
      setWallet(w);
      setTransactions(txRes.transactions ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <Text style={styles.pageTitle}>💰 Ví Của Tôi</Text>

            {/* Balance card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Số Dư Hiện Tại</Text>
              <Text style={styles.balanceAmount}>{wallet?.balance?.toLocaleString() ?? '0'}</Text>
              <Text style={styles.balanceCurrency}>COINS</Text>
              
              <TouchableOpacity
                style={styles.depositBtn}
                onPress={() => navigation.navigate('Deposit')}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.depositBtnText}>Nạp Thêm Xu</Text>
              </TouchableOpacity>

              <View style={styles.balanceRow}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.success} />
                <Text style={styles.balanceSafe}>Ví được bảo mật</Text>
              </View>
            </View>

            <Text style={styles.txTitle}>Lịch Sử Giao Dịch</Text>
          </>
        }
        renderItem={({ item }) => <TransactionItem tx={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="receipt-outline" size={48} color={colors.textSubtle} />
            <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pageTitle: {
    fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, marginBottom: spacing.md,
  },
  balanceCard: {
    margin: spacing.lg, padding: spacing.xl, borderRadius: radius.xl,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', gap: 6,
    // Add simple shadow for premium card look
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  balanceLabel: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.medium },
  balanceAmount: { fontSize: 48, fontWeight: fontWeight.extrabold, color: colors.primary },
  balanceCurrency: { fontSize: fontSize.sm, color: colors.textSubtle, letterSpacing: 3, fontWeight: fontWeight.bold, marginBottom: spacing.sm },
  depositBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: 12,
    borderRadius: radius.md, width: '100%', marginBottom: spacing.sm,
  },
  depositBtnText: { color: '#FFFFFF', fontSize: fontSize.md, fontWeight: fontWeight.bold },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  balanceSafe: { fontSize: fontSize.xs, color: colors.success },
  txTitle: {
    fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text,
    paddingHorizontal: spacing.lg, marginBottom: spacing.sm,
  },
  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  txIconBox: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  txDesc: { fontSize: fontSize.xs, color: colors.textSubtle, marginTop: 1 },
  txDate: { fontSize: fontSize.xs, color: colors.textSubtle, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  txBalance: { fontSize: fontSize.xs, color: colors.textSubtle, marginTop: 2 },
  listContent: { paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
});
