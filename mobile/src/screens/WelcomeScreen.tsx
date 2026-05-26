import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/theme';
import { useAuth } from '@/auth/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

// ── Slider cards matching the website design
const CARDS = [
  {
    num: '01',
    icon: '🧬',
    title: 'What is GeneoRx?',
    body: 'GeneoRx is your personal medication intelligence platform — connecting medications, symptoms, and nutrient levels to help you understand what is really going on in your body.',
    bullets: [],
  },
  {
    num: '02',
    icon: '⚙️',
    title: 'How does it work?',
    body: 'GeneoRx analyzes:',
    bullets: [
      'Your medications',
      'Your symptoms over time',
      'Known drug–nutrient interactions',
    ],
    extra: 'As you check in regularly, it builds a personalized profile, spotting patterns and improving accuracy over time.',
  },
  {
    num: '03',
    icon: '💡',
    title: 'How does it help you?',
    body: '',
    bullets: [
      'Explains symptoms — possible links to medications or nutrient imbalances',
      'Finds root causes — what may be driving fatigue or brain fog',
      'Tracks progress — monitors changes over time',
      'Prepares you for doctor visits — a concise health summary',
    ],
  },
  {
    num: '04',
    icon: '✨',
    title: 'In short.',
    body: 'GeneoRx helps you connect the dots between your medications, symptoms, and nutrition — so you can make smarter health decisions.',
    bullets: [],
    summary: true,
  },
];

