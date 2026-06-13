import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { authService } from '../../services/api/auth.service';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

type Step = 'email' | 'verify' | 'reset' | 'done';

export function ForgotPasswordScreen({ navigation }: Props) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!email.trim()) { Alert.alert('Lỗi', 'Nhập email của bạn'); return; }
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setStep('verify');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể gửi email');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) { Alert.alert('Lỗi', 'Mã xác nhận phải có 6 chữ số'); return; }
    setLoading(true);
    try {
      const data = await authService.verifyResetCode(email.trim(), code);
      setResetToken(data.resetToken);
      setStep('reset');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Mã không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) { Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 8 ký tự'); return; }
    setLoading(true);
    try {
      await authService.resetPassword(resetToken, newPassword);
      setStep('done');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Quên Mật Khẩu</Text>

        {step === 'email' && (
          <View style={styles.section}>
            <Text style={styles.desc}>Nhập email của bạn để nhận mã xác nhận.</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color={colors.textSubtle} style={styles.inputIcon} />
                <TextInput style={styles.input} value={email} onChangeText={setEmail}
                  placeholder="email@example.com" placeholderTextColor={colors.textSubtle}
                  autoCapitalize="none" keyboardType="email-address" />
              </View>
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleSendEmail} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Gửi Mã</Text>}
            </TouchableOpacity>
          </View>
        )}

        {step === 'verify' && (
          <View style={styles.section}>
            <Text style={styles.desc}>Nhập mã 6 chữ số đã gửi tới <Text style={{ color: colors.purple, fontWeight: 'bold' }}>{email}</Text></Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mã Xác Nhận</Text>
              <View style={styles.inputRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSubtle} style={styles.inputIcon} />
                <TextInput style={styles.input} value={code} onChangeText={setCode}
                  placeholder="123456" placeholderTextColor={colors.textSubtle}
                  keyboardType="number-pad" maxLength={6} />
              </View>
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleVerifyCode} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Xác Nhận</Text>}
            </TouchableOpacity>
          </View>
        )}

        {step === 'reset' && (
          <View style={styles.section}>
            <Text style={styles.desc}>Nhập mật khẩu mới của bạn.</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật Khẩu Mới</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textSubtle} style={styles.inputIcon} />
                <TextInput style={[styles.input, { flex: 1 }]} value={newPassword} onChangeText={setNewPassword}
                  placeholder="Tối thiểu 8 ký tự" placeholderTextColor={colors.textSubtle}
                  secureTextEntry={!showPwd} />
                <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={{ padding: 4 }}>
                  <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSubtle} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleResetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Đổi Mật Khẩu</Text>}
            </TouchableOpacity>
          </View>
        )}

        {step === 'done' && (
          <View style={styles.doneSection}>
            <Ionicons name="checkmark-circle" size={72} color={colors.success} />
            <Text style={styles.doneTitle}>Thành Công!</Text>
            <Text style={styles.doneDesc}>Mật khẩu đã được đổi. Hãy đăng nhập lại.</Text>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.btnText}>Đăng Nhập</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xxl },
  backBtn: { marginBottom: spacing.md },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text, marginBottom: spacing.sm },
  desc: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.lg, lineHeight: 20 },
  section: { gap: spacing.md },
  inputGroup: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textMuted },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.text, fontSize: fontSize.md },
  btn: {
    backgroundColor: colors.accent, borderRadius: radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  btnText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: '#FFFFFF' },
  doneSection: { alignItems: 'center', gap: spacing.md, marginTop: spacing.xxl },
  doneTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text },
  doneDesc: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
});
