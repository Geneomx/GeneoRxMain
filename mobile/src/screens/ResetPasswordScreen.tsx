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
import { resetPassword } from '@/api/auth';
import { colors, spacing } from '@/theme';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;
type Nav = NativeStackNavigationProp<AuthStackParamList>;

export const ResetPasswordScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<Nav>();
  const { token = '', email = '' } = route.params ?? {};

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleReset() {
    if (password.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match. Please check and try again.');
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
            <View style={[s.iconCircle, { backgroundColor: '#F0FDF4', borderColor: '#A7F3D0' }]}>
              <Text style={s.iconText}>✓</Text>
            </View>
          </View>

          <Text style={s.title}>Password reset</Text>
          <Text style={s.sub}>Your password has been updated successfully. Sign in with your new password to continue.</Text>

          <Pressable
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.8 }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={s.btnText}>Sign in now</Text>
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
              <Text style={s.iconText}>🔒</Text>
            </View>
          </View>

          <Text style={s.title}>Choose a new password</Text>
          <Text style={s.sub}>
            Resetting password for <Text style={s.em}>{email}</Text>.
            Choose something secure you haven't used before.
          </Text>

          <View style={s.field}>
            <Text style={s.label}>New password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textDim}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              style={s.input}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Confirm new password</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat your new password"
              placeholderTextColor={colors.textDim}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={s.input}
              returnKeyType="done"
              onSubmitEditing={handleReset}
            />
          </View>

          <Pressable
            style={({ pressed }) => [s.btn, (pressed || loading) && { opacity: 0.75 }]}
            onPress={handleReset}
            disabled={loading}
          >
            <Text style={s.btnText}>{loading ? 'Resetting…' : 'Set new password'}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={s.backBtn}>
            <Text style={s.backText}>Request a new link instead</Text>
          </Pressable>

          <Text style={s.legal}>Educational guidance only   not medical advice.</Text>
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

  field: { width: '100%', gap: 6, marginBottom: 16 },
  label: { fontSize: 13.5, fontWeight: '600', color: colors.textSoft },
  input: {
    height: 50, paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    fontSize: 15.5, color: colors.text, backgroundColor: colors.background,
  },

  btn: {
    width: '100%', height: 52,
    backgroundColor: colors.primary, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 16,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  backBtn: { padding: 8, marginBottom: 24 },
  backText: { fontSize: 14.5, color: colors.textMuted, fontWeight: '500' },

  legal: { fontSize: 12.5, color: colors.textDim, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
});
