import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Image, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/auth.store';
import { userService } from '../../services/api/user.service';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/MainNavigator';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/api/auth.service';

type NavProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color={colors.accent} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, setUser, logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    try {
      const fresh = await userService.getMe();
      setUser(fresh);
      setFullName(fresh.fullName);
      setPhone(fresh.phone ?? '');
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await userService.updateMe({ fullName: fullName.trim(), phone: phone.trim() || undefined });
      setUser(updated);
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần Quyền Truy Cập', 'Hãy cấp quyền truy cập ảnh');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const updated = await userService.uploadAvatar({
        uri: asset.uri,
        name: asset.fileName ?? 'avatar.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
      setUser(updated);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng Xuất', 'Bạn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng Xuất', style: 'destructive', onPress: async () => {
          await authService.logout().catch(() => {});
          await logout();
        },
      },
    ]);
  };

  const avatarUri = user?.avatarUrl;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); reload(); }} tintColor={colors.accent} />}
      >
        <Text style={styles.pageTitle}>👤 Cá Nhân</Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickAvatar} disabled={uploading} style={styles.avatarWrapper}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={styles.avatar} />
              : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{user?.fullName?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
              )
            }
            <View style={styles.avatarEditBadge}>
              {uploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={14} color="#fff" />
              }
            </View>
          </TouchableOpacity>
          <View style={styles.userBadge}>
            <Ionicons name="eye-outline" size={12} color={colors.accent} />
            <Text style={styles.userBadgeText}>Khán Giả</Text>
          </View>
        </View>

        {/* Editing or viewing */}
        {editing ? (
          <View style={styles.editSection}>
            <Text style={styles.sectionTitle}>Chỉnh Sửa Thông Tin</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Họ và Tên</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color={colors.textSubtle} />
                <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholderTextColor={colors.textSubtle} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số Điện Thoại</Text>
              <View style={styles.inputRow}>
                <Ionicons name="call-outline" size={18} color={colors.textSubtle} />
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={colors.textSubtle} />
              </View>
            </View>

            <View style={styles.editBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Lưu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Thông Tin</Text>
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.editIconBtn}>
                <Ionicons name="pencil-outline" size={18} color={colors.accent} />
              </TouchableOpacity>
            </View>
            <InfoRow icon="person-outline" label="Họ và Tên" value={user?.fullName} />
            <InfoRow icon="mail-outline" label="Email" value={user?.email} />
            <InfoRow icon="call-outline" label="Số Điện Thoại" value={user?.phone} />
            <InfoRow icon="calendar-outline" label="Ngày Tham Gia" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : undefined} />
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('ChangePassword')}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: colors.blueDim }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.blue} />
              </View>
              <Text style={styles.actionText}>Đổi Mật Khẩu</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, styles.logoutRow]} onPress={handleLogout}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: colors.dangerDim }]}>
                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              </View>
              <Text style={[styles.actionText, { color: colors.danger }]}>Đăng Xuất</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.danger + '80'} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text, marginBottom: spacing.lg },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl, gap: spacing.sm },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: colors.accent },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: colors.accentBorder,
    backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 40, fontWeight: fontWeight.bold, color: colors.accent },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg,
  },
  userBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.accentDim, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.accentBorder,
  },
  userBadgeText: { fontSize: fontSize.xs, color: colors.accent, fontWeight: fontWeight.medium },
  infoSection: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
    marginBottom: spacing.lg, gap: spacing.sm,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  editIconBtn: { padding: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: fontSize.xs, color: colors.textSubtle },
  infoValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium, marginTop: 2 },
  editSection: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.accentBorder, padding: spacing.md,
    marginBottom: spacing.lg, gap: spacing.md,
  },
  inputGroup: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.medium },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surfaceHover, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, height: 50,
  },
  input: { flex: 1, color: colors.text, fontSize: fontSize.md },
  editBtnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { color: colors.textMuted, fontWeight: fontWeight.medium },
  saveBtn: { flex: 1, height: 48, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: fontWeight.bold },
  actionsSection: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  logoutRow: { borderBottomWidth: 0 },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium },
});
