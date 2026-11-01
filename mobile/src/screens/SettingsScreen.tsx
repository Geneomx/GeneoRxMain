import { useVisualPreferences } from '@/store/VisualPreferencesContext';
import React, { useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/auth/AuthContext';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { EditorSheet, refined } from '@/components/RefinedUI';
import { Accordion } from '@/screens/wizard/ui';
import { useReminderSettings } from '@/hooks/useReminderSettings';
import { DropdownSelect } from '@/components/DropdownSelect';
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
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <View style={{ flex: 1, gap: 4 }}><Text style={[ss.rowLabel, danger && ss.rowLabelDanger]}>{label}</Text>{value ? <Text style={ss.rowValue}>{value}</Text> : null}</View>
    <View style={ss.rowRight}>
      {chevron ? <Text style={ss.chevron}>›</Text> : null}
    </View>
  </Pressable>
);

const Divider = () => <View style={ss.divider} />;

// ── Main screen ───────────────────────────────────────────────────────────────

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { signOut, user, isGuest } = useAuth();
  const reminder = useReminderSettings();
  const { brandMotion, setBrandMotion } = useVisualPreferences();
  const [showReminders, setShowReminders] = useState(false);
  const { language, languages, setLanguageCode } = useLanguage();
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
  // The website requires typing DELETE (all caps) before the destructive
  // action fires; we mirror that friction with a confirmation dialog.
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const deleteArmed = deleteConfirmText === 'DELETE';

  function confirmDeleteAccount() {
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  }

  async function doDeleteAccount() {
    if (!deleteArmed || deleting) return;
    setDeleting(true);
    try {
      await apiRequest('/account', { method: 'DELETE' });
      // Clear on-device health data too — otherwise it would be pushed into
      // the next account registered on this device.
      await AsyncStorage.clear().catch(() => undefined);
      // signOut clears the token and navigates to Auth stack
      await signOut();
    } catch (err: any) {
      setDeleting(false);
      Alert.alert(t('mobile.alert.error'), err?.message ?? t('mobile.alert.try_again'));
    }
  }

  return (
    <SafeAreaView style={ss.safe} edges={['top', 'left', 'right']}>
      <AmbientBackground />
      <ScrollView contentContainerStyle={[ss.content, { paddingBottom: scrollBottom }]} showsVerticalScrollIndicator={false}>
        <View style={page}>
        <View style={refined.heading}><Text accessibilityRole="header" style={{ flex: 1, fontSize: 24, fontWeight: '600', letterSpacing: -0.3, color: colors.text }}>{t('mobile.profile.settings')}</Text><Button compact variant="ghost" title={t('nav.back')} onPress={() => navigation.goBack()} /></View>
        {/* ── Preferences ─── */}
        <SectionHeader title={t('mobile.settings.preferences')} />
        <View style={ss.card}>
          <View style={ss.languageRow}>
            <View style={{ flex: 1 }}>
              <Text style={ss.rowLabel}>{t('mobile.settings.language')}</Text>
            </View>
            <View style={{ width: 148, maxWidth: '100%' }}><DropdownSelect inline accessibilityLabel={t('mobile.settings.language')} value={language.code} options={languages.map(item => ({ value: item.code, label: item.nativeLabel }))} onChange={code => { void setLanguageCode(code).catch(() => Alert.alert(t('mobile.alert.try_again'))); }} /></View>
          </View>
        </View>

        <View style={ss.card}><View style={[ss.languageRow, { gap: 12 }]}><View style={{ flex: 1 }}><Text style={ss.rowLabel}>{t('easy.brand_motion')}</Text></View><Switch accessibilityHint={t('easy.brand_motion_note')} accessibilityLabel={t('easy.brand_motion')} value={brandMotion} onValueChange={value => { void setBrandMotion(value).catch(() => Alert.alert(t('mobile.alert.try_again'))); }} /></View></View>
        <Row label={t('mobile.reminders.title')} value={t(reminder.enabled ? 'parity.reminder_on' : 'parity.reminder_off')} chevron onPress={() => setShowReminders(true)} />
        <SectionHeader title={t('mobile.settings.security')} />
        <View style={ss.card}>
          {!isGuest ? <Row label={t('mobile.settings.change_password')} chevron onPress={() => setShowChangePassword(true)} /> : null}
          <Row label={t('refined.personal_title')} value={isGuest ? undefined : user?.email} chevron onPress={() => navigation.navigate('ProfileMain', { edit: 'personal' })} />
        </View>

        {/* ── Legal ─── */}
        <SectionHeader title={t('mobile.settings.legal')} />
        <View style={ss.card}>
          <Row
            label={t('mobile.settings.privacy')}
            chevron
            onPress={() => Linking.openURL(legalPrivacyUrl(language)).catch(() => undefined)}
          />
          <Divider />
          <Row
            label={t('mobile.settings.terms')}
            chevron
            onPress={() => Linking.openURL(legalTermsUrl(language)).catch(() => undefined)}
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

        {!isGuest ? <Accordion title={t('mobile.settings.danger_zone')}>
          <Row label={t('mobile.settings.delete_account')} danger chevron onPress={confirmDeleteAccount} />
          <Text style={ss.dangerNote}>{t('mobile.settings.delete_note')}</Text>
        </Accordion> : null}

        <Text style={ss.legal}>{t('mobile.settings.copyright')}</Text>
        </View>
      </ScrollView>

      <EditorSheet visible={showChangePassword} title={t('mobile.settings.change_password')} onClose={() => { if (!pwLoading) { setShowChangePassword(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); } }} footer={<Button title={pwLoading ? t('mobile.settings.updating') : t('mobile.settings.update_password')} onPress={handleChangePassword} loading={pwLoading} disabled={pwLoading} />}>
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
            </View>
</EditorSheet>
      <EditorSheet visible={showReminders} title={t('mobile.reminders.title')} onClose={() => setShowReminders(false)}><View style={ss.toggleRow}><View style={{ flex: 1, gap: 4 }}><Text style={refined.rowTitle}>{t('parity.reminder')}</Text><Text style={refined.meta}>{t('parity.reminder_sub')}</Text></View><Switch accessibilityLabel={t('parity.reminder')} value={reminder.enabled} disabled={reminder.busy} onValueChange={v => { void reminder.toggle(v); }} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" /></View></EditorSheet>
      {/* ── Delete confirmation (type DELETE) ─── */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={closeDeleteModal}>
        <View style={ss.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDeleteModal} />
          <View style={ss.modalCard}>
            <Text style={ss.modalTitle}>{t('mobile.settings.delete_account')}</Text>
            <Text style={ss.modalBody}>{t('mobile.settings.delete_note')}</Text>
            <Text style={ss.modalPrompt}>To confirm, type DELETE in the box below.</Text>
            <TextInput
              style={ss.modalInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor={colors.textDim}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!deleting}
              accessibilityLabel="Type DELETE to confirm account deletion"
            />
            <View style={ss.modalActions}>
              <Button
                title={t('mobile.alert.cancel')}
                variant="ghost"
                onPress={closeDeleteModal}
                disabled={deleting}
                style={ss.modalBtn}
              />
              <Button
                title={t('mobile.alert.delete_confirm')}
                variant="danger"
                onPress={doDeleteAccount}
                disabled={!deleteArmed || deleting}
                loading={deleting}
                style={ss.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  <Input label={label} value={value} onChangeText={onChangeText} placeholder={placeholder} secureTextEntry autoCapitalize="none" autoCorrect={false} />
);

// ── Styles ────────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    alignItems: 'center',
    paddingTop: 24,
    gap: 8,
  },

  sectionHeader: { paddingTop: 16, paddingBottom: 6, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '500', color: colors.text },
  sectionSub: { fontSize: 15, color: colors.textDim, marginTop: 2 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 0,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 0,
    minHeight: 64,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
  rowLabel: { flexShrink: 1, fontSize: 17, fontWeight: '500', color: colors.text },
  rowLabelDanger: { color: colors.danger },
  rowLabelMuted: { color: colors.textSoft },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 48 },
  rowRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0, minWidth: 16 },
  rowValue: { flexShrink: 1, fontSize: 16, color: colors.textMuted },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 0,
    gap: 12,
  },
  languageHint: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 2,
  },
  chevron: { fontSize: 20, color: colors.textDim, marginRight: 0 },

  divider: { height: 1, backgroundColor: colors.borderSoft, marginLeft: 0 },

  passwordForm: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: 12,
  },
  pwField: { gap: 5 },
  pwLabel: { fontSize: 16, fontWeight: '500', color: colors.textSoft },
  pwInput: {
    height: 44,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    fontSize: 17,
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
  actionBtnTextPrimary: { color: colors.textInverse, fontSize: 14.5, fontWeight: '500' },

  dangerNote: {
    fontSize: 15,
    color: colors.textDim,
    paddingHorizontal: 4,
    lineHeight: 22,
  },

  legal: {
    fontSize: 15,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 12,
    paddingBottom: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 6, 12, 0.72)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '500', color: colors.text },
  modalBody: { fontSize: 17, color: colors.textMuted, lineHeight: 24 },
  modalPrompt: { fontSize: 16, fontWeight: '500', color: colors.textSoft },
  modalInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    color: colors.text,
    letterSpacing: 1,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalBtn: { flex: 1 },
});
