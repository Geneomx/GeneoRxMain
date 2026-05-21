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
import { useAuth } from '@/auth/AuthContext';
import { colors, spacing } from '@/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!name || !email || !password) {
      Alert.alert('Missing info', 'Please fill out all required fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match', 'Please re-enter your password.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp({ name, email, password, password_confirmation: confirm });
    } catch (err) {
      Alert.alert('Sign up failed', err instanceof Error ? err.message : 'Please try again.');
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
            <Text style={styles.eyebrow}>  Get started</Text>
            <Text style={styles.title}>
              Create your <Text style={styles.titleItalic}>free</Text>{'\n'}account.
            </Text>
            <Text style={styles.subtitle}>
              Save your medications, symptoms, check-ins, and doctor summary across devices.
            </Text>

            <View style={styles.benefits}>
              <View style={styles.benefitRow}>
                <View style={styles.benefitDot} />
                <Text style={styles.benefitText}>Free forever   no credit card required</Text>
              </View>
              <View style={styles.benefitRow}>
                <View style={styles.benefitDot} />
                <Text style={styles.benefitText}>Email verification for account security</Text>
              </View>
              <View style={styles.benefitRow}>
                <View style={styles.benefitDot} />
                <Text style={styles.benefitText}>Weekly check-ins build your profile</Text>
              </View>
            </View>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <Input label="Full name" value={name} onChangeText={setName} placeholder="Jane Doe" />
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
              placeholder="At least 6 characters"
            />
            <Input
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              placeholder="••••••••"
            />
            <Button title="Create free account" onPress={onSubmit} loading={submitting} />
          </View>

          {/* FOOTER LINK */}
          <View style={styles.bottomLink}>
            <Text style={styles.bottomLinkLead}>Already have an account?</Text>
            <Pressable onPress={() => navigation.replace('Login')}>
              <Text style={styles.bottomLinkAction}>Sign in →</Text>
            </Pressable>
          </View>

          <Text style={styles.legal}>
            By creating an account you agree to receive a 6-digit email verification code. Educational guidance only   not medical advice.
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
  backText: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandLogo: { width: 26, height: 26 },
  brandName: { fontSize: 14.5, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },

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
  titleItalic: { fontStyle: 'italic', fontWeight: '400', color: colors.primaryDark },
  subtitle: { fontSize: 15, color: colors.textSoft, lineHeight: 22, marginBottom: 18 },
  benefits: { gap: 8 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
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
  bottomLinkAction: { fontSize: 14, color: colors.primaryDark, fontWeight: '700' },

  legal: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: spacing.sm,
  },
});
