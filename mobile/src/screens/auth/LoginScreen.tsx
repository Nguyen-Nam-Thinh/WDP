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

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.login(email.trim(), password);
      if (data.user.role !== 'spectator') {
        Alert.alert('Lỗi', 'App này chỉ dành cho Spectator. Vui lòng dùng web.');
        return;
      }
      await login(data.user, data.accessToken, data.refreshToken);
    } catch (err: any) {
      Alert.alert('Đăng nhập thất bại', err?.message || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>🏇</Text>
          </View>
          <Text style={styles.title}>RaceTrack Pro</Text>
          <Text style={styles.subtitle}>Chào mừng trở lại, Khán Giả!</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
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

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotRow}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.loginBtnText}>Đăng Nhập</Text>
            }
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logoBox: {
    width: 72, height: 72, borderRadius: radius.lg,
    backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.accentBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  logoText: { fontSize: 36 },
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
  forgotRow: { alignItems: 'flex-end' },
  forgotText: { fontSize: fontSize.sm, color: colors.accent, fontWeight: fontWeight.medium },
  loginBtn: {
    backgroundColor: colors.accent, borderRadius: radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  loginBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: '#000' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },
  registerText: { color: colors.textMuted, fontSize: fontSize.sm },
  registerLink: { color: colors.accent, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
