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
import { useAuth } from '@/auth/AuthContext';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { colors, spacing } from '@/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn } = useAuth();
  const { signInWithGoogle, signInWithApple, appleAvailable, loading: socialLoading, error: socialError } = useSocialAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn({ email, password });
    } catch (err) {
      Alert.alert('Sign in failed', err instanceof Error ? err.message : 'Please try again.');
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
            <Pressable onPress={() => navigation.goBack()} hitSlop={14} style={styles.back}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
            <View style={styles.brandRow}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <Text style={styles.brandName}>GeneoRx</Text>
            </View>
          </View>

          {/* INTRO */}
          <View style={styles.intro}>
            <Text style={styles.eyebrow}>  Welcome back</Text>
            <Text style={styles.title}>
              Sign in to{'\n'}your <Text style={styles.titleItalic}>account</Text>.
            </Text>
            <Text style={styles.subtitle}>
              Continue your setup, review insights, and prepare your doctor summary.
            </Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <Input
              label="Email address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
            <Button title="Sign in" onPress={onSubmit} loading={submitting} />

            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotLink}
            >
              <Text style={styles.forgotLinkText}>Forgot your password?</Text>
            </Pressable>

            {/* ── Social sign-in ─────────────────────────────────────────── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {socialError ? (
              <Text style={styles.socialError}>{socialError}</Text>
            ) : null}

            {socialLoading ? (
              <View style={styles.socialLoadingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.socialLoadingText}>Signing in…</Text>
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
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
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
            <Text style={styles.bottomLinkLead}>Don&apos;t have an account?</Text>
            <Pressable onPress={() => navigation.replace('Register')}>
              <Text style={styles.bottomLinkAction}>Create one →</Text>
            </Pressable>
          </View>

          <Text style={styles.legal}>
            Educational guidance only   not medical advice.
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
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  back: { padding: 4 },
  backText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandLogo: { width: 26, height: 26 },
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
    color: colors.primaryDark,
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
    color: colors.primaryDark,
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
    color: colors.primaryDark,
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
    color: '#B91C1C',
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
    backgroundColor: '#fff',
    borderColor: '#dadce0',
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3c4043',
  },

  // AppleAuthenticationButton requires an explicit height
  appleNativeBtn: {
    height: 48,
    borderRadius: 10,
  },
});
