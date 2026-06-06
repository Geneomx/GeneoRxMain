import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/theme';
import { useAuth } from '@/auth/AuthContext';
import { ABOUT_CARDS } from '@/content/homeContent';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const { width: SCREEN_W } = Dimensions.get('window');
const SNAP = SCREEN_W;
const WATERMARK_SIZE = Math.round(SCREEN_W * 0.95);
const TOTAL = ABOUT_CARDS.length;

// Per-slide accent palette (mirrors the website slide themes)
const THEMES = [
  { accent: '#0E7C66' }, // teal
  { accent: '#2B7A9B' }, // blue
  { accent: '#6B5B95' }, // purple
  { accent: '#1F9281' }, // teal-green (summary)
];

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { continueAsGuest } = useAuth();
  const float = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef<ScrollView>(null);
  const [activeCard, setActiveCard] = useState(0);

  // Gentle breathe for the watermark
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

  // Slow continuous rotation for the watermark
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 40000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  // Entrance animation
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  // Smoothly fade the halo color toward the active slide's accent.
  // NOTE: backgroundColor is NOT supported by the native driver, so this
  // animation must stay JS-driven (useNativeDriver: false) and use its own
  // Animated.Value — never scrollX (which is native-driven for transforms).
  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: activeCard,
      duration: 350,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [activeCard, colorAnim]);

  const enterTranslate = enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  const watermarkScale = float.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const watermarkRotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  // Soft accent halo that shifts color toward the active slide (teal → blue → purple → green).
  // Driven by colorAnim (JS) because backgroundColor can't run on the native driver.
  const glowColor = colorAnim.interpolate({
    inputRange: THEMES.map((_, i) => i),
    outputRange: THEMES.map((t) => t.accent),
    extrapolate: 'clamp',
  });
  const glowScale = float.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  // Subtle horizontal parallax: watermark drifts as the slides move.
  const watermarkShift = scrollX.interpolate({
    inputRange: [0, Math.max(1, (TOTAL - 1) * SNAP)],
    outputRange: [26, -26],
    extrapolate: 'clamp',
  });

  const goToCard = (i: number) => {
    const idx = Math.max(0, Math.min(TOTAL - 1, i));
    setActiveCard(idx);
    sliderRef.current?.scrollTo({ x: idx * SNAP, animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP);
    if (idx !== activeCard) setActiveCard(idx);
  };

  const activeTheme = THEMES[activeCard] ?? THEMES[0];

  return (
    <View style={styles.root}>
      {/* Gradient background + decorative dots */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#E7F3EF" />
            <Stop offset="0.45" stopColor="#F3FAF8" />
            <Stop offset="1" stopColor="#FFFFFF" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bg)" />
        <Circle cx={SCREEN_W * 0.12} cy={96} r={6} fill="#0E7C66" opacity={0.08} />
        <Circle cx={SCREEN_W * 0.9} cy={150} r={9} fill="#0E7C66" opacity={0.06} />
        <Circle cx={SCREEN_W * 0.82} cy={70} r={4} fill="#0E7C66" opacity={0.1} />
        <Circle cx={SCREEN_W * 0.18} cy={430} r={5} fill="#0E7C66" opacity={0.06} />
        <Circle cx={SCREEN_W * 0.88} cy={500} r={7} fill="#0E7C66" opacity={0.05} />
      </Svg>

      {/* Faint animated watermark logo behind everything */}
      <Animated.View
        style={[styles.watermarkWrap, { transform: [{ translateX: watermarkShift }] }]}
        pointerEvents="none"
      >
        <Animated.Image
          source={require('../../assets/logo.png')}
          resizeMode="contain"
          style={[
            styles.watermark,
            { transform: [{ rotate: watermarkRotate }, { scale: watermarkScale }] },
          ]}
        />
      </Animated.View>

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        {/* Brand */}
        <View style={styles.brandRow}>
          <Image source={require('../../assets/logo.png')} style={styles.brandLogo} resizeMode="contain" />
          <Text style={styles.brandName}>GeneoRx</Text>
        </View>

        <Animated.View style={[styles.body, { opacity: enter, transform: [{ translateY: enterTranslate }] }]}>
          {/* Soft, layered color halo behind the active slide */}
          <View style={styles.glowWrap} pointerEvents="none">
            <Animated.View style={{ transform: [{ scale: glowScale }] }}>
              <Animated.View style={[styles.glowOuter, { backgroundColor: glowColor }]}>
                <Animated.View style={[styles.glowInner, { backgroundColor: glowColor }]} />
              </Animated.View>
            </Animated.View>
          </View>

          {/* Boxless one-at-a-time cross-fade slider */}
          <Animated.ScrollView
            ref={sliderRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            onMomentumScrollEnd={onScrollEnd}
            scrollEventThrottle={16}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: true,
            })}
            style={styles.slider}
          >
            {ABOUT_CARDS.map((card, i) => {
              const theme = THEMES[i] ?? THEMES[0];
              const inputRange = [(i - 1) * SNAP, i * SNAP, (i + 1) * SNAP];
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0, 1, 0],
                extrapolate: 'clamp',
              });
              const translateY = scrollX.interpolate({
                inputRange,
                outputRange: [14, 0, 14],
                extrapolate: 'clamp',
              });
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.94, 1, 0.94],
                extrapolate: 'clamp',
              });
              return (
                <View key={card.num} style={styles.slide}>
                  <Animated.View
                    style={[styles.slideInner, { opacity, transform: [{ translateY }, { scale }] }]}
                  >
                    <View style={styles.kickerRow}>
                      <Text style={[styles.kicker, { color: theme.accent }]}>
                        {card.num} / 0{TOTAL}
                      </Text>
                      <View style={styles.segments}>
                        {ABOUT_CARDS.map((_, si) => (
                          <View
                            key={si}
                            style={[
                              styles.segment,
                              { backgroundColor: si <= i ? theme.accent : colors.borderSoft },
                              si === i && styles.segmentActive,
                            ]}
                          />
                        ))}
                      </View>
                    </View>

                    <Text style={styles.cardTitle}>{card.title}</Text>

                    {card.body ? <Text style={styles.cardBody}>{card.body}</Text> : null}

                    {card.bullets.length > 0 && (
                      <View style={styles.bulletList}>
                        {card.bullets.map((b, bi) => (
                          <View key={bi} style={styles.bulletRow}>
                            <View style={[styles.bulletDot, { backgroundColor: theme.accent }]} />
                            <Text style={styles.bulletText}>{b}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {card.extra ? <Text style={styles.cardExtra}>{card.extra}</Text> : null}
                  </Animated.View>
                </View>
              );
            })}
          </Animated.ScrollView>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {ABOUT_CARDS.map((_, i) => (
              <Pressable key={i} onPress={() => goToCard(i)} hitSlop={10}>
                <View
                  style={[
                    styles.dot,
                    i === activeCard && [styles.dotActive, { backgroundColor: activeTheme.accent }],
                  ]}
                />
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button title="Create your free account" onPress={() => navigation.navigate('Register')} style={styles.primaryCta} />
          <Button title="Sign in" variant="secondary" onPress={() => navigation.navigate('Login')} style={styles.secondaryCta} />
          <Pressable
            style={({ pressed }) => [styles.guestLink, pressed && { opacity: 0.6 }]}
            onPress={() => continueAsGuest()}
          >
            <Text style={styles.guestLinkText}>
              Or <Text style={styles.guestLinkAccent}>continue as guest →</Text>
            </Text>
          </Pressable>
          <Text style={styles.legal}>Free to start · Educational guidance only · not medical advice</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3FAF8' },
  safe: { flex: 1 },

  /* WATERMARK */
  watermarkWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermark: { width: WATERMARK_SIZE, height: WATERMARK_SIZE, opacity: 0.13 },

  /* BRAND */
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 9,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  brandLogo: { width: 26, height: 26 },
  brandName: { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },

  /* BODY */
  body: { flex: 1, justifyContent: 'center' },

  /* GLOW — two concentric translucent circles fake a soft radial falloff */
  glowWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    width: SCREEN_W * 0.92,
    height: SCREEN_W * 0.92,
    borderRadius: SCREEN_W * 0.46,
    opacity: 0.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowInner: {
    width: SCREEN_W * 0.56,
    height: SCREEN_W * 0.56,
    borderRadius: SCREEN_W * 0.28,
    opacity: 0.16,
  },

  /* SLIDER */
  slider: { flexGrow: 0 },
  slide: { width: SCREEN_W, justifyContent: 'center' },
  slideInner: { minHeight: 300, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  kicker: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  segments: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  segment: { height: 3, width: 14, borderRadius: 2 },
  segmentActive: { width: 26 },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 14,
    lineHeight: 32,
  },
  cardBody: { fontSize: 15, color: colors.textSoft, lineHeight: 22, marginBottom: 2 },
  cardExtra: { fontSize: 14, color: colors.textMuted, lineHeight: 21, marginTop: 12, fontStyle: 'italic' },
  bulletList: { marginTop: 10, gap: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 15, color: colors.textSoft, lineHeight: 22 },

  /* DOTS */
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderSoft },
  dotActive: { width: 26, borderRadius: 4 },

  /* ACTIONS */
  actions: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: 10 },
  primaryCta: {
    borderRadius: 14,
    minHeight: 54,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 8,
  },
  secondaryCta: {
    borderRadius: 14,
    minHeight: 52,
  },
  guestLink: { paddingVertical: 4, alignItems: 'center' },
  guestLinkText: { fontSize: 14, color: colors.textMuted },
  guestLinkAccent: { color: colors.primaryDark, fontWeight: '700' },
  legal: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
});
