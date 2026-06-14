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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { useTranslation } from '@/hooks/useTranslation';
import { forgotPassword } from '@/api/auth';
import { colors, spacing } from '@/theme';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      Alert.alert(t('mobile.alert.invalid_email'), t('mobile.alert.valid_email'));
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(trimmed);
      setSent(true);
    } catch (err: any) {
      Alert.alert(t('mobile.alert.error'), err?.message ?? t('mobile.alert.try_again'));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.brandRow}>
            <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />
            <Text style={s.brandName}>GeneoRx</Text>
          </View>

          <View style={s.iconWrap}>
            <View style={s.iconCircle}>
              <Text style={s.iconText}>✓</Text>
            </View>
          </View>

          <Text style={s.title}>{t('mobile.auth.inbox_title')}</Text>
          <Text style={s.sub}>
            {t('mobile.auth.inbox_sub', { email: email.trim() })}
          </Text>

          <Text style={s.hint}>{t('mobile.auth.link_expires')}</Text>

          <Button
            title={t('mobile.auth.back_signin')}
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
              <Text style={s.iconText}>🔑</Text>
            </View>
          </View>

          <Text style={s.title}>{t('mobile.auth.forgot_title')}</Text>
          <Text style={s.sub}>
            {t('mobile.auth.forgot_sub')}
          </Text>

          <View style={s.field}>
            <Text style={s.label}>{t('mobile.auth.email')}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textDim}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              style={s.input}
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <Button
            title={loading ? t('mobile.auth.sending') : t('mobile.auth.send_reset')}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={{ width: '100%', marginBottom: 16 }}
          />

          <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backText}>{t('mobile.auth.back_signin')}</Text>
          </Pressable>

          <Text style={s.legal}>{t('mobile.auth.forgot_legal')}</Text>
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
  hint: { fontSize: 13.5, color: colors.textMuted, marginBottom: 28, textAlign: 'center' },

  field: { width: '100%', gap: 6, marginBottom: 20 },
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
