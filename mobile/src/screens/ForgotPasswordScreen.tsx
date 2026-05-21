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
import { forgotPassword } from '@/api/auth';
import { colors, spacing } from '@/theme';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(trimmed);
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not send reset link. Please try again.');
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

          <Text style={s.title}>Check your inbox</Text>
          <Text style={s.sub}>
            If <Text style={s.em}>{email.trim()}</Text> is registered, we've sent a reset link. Check your spam folder if you don't see it.
          </Text>

          <Text style={s.hint}>The link expires in 60 minutes.</Text>

          <Pressable
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.8 }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={s.btnText}>Back to sign in</Text>
          </Pressable>
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

          <Text style={s.title}>Forgot your password?</Text>
          <Text style={s.sub}>
            Enter the email address linked to your account and we'll send you a secure reset link.
          </Text>

          <View style={s.field}>
            <Text style={s.label}>Email address</Text>
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

          <Pressable
            style={({ pressed }) => [s.btn, (pressed || loading) && { opacity: 0.75 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={s.btnText}>{loading ? 'Sending…' : 'Send reset link'}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backText}>← Back to sign in</Text>
          </Pressable>

          <Text style={s.legal}>Link expires in 60 minutes. Educational guidance only   not medical advice.</Text>
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
  logo: { width: 28, height: 28 },
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
    fontSize: 15.5, color: colors.text, backgroundColor: colors.background,
  },

  btn: {
    width: '100%', height: 52,
    backgroundColor: colors.primary, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  backBtn: { padding: 8, marginBottom: 24 },
  backText: { fontSize: 14.5, color: colors.textMuted, fontWeight: '500' },

  legal: { fontSize: 12.5, color: colors.textDim, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
});
