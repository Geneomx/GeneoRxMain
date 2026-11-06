import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, type TextInputInstance, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/AmbientBackground';
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
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const verifyingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<TextInputInstance>(null);

  // Registration sends the first code on the server. Reopening this screen
  // must not send duplicates or immediately hit the resend cooldown.
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCooldown(seconds = 60) {
    if (timerRef.current) clearInterval(timerRef.current);
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
    setSendError(null);
    setResending(true);
    try {
      await sendOtp(user.email);
      setSent(true);
      startCooldown(60);
      if (!silent) Alert.alert(t('mobile.alert.updated'), t('mobile.auth.code_sent'));
    } catch (err: any) {
      setSendError(err?.message ?? t('mobile.alert.try_again'));
      if (!silent) Alert.alert(t('mobile.alert.error'), err?.message ?? t('mobile.alert.try_again'));
    } finally {
      setResending(false);
    }
  }

  async function handleVerify(submittedCode = code) {
    if (verifyingRef.current) return;
    if (submittedCode.length !== CODE_LENGTH) {
      Alert.alert(t('mobile.auth.incomplete_code'), t('mobile.auth.enter_all_digits', { digits: CODE_LENGTH }));
      return;
    }
    if (!user?.email) return;

    verifyingRef.current = true;
    setVerifying(true);
    try {
      await verifyOtp(user.email, submittedCode);
      markEmailVerified();
      // RootNavigator will now render AppTabs because emailVerified = true
    } catch (err: any) {
      const msg = err?.message ?? 'Incorrect code. Please check your email and try again.';
      Alert.alert(t('mobile.auth.incorrect_code'), msg);
      setCode('');
      inputRef.current?.focus();
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  }

  function onCodeChange(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(clean);
    if (clean.length === CODE_LENGTH) {
      // auto-submit when all digits entered
      void handleVerify(clean);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <AmbientBackground />
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

          {/* Icon */}
          <View style={s.iconWrap}>
            <View style={s.iconCircle}>
              <Text style={s.iconText}>✉</Text>
            </View>
          </View>

          {/* Copy */}
          <Text style={s.title}>{t('mobile.auth.verify_check_email')}</Text>
          <Text style={s.sub}>
            {t(sendError ? 'design.verify_not_sent' : resending ? 'design.verify_sending' : sent ? 'mobile.auth.verify_sent' : 'design.verify_enter', { digits: CODE_LENGTH, email: user?.email ?? 'your email' })}
          </Text>
          {sendError ? <Text accessibilityRole="alert" style={s.sendError}>{sendError}</Text> : null}

          {/* Code input */}
          <View style={s.inputWrap}>
            <TextInput
              ref={inputRef}
              accessibilityLabel={t('design.verification_code')}
              value={code}
              onChangeText={onCodeChange}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              autoFocus
              style={s.codeInput}
              textContentType="oneTimeCode"
              importantForAutofill="yes"
              caretHidden
              selectionColor="transparent"
            />
            {/* Visual digit boxes */}
            <View style={s.boxes} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
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
            onPress={() => void handleVerify()}
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
              <Pressable onPress={() => handleSend(false)} disabled={resending} style={s.resendButton}>
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

  iconWrap: { marginBottom: 24 },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary50,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.primary100,
  },
  iconText: { fontSize: 34 },

  title: {
    fontSize: 24, fontWeight: '600', color: colors.text,
    letterSpacing: -0.6, marginBottom: 10, textAlign: 'center',
  },
  sub: {
    fontSize: 17, color: colors.textSoft, textAlign: 'center', lineHeight: 22, marginBottom: 32,
  },
  sendError: { color: colors.danger, fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 16 },

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
    color: 'transparent',
    backgroundColor: 'transparent',
    // Android still paints the digits despite the transparent colour, which
    // doubled every number over the boxes; opacity keeps it focusable but unseen.
    opacity: 0,
    zIndex: 1,
    fontSize: 24,
    letterSpacing: 28,
    textAlign: 'center',
  },
  boxes: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    zIndex: 0,
  },
  box: {
    flex: 1, minWidth: 0, height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#F2F2F7',
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
    fontSize: 24, fontWeight: '500', color: colors.text,
  },

  resendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  resendButton: { minHeight: 44, paddingHorizontal: 4, justifyContent: 'center' },
  resendLabel: { fontSize: 14.5, color: colors.textMuted },
  resendLink: { fontSize: 14.5, fontWeight: '500', color: colors.primary },
  resendCountdown: { fontSize: 14.5, color: colors.textDim },

  signOutBtn: { minHeight: 44, justifyContent: 'center', marginBottom: 28, padding: 8 },
  signOutText: { fontSize: 13.5, color: colors.textMuted, textDecorationLine: 'underline' },

  legal: {
    fontSize: 12.5,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
});
