import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useAuth } from '@/auth/AuthContext';
import { sendOtp, verifyOtp } from '@/api/auth';
import { useTranslation } from '@/hooks/useTranslation';
import { colors, spacing } from '@/theme';

const CODE_LENGTH = 6;

export const VerifyEmailScreen: React.FC = () => {
  const { user, signOut, markEmailVerified } = useAuth();
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Auto-send OTP on mount
  useEffect(() => {
    if (user?.email) handleSend(true);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCooldown(seconds = 60) {
    setCooldown(seconds);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function handleSend(silent = false) {
    if (!user?.email) return;
    setResending(true);
    try {
      await sendOtp(user.email);
      startCooldown(60);
      if (!silent) Alert.alert(t('mobile.alert.updated'), t('mobile.auth.code_sent'));
    } catch (err: any) {
      if (!silent) Alert.alert(t('mobile.alert.error'), err?.message ?? t('mobile.alert.try_again'));
    } finally {
      setResending(false);
    }
  }

  async function handleVerify() {
    if (code.length !== CODE_LENGTH) {
      Alert.alert(t('mobile.auth.incomplete_code'), t('mobile.auth.enter_all_digits', { digits: CODE_LENGTH }));
      return;
    }
    if (!user?.email) return;

    setVerifying(true);
    try {
      await verifyOtp(user.email, code);
      markEmailVerified();
      // RootNavigator will now render AppTabs because emailVerified = true
    } catch (err: any) {
      const msg = err?.message ?? 'Incorrect code. Please check your email and try again.';
      Alert.alert(t('mobile.auth.incorrect_code'), msg);
      setCode('');
      inputRef.current?.focus();
    } finally {
      setVerifying(false);
    }
  }

  function onCodeChange(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(clean);
    if (clean.length === CODE_LENGTH) {
      // auto-submit when all digits entered
      setTimeout(() => handleVerify(), 100);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={s.brandRow}>
            <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />
            <Text style={s.brandName}>GeneoRx</Text>
          </View>

          {/* Icon */}
          <View style={s.iconWrap}>
            <View style={s.iconCircle}>
              <Text style={s.iconText}>✉</Text>
            </View>
          </View>

          {/* Copy */}
          <Text style={s.title}>{t('mobile.auth.verify_check_email')}</Text>
          <Text style={s.sub}>
            {t('mobile.auth.verify_sent', { digits: CODE_LENGTH, email: user?.email ?? 'your email' })}
          </Text>

          {/* Code input */}
          <View style={s.inputWrap}>
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={onCodeChange}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              autoFocus
              style={s.codeInput}
              placeholder="000000"
              placeholderTextColor={colors.textDim}
              textContentType="oneTimeCode"
              importantForAutofill="yes"
            />
            {/* Visual digit boxes */}
            <View style={s.boxes} pointerEvents="none">
              {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    s.box,
                    code.length === i && s.boxActive,
                    i < code.length && s.boxFilled,
                  ]}
                >
                  <Text style={s.boxChar}>{code[i] ?? ''}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Verify button */}
          <Button
            title={verifying ? t('mobile.auth.verifying') : t('mobile.auth.verify_btn')}
            onPress={handleVerify}
            loading={verifying}
            disabled={verifying || code.length < CODE_LENGTH}
            style={{ width: '100%', marginBottom: 20 }}
          />

          {/* Resend */}
          <View style={s.resendRow}>
            <Text style={s.resendLabel}>{t('mobile.auth.didnt_receive')}</Text>
            {cooldown > 0 ? (
              <Text style={s.resendCountdown}>{t('mobile.auth.resend_in', { seconds: cooldown })}</Text>
            ) : (
              <Pressable onPress={() => handleSend(false)} disabled={resending}>
                <Text style={[s.resendLink, resending && { opacity: 0.5 }]}>
                  {resending ? t('mobile.auth.sending') : t('mobile.auth.resend')}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Sign out link */}
          <Pressable onPress={signOut} style={s.signOutBtn}>
            <Text style={s.signOutText}>{t('mobile.auth.use_different')}</Text>
          </Pressable>

          <Text style={s.legal}>
            {t('mobile.auth.verify_spam')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 24,
    paddingBottom: 48,
  },

  brandRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 36, alignSelf: 'flex-start',
  },
  logo: { height: 32, width: 124 },
  brandName: { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },

  iconWrap: { marginBottom: 24 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary50,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.primary100,
  },
  iconText: { fontSize: 34 },

  title: {
    fontSize: 28, fontWeight: '800', color: colors.text,
    letterSpacing: -0.6, marginBottom: 10, textAlign: 'center',
  },
  sub: {
    fontSize: 15, color: colors.textSoft, textAlign: 'center', lineHeight: 22, marginBottom: 32,
  },
  email: { fontWeight: '700', color: colors.text },

  inputWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  // Hidden real input sits on top of the visual boxes for focus/typing
  codeInput: {
    position: 'absolute',
    width: '100%', height: 60,
    opacity: 0,
    zIndex: 1,
    fontSize: 24,
    letterSpacing: 28,
    textAlign: 'center',
  },
  boxes: {
    flexDirection: 'row',
    gap: 10,
    zIndex: 0,
  },
  box: {
    width: 48, height: 58,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  boxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary50,
  },
  boxFilled: {
    borderColor: colors.primary100,
    backgroundColor: colors.background,
  },
  boxChar: {
    fontSize: 24, fontWeight: '700', color: colors.text,
  },

  resendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  resendLabel: { fontSize: 14.5, color: colors.textMuted },
  resendLink: { fontSize: 14.5, fontWeight: '700', color: colors.primary },
  resendCountdown: { fontSize: 14.5, color: colors.textDim },

  signOutBtn: { marginBottom: 28, padding: 8 },
  signOutText: { fontSize: 13.5, color: colors.textMuted, textDecorationLine: 'underline' },

  legal: {
    fontSize: 12.5,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
