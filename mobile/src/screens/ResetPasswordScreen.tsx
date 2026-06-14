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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { useTranslation } from '@/hooks/useTranslation';
import { resetPassword } from '@/api/auth';
import { colors, spacing } from '@/theme';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;
type Nav = NativeStackNavigationProp<AuthStackParamList>;

export const ResetPasswordScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { token = '', email = '' } = route.params ?? {};

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleReset() {
    if (password.length < 8) {
      Alert.alert(t('mobile.alert.too_short'), t('mobile.alert.min_8_chars'));
      return;
    }
    if (password !== confirm) {
      Alert.alert(t('mobile.alert.mismatch'), t('mobile.alert.passwords_no_match'));
      return;
    }
    if (!token || !email) {
      Alert.alert('Invalid link', 'This reset link is missing required information. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, email, password, confirm);
      setDone(true);
    } catch (err: any) {
      const msg = err?.message ?? 'Could not reset password. The link may have expired   please request a new one.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.brandRow}>
            <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />
            <Text style={s.brandName}>GeneoRx</Text>
          </View>

          <View style={s.iconWrap}>
            <View style={[s.iconCircle, { backgroundColor: colors.successBg, borderColor: colors.success }]}>
              <Text style={s.iconText}>✓</Text>
            </View>
          </View>

          <Text style={s.title}>{t('mobile.auth.reset_done_title')}</Text>
          <Text style={s.sub}>{t('mobile.auth.reset_done_sub')}</Text>

          <Button
            title={t('mobile.auth.signin_now')}
            onPress={() => navigation.navigate('Login')}
            style={{ width: '100%' }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.brandRow}>
            <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />
            <Text style={s.brandName}>GeneoRx</Text>
          </View>

          <View style={s.iconWrap}>
            <View style={s.iconCircle}>
              <Text style={s.iconText}>🔒</Text>
            </View>
          </View>

          <Text style={s.title}>{t('mobile.auth.reset_choose')}</Text>
          <Text style={s.sub}>
            {t('mobile.auth.reset_for_email', { email })}
          </Text>

          <View style={s.field}>
            <Text style={s.label}>{t('mobile.auth.new_password')}</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('mobile.settings.new_pw_ph')}
              placeholderTextColor={colors.textDim}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              style={s.input}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>{t('mobile.settings.confirm_new_password')}</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder={t('mobile.settings.confirm_pw_ph')}
              placeholderTextColor={colors.textDim}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={s.input}
              returnKeyType="done"
              onSubmitEditing={handleReset}
            />
          </View>

          <Button
            title={loading ? t('mobile.auth.resetting') : t('mobile.auth.set_new_password')}
            onPress={handleReset}
            loading={loading}
            disabled={loading}
            style={{ width: '100%', marginTop: 8, marginBottom: 16 }}
          />

          <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={s.backBtn}>
            <Text style={s.backText}>{t('mobile.auth.request_new_link')}</Text>
          </Pressable>

          <Text style={s.legal}>{t('mobile.legal')}</Text>
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 36, alignSelf: 'flex-start' },
  logo: { height: 32, width: 124 },
  brandName: { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },

  iconWrap: { marginBottom: 24 },
  iconCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: colors.primary50,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.primary100,
  },
  iconText: { fontSize: 32 },

  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.6, marginBottom: 10, textAlign: 'center' },
  sub: { fontSize: 15, color: colors.textSoft, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  em: { fontWeight: '700', color: colors.text },

  field: { width: '100%', gap: 6, marginBottom: 16 },
  label: { fontSize: 13.5, fontWeight: '600', color: colors.textSoft },
  input: {
    height: 50, paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    fontSize: 15.5, color: colors.text, backgroundColor: colors.surfaceAlt,
  },

  backBtn: { padding: 8, marginBottom: 24 },
  backText: { fontSize: 14.5, color: colors.textMuted, fontWeight: '500' },

  legal: { fontSize: 12.5, color: colors.textDim, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
});
