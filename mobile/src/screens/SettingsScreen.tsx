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
import { Button } from '@/components/Button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/store/LanguageContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { apiRequest } from '@/api/client';
import { legalPrivacyUrl, legalTermsUrl } from '@/utils/legalUrls';
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
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { page, scrollBottom } = useResponsiveLayout();

  // ── Change password state ──────────────────────────────────────────────
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  async function handleChangePassword() {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert(t('mobile.alert.required'), t('mobile.alert.fill_password_fields'));
      return;
    }
    if (newPw.length < 8) {
      Alert.alert(t('mobile.alert.too_short'), t('mobile.alert.min_8_chars'));
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert(t('mobile.alert.mismatch'), t('mobile.alert.passwords_no_match'));
      return;
    }

    setPwLoading(true);
    try {
      await apiRequest('/account/password', {
        method: 'PUT',
        body: { current_password: currentPw, password: newPw, password_confirmation: confirmPw },
      });
      Alert.alert(t('mobile.alert.updated'), t('mobile.alert.password_changed'), [
        { text: t('mobile.alert.ok'), onPress: () => { setShowChangePassword(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); } },
      ]);
    } catch (err: any) {
      const msg = err?.message ?? t('mobile.alert.try_again');
      Alert.alert(t('mobile.alert.error'), msg);
    } finally {
      setPwLoading(false);
    }
  }

  // ── Delete account ─────────────────────────────────────────────────────
  function confirmDeleteAccount() {
    Alert.alert(
      t('mobile.settings.delete_account'),
      t('mobile.alert.delete_body'),
      [
        { text: t('mobile.alert.cancel'), style: 'cancel' },
        {
          text: t('mobile.alert.delete_confirm'),
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
      Alert.alert(t('mobile.alert.error'), err?.message ?? t('mobile.alert.try_again'));
    }
  }

  return (
    <SafeAreaView style={ss.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[ss.content, { paddingBottom: scrollBottom }]} showsVerticalScrollIndicator={false}>
        <View style={page}>
        {/* ── Preferences ─── */}
        <SectionHeader title={t('mobile.settings.preferences')} subtitle={t('mobile.settings.preferences_sub')} />
        <View style={ss.card}>
          <View style={ss.languageRow}>
            <View style={{ flex: 1 }}>
              <Text style={ss.rowLabel}>{t('mobile.settings.language')}</Text>
              <Text style={ss.languageHint}>{language.label}</Text>
            </View>
            <LanguageSelector compact />
          </View>
        </View>

        {/* ── Account info ─── */}
        <SectionHeader title={t('mobile.settings.account')} />
        <View style={ss.card}>
          <Row label={t('mobile.settings.name')} value={user?.name ?? ' '} />
          <Divider />
          <Row label={t('mobile.auth.email')} value={user?.email ?? ' '} />
        </View>

        <SectionHeader title={t('mobile.settings.security')} />
        <View style={ss.card}>
          <Row
            label={t('mobile.settings.change_password')}
            chevron
            onPress={() => setShowChangePassword(!showChangePassword)}
          />

          {showChangePassword && (
            <View style={ss.passwordForm}>
              <Divider />
              <PwInput
                label={t('mobile.settings.current_password')}
                value={currentPw}
                onChangeText={setCurrentPw}
                placeholder={t('mobile.settings.current_pw_ph')}
              />
              <PwInput
                label={t('mobile.settings.new_password')}
                value={newPw}
                onChangeText={setNewPw}
                placeholder={t('mobile.settings.new_pw_ph')}
              />
              <PwInput
                label={t('mobile.settings.confirm_new_password')}
                value={confirmPw}
                onChangeText={setConfirmPw}
                placeholder={t('mobile.settings.confirm_pw_ph')}
              />
              <Button
                title={pwLoading ? t('mobile.settings.updating') : t('mobile.settings.update_password')}
                onPress={handleChangePassword}
                loading={pwLoading}
                disabled={pwLoading}
              />
            </View>
          )}
        </View>

        {/* ── Legal ─── */}
        <SectionHeader title={t('mobile.settings.legal')} />
        <View style={ss.card}>
          <Row
            label={t('mobile.settings.privacy')}
            chevron
            onPress={() => Linking.openURL(legalPrivacyUrl(language))}
          />
          <Divider />
          <Row
            label={t('mobile.settings.terms')}
            chevron
            onPress={() => Linking.openURL(legalTermsUrl(language))}
          />
        </View>

        {/* ── Sign out ─── */}
        <View style={ss.card}>
          <Pressable
            onPress={signOut}
            style={({ pressed }) => [ss.row, pressed && { opacity: 0.7 }]}
          >
            <Text style={[ss.rowLabel, ss.rowLabelMuted]}>{t('mobile.settings.sign_out')}</Text>
          </Pressable>
        </View>

        {/* ── Danger zone ─── */}
        <SectionHeader title={t('mobile.settings.danger_zone')} />
        <View style={ss.card}>
          <Row
            label={t('mobile.settings.delete_account')}
            danger
            chevron
            onPress={confirmDeleteAccount}
          />
        </View>
        <Text style={ss.dangerNote}>
          {t('mobile.settings.delete_note')}
        </Text>

        <Text style={ss.legal}>{t('mobile.settings.copyright')}</Text>
        </View>
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
    alignItems: 'center',
    paddingTop: spacing.md,
    gap: 8,
  },

  sectionHeader: { paddingTop: 16, paddingBottom: 6, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionSub: { fontSize: 12.5, color: colors.textDim, marginTop: 2 },

  card: {
    backgroundColor: colors.surfaceAlt,
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
  rowLabelDanger: { color: colors.danger },
  rowLabelMuted: { color: colors.textSoft },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 14, color: colors.textMuted },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  languageHint: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },
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
    backgroundColor: colors.surfaceAlt,
  },

  actionBtn: {
    height: 42,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  actionBtnPrimary: { backgroundColor: colors.buttonPrimary },
  actionBtnTextPrimary: { color: colors.textInverse, fontSize: 14.5, fontWeight: '700' },

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
