import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/theme';
import { useAuth } from '@/auth/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

interface InfoSection {
  num: string;
  title: string;
  body?: string;
  bullets?: { strong?: string; rest: string }[];
  summary?: boolean;
}

const SECTIONS: InfoSection[] = [
  {
    num: '01',
    title: 'What is GeneoRx?',
    body:
      'GeneoRx is your personal medication intelligence platform   connecting medications, symptoms, and nutrient levels to help you understand what is really going on in your body, giving you a clearer picture of your health.',
  },
  {
    num: '02',
    title: 'How does it work?',
    body: 'GeneoRx analyzes:',
    bullets: [
      { rest: 'Your medications' },
      { rest: 'Your symptoms over time' },
      { rest: 'Known drug nutrient interactions' },
    ],
  },
  {
    num: '03',
    title: 'How does it help you?',
    bullets: [
      { strong: 'Explains symptoms', rest: '   possible links to medications or nutrient imbalances' },
      { strong: 'Finds root causes', rest: '   what may be driving fatigue or brain fog' },
      { strong: 'Tracks progress', rest: '   monitors changes over time' },
      { strong: 'Prepares you for doctor visits', rest: '   a concise health summary' },
    ],
  },
  {
    num: '04',
    title: 'In short.',
    body:
      'GeneoRx helps you connect the dots between your medications, symptoms, and nutrition   so you can make smarter health decisions.',
    summary: true,
  },
];

