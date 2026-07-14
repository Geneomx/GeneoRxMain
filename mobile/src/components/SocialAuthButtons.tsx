import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleLogo } from '@/components/GoogleLogo';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { colors, spacing } from '@/theme';

/**
 * Shared "or continue with" Google + Apple block used on both the Login and
 * Register screens, so the two stay identical (matches the website, which
 * offers social auth on sign-in and sign-up alike).
 */
export const SocialAuthButtons: React.FC<{ mode?: 'signin' | 'signup' }> = ({ mode = 'signin' }) => {
  const { t } = useTranslation();
  const { signInWithGoogle, signInWithApple, appleAvailable, loading, error } = useSocialAuth();

  return (
    <>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('mobile.auth.or_continue')}</Text>
        <View style={styles.dividerLine} />
      </View>

      {error ? <Text style={styles.socialError}>{error}</Text> : null}

      {loading ? (
        <View style={styles.socialLoadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.socialLoadingText}>{t('mobile.auth.signing_in')}</Text>
        </View>
      ) : (
        <View style={styles.socialBtns}>
          <Pressable
            style={({ pressed }) => [styles.socialBtn, styles.googleBtn, pressed && styles.socialBtnPressed]}
            onPress={signInWithGoogle}
            accessibilityRole="button"
            accessibilityLabel={t('mobile.auth.google')}
          >
            <GoogleLogo size={18} />
            <Text style={styles.googleBtnText}>{t('mobile.auth.google')}</Text>
          </Pressable>

          {/* Apple — native button, iOS only */}
          {appleAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                mode === 'signup'
                  ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                  : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              }
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={10}
              style={styles.appleNativeBtn}
              onPress={signInWithApple}
            />
          )}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
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
