import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '@/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const STORAGE_KEY = '@geneorx_onboarding_seen';

interface Card {
  num: string;
  tag: string;
  title: string;
  body?: string;
  bullets?: { strong?: string; rest: string }[];
  accent?: boolean;
  icon: string;
}

const CARDS: Card[] = [
  {
    num: '01',
    tag: 'Overview',
    title: 'What is GeneoRx?',
    body:
      'GeneoRx is your personal medication intelligence platform — connecting medications, symptoms, and nutrient levels to help you understand what is really going on in your body.',
    icon: '💊',
  },
  {
    num: '02',
    tag: 'How it works',
    title: 'How does it work?',
    body: 'GeneoRx analyzes three things together:',
    bullets: [
      { rest: 'Your medications and dosages' },
      { rest: 'Your symptoms over time' },
      { rest: 'Known drug-nutrient interactions' },
    ],
    icon: '⚙️',
  },
  {
    num: '03',
    tag: 'Benefits',
    title: 'How does it help you?',
    bullets: [
      { strong: 'Explains symptoms', rest: ' — possible links to medications or nutrient imbalances' },
      { strong: 'Finds root causes', rest: ' — what may be driving fatigue or brain fog' },
      { strong: 'Tracks progress', rest: ' — monitors changes over time' },
      { strong: 'Prepares you', rest: ' — a concise summary for doctor visits' },
    ],
    icon: '✨',
  },
  {
    num: '04',
    tag: 'In short',
    title: 'The big picture.',
    body:
      'GeneoRx helps you connect the dots between your medications, symptoms, and nutrition — so you can make smarter, more informed health decisions.',
    accent: true,
    icon: '🎯',
  },
];

interface Props {
  /** Called after user dismisses the modal */
  onDone?: () => void;
  /** Force show (ignore AsyncStorage) — useful for previewing */
  forceShow?: boolean;
}

