import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/api/auth.service';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'> };

export function RegisterScreen({ navigation }: Props) {
  const { login } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        role: 'spectator',
      });
      await login(data.user, data.accessToken, data.refreshToken);
    } catch (err: any) {
      Alert.alert('Đăng ký thất bại', err?.message || 'Có lỗi xảy ra, vui lòng thử lại');
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

        <View style={styles.header}>
          <Text style={styles.title}>Tạo Tài Khoản</Text>
          <Text style={styles.subtitle}>Đăng ký để theo dõi và đặt cược vào các cuộc đua</Text>
        </View>

        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và Tên *</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={colors.textSubtle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nguyễn Văn A"
                placeholderTextColor={colors.textSubtle}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={colors.textSubtle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={colors.textSubtle}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số Điện Thoại</Text>
            <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={18} color={colors.textSubtle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="0901234567"
                placeholderTextColor={colors.textSubtle}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu * (tối thiểu 8 ký tự)</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSubtle} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textSubtle}
                secureTextEntry={!showPwd}
              />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSubtle} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Role badge */}
          <View style={styles.roleBadge}>
            <Ionicons name="eye-outline" size={16} color={colors.accent} />
            <Text style={styles.roleText}>Vai trò: Khán Giả (Spectator)</Text>
          </View>

          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.registerBtnText}>Tạo Tài Khoản</Text>
            }
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xxl },
  backBtn: { marginBottom: spacing.md },
  header: { marginBottom: spacing.xl },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted },
  form: { gap: spacing.md },
  inputGroup: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textMuted },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.text, fontSize: fontSize.md },
  eyeBtn: { padding: 4 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.accentBorder,
    borderRadius: radius.md, padding: spacing.md,
  },
  roleText: { color: colors.purple, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  registerBtn: {
    backgroundColor: colors.accent, borderRadius: radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  registerBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: '#FFFFFF' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },
  loginText: { color: colors.textMuted, fontSize: fontSize.sm },
  loginLink: { color: colors.purple, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
});
