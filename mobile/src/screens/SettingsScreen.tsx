import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/auth/AuthContext';
import { apiRequest } from '@/api/client';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/ProfileStack';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

// ── Small components ──────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <View style={ss.sectionHeader}>
    <Text style={ss.sectionTitle}>{title}</Text>
    {subtitle ? <Text style={ss.sectionSub}>{subtitle}</Text> : null}
  </View>
);

const Row: React.FC<{ label: string; value?: string; onPress?: () => void; danger?: boolean; chevron?: boolean }> = ({
  label, value, onPress, danger, chevron,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [ss.row, pressed && { opacity: 0.7 }]}
    disabled={!onPress}
  >
    <Text style={[ss.rowLabel, danger && ss.rowLabelDanger]}>{label}</Text>
    <View style={ss.rowRight}>
      {value ? <Text style={ss.rowValue}>{value}</Text> : null}
      {chevron ? <Text style={ss.chevron}>›</Text> : null}
    </View>
  </Pressable>
);

const Divider = () => <View style={ss.divider} />;

// ── Main screen ───────────────────────────────────────────────────────────────

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { signOut, user } = useAuth();

  // ── Change password state ──────────────────────────────────────────────
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  async function handleChangePassword() {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Required', 'Please fill in all password fields.');
      return;
    }
    if (newPw.length < 8) {
      Alert.alert('Too short', 'New password must be at least 8 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }

    setPwLoading(true);
    try {
      await apiRequest('/account/password', {
        method: 'PUT',
        body: { current_password: currentPw, password: newPw, password_confirmation: confirmPw },
      });
      Alert.alert('Updated', 'Your password has been changed successfully.', [
        { text: 'OK', onPress: () => { setShowChangePassword(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); } },
      ]);
    } catch (err: any) {
      const msg = err?.message ?? 'Could not update password. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setPwLoading(false);
    }
  }

  // ── Delete account ─────────────────────────────────────────────────────
  function confirmDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This is permanent. All your medications, check-ins, health data, and subscription will be immediately and irreversibly deleted. There is no undo.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: doDeleteAccount,
        },
      ],
    );
  }

  async function doDeleteAccount() {
    try {
      await apiRequest('/account', { method: 'DELETE' });
      // signOut clears the token and navigates to Auth stack
      await signOut();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not delete account. Please try again or contact support.');
    }
  }

  return (
    <SafeAreaView style={ss.safe} edges={['top']}>
      <ScrollView contentContainerStyle={ss.content} showsVerticalScrollIndicator={false}>

        {/* ── Account info ─── */}
        <SectionHeader title="Account" />
        <View style={ss.card}>
          <Row label="Name" value={user?.name ?? ' '} />
          <Divider />
          <Row label="Email" value={user?.email ?? ' '} />
        </View>

        {/* ── Password ─── */}
        <SectionHeader title="Security" />
        <View style={ss.card}>
          <Row
            label="Change password"
            chevron
            onPress={() => setShowChangePassword(!showChangePassword)}
          />

          {showChangePassword && (
            <View style={ss.passwordForm}>
              <Divider />
              <PwInput
                label="Current password"
                value={currentPw}
                onChangeText={setCurrentPw}
                placeholder="Your current password"
              />
              <PwInput
                label="New password"
                value={newPw}
                onChangeText={setNewPw}
                placeholder="At least 8 characters"
              />
              <PwInput
                label="Confirm new password"
                value={confirmPw}
                onChangeText={setConfirmPw}
                placeholder="Repeat new password"
              />
              <Pressable
                style={[ss.actionBtn, ss.actionBtnPrimary, pwLoading && { opacity: 0.6 }]}
                onPress={handleChangePassword}
                disabled={pwLoading}
              >
                <Text style={ss.actionBtnTextPrimary}>
                  {pwLoading ? 'Updating…' : 'Update password'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Legal ─── */}
        <SectionHeader title="Legal" />
        <View style={ss.card}>
          <Row
            label="Privacy Policy"
            chevron
            onPress={() => Linking.openURL('https://geneorx.com/legal/privacy')}
          />
          <Divider />
          <Row
            label="Terms of Service"
            chevron
            onPress={() => Linking.openURL('https://geneorx.com/legal/terms')}
          />
        </View>

        {/* ── Sign out ─── */}
        <View style={ss.card}>
          <Pressable
            onPress={signOut}
            style={({ pressed }) => [ss.row, pressed && { opacity: 0.7 }]}
          >
            <Text style={[ss.rowLabel, ss.rowLabelMuted]}>Sign out</Text>
          </Pressable>
        </View>

        {/* ── Danger zone ─── */}
        <SectionHeader title="Danger zone" />
        <View style={ss.card}>
          <Row
            label="Delete account"
            danger
            chevron
            onPress={confirmDeleteAccount}
          />
        </View>
        <Text style={ss.dangerNote}>
          Deleting your account permanently removes all your data and cannot be undone.
          This satisfies Apple's account deletion requirement.
        </Text>

        <Text style={ss.legal}>© GeneoRx · Educational guidance only   not medical advice.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Password input subcomponent ───────────────────────────────────────────────

const PwInput: React.FC<{
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}> = ({ label, value, onChangeText, placeholder }) => (
  <View style={ss.pwField}>
    <Text style={ss.pwLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textDim}
      secureTextEntry
      autoCapitalize="none"
      autoCorrect={false}
      style={ss.pwInput}
    />
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundAlt },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 60,
    gap: 8,
  },

  sectionHeader: { paddingTop: 16, paddingBottom: 6, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionSub: { fontSize: 12.5, color: colors.textDim, marginTop: 2 },

  card: {
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    minHeight: 50,
  },
  rowLabel: { fontSize: 15, fontWeight: '500', color: colors.text },
  rowLabelDanger: { color: '#DC2626' },
  rowLabelMuted: { color: colors.textSoft },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 14, color: colors.textMuted },
  chevron: { fontSize: 20, color: colors.textDim, marginRight: -4 },

  divider: { height: 1, backgroundColor: colors.borderSoft, marginLeft: spacing.lg },

  passwordForm: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: 12,
  },
  pwField: { gap: 5 },
  pwLabel: { fontSize: 13, fontWeight: '600', color: colors.textSoft },
  pwInput: {
    height: 44,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },

  actionBtn: {
    height: 42,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  actionBtnPrimary: { backgroundColor: colors.primary },
  actionBtnTextPrimary: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '700' },

  dangerNote: {
    fontSize: 12.5,
    color: colors.textDim,
    paddingHorizontal: 4,
    lineHeight: 18,
  },

  legal: {
    fontSize: 11.5,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 12,
    paddingBottom: 8,
  },
});
