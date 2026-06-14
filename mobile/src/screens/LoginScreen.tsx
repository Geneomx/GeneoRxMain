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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAuth } from '@/auth/AuthContext';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { colors, spacing } from '@/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn } = useAuth();
  const { t } = useTranslation();
  const { signInWithGoogle, signInWithApple, appleAvailable, loading: socialLoading, error: socialError } = useSocialAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!email || !password) {
      Alert.alert(t('mobile.alert.missing_info'), t('mobile.alert.enter_email_pw'));
      return;
    }
    setSubmitting(true);
    try {
      await signIn({ email, password });
    } catch (err) {
      Alert.alert(t('mobile.alert.signin_failed'), err instanceof Error ? err.message : t('mobile.alert.try_again'));
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
            <Text style={styles.eyebrow}>  {t('mobile.auth.welcome_back')}</Text>
            <Text style={styles.title}>
              {t('portal.signin_account')}
            </Text>
            <Text style={styles.subtitle}>
              {t('mobile.auth.login_sub')}
            </Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
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
              placeholder="••••••••"
            />
            <Button title={t('nav.signin')} onPress={onSubmit} loading={submitting} />

            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotLink}
            >
              <Text style={styles.forgotLinkText}>{t('mobile.auth.forgot')}</Text>
            </Pressable>

            {/* ── Social sign-in ─────────────────────────────────────────── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('mobile.auth.or_continue')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {socialError ? (
              <Text style={styles.socialError}>{socialError}</Text>
            ) : null}

            {socialLoading ? (
              <View style={styles.socialLoadingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.socialLoadingText}>{t('mobile.auth.signing_in')}</Text>
              </View>
            ) : (
              <View style={styles.socialBtns}>
                {/* Google */}
                <Pressable
                  style={({ pressed }) => [styles.socialBtn, styles.googleBtn, pressed && styles.socialBtnPressed]}
                  onPress={signInWithGoogle}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
                >
                  {/* Google "G" coloured logo */}
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleBtnText}>{t('mobile.auth.google')}</Text>
                </Pressable>

                {/* Apple   rendered with the native Apple button (iOS only) */}
                {appleAvailable && (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={10}
                    style={styles.appleNativeBtn}
                    onPress={signInWithApple}
                  />
                )}
              </View>
            )}
          </View>

          {/* FOOTER LINK */}
          <View style={styles.bottomLink}>
            <Text style={styles.bottomLinkLead}>{t('mobile.auth.no_account')}</Text>
            <Pressable onPress={() => navigation.replace('Register')}>
              <Text style={styles.bottomLinkAction}>{t('mobile.auth.create_one')}</Text>
            </Pressable>
          </View>

          <Text style={styles.legal}>
            {t('mobile.legal')}
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
  backText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    justifyContent: 'center',
  },
  brandLogo: { height: 32, width: 124 },
  brandName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },

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
  titleItalic: {
    fontStyle: 'italic',
    fontWeight: '400',
    color: colors.primaryLight,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSoft,
    lineHeight: 22,
  },

  /* FORM */
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  forgotLink: { alignSelf: 'center', paddingVertical: 4 },
  forgotLinkText: { fontSize: 14, color: colors.primary, fontWeight: '600' },

  /* FOOTER LINK */
  bottomLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    marginBottom: spacing.lg,
  },
  bottomLinkLead: {
    fontSize: 14,
    color: colors.textMuted,
  },
  bottomLinkAction: {
    fontSize: 14,
    color: colors.primaryLight,
    fontWeight: '700',
  },

  legal: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
  },

  /* ── Social sign-in ──── */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSoft,
  },
  dividerText: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontWeight: '500',
  },

  socialError: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },

  socialLoadingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: spacing.sm,
  },
  socialLoadingText: {
    fontSize: 14,
    color: colors.textMuted,
  },

  socialBtns: {
    gap: 10,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    gap: 8,
    borderWidth: 1,
  },
  socialBtnPressed: { opacity: 0.85 },

  googleBtn: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },

  // AppleAuthenticationButton requires an explicit height
  appleNativeBtn: {
    height: 48,
    borderRadius: 10,
  },
});
