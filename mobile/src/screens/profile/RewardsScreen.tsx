import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { rewardService } from '../../services/api/reward.service';
import { userService } from '../../services/api/user.service';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';
import { Reward, Redemption } from '../../types';
import Ionicons from '@expo/vector-icons/Ionicons';

export function RewardsScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const balance = user?.walletId?.balance ?? 0;

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Reload user profile/wallet
      const freshUser = await userService.getMe();
      setUser(freshUser);

      // Load rewards and redemptions
      const [rewardsData, redemptionsData] = await Promise.all([
        rewardService.getRewards(),
        rewardService.getMyRedemptions(),
      ]);
      setRewards(rewardsData);
      setRedemptions(redemptionsData);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể tải thông tin phần thưởng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const handleRedeem = (reward: Reward) => {
    const costInCoins = reward.coinsRequired;
    if (balance < costInCoins) {
      Alert.alert('Số Dư Không Đủ', 'Bạn không đủ coins trong ví để đổi phần quà này.');
      return;
    }

    Alert.alert(
      'Xác Nhận Đổi Quà',
      `Bạn có chắc chắn muốn dùng ${costInCoins.toLocaleString('vi-VN')} coins để đổi "${reward.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng Ý',
          onPress: async () => {
            setRedeemingId(reward._id);

            if (user?.walletId) {
              setUser({
                ...user,
                walletId: { ...user.walletId, balance: user.walletId.balance - costInCoins },
              });
            }
            setRewards((prev) =>
              prev.map((r) =>
                r._id === reward._id ? { ...r, stock: Math.max(0, r.stock - 1) } : r,
              ),
            );

            try {
              const redemption = await rewardService.redeemReward(reward._id);
              setRedemptions((prev) => [redemption, ...prev]);
              Alert.alert(
                'Thành Công',
                `Đổi quà thành công!\nMã voucher: ${redemption.voucherCode}`,
              );
              const freshUser = await userService.getMe();
              setUser(freshUser);
            } catch (err: any) {
              if (user?.walletId) {
                setUser({
                  ...user,
                  walletId: { ...user.walletId, balance: user.walletId.balance + costInCoins },
                });
              }
              setRewards((prev) =>
                prev.map((r) =>
                  r._id === reward._id ? { ...r, stock: r.stock + 1 } : r,
                ),
              );
              Alert.alert('Lỗi', err?.message || 'Đổi quà thất bại');
            } finally {
              setRedeemingId(null);
            }
          },
        },
      ],
    );
  };

  const handleCopyCode = (code: string, id: string) => {
    // Simulated copy for RN with beautiful banner
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đổi Thưởng</Text>
        <TouchableOpacity onPress={() => fetchData()} style={styles.refreshBtn}>
          <Ionicons name="sync-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View>
          <Text style={styles.balanceLabel}>Số Dư Khả Dụng</Text>
          <Text style={styles.balanceValue}>{balance.toLocaleString('vi-VN')} coins</Text>
        </View>
        <View style={styles.coinIconContainer}>
          <Ionicons name="cash" size={26} color={colors.gold} />
        </View>
      </View>

      {/* Tab Selectors */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'rewards' && styles.tabActive]}
          onPress={() => setActiveTab('rewards')}
        >
          <Text style={[styles.tabText, activeTab === 'rewards' && styles.tabTextActive]}>Quà Tặng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Lịch Sử Đổi</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        >
          {activeTab === 'rewards' ? (
            rewards.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="gift-outline" size={48} color={colors.textSubtle} style={{ opacity: 0.5 }} />
                <Text style={styles.emptyText}>Hiện tại chưa có phần quà nào khả dụng.</Text>
              </View>
            ) : (
              rewards.map((reward) => (
                <View key={reward._id} style={styles.rewardCard}>
                  {reward.imageUrl && (
                    <Image source={{ uri: reward.imageUrl }} style={styles.rewardImage} />
                  )}
                  <View style={styles.rewardDetails}>
                    <Text style={styles.rewardName}>{reward.name}</Text>
                    <Text style={styles.rewardDesc}>{reward.description}</Text>
                    
                    <View style={styles.rewardFooter}>
                      <View style={styles.rewardStats}>
                        <Text style={styles.rewardStock}>Còn lại: {reward.stock}</Text>
                        <Text style={styles.rewardPrice}>
                          <Ionicons name="cash" size={14} color={colors.gold} /> {reward.coinsRequired.toLocaleString('vi-VN')} coins
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        style={[
                          styles.redeemBtn,
                          balance < reward.coinsRequired && styles.btnDisabled,
                        ]}
                        disabled={redeemingId !== null}
                        onPress={() => handleRedeem(reward)}
                      >
                        {redeemingId === reward._id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.redeemBtnText}>Đổi Quà</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )
          ) : (
            redemptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color={colors.textSubtle} style={{ opacity: 0.5 }} />
                <Text style={styles.emptyText}>Bạn chưa đổi phần quà nào.</Text>
              </View>
            ) : (
              redemptions.map((redemption) => {
                const isPhysical = redemption.rewardId?.type === 'physical';
                return (
                  <View key={redemption._id} style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyName}>{redemption.rewardId?.name || 'Phần quà đã đổi'}</Text>
                        <Text style={styles.historyDate}>
                          {new Date(redemption.createdAt).toLocaleString('vi-VN')}
                        </Text>
                      </View>
                      <Text style={styles.historyPrice}>
                        -{redemption.coinsSpent.toLocaleString('vi-VN')} coins
                      </Text>
                    </View>

                    <View style={styles.voucherBox}>
                      <Text style={styles.voucherLabel}>{isPhysical ? 'MÃ NHẬN QUÀ:' : 'MÃ VOUCHER:'}</Text>
                      <View style={styles.voucherCodeContainer}>
                        <Text style={styles.voucherCode}>{redemption.voucherCode}</Text>
                        <TouchableOpacity
                          style={styles.copyBtn}
                          onPress={() => handleCopyCode(redemption.voucherCode, redemption._id)}
                        >
                          {copiedId === redemption._id ? (
                            <Text style={styles.copiedText}>Đã chép</Text>
                          ) : (
                            <Ionicons name="copy-outline" size={16} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      </View>
                      <Text style={{ fontSize: 9, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 }}>
                        {isPhysical 
                          ? '⚡ Trình mã này cho BTC tại quầy để nhận quà vật lý.'
                          : '⚡ Sao chép mã này áp dụng khi thanh toán.'}
                      </Text>
                    </View>
                  </View>
                );
              })
            )
          )}
        </ScrollView>
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
  refreshBtn: { padding: 4 },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  balanceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, margin: spacing.md, padding: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
  },
  balanceLabel: { fontSize: fontSize.xs, color: colors.textSubtle, textTransform: 'uppercase', fontWeight: fontWeight.bold },
  balanceValue: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: colors.secondary, marginTop: 4 },
  coinIconContainer: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.accentDim,
    alignItems: 'center', justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row', backgroundColor: colors.bgSecondary,
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    borderRadius: radius.md, padding: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  tabActive: { backgroundColor: colors.surface },
  tabText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.semibold },
  tabTextActive: { color: colors.primary, fontWeight: fontWeight.bold },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.lg },
  
  // Reward list styles
  rewardCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.md,
  },
  rewardImage: { width: '100%', height: 160, backgroundColor: colors.bgSecondary },
  rewardDetails: { padding: spacing.md },
  rewardName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, fontFamily: 'serif' },
  rewardDesc: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  rewardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  rewardStats: { gap: 2 },
  rewardStock: { fontSize: 10, color: colors.textSubtle },
  rewardPrice: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.secondary },
  redeemBtn: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: radius.sm,
  },
  redeemBtnText: { color: '#FFF', fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  btnDisabled: { opacity: 0.5 },

  // History list styles
  historyCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  historyName: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
  historyDate: { fontSize: 10, color: colors.textSubtle, marginTop: 2 },
  historyPrice: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.secondary },
  
  voucherBox: {
    backgroundColor: colors.bgSecondary, borderRadius: radius.md,
    padding: spacing.sm, marginTop: spacing.sm,
  },
  voucherLabel: { fontSize: 9, color: colors.textSubtle, fontWeight: fontWeight.bold },
  voucherCodeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  voucherCode: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary, fontFamily: 'monospace' },
  copyBtn: {
    padding: 6, borderRadius: radius.sm, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  copiedText: { fontSize: 9, color: colors.success, fontWeight: fontWeight.bold },
});
