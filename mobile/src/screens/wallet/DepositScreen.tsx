import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

const COIN_RATE = 1000; // 1 xu = 1,000 VND

const QUICK_AMOUNTS = [
  { coins: 50,    vnd: 50_000 },
  { coins: 100,   vnd: 100_000 },
  { coins: 200,   vnd: 200_000 },
  { coins: 500,   vnd: 500_000 },
  { coins: 1000,  vnd: 1_000_000 },
  { coins: 2000,  vnd: 2_000_000 },
];

const BANK_ACCOUNTS = [
  { bank: 'Vietcombank (VCB)',   number: '1020 4857 2934 8800', owner: 'CONG TY TNHH RACING VN', branch: 'TP. Hồ Chí Minh', color: '#1F3D2B',    logo: '🏦' },
  { bank: 'Techcombank (TCB)',   number: '1901 2345 6789 0001', owner: 'CONG TY TNHH RACING VN', branch: 'Hà Nội',           color: '#8C2F1B',       logo: '🏦' },
  { bank: 'MB Bank',            number: '0909 8888 0002',       owner: 'CONG TY TNHH RACING VN', branch: 'TP. Hồ Chí Minh', color: '#1E3A8A',  logo: '🏦' },
];

const EWALLETS = [
  { name: 'MoMo',    phone: '0909.888.777', color: '#D14D72' },
  { name: 'ZaloPay', phone: '0909.888.777', color: '#0084FF' },
  { name: 'VNPay',   phone: '0909.888.777', color: '#E11D48' },
];

