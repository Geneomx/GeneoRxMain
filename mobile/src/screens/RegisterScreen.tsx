import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAuth } from '@/auth/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { colors, spacing } from '@/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!name || !email || !password) {
      Alert.alert(t('mobile.alert.missing_info'), t('mobile.alert.fill_all'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('mobile.alert.weak_password'), t('mobile.alert.min_6_chars'));
      return;
    }
    if (password !== confirm) {
      Alert.alert(t('mobile.alert.password_mismatch'), t('mobile.alert.reenter_password'));
      return;
    }
    setSubmitting(true);
    try {
      await signUp({ name, email, password, password_confirmation: confirm });
    } catch (err) {
      Alert.alert(t('mobile.alert.signup_failed'), err instanceof Error ? err.message : t('mobile.alert.try_again'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* TOP BAR */}
          <View style={styles.topBar}>
            <View style={styles.topBarSide}>
              <Pressable onPress={() => navigation.goBack()} hitSlop={14} style={styles.back}>
                <Text style={styles.backText}>← {t('nav.back')}</Text>
              </Pressable>
            </View>
            <View style={styles.brandRow}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <Text style={styles.brandName}>GeneoRx</Text>
            </View>
            <View style={[styles.topBarSide, styles.topBarSideRight]}>
              <LanguageSelector compact />
            </View>
          </View>

          {/* INTRO */}
          <View style={styles.intro}>
            <Text style={styles.eyebrow}>  {t('mobile.auth.get_started')}</Text>
            <Text style={styles.title}>
              {t('cta.register')}
            </Text>
            <Text style={styles.subtitle}>
              {t('mobile.auth.register_sub')}
            </Text>

            <View style={styles.benefits}>
              <View style={styles.benefitRow}>
                <View style={styles.benefitDot} />
                <Text style={styles.benefitText}>{t('mobile.auth.benefit_free')}</Text>
              </View>
              <View style={styles.benefitRow}>
                <View style={styles.benefitDot} />
                <Text style={styles.benefitText}>{t('mobile.auth.benefit_verify')}</Text>
              </View>
              <View style={styles.benefitRow}>
                <View style={styles.benefitDot} />
                <Text style={styles.benefitText}>{t('mobile.auth.benefit_checkins')}</Text>
              </View>
            </View>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <Input label={t('mobile.auth.full_name')} value={name} onChangeText={setName} placeholder="Jane Doe" />
            <Input
              label={t('mobile.auth.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <Input
              label={t('mobile.auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={t('mobile.alert.min_6_chars')}
            />
            <Input
              label={t('mobile.auth.confirm_password')}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              placeholder="••••••••"
            />
            <Button title={t('mobile.auth.create_btn')} onPress={onSubmit} loading={submitting} />
          </View>

          {/* FOOTER LINK */}
          <View style={styles.bottomLink}>
            <Text style={styles.bottomLinkLead}>{t('mobile.auth.has_account')}</Text>
            <Pressable onPress={() => navigation.replace('Login')}>
              <Text style={styles.bottomLinkAction}>{t('mobile.auth.signin_link')}</Text>
            </Pressable>
          </View>

          <Text style={styles.legal}>
            {t('mobile.auth.register_legal')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },

  /* TOP BAR */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  topBarSide: {
    flex: 1,
    minWidth: 72,
  },
  topBarSideRight: {
    alignItems: 'flex-end',
  },
  back: { padding: 4, alignSelf: 'flex-start' },
  backText: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center' },
  brandLogo: { height: 32, width: 124 },
  brandName: { fontSize: 14.5, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },

  /* INTRO */
  intro: { marginBottom: spacing.lg },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: 12,
  },
  titleItalic: { fontStyle: 'italic', fontWeight: '400', color: colors.primaryLight },
  subtitle: { fontSize: 15, color: colors.textSoft, lineHeight: 22, marginBottom: 18 },
  benefits: { gap: 8 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.buttonPrimary,
  },
  benefitText: { fontSize: 13.5, color: colors.textSoft },

  /* FORM */
  form: { gap: spacing.md, marginBottom: spacing.lg },

  /* FOOTER LINK */
  bottomLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    marginBottom: spacing.md,
  },
  bottomLinkLead: { fontSize: 14, color: colors.textMuted },
  bottomLinkAction: { fontSize: 14, color: colors.primaryLight, fontWeight: '700' },

  legal: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: spacing.sm,
  },
});
