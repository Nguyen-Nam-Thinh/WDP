import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { userService } from '../../services/api/user.service';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export function ChangePasswordScreen() {
  const navigation = useNavigation();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!currentPwd || !newPwd) { Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ'); return; }
    if (newPwd.length < 8) { Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 8 ký tự'); return; }
    setLoading(true);
    try {
      await userService.changePassword(currentPwd, newPwd);
      Alert.alert('Thành Công', 'Mật khẩu đã được thay đổi', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
            <Text style={styles.backText}>Quay Lại</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Đổi Mật Khẩu</Text>
          <Text style={styles.subtitle}>Nhập mật khẩu hiện tại và mật khẩu mới</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật Khẩu Hiện Tại</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textSubtle} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={currentPwd}
                  onChangeText={setCurrentPwd}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSubtle}
                  secureTextEntry={!showCurrent}
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={{ padding: 4 }}>
                  <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSubtle} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật Khẩu Mới (tối thiểu 8 ký tự)</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-open-outline" size={18} color={colors.textSubtle} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newPwd}
                  onChangeText={setNewPwd}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSubtle}
                  secureTextEntry={!showNew}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)} style={{ padding: 4 }}>
                  <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSubtle} />
                </TouchableOpacity>
              </View>
            </View>

            {newPwd.length > 0 && newPwd.length < 8 && (
              <View style={styles.strengthWeak}>
                <Ionicons name="warning-outline" size={14} color={colors.danger} />
                <Text style={styles.strengthWeakText}>Mật khẩu quá ngắn</Text>
              </View>
            )}
            {newPwd.length >= 8 && (
              <View style={styles.strengthOk}>
                <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                <Text style={styles.strengthOkText}>Mật khẩu hợp lệ</Text>
              </View>
            )}

            <TouchableOpacity style={styles.btn} onPress={handleChange} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Đổi Mật Khẩu</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  backText: { color: colors.text, fontSize: fontSize.md },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.xl },
  form: { gap: spacing.md },
  inputGroup: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.medium },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, height: 50,
  },
  input: { flex: 1, color: colors.text, fontSize: fontSize.md },
  strengthWeak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  strengthWeakText: { color: colors.danger, fontSize: fontSize.xs },
  strengthOk: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  strengthOkText: { color: colors.success, fontSize: fontSize.xs },
  btn: {
    backgroundColor: colors.accent, borderRadius: radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  btnText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: '#FFFFFF' },
});