const FEATURE_CHIPS = [
  'Personalized health patterns',
  'Medication and nutrient insights',
  'Doctor-ready summaries',
];

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { continueAsGuest } = useAuth();
  const float = useRef(new Animated.Value(0)).current;
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  const prev = () => setActiveCard((c) => (c > 0 ? c - 1 : CARDS.length - 1));
  const next = () => setActiveCard((c) => (c < CARDS.length - 1 ? c + 1 : 0));

  const card = CARDS[activeCard];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>

      {/* ── TOP NAV ── */}
      <View style={styles.topNav}>
        <View style={styles.brandRow}>
          <Image source={require('../../assets/logo.png')} style={styles.brandLogo} resizeMode="contain" />
          <Text style={styles.brandName}>GeneoRx</Text>
        </View>
        <View style={styles.navButtons}>
          <Pressable style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.6 }]} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkBtnText}>Sign in</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.ghostChip, pressed && { backgroundColor: colors.surfaceAlt }]} onPress={() => continueAsGuest()}>
            <Text style={styles.ghostChipText}>Guest</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.primaryChip, pressed && { backgroundColor: colors.primaryDark }]} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.primaryChipText}>Create</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── HERO LOGO ── */}
        <View style={styles.heroVisual}>
          <View style={styles.heroBg} />
          <View style={styles.heroBgGlow} />
          <View style={styles.heroRingOuter} />
          <View style={styles.heroRingMid} />
          <Animated.View style={[styles.heroLogoWrap, { transform: [{ translateY }] }]}>
            <Image source={require('../../assets/logo.png')} style={styles.heroLogo} resizeMode="contain" />
          </Animated.View>
        </View>

        {/* ── HERO COPY (matching website) ── */}
        <View style={styles.heroCopy}>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot}><Text style={styles.heroBadgeDotText}>✕</Text></View>
            <Text style={styles.heroBadgeText}>Personal medication intelligence platform</Text>
          </View>

          <Text style={styles.headline}>
            Understand your meds with{'\n'}<Text style={styles.headlineItalic}>clearer insight</Text>
            <Text style={styles.headlineDot}>.</Text>
          </Text>

          <Text style={styles.sub}>
            GeneoRx turns medications, symptoms, and nutrient patterns into simple guidance you can track, understand, and discuss with your doctor.
          </Text>

          {/* Feature chips */}
          <View style={styles.chips}>
            {FEATURE_CHIPS.map((chip) => (
              <View key={chip} style={styles.chip}>
                <View style={styles.chipDot} />
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>

          {/* CTAs */}
          <View style={styles.heroActions}>
            <Button title="Create your free account" onPress={() => navigation.navigate('Register')} />
            <Pressable style={({ pressed }) => [styles.guestLink, pressed && { opacity: 0.6 }]} onPress={() => continueAsGuest()}>
              <Text style={styles.guestLinkText}>Or <Text style={styles.guestLinkAccent}>continue as guest →</Text></Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.legal}>Free to start · Educational guidance only · not medical advice</Text>

        {/* ── SLIDER SECTION HEADER ── */}
        <View style={styles.sliderHead}>
          <Text style={styles.sliderHeadTag}>  About GeneoRx</Text>
          <Text style={styles.sliderHeadTitle}>
            A <Text style={styles.sliderHeadItalic}>clearer</Text> picture of your health.
          </Text>
        </View>

        {/* ── CARD SLIDER ── */}
        <View style={styles.sliderWrap}>
          {/* Left arrow */}
          <TouchableOpacity style={styles.arrow} onPress={prev} activeOpacity={0.7}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>

          {/* Card */}
          <View style={[styles.card, card.summary && styles.cardSummary]}>
            {/* Number badge */}
            <View style={styles.cardNumBadge}>
              <Text style={[styles.cardNum, card.summary && styles.cardNumSummary]}>{card.num}</Text>
            </View>

            {/* Icon */}
            <View style={[styles.iconWrap, card.summary && styles.iconWrapSummary]}>
              <Text style={styles.iconEmoji}>{card.icon}</Text>
            </View>

            {/* Title */}
            <Text style={[styles.cardTitle, card.summary && styles.cardTitleSummary]}>{card.title}</Text>

            {/* Body */}
            {card.body ? (
              <Text style={[styles.cardBody, card.summary && styles.cardBodySummary]}>{card.body}</Text>
            ) : null}

            {/* Bullets */}
            {card.bullets.length > 0 && (
              <View style={styles.bulletList}>
                {card.bullets.map((b, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bulletDot, card.summary && styles.bulletDotSummary]} />
                    <Text style={[styles.bulletText, card.summary && styles.bulletTextSummary]}>{b}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Extra text */}
            {'extra' in card && card.extra ? (
              <Text style={[styles.cardExtra, card.summary && styles.cardBodySummary]}>{card.extra}</Text>
            ) : null}
          </View>

          {/* Right arrow */}
          <TouchableOpacity style={styles.arrow} onPress={next} activeOpacity={0.7}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {CARDS.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setActiveCard(i)} activeOpacity={0.7}>
              <View style={[styles.dot, i === activeCard && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── BOTTOM CTA ── */}
        <View style={styles.bottomCta}>
          <Text style={styles.bottomCtaTitle}>
            Ready for a <Text style={styles.bottomCtaItalic}>clearer picture</Text>?
          </Text>
          <Text style={styles.bottomCtaSub}>
            Join people who use GeneoRx to turn their medications and symptoms into something useful.
          </Text>
          <Button title="Create your free account" onPress={() => navigation.navigate('Register')} style={{ marginTop: 4 }} />
        </View>

        <Text style={styles.footer}>© GeneoRx · Educational guidance only</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  /* TOP NAV */
  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: 10,
    backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandLogo: { width: 30, height: 30 },
  brandName: { fontSize: 15.5, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  navButtons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  linkBtnText: { fontSize: 13.5, fontWeight: '600', color: colors.textSoft },
  ghostChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  ghostChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  primaryChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 7, backgroundColor: colors.primary },
  primaryChipText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },

  /* HERO VISUAL */
  heroVisual: { height: 200, alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: spacing.md },
  heroBg: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(14,124,102,0.07)' },
  heroBgGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(14,124,102,0.10)' },
  heroRingOuter: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: 'rgba(14,124,102,0.14)' },
  heroRingMid: { position: 'absolute', width: 155, height: 155, borderRadius: 78, borderWidth: 1, borderColor: 'rgba(14,124,102,0.18)', borderStyle: 'dashed' },
  heroLogoWrap: { shadowColor: '#0E7C66', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 10 },
  heroLogo: { width: 100, height: 100 },

  /* HERO COPY */
  heroCopy: { alignItems: 'center', marginBottom: spacing.md },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 5, paddingHorizontal: 12, paddingLeft: 6,
    borderRadius: 999, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.borderSoft,
    marginBottom: 20, shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  heroBadgeDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  heroBadgeDotText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  heroBadgeText: { fontSize: 12.5, fontWeight: '600', color: colors.textSoft },

  headline: { fontSize: 34, fontWeight: '800', color: colors.text, letterSpacing: -1, lineHeight: 40, textAlign: 'center', marginBottom: 12 },
  headlineItalic: { fontStyle: 'italic', fontWeight: '400', color: colors.primaryDark },
  headlineDot: { fontStyle: 'normal', fontWeight: '800', color: colors.text },
  sub: { fontSize: 15, color: colors.textSoft, lineHeight: 22, textAlign: 'center', paddingHorizontal: spacing.xs, marginBottom: 18 },

  /* FEATURE CHIPS */
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: spacing.md },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
    shadowColor: '#0F1F1B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSoft },

  /* HERO ACTIONS */
  heroActions: { width: '100%', gap: 10, marginTop: 4 },
  guestLink: { paddingVertical: 6, alignItems: 'center' },
  guestLinkText: { fontSize: 14, color: colors.textMuted },
  guestLinkAccent: { color: colors.primaryDark, fontWeight: '700' },

  legal: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.md },

  /* SLIDER SECTION HEADER */
  sliderHead: { marginBottom: 16 },
  sliderHeadTag: { fontSize: 12, fontWeight: '700', color: colors.primaryDark, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  sliderHeadTitle: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5, lineHeight: 30 },
  sliderHeadItalic: { fontStyle: 'italic', fontWeight: '400', color: colors.primaryDark },

  /* CARD SLIDER */
  sliderWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },

  arrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F1F1B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
    flexShrink: 0,
  },
  arrowText: { fontSize: 22, color: colors.textSoft, lineHeight: 26, marginTop: -2 },

  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: colors.borderSoft,
    borderLeftWidth: 4, borderLeftColor: colors.primary,
    minHeight: 200,
    shadowColor: '#0F1F1B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
    position: 'relative',
  },
  cardSummary: {
    backgroundColor: '#053D33',
    borderColor: '#053D33', borderLeftColor: colors.primaryLight,
  },

  cardNumBadge: {
    position: 'absolute', top: 14, right: 16,
    backgroundColor: colors.backgroundAlt, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  cardNum: { fontSize: 12, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 },
  cardNumSummary: { color: 'rgba(255,255,255,0.5)' },

  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  iconWrapSummary: { backgroundColor: 'rgba(255,255,255,0.15)' },
  iconEmoji: { fontSize: 22 },

  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3, marginBottom: 10, lineHeight: 23, paddingRight: 40 },
  cardTitleSummary: { color: '#FFFFFF' },
  cardBody: { fontSize: 14, color: colors.textSoft, lineHeight: 21, marginBottom: 4 },
  cardBodySummary: { color: 'rgba(255,255,255,0.80)' },
  cardExtra: { fontSize: 13.5, color: colors.textMuted, lineHeight: 20, marginTop: 10, fontStyle: 'italic' },

  bulletList: { marginTop: 6, gap: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary, marginTop: 7, flexShrink: 0 },
  bulletDotSummary: { backgroundColor: colors.primaryLight },
  bulletText: { flex: 1, fontSize: 14, color: colors.textSoft, lineHeight: 21 },
  bulletTextSummary: { color: 'rgba(255,255,255,0.82)' },

  /* DOT INDICATORS */
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderSoft },
  dotActive: { width: 24, borderRadius: 4, backgroundColor: colors.primary },

  /* BOTTOM CTA */
  bottomCta: {
    backgroundColor: '#0A2E26', borderRadius: 20, padding: spacing.lg,
    marginBottom: spacing.lg, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(63,179,154,0.20)',
    shadowColor: '#0E7C66', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 8,
  },
  bottomCtaTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.6, lineHeight: 30, marginBottom: 10 },
  bottomCtaItalic: { fontStyle: 'italic', fontWeight: '400', color: colors.primaryLight },
  bottomCtaSub: { fontSize: 14.5, color: 'rgba(255,255,255,0.72)', textAlign: 'center', lineHeight: 21, marginBottom: 18 },

  footer: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
});
