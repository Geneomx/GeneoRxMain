import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProfile } from '@/store/ProfileContext';
import { useAuth } from '@/auth/AuthContext';
import { clearToken } from '@/auth/tokenStorage';
import { useWizard } from '@/store/WizardContext';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Loader } from '@/components/Loader';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/ProfileStack';

export const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { data, loading, refresh, save } = useProfile();
  const { signOut, user, isGuest } = useAuth();
  const { reset: resetWizard } = useWizard();
  const { page, scrollBottom } = useResponsiveLayout();

  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [pregnant, setPregnant] = useState(false);
  const [kidneyDisease, setKidneyDisease] = useState(false);
  const [anticoagulants, setAnticoagulants] = useState(false);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setAge(String(data.profile?.age ?? ''));
    setGender(data.profile?.gender ?? '');
    setPhone(data.profile?.phone ?? '');
    setPregnant(!!data.profile?.pregnant);
    setKidneyDisease(!!data.profile?.kidneyDisease);
    setAnticoagulants(!!data.profile?.anticoagulants);
    setConsent(!!data.account?.consent);
  }, [data]);

  async function onSave() {
    setSaving(true);
    try {
      await save({
        profile: { age, gender, phone, pregnant, kidneyDisease, anticoagulants },
        account: { consent },
      });
      Alert.alert(t('mobile.profile.saved_title'), t('mobile.profile.saved_body'));
    } catch (err) {
      Alert.alert(
        t('mobile.profile.save_error_title'),
        err instanceof Error ? err.message : t('mobile.profile.save_error_body'),
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmResetApp() {
    Alert.alert(
      t('mobile.profile.reset_title'),
      t('mobile.profile.reset_body'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('mobile.profile.reset_btn'),
          style: 'destructive',
          onPress: async () => {
            try {
              resetWizard();
              await AsyncStorage.clear();
              await clearToken();
            } catch {
              // best-effort — still sign out below
            }
            await signOut();
          },
        },
      ],
    );
  }

  if (loading && !data) return <Loader />;

  const displayName = data?.user?.name || user?.name || t('mobile.profile.your_account');
  const displayEmail = data?.user?.email || user?.email || '';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottom }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={page}>
        {/* HEADER */}
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>GeneoRx</Text>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.7 }]}
            hitSlop={8}
          >
            <Text style={styles.settingsBtnText}>{t('mobile.profile.settings')}</Text>
          </Pressable>
        </View>

        {/* PROFILE HEADER */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{displayEmail || t('mobile.profile.no_email')}</Text>
            <View style={[styles.planTag, isGuest && styles.planTagGuest]}>
              <Text style={[styles.planTagText, isGuest && styles.planTagTextGuest]}>
                {isGuest ? t('mobile.profile.guest_mode') : t('mobile.profile.free_plan')}
              </Text>
            </View>
          </View>
        </View>

        {/* HEALTH PROFILE SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTag}>  {t('mobile.profile.health_tag')}</Text>
            <Text style={styles.sectionTitle}>{t('mobile.profile.about_you')}</Text>
            <Text style={styles.sectionSub}>{t('mobile.profile.about_sub')}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Input label={t('account.age')} value={age} onChangeText={setAge} keyboardType="number-pad" placeholder={t('account.age_placeholder')} />
            </View>
            <View style={styles.col}>
              <Input label={t('account.gender')} value={gender} onChangeText={setGender} placeholder={t('account.gender')} />
            </View>
          </View>
          <Input label={t('mobile.profile.phone_optional')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+1 555 000 0000" />
        </View>

        {/* SAFETY FLAGS */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTag}>  {t('mobile.profile.safety_tag')}</Text>
            <Text style={styles.sectionTitle}>{t('mobile.profile.safety_title')}</Text>
            <Text style={styles.sectionSub}>{t('mobile.profile.safety_sub')}</Text>
          </View>

          <Toggle
            label={t('account.pregnant')}
            description={t('mobile.profile.pregnant_desc')}
            value={pregnant}
            onValueChange={setPregnant}
          />
          <Toggle
            label={t('account.chip.kidney')}
            description={t('mobile.profile.kidney_desc')}
            value={kidneyDisease}
            onValueChange={setKidneyDisease}
          />
          <Toggle
            label={t('account.chip.anticoag')}
            description={t('mobile.profile.anticoag_desc')}
            value={anticoagulants}
            onValueChange={setAnticoagulants}
          />
        </View>

        {/* CONSENT */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTag}>  {t('mobile.profile.consent_tag')}</Text>
            <Text style={styles.sectionTitle}>{t('mobile.profile.consent_title')}</Text>
          </View>
          <Toggle
            label={t('mobile.profile.consent_label')}
            description={t('mobile.profile.consent_desc')}
            value={consent}
            onValueChange={setConsent}
          />
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <Button title={t('mobile.profile.save')} onPress={onSave} loading={saving} />
          <Button title={t('mobile.profile.sign_out')} variant="secondary" onPress={signOut} />
          <Pressable
            onPress={confirmResetApp}
            style={({ pressed }) => [styles.resetLink, pressed && { opacity: 0.6 }]}
            hitSlop={8}
          >
            <Text style={styles.resetLinkText}>{t('mobile.profile.reset_link')}</Text>
          </Pressable>
        </View>

        <Text style={styles.legal}>{t('mobile.settings.copyright')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const Toggle: React.FC<{
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}> = ({ label, description, value, onValueChange }) => (
  <View style={toggleStyles.row}>
    <View style={{ flex: 1 }}>
      <Text style={toggleStyles.label}>{label}</Text>
      {description ? <Text style={toggleStyles.description}>{description}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ true: colors.primaryLight, false: colors.border }}
      thumbColor={value ? colors.primary : '#FFFFFF'}
      ios_backgroundColor={colors.border}
    />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundAlt },
  content: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    gap: spacing.md,
  },

  /* BRAND */
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  brandLogo: { height: 32, width: 124 },
  brandName: { fontSize: 14.5, fontWeight: '800', color: colors.text, letterSpacing: -0.2, flex: 1 },
  settingsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primary50,
  },
  settingsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  /* PROFILE HEADER */
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary100,
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.primaryDark },
  profileMeta: { flex: 1 },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  profileEmail: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  planTag: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 5,
    backgroundColor: colors.primary50,
  },
  planTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  planTagGuest: { backgroundColor: colors.surfaceAlt },
  planTagTextGuest: { color: colors.textMuted },

  /* SECTION */
  section: {
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHead: { gap: 4, marginBottom: 4 },
  sectionTag: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  sectionSub: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginTop: 2 },

  row: { flexDirection: 'row', gap: spacing.sm },
  col: { flex: 1 },

  /* ACTIONS */
  actions: { gap: 10, marginTop: 4 },
  resetLink: { alignItems: 'center', paddingVertical: 8, marginTop: 2 },
  resetLinkText: { fontSize: 13, fontWeight: '600', color: colors.danger },

  legal: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  description: { fontSize: 12.5, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
});