export function DepositScreen() {
  const navigation = useNavigation();
  const [method, setMethod] = useState<'bank' | 'ewallet'>('bank');
  const [selectedBank, setSelectedBank] = useState(0);
  const [selectedWallet, setSelectedWallet] = useState(0);
  const [coinAmount, setCoinAmount] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState<string | null>(null);

  const coins = Number(coinAmount) || 0;
  const vndAmount = coins * COIN_RATE;
  const refCode = `NAP-ALEX-${coinAmount || 'XXX'}`;

  const currentBank = BANK_ACCOUNTS[selectedBank];
  const currentWallet = EWALLETS[selectedWallet];

  const handleCopy = (text: string, key: string) => {
    // Mock copy in React Native - since native clipboard requires a separate library,
    // we show a beautiful temporary banner.
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleComplete = () => {
    Alert.alert(
      'Yêu Cầu Đã Gửi',
      'Cảm ơn bạn! Hệ thống đang kiểm tra giao dịch chuyển khoản. Xu sẽ được cộng tự động sau 1-5 phút.',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cổng Nạp Xu</Text>
        <View style={styles.secureBadge}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
          <Text style={styles.secureText}>Bảo mật</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Step Indicator */}
        <View style={styles.stepsRow}>
          {[
            { n: 1, label: 'Phương thức' },
            { n: 2, label: 'Số xu' },
            { n: 3, label: 'Thanh toán' },
          ].map((s, i) => (
            <React.Fragment key={i}>
              <View style={styles.stepItem}>
                <View style={[
                  styles.stepDot,
                  s.n === step && styles.stepDotActive,
                  s.n < step && styles.stepDotCompleted,
                ]}>
                  {s.n < step ? (
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  ) : (
                    <Text style={[styles.stepNum, s.n === step && styles.stepNumActive]}>{s.n}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, s.n === step && styles.stepLabelActive]}>{s.label}</Text>
              </View>
              {i < 2 && <View style={[styles.stepLine, step > s.n && styles.stepLineCompleted]} />}
            </React.Fragment>
          ))}
        </View>

        {/* STEP 1: SELECT METHOD */}
        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chọn Phương Thức Thanh Toán</Text>
            <Text style={styles.sectionSubtitle}>Hỗ trợ chuyển khoản ngân hàng và ví điện tử Việt Nam.</Text>

            <View style={styles.methodGrid}>
              <TouchableOpacity
                style={[styles.methodCard, method === 'bank' && styles.methodCardActive]}
                onPress={() => setMethod('bank')}
              >
                <View style={[styles.methodIconBox, { backgroundColor: colors.blueDim }]}>
                  <Ionicons name="business" size={24} color={colors.blue} />
                </View>
                <Text style={styles.methodName}>Ngân Hàng</Text>
                <Text style={styles.methodDesc}>Vietcombank, MB, Techcombank</Text>
                <View style={styles.methodBadge}>
                  <Text style={styles.methodBadgeText}>5-15 phút</Text>
                </View>
                {method === 'bank' && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.checkIcon} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodCard, method === 'ewallet' && styles.methodCardActive]}
                onPress={() => setMethod('ewallet')}
              >
                <View style={[styles.methodIconBox, { backgroundColor: colors.purpleDim }]}>
                  <Ionicons name="phone-portrait-outline" size={24} color={colors.purple} />
                </View>
                <Text style={styles.methodName}>Ví Điện Tử</Text>
                <Text style={styles.methodDesc}>MoMo, ZaloPay, VNPay</Text>
                <View style={[styles.methodBadge, { backgroundColor: colors.successDim }]}>
                  <Text style={[styles.methodBadgeText, { color: colors.success }]}>Tức thì</Text>
                </View>
                {method === 'ewallet' && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={16} color={colors.primary} />
              <Text style={styles.infoText}>Mọi giao dịch đều được mã hóa SSL an toàn tuyệt đối 100%.</Text>
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
              <Text style={styles.nextBtnText}>Tiếp Tục</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: ENTER COINS */}
        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nhập Số Xu Cần Nạp</Text>
            <Text style={styles.sectionSubtitle}>Tỷ giá: 1 Xu = 1.000 VND</Text>

            <View style={styles.inputCard}>
              <View style={styles.inputContainer}>
                <Ionicons name="cash" size={24} color={colors.gold} style={styles.cashIcon} />
                <TextInput
                  style={styles.coinInput}
                  value={coinAmount}
                  onChangeText={(val) => setCoinAmount(val.replace(/[^0-9]/g, ''))}
                  placeholder="Nhập số xu..."
                  placeholderTextColor={colors.textSubtle}
                  keyboardType="numeric"
                />
                <Text style={styles.coinSuffix}>xu</Text>
              </View>

              {coins > 0 ? (
                <View style={styles.vndSummary}>
                  <Text style={styles.vndLabel}>Số tiền tương ứng:</Text>
                  <Text style={styles.vndValue}>{vndAmount.toLocaleString('vi-VN')} VND</Text>
                </View>
              ) : null}

              <Text style={styles.quickLabel}>Chọn nhanh:</Text>
              <View style={styles.quickGrid}>
                {QUICK_AMOUNTS.map((q) => (
                  <TouchableOpacity
                    key={q.coins}
                    style={[styles.quickBtn, coins === q.coins && styles.quickBtnActive]}
                    onPress={() => setCoinAmount(String(q.coins))}
                  >
                    <Text style={[styles.quickCoins, coins === q.coins && styles.quickBtnTextActive]}>
                      {q.coins} xu
                    </Text>
                    <Text style={[styles.quickVnd, coins === q.coins && styles.quickBtnTextActiveDim]}>
                      {(q.vnd / 1000).toLocaleString()}k VND
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backLink} onPress={() => setStep(1)}>
                <Ionicons name="arrow-back" size={16} color={colors.textMuted} />
                <Text style={styles.backLinkText}>Quay lại</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.nextBtn, { flex: 1, marginTop: 0 }, coins <= 0 && styles.btnDisabled]}
                disabled={coins <= 0}
                onPress={() => setStep(3)}
              >
                <Text style={styles.nextBtnText}>Tiếp Tục</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: PAYMENT & CONFIRM */}
        {step === 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chuyển Khoản Thanh Toán</Text>
            <Text style={styles.sectionSubtitle}>Vui lòng chuyển khoản đúng số tiền và nội dung bên dưới.</Text>

            {/* BANK OPTION */}
            {method === 'bank' ? (
              <View style={styles.paymentContainer}>
                {/* Bank picker */}
                <View style={styles.bankPicker}>
                  {BANK_ACCOUNTS.map((b, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.bankItem, selectedBank === idx && styles.bankItemActive]}
                      onPress={() => setSelectedBank(idx)}
                    >
                      <Text style={styles.bankLogo}>{b.logo}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.bankName, selectedBank === idx && { color: colors.primary }]}>
                          {b.bank}
                        </Text>
                        <Text style={styles.bankBranch}>{b.branch}</Text>
                      </View>
                      {selectedBank === idx && (
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Transfer Info card */}
                <View style={styles.transferCard}>
                  <View style={[styles.transferCardHeader, { backgroundColor: currentBank.color }]}>
                    <Text style={styles.transferCardTitle}>{currentBank.bank}</Text>
                    <Text style={styles.transferCardBranch}>{currentBank.branch}</Text>
                  </View>

                  <View style={styles.transferBody}>
                    {[
                      { label: 'Chủ Tài Khoản', value: currentBank.owner, key: 'owner' },
                      { label: 'Số Tài Khoản', value: currentBank.number, key: 'number' },
                      { label: 'Số Tiền', value: `${vndAmount.toLocaleString('vi-VN')} VND`, key: 'vnd' },
                      { label: 'Nội Dung CK', value: refCode, key: 'ref', highlight: true },
                    ].map((item, idx) => (
                      <View key={idx} style={[styles.infoRow, item.highlight && styles.infoRowHighlight]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoLabel}>{item.label}</Text>
                          <Text style={[styles.infoValue, item.highlight && { color: colors.secondary, fontWeight: 'bold' }]}>
                            {item.value}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.copyBtn}
                          onPress={() => handleCopy(item.value, item.key)}
                        >
                          {copied === item.key ? (
                            <Text style={styles.copiedText}>Đã chép</Text>
                          ) : (
                            <Ionicons name="copy-outline" size={16} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              /* E-WALLET OPTION */
              <View style={styles.paymentContainer}>
                <View style={styles.walletPicker}>
                  {EWALLETS.map((w, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.walletItem, selectedWallet === idx && styles.walletItemActive, { borderColor: selectedWallet === idx ? w.color : colors.border }]}
                      onPress={() => setSelectedWallet(idx)}
                    >
                      <Text style={[styles.walletNameText, { color: selectedWallet === idx ? w.color : colors.text }]}>
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* QR Simulation Card */}
                <View style={styles.qrCard}>
                  <View style={styles.qrBox}>
                    <Ionicons name="qr-code-outline" size={120} color={colors.text} />
                    <Text style={styles.qrScanText}>Quét mã QR để thanh toán</Text>
                  </View>

                  <View style={styles.transferBody}>
                    {[
                      { label: 'Ứng Dụng', value: currentWallet.name, key: 'wname' },
                      { label: 'Số Điện Thoại', value: currentWallet.phone, key: 'wphone' },
                      { label: 'Số Tiền', value: `${vndAmount.toLocaleString('vi-VN')} VND`, key: 'wvnd' },
                      { label: 'Nội Dung', value: refCode, key: 'wref', highlight: true },
                    ].map((item, idx) => (
                      <View key={idx} style={[styles.infoRow, item.highlight && styles.infoRowHighlight]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoLabel}>{item.label}</Text>
                          <Text style={[styles.infoValue, item.highlight && { color: colors.secondary, fontWeight: 'bold' }]}>
                            {item.value}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.copyBtn}
                          onPress={() => handleCopy(item.value, item.key)}
                        >
                          {copied === item.key ? (
                            <Text style={styles.copiedText}>Đã chép</Text>
                          ) : (
                            <Ionicons name="copy-outline" size={16} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Warning note */}
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color={colors.secondary} style={{ marginTop: 2 }} />
              <Text style={styles.warningText}>
                <Text style={{ fontWeight: 'bold' }}>QUAN TRỌNG: </Text>
                Nhập chính xác nội dung chuyển khoản để hệ thống tự động đối soát và cộng xu trong 1-5 phút.
              </Text>
            </View>

            {/* Navigation row */}
            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backLink} onPress={() => setStep(2)}>
                <Ionicons name="arrow-back" size={16} color={colors.textMuted} />
                <Text style={styles.backLinkText}>Quay lại</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.nextBtn, { flex: 1, marginTop: 0 }]} onPress={handleComplete}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                <Text style={styles.nextBtnText}>Đã Chuyển Tiền</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
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
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  secureBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.accentDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full,
  },
  secureText: { fontSize: 10, fontWeight: fontWeight.semibold, color: colors.primary },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },

  // Steps indicator
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: spacing.md },
  stepItem: { alignItems: 'center', width: 70 },
  stepDot: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.textSubtle,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg,
    display: 'flex',
  },
  stepDotActive: { borderColor: colors.primary, backgroundColor: colors.accentDim },
  stepDotCompleted: { borderColor: colors.primary, backgroundColor: colors.primary },
  stepNum: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.textSubtle, textAlign: 'center' },
  stepNumActive: { color: colors.primary },
  stepLabel: { fontSize: 9, color: colors.textSubtle, fontWeight: fontWeight.medium, marginTop: 4 },
  stepLabelActive: { color: colors.primary, fontWeight: fontWeight.bold },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: -10, marginTop: -14 },
  stepLineCompleted: { backgroundColor: colors.primary },

  // Sections
  section: { gap: spacing.md },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, fontFamily: 'serif' },
  sectionSubtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: -8 },

  // Method Selection
  methodGrid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  methodCard: {
    flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface,
    borderWidth: 2, borderColor: colors.border, gap: spacing.sm, position: 'relative',
  },
  methodCardActive: { borderColor: colors.primary, backgroundColor: colors.accentDim },
  methodIconBox: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  methodName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  methodDesc: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 16 },
  methodBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm,
    backgroundColor: colors.accentDim,
  },
  methodBadgeText: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.primary },
  checkIcon: { position: 'absolute', top: 12, right: 12 },

  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.accentDim, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.accentBorder,
  },
  infoText: { flex: 1, fontSize: fontSize.xs, color: colors.primary, lineHeight: 16 },

  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, height: 50, borderRadius: radius.md, marginTop: spacing.md,
  },
  nextBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: '#FFF' },
  btnDisabled: { opacity: 0.5 },

  // Step 2 entry
  inputCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', height: 56, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, backgroundColor: colors.bg,
  },
  cashIcon: { marginRight: spacing.sm },
  coinInput: { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  coinSuffix: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.gold },
  vndSummary: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  vndLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  vndValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },

  quickLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.xs },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickBtn: {
    width: '30%', paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  quickBtnActive: { borderColor: colors.primary, backgroundColor: colors.accentDim },
  quickCoins: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
  quickVnd: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  quickBtnTextActive: { color: colors.primary, fontWeight: 'bold' },
  quickBtnTextActiveDim: { color: colors.primary },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm },
  backLinkText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.medium },

  // Step 3 Payment Details
  paymentContainer: { gap: spacing.md },
  bankPicker: { gap: spacing.xs },
  bankItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md,
    backgroundColor: colors.surface, borderStyle: 'solid', borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md,
  },
  bankItemActive: { borderColor: colors.primary, backgroundColor: colors.accentDim },
  bankLogo: { fontSize: fontSize.xl },
  bankName: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
  bankBranch: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

  transferCard: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' },
  transferCardHeader: { padding: spacing.md },
  transferCardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: '#FFF' },
  transferCardBranch: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  transferBody: { padding: spacing.md },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoRowHighlight: { backgroundColor: colors.accentDim, marginHorizontal: -spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.sm },
  infoLabel: { fontSize: 10, color: colors.textSubtle },
  infoValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, marginTop: 2 },
  copyBtn: { padding: 8, borderRadius: radius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  copiedText: { fontSize: 10, color: colors.success, fontWeight: fontWeight.bold },

  walletPicker: { flexDirection: 'row', gap: spacing.sm },
  walletItem: {
    flex: 1, paddingVertical: spacing.sm, borderWidth: 2, borderRadius: radius.md,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  walletItemActive: { backgroundColor: colors.accentDim },
  walletNameText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  qrCard: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden', padding: spacing.md, gap: spacing.md },
  qrBox: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.bg, borderRadius: radius.md },
  qrScanText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },

  warningBox: {
    flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.dangerDim,
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.danger + '30',
  },
  warningText: { flex: 1, fontSize: fontSize.xs, color: colors.danger, lineHeight: 18 },
});