const STATS = [
  { num: '60s', label: 'Insight time' },
  { num: '240+', label: 'Interactions' },
  { num: '100%', label: 'Private' },
];

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { continueAsGuest } = useAuth();
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>

      {/* ====== TOP NAV   Logo + auth buttons ====== */}
      <View style={styles.topNav}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>GeneoRx</Text>
        </View>

        <View style={styles.navButtons}>
          <Pressable
            style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.6 }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkBtnText}>Sign in</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.ghostChip, pressed && { backgroundColor: colors.surfaceAlt }]}
            onPress={() => continueAsGuest()}
          >
            <Text style={styles.ghostChipText}>Guest</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.primaryChip, pressed && { backgroundColor: colors.primaryDark }]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.primaryChipText}>Create</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ====== HERO VISUAL ====== */}
        <View style={styles.heroVisual}>
          <View style={styles.heroBg} />
          <View style={styles.heroRingOuter} />
          <View style={styles.heroRingInner} />
          <Animated.View style={[styles.heroLogoWrap, { transform: [{ translateY }] }]}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.heroLogo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* ====== HERO COPY ====== */}
        <View style={styles.heroCopy}>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot}>
              <Text style={styles.heroBadgeDotText}>Rx</Text>
            </View>
            <Text style={styles.heroBadgeText}>Personal medication intelligence</Text>
          </View>

          <Text style={styles.headline}>
            The <Text style={styles.headlineItalic}>clarity</Text>{'\n'}behind your medications.
          </Text>
          <Text style={styles.sub}>
            GeneoRx connects your medications, symptoms, and nutrient levels into a single, intelligent view   so you can understand what is happening in your body.
          </Text>

          <View style={styles.heroActions}>
            <Button
              title="Create your free account"
              onPress={() => navigation.navigate('Register')}
            />
            <Pressable
              style={({ pressed }) => [styles.guestLink, pressed && { opacity: 0.6 }]}
              onPress={() => continueAsGuest()}
            >
              <Text style={styles.guestLinkText}>
                Or <Text style={styles.guestLinkAccent}>continue as guest →</Text>
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.legal}>
          Free to start. Educational guidance only   not medical advice.
        </Text>

        {/* ====== STATS STRIP ====== */}
        <View style={styles.statsStrip}>
          {STATS.map((s, idx) => (
            <React.Fragment key={s.label}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{s.num}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
              {idx < STATS.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ====== SECTION HEADER ====== */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTag}>  About GeneoRx</Text>
          <Text style={styles.sectionTitle}>
            A <Text style={styles.sectionTitleItalic}>clearer</Text> picture of your health.
          </Text>
        </View>

        {/* ====== INFO SECTIONS ====== */}
        <View style={styles.infoSections}>
          {SECTIONS.map((section) => (
            <View
              key={section.title}
              style={[styles.infoCard, section.summary && styles.infoCardSummary]}
            >
              <Text style={[styles.infoNum, section.summary && styles.infoNumSummary]}>
                {section.num}
              </Text>
              <Text style={[styles.infoTitle, section.summary && styles.infoTitleSummary]}>
                {section.title}
              </Text>
              {section.body && (
                <Text style={[styles.infoBody, section.summary && styles.infoBodySummary]}>
                  {section.body}
                </Text>
              )}
              {section.bullets && (
                <View style={styles.bulletList}>
                  {section.bullets.map((b, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>
                        {b.strong && <Text style={styles.bulletStrong}>{b.strong}</Text>}
                        {b.rest}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* ====== BOTTOM CTA ====== */}
        <View style={styles.bottomCta}>
          <Text style={styles.bottomCtaTitle}>
            Ready for a <Text style={styles.bottomCtaItalic}>clearer picture</Text>?
          </Text>
          <Text style={styles.bottomCtaSub}>
            Join people who use GeneoRx to turn their medications and symptoms into something useful.
          </Text>
          <Button
            title="Create your free account"
            onPress={() => navigation.navigate('Register')}
            style={{ marginTop: 4 }}
          />
        </View>

        <Text style={styles.footer}>
          © GeneoRx · Educational guidance only
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  /* ====== TOP NAV ====== */
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: { width: 30, height: 30 },
  brandName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  linkBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textSoft,
  },
  ghostChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  ghostChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  primaryChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },
  primaryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },

  /* ====== HERO VISUAL ====== */
  heroVisual: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.md,
  },
  heroBg: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(14, 124, 102, 0.06)',
  },
  heroRingOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(14, 124, 102, 0.12)',
  },
  heroRingInner: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 1,
    borderColor: 'rgba(14, 124, 102, 0.18)',
    borderStyle: 'dashed',
  },
  heroLogoWrap: {
    shadowColor: '#0E7C66',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 8,
  },
  heroLogo: { width: 130, height: 130 },

  /* ====== HERO COPY ====== */
  heroCopy: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
    paddingLeft: 5,
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: 18,
    shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  heroBadgeDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeDotText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  heroBadgeText: { fontSize: 12.5, fontWeight: '600', color: colors.textSoft },

  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.9,
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 12,
  },
  headlineItalic: {
    fontStyle: 'italic',
    fontWeight: '400',
    color: colors.primaryDark,
  },
  sub: {
    fontSize: 15,
    color: colors.textSoft,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },

  /* ====== HERO ACTIONS ====== */
  heroActions: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  guestLink: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  guestLinkText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  guestLinkAccent: {
    color: colors.primaryDark,
    fontWeight: '700',
  },

  legal: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },

  /* ====== STATS ====== */
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -0.6,
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.borderSoft,
    marginVertical: 4,
  },

  /* ====== SECTION HEADER ====== */
  sectionHead: { marginBottom: spacing.md },
  sectionTag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  sectionTitleItalic: {
    fontStyle: 'italic',
    fontWeight: '400',
    color: colors.primaryDark,
  },

  /* ====== INFO SECTIONS ====== */
  infoSections: { gap: 12, marginBottom: spacing.xl },
  infoCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    padding: 22,
  },
  infoCardSummary: {
    backgroundColor: '#053D33',
    borderColor: '#053D33',
  },
  infoNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  infoNumSummary: { color: colors.primaryLight },
  infoTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  infoTitleSummary: { color: '#FFFFFF' },
  infoBody: {
    fontSize: 14.5,
    color: colors.textSoft,
    lineHeight: 22,
  },
  infoBodySummary: { color: 'rgba(255,255,255,0.82)' },
  bulletList: { marginTop: 10, gap: 9 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(14, 124, 102, 0.12)',
    marginTop: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSoft,
    lineHeight: 21,
  },
  bulletStrong: {
    fontWeight: '700',
    color: colors.text,
  },

  /* ====== BOTTOM CTA ====== */
  bottomCta: {
    backgroundColor: colors.text,
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  bottomCtaTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 8,
  },
  bottomCtaItalic: {
    fontStyle: 'italic',
    fontWeight: '400',
    color: colors.primaryLight,
  },
  bottomCtaSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },

  footer: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