export const OnboardingModal: React.FC<Props> = ({ onDone, forceShow = false }) => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  // Animations
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(60)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  /* ---- Check AsyncStorage on mount ---- */
  useEffect(() => {
    (async () => {
      if (forceShow) {
        setVisible(true);
        return;
      }
      const seen = await AsyncStorage.getItem(STORAGE_KEY);
      if (!seen) setVisible(true);
    })();
  }, [forceShow]);

  /* ---- Entrance animation when visible flips true ---- */
  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  /* ---- Card transition ---- */
  const animateCardOut = (cb: () => void) => {
    Animated.parallel([
      Animated.timing(cardSlide, {
        toValue: -30,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      cb();
      cardSlide.setValue(40);
      Animated.parallel([
        Animated.spring(cardSlide, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  /* ---- Dismiss animation ---- */
  const dismiss = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 80,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onDone?.();
    });
  };

  const handleNext = () => {
    if (step < CARDS.length - 1) {
      animateCardOut(() => setStep((s) => s + 1));
    } else {
      dismiss();
    }
  };

  const handleSkip = () => dismiss();

  if (!visible) return null;

  const card = CARDS[step];
  const isLast = step === CARDS.length - 1;

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />

      {/* Sheet */}
      <View style={styles.sheetContainer}>
        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: sheetOpacity,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header row */}
          <View style={styles.headerRow}>
            <View style={styles.brandPill}>
              <View style={styles.brandDot}>
                <Text style={styles.brandDotText}>Rx</Text>
              </View>
              <Text style={styles.brandPillText}>GeneoRx</Text>
            </View>

            <Pressable onPress={handleSkip} style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.5 }]}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          {/* Progress dots */}
          <View style={styles.dotsRow}>
            {CARDS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === step && styles.dotActive,
                  i < step && styles.dotDone,
                ]}
              />
            ))}
          </View>

          {/* Card content */}
          <Animated.View
            style={[
              styles.card,
              card.accent && styles.cardAccent,
              { opacity: cardOpacity, transform: [{ translateY: cardSlide }] },
            ]}
          >
            {/* Icon + num */}
            <View style={styles.cardTopRow}>
              <View style={[styles.iconBubble, card.accent && styles.iconBubbleAccent]}>
                <Text style={styles.iconEmoji}>{card.icon}</Text>
              </View>
              <Text style={[styles.cardNum, card.accent && styles.cardNumAccent]}>
                {card.num} / {CARDS.length}
              </Text>
            </View>

            {/* Tag */}
            <View style={[styles.tag, card.accent && styles.tagAccent]}>
              <Text style={[styles.tagText, card.accent && styles.tagTextAccent]}>
                {card.tag}
              </Text>
            </View>

            {/* Title */}
            <Text style={[styles.cardTitle, card.accent && styles.cardTitleAccent]}>
              {card.title}
            </Text>

            {/* Body */}
            {card.body && (
              <Text style={[styles.cardBody, card.accent && styles.cardBodyAccent]}>
                {card.body}
              </Text>
            )}

            {/* Bullets */}
            {card.bullets && (
              <View style={styles.bulletList}>
                {card.bullets.map((b, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <View style={[styles.bulletDot, card.accent && styles.bulletDotAccent]} />
                    <Text style={[styles.bulletText, card.accent && styles.bulletTextAccent]}>
                      {b.strong && (
                        <Text style={[styles.bulletStrong, card.accent && styles.bulletStrongAccent]}>
                          {b.strong}
                        </Text>
                      )}
                      {b.rest}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Step counter */}
          <Text style={styles.stepCounter}>
            {step + 1} of {CARDS.length}
          </Text>

          {/* CTA Button */}
          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
            onPress={handleNext}
          >
            <Text style={styles.ctaBtnText}>
              {isLast ? 'Get Started →' : 'Next →'}
            </Text>
          </Pressable>

          {/* Swipe hint */}
          {step === 0 && (
            <Text style={styles.swipeHint}>Tap Next to continue</Text>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 31, 27, 0.55)',
  },

  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: 28,
  },

  sheet: {
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: spacing.lg,
    shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
    maxHeight: SCREEN_H * 0.88,
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderSoft,
    alignSelf: 'center',
    marginBottom: 18,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 5,
    paddingHorizontal: 10,
    paddingLeft: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundAlt,
  },
  brandDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandDotText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  brandPillText: { fontSize: 13, fontWeight: '700', color: colors.text },

  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textMuted,
  },

  /* Progress dots */
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  dot: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    backgroundColor: colors.borderSoft,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  dotDone: {
    backgroundColor: colors.primaryLight,
  },

  /* Card */
  card: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: 16,
    minHeight: 200,
  },
  cardAccent: {
    backgroundColor: '#053D33',
    borderColor: '#053D33',
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleAccent: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  iconEmoji: { fontSize: 22 },

  cardNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  cardNumAccent: { color: 'rgba(255,255,255,0.5)' },

  /* Tag */
  tag: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.primary50,
    marginBottom: 10,
  },
  tagAccent: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tagTextAccent: { color: 'rgba(255,255,255,0.8)' },

  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 10,
  },
  cardTitleAccent: { color: '#FFFFFF' },

  cardBody: {
    fontSize: 15,
    color: colors.textSoft,
    lineHeight: 22,
  },
  cardBodyAccent: { color: 'rgba(255,255,255,0.82)' },

  /* Bullets */
  bulletList: { marginTop: 6, gap: 10 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletDotAccent: {
    backgroundColor: colors.primaryLight,
  },
  bulletText: {
    flex: 1,
    fontSize: 14.5,
    color: colors.textSoft,
    lineHeight: 21,
  },
  bulletTextAccent: { color: 'rgba(255,255,255,0.82)' },
  bulletStrong: {
    fontWeight: '700',
    color: colors.text,
  },
  bulletStrongAccent: { color: '#FFFFFF' },

  /* Step counter */
  stepCounter: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },

  /* CTA */
  ctaBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaBtnPressed: {
    backgroundColor: colors.primaryDark,
    shadowOpacity: 0.15,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  swipeHint: {
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 2,
  },
});
