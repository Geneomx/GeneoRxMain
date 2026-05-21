import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { api, getToken, setToken } from './src/api';
import { GeneoProvider } from './src/geneorx/GeneoContext';
import { PortalScreen } from './src/geneorx/PortalScreen';
import type { ApiProfileResponse } from './src/geneorx/sync';

type Screen = 'login' | 'register' | 'verify' | 'treatments';
type SessionUser = { name: string; email: string; emailVerified?: boolean; isGuest?: boolean };

const LIVE_BASE = 'https://geneorx.com';
const LANGUAGES = [
  { label: 'English', path: '' },
  { label: 'Español', path: '/es' },
  { label: 'Français', path: '/fr' },
  { label: 'العربية', path: '/ar' },
  { label: 'اردو', path: '/ur' },
  { label: 'Kiswahili', path: '/sw' },
];
const COUNTRY_CODES = ['+1', '+44', '+92', '+91', '+61', '+971', '+966', '+974', '+965', '+968'];

function LandingBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.infoBlock}>
      <Text style={styles.infoTitle}>{title}</Text>
      {children}
    </View>
  );
}

function LandingBullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>-</Text>
      <Text style={styles.infoText}>{children}</Text>
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [ready, setReady] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [password2, setPassword2] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('+92');
  const [phone, setPhone] = useState('');

  const [user, setUser] = useState<SessionUser | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const loadSessionUser = useCallback(async (token: string) => {
    const d = await api<ApiProfileResponse>('/api/mobile/profile', { token });
    setUser({ name: d.user.name, email: d.user.email, emailVerified: d.user.emailVerified });
  }, []);

  useEffect(() => {
    (async () => {
      const t = await getToken();
      if (!t) {
        return;
      }
      try {
        await loadSessionUser(t);
        setScreen('treatments');
      } catch {
        await setToken(null);
        setUser(null);
        setScreen('login');
      }
    })();
  }, [loadSessionUser]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((n) => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22d3ee" />
        <StatusBar style="light" />
      </View>
    );
  }

  const onLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ token: string; user: { name: string; email: string; id: number; emailVerified?: boolean } }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        token: null,
      });
      await setToken(res.token);
      setUser({ name: res.user.name, email: res.user.email, emailVerified: res.user.emailVerified });
      setScreen('treatments');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async () => {
    setError(null);
    if (password !== password2) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await api<{ token: string; user: { name: string; email: string; id: number; emailVerified?: boolean } }>('/api/auth/register', {
        method: 'POST',
        body: {
          name,
          email,
          phone: phone ? `${phoneCountry}${phone}` : undefined,
          password,
          password_confirmation: password2,
        },
        token: null,
      });
      await setToken(res.token);
      setUser({ name: res.user.name, email: res.user.email, emailVerified: res.user.emailVerified });
      setOtpCode('');
      setResendIn(45);
      setScreen('verify');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    setLoading(true);
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // still clear
    }
    await setToken(null);
    setUser(null);
    setScreen('login');
    setLoading(false);
  };

  const continueAsGuest = async () => {
    await setToken(null);
    setError(null);
    setUser({ name: 'Guest', email: 'guest@geneorx.local', emailVerified: false, isGuest: true });
    setScreen('treatments');
  };

  const openLiveAuth = (path: string) => {
    void Linking.openURL(`${LIVE_BASE}${path}`);
  };

  const onVerifyEmail = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      await api('/api/auth/email-otp/verify', {
        method: 'POST',
        body: { email: user.email, code: otpCode },
        token: null,
      });
      setUser({ ...user, emailVerified: true });
      setScreen('treatments');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const onResendEmailOtp = async () => {
    if (!user || resendIn > 0) return;
    setError(null);
    setLoading(true);
    try {
      await api('/api/auth/email-otp/send', {
        method: 'POST',
        body: { email: user.email },
        token: null,
      });
      setResendIn(45);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light" />
        {error ? (
          <View style={styles.errBanner}>
            <Text style={styles.errText}>{error}</Text>
          </View>
        ) : null}

        {screen === 'login' && (
          <ScrollView style={styles.authScroll} contentContainerStyle={styles.authWrap} keyboardShouldPersistTaps="handled">
            <View pointerEvents="none" style={styles.glowCyan} />
            <View pointerEvents="none" style={styles.glowViolet} />
            <Text style={styles.eyebrow}>Personalized medication insight</Text>
            <View style={styles.languageRow}>
              {LANGUAGES.map((lang) => (
                <Pressable key={lang.label} onPress={() => openLiveAuth(`${lang.path}/login`)}>
                  <Text style={styles.languagePill}>{lang.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.heroTitle}>Why Do I Feel This Way?</Text>
            <Text style={styles.heroSub}>
              GeneoRx helps you understand how your medications, symptoms, and nutrient patterns may be connected.
            </Text>
            <View style={styles.card}>
              <Text style={styles.h1}>Welcome back</Text>
              <Text style={styles.muted}>Sign in to continue to your health dashboard.</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#A9B4D6"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#A9B4D6"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => openLiveAuth('/login')}>
                <Text style={styles.inlineLink}>Forgot password?</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={onLogin}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#061018" /> : <Text style={styles.btnText}>Sign in</Text>}
              </Pressable>
              <View style={styles.authLinkRow}>
                <Pressable onPress={() => setScreen('register')}>
                  <Text style={styles.link}>Create a Free Account</Text>
                </Pressable>
                <Pressable onPress={continueAsGuest}>
                  <Text style={styles.link}>Continue as Guest -&gt;</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.infoPanel}>
              <LandingBlock title="What is GeneoRx?">
                <Text style={styles.infoText}>
                  GeneoRx is your personal medication intelligence platform connecting medications, symptoms, and nutrient levels to help you understand what's really going on in your body, giving you a clearer picture of your health.
                </Text>
              </LandingBlock>
              <LandingBlock title="How does it work?">
                <Text style={styles.infoText}>GeneoRx analyzes:</Text>
                <LandingBullet>Your medications</LandingBullet>
                <LandingBullet>Your symptoms over time</LandingBullet>
                <LandingBullet>Known drug-nutrient interactions</LandingBullet>
                <Text style={styles.infoText}>
                  As you check in regularly, it builds a personalized profile, spotting patterns and improving accuracy over time.
                </Text>
              </LandingBlock>
              <LandingBlock title="How does it help you?">
                <LandingBullet>Explains symptoms - understand possible links to medications or nutrient imbalances</LandingBullet>
                <LandingBullet>Finds root causes - highlights what may be driving issues like fatigue or brain fog</LandingBullet>
                <LandingBullet>Tracks progress - monitors changes over time</LandingBullet>
                <LandingBullet>Prepares you for doctor visits - provides a quick health summary for your doctor</LandingBullet>
              </LandingBlock>
              <LandingBlock title="In short">
                <Text style={styles.infoText}>
                  GeneoRx helps you connect the dots between your medications, symptoms, and nutrition so you can make smarter health decisions.
                </Text>
              </LandingBlock>
            </View>
          </ScrollView>
        )}

        {screen === 'register' && (
          <ScrollView style={styles.authScroll} contentContainerStyle={styles.authWrap} keyboardShouldPersistTaps="handled">
            <View pointerEvents="none" style={styles.glowCyan} />
            <View pointerEvents="none" style={styles.glowViolet} />
            <Text style={styles.eyebrow}>Start your guided setup</Text>
            <View style={styles.languageRow}>
              {LANGUAGES.map((lang) => (
                <Pressable key={lang.label} onPress={() => openLiveAuth(`${lang.path}/register`)}>
                  <Text style={styles.languagePill}>{lang.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.heroTitle}>Create account</Text>
            <Text style={styles.heroSub}>Save your medications, symptoms, routine, check-ins, and doctor summary across devices.</Text>
            <View style={styles.card}>
              <Text style={styles.h1}>Create free account</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#A9B4D6"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A9B4D6"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Text style={styles.fieldLabel}>Phone number optional</Text>
            <View style={styles.phoneRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryScroll}>
                {COUNTRY_CODES.map((code) => (
                  <Pressable
                    key={code}
                    style={[styles.countryPill, phoneCountry === code && styles.countryPillOn]}
                    onPress={() => setPhoneCountry(code)}
                  >
                    <Text style={styles.countryText}>{code}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder="e.g. 3001234567"
                placeholderTextColor="#A9B4D6"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            <Text style={styles.helperText}>We'll send SMS reminders for your weekly check-in when SMS is enabled.</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                placeholderTextColor="#A9B4D6"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Confirm password"
                placeholderTextColor="#A9B4D6"
                secureTextEntry
                value={password2}
                onChangeText={setPassword2}
              />
            </View>
            <Pressable
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={onRegister}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#061018" /> : <Text style={styles.btnText}>Create account</Text>}
            </Pressable>
            <Pressable onPress={() => setScreen('login')}>
              <Text style={styles.link}>Back to sign in</Text>
            </Pressable>
            <Pressable onPress={continueAsGuest}>
              <Text style={styles.secondaryLink}>Continue as Guest →</Text>
            </Pressable>
            </View>
          </ScrollView>
        )}

        {screen === 'verify' && user && (
          <ScrollView style={styles.authScroll} contentContainerStyle={styles.authWrap} keyboardShouldPersistTaps="handled">
            <View pointerEvents="none" style={styles.glowCyan} />
            <View pointerEvents="none" style={styles.glowViolet} />
            <Text style={styles.eyebrow}>Secure your account</Text>
            <Text style={styles.heroTitle}>Verify your email</Text>
            <Text style={styles.heroSub}>We sent a 6-digit code to {user.email}. You can continue now, but verifying helps protect account recovery and sync.</Text>
            <View style={styles.card}>
              <Text style={styles.h1}>Email verification</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="123456"
                placeholderTextColor="#A9B4D6"
                keyboardType="number-pad"
                maxLength={6}
                value={otpCode}
                onChangeText={(t) => setOtpCode(t.replace(/\D/g, '').slice(0, 6))}
              />
              <Pressable style={[styles.btn, (loading || otpCode.length !== 6) && styles.btnDisabled]} onPress={onVerifyEmail} disabled={loading || otpCode.length !== 6}>
                {loading ? <ActivityIndicator color="#061018" /> : <Text style={styles.btnText}>Verify and continue</Text>}
              </Pressable>
              <Pressable onPress={onResendEmailOtp} disabled={loading || resendIn > 0}>
                <Text style={styles.link}>{resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}</Text>
              </Pressable>
              <Pressable onPress={() => setScreen('treatments')}>
                <Text style={styles.secondaryLink}>Skip for now</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {screen === 'treatments' && user && (
          <GeneoProvider userEmail={user.email} userName={user.name} offlineMode={user.isGuest}>
            <PortalScreen onLogout={onLogout} userName={user.name} />
          </GeneoProvider>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070A12',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070A12',
  },
  errBanner: {
    backgroundColor: '#7f1d1d',
    padding: 10,
    borderRadius: 8,
    margin: 12,
  },
  errText: { color: '#fecaca' },
  authScroll: {
    flex: 1,
    maxHeight: '100%',
  },
  authWrap: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 14,
    paddingTop: 14,
    paddingBottom: 24,
  },
  glowCyan: {
    position: 'absolute',
    top: -120,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(40,225,255,0.12)',
  },
  glowViolet: {
    position: 'absolute',
    top: 60,
    right: -110,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(167,139,250,0.13)',
  },
  eyebrow: {
    alignSelf: 'flex-start',
    color: '#A9B4D6',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(15,23,54,0.55)',
    fontSize: 13,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    color: '#EAF0FF',
    letterSpacing: -0.5,
  },
  heroSub: {
    color: '#A9B4D6',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 14,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 16,
  },
  languagePill: {
    color: '#EAF0FF',
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(15,23,54,0.55)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  infoPanel: {
    gap: 12,
    marginBottom: 18,
  },
  infoBlock: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(7,10,18,0.30)',
  },
  infoTitle: {
    color: '#28E1FF',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 7,
  },
  infoText: {
    color: '#EAF0FF',
    fontSize: 13,
    lineHeight: 19,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  bulletDot: {
    color: '#28E1FF',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '900',
  },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#24325E',
    backgroundColor: 'rgba(15,23,54,0.86)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 8,
  },
  h1: { fontSize: 24, fontWeight: '900', color: '#EAF0FF', marginBottom: 8 },
  muted: { color: '#A9B4D6', fontSize: 13, marginTop: 14, marginBottom: 16, lineHeight: 18 },
  input: {
    backgroundColor: 'rgba(7,10,18,0.45)',
    color: '#EAF0FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  fieldLabel: {
    color: '#A9B4D6',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  phoneRow: {
    gap: 10,
    marginBottom: 8,
  },
  countryScroll: {
    maxHeight: 42,
  },
  countryPill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: 8,
    backgroundColor: 'rgba(7,10,18,0.45)',
  },
  countryPillOn: {
    borderColor: '#28E1FF',
    backgroundColor: 'rgba(40,225,255,0.14)',
  },
  countryText: {
    color: '#EAF0FF',
    fontWeight: '800',
  },
  phoneInput: {
    marginBottom: 4,
  },
  passwordRow: {
    flexDirection: 'column',
    gap: 10,
  },
  passwordInput: {
    width: '100%',
  },
  helperText: {
    color: '#A9B4D6',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 22,
    fontWeight: '800',
  },
  btn: {
    backgroundColor: '#28E1FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#061018', fontSize: 16, fontWeight: '900' },
  authLinkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 18,
  },
  link: { color: '#28E1FF', marginTop: 16, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  inlineLink: { color: '#28E1FF', marginBottom: 12, textAlign: 'right', fontSize: 13, fontWeight: '800' },
  secondaryLink: { color: '#A9B4D6', marginTop: 14, textAlign: 'center', fontSize: 14, fontWeight: '600' },
});
