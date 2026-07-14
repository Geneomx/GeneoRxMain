import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ABOUT_CARDS } from '@/content/homeContent';
import { translate } from '@/content/siteTranslations';
import { useLanguage } from '@/store/LanguageContext';
import { colors, gradients, spacing } from '@/theme';

const STORAGE_KEY = '@geneorx_onboarding_seen';

const SLIDE_ACCENTS = ['#3ACFEB', '#A78BFA', '#FF4FD8', '#34D399'] as const;
const SLIDE_ICONS = ['💊', '⚙️', '✨', '🎯'] as const;

function getSlideCopy(index: number, lang: string) {
  const bullets =
    index === 1
      ? [0, 1, 2].map((bi) => translate(`slide.1.b${bi}`, lang))
      : index === 2
        ? [0, 1, 2, 3].map((bi) => translate(`slide.2.b${bi}`, lang))
        : [];

  return {
    tag: translate(`slide.${index}.tag`, lang),
    title: translate(`slide.${index}.title`, lang),
    body:
      index === 1
        ? translate('slide.1.p0', lang)
        : index === 0 || index === 3
          ? translate(`slide.${index}.p0`, lang)
          : '',
    bullets,
    extra: index === 1 ? translate('slide.1.p1', lang) : '',
  };
}

interface Props {
  onDone?: () => void;
  forceShow?: boolean;
}

export const OnboardingModal: React.FC<Props> = ({ onDone, forceShow = false }) => {
  const { language } = useLanguage();
  const lang = language.code;
  const [visible, setVisible] = useState(false);
  const [page, setPage] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const slideCount = ABOUT_CARDS.length;

  const goTo = (p: number) => {
    const next = Math.max(0, Math.min(slideCount - 1, p));
    setPage(next);
    if (cardWidth > 0) scrollRef.current?.scrollTo({ x: next * cardWidth, animated: true });
  };

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(60)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

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
  }, [visible, backdropOpacity, sheetTranslateY, sheetOpacity]);

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

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />

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
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.brandPill}>
              <View style={styles.brandDot}>
                <Text style={styles.brandDotText}>Rx</Text>
              </View>
              <Text style={styles.brandPillText}>GeneoRx</Text>
            </View>
            <Pressable onPress={dismiss} style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.5 }]}>
              <Text style={styles.skipText}>{translate('mobile.onboarding.skip', lang)}</Text>
            </Pressable>
          </View>

          <Text style={styles.introTitle}>{translate('hero.eyebrow', lang)}</Text>
          <Text style={styles.introSub}>{translate('cta.sub', lang)}</Text>

          {/* Progress segments — tappable, like the website's intro tabs */}
          <View style={styles.segments}>
            {ABOUT_CARDS.map((c, i) => (
              <Pressable
                key={c.num}
                onPress={() => goTo(i)}
                hitSlop={8}
                style={[styles.segment, i <= page && { backgroundColor: SLIDE_ACCENTS[i] ?? SLIDE_ACCENTS[0] }]}
              />
            ))}
          </View>

          {/* Swipeable slides */}
          <View style={styles.carousel} onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}>
            {cardWidth > 0 && (
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / cardWidth))}
              >
                {ABOUT_CARDS.map((card, i) => {
                  const accent = SLIDE_ACCENTS[i] ?? SLIDE_ACCENTS[0];
                  const copy = getSlideCopy(i, lang);
                  return (
                    <ScrollView
                      key={card.num}
                      style={{ width: cardWidth }}
                      contentContainerStyle={styles.slide}
                      showsVerticalScrollIndicator={false}
                    >
                      <View style={[styles.iconTile, { borderColor: accent + '55', backgroundColor: accent + '22' }]}>
                        <Text style={styles.iconTileText}>{SLIDE_ICONS[i] ?? '•'}</Text>
                      </View>
                      <Text style={[styles.sectionKicker, { color: accent }]}>
                        {copy.tag}
                      </Text>
                      <Text style={styles.sectionTitle}>{copy.title}</Text>
                      {copy.body ? <Text style={styles.sectionBody}>{copy.body}</Text> : null}
                      {copy.bullets.length > 0 && (
                        <View style={styles.bulletList}>
                          {copy.bullets.map((b, bi) => (
                            <View key={bi} style={styles.bulletRow}>
                              <Text style={[styles.bulletMark, { color: accent }]}>·</Text>
                              <Text style={styles.bulletText}>{b}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {copy.extra ? <Text style={styles.sectionExtra}>{copy.extra}</Text> : null}
                    </ScrollView>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Footer — Back · "1 of 4" · Continue (mirrors website intro-footer) */}
          <View style={styles.footerRow}>
            <Pressable
              onPress={() => goTo(page - 1)}
              disabled={page === 0}
              style={({ pressed }) => [
                styles.backBtn,
                page === 0 && styles.backBtnDisabled,
                pressed && page > 0 && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={translate('nav.back', lang)}
            >
              <Text style={styles.backBtnText}>‹ {translate('nav.back', lang)}</Text>
            </Pressable>

            <Text style={styles.counter}>{page + 1} of {slideCount}</Text>

            <Pressable
              onPress={() => (page === slideCount - 1 ? dismiss() : goTo(page + 1))}
              style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel={page === slideCount - 1 ? 'Explore GeneoRx' : translate('nav.continue', lang)}
            >
              <LinearGradient
                colors={gradients.primaryCta}
                start={gradients.start}
                end={gradients.end}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.nextBtnText} numberOfLines={1}>
                {page === slideCount - 1 ? 'Explore GeneoRx' : translate('nav.continue', lang)} ›
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 6, 12, 0.72)',
  },

  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: 20,
  },

  sheet: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: spacing.lg,
    maxHeight: '92%',
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderSoft,
    alignSelf: 'center',
    marginBottom: 14,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandDotText: { fontSize: 9, fontWeight: '800', color: colors.buttonText },
  brandPillText: { fontSize: 15, fontWeight: '800', color: colors.text },

  skipBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  skipText: { fontSize: 13.5, fontWeight: '600', color: colors.textMuted },

  introTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  introSub: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },

  segments: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.borderSoft },

  carousel: { height: 340, marginBottom: 4 },
  slide: { paddingRight: spacing.xs, paddingBottom: 8, gap: 8 },
  iconTile: {
    width: 52, height: 52, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  iconTileText: { fontSize: 26 },

  /* Footer — mirrors website .intro-footer (Back · counter · Continue) */
  footerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 10, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    height: 46, paddingHorizontal: 16, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  backBtnDisabled: { opacity: 0.35 },
  backBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSoft },
  counter: {
    flex: 1, textAlign: 'center',
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  nextBtn: {
    height: 46, paddingHorizontal: 18, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  nextBtnText: { fontSize: 14, fontWeight: '700', color: colors.onPrimary },

  sectionKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  sectionBody: { fontSize: 14, color: colors.textSoft, lineHeight: 20 },
  sectionExtra: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  bulletList: { gap: 6 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletMark: { fontSize: 18, fontWeight: '900', lineHeight: 20, width: 10 },
  bulletText: { flex: 1, fontSize: 13.5, color: colors.textSoft, lineHeight: 19 },
});
