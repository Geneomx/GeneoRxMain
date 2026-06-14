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
import { ABOUT_CARDS } from '@/content/homeContent';
import { translate } from '@/content/siteTranslations';
import { useLanguage } from '@/store/LanguageContext';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/theme';

const STORAGE_KEY = '@geneorx_onboarding_seen';

const SLIDE_ACCENTS = ['#28E1FF', '#A78BFA', '#FF4FD8', '#34D399'] as const;

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

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {ABOUT_CARDS.map((card, i) => {
              const accent = SLIDE_ACCENTS[i] ?? SLIDE_ACCENTS[0];
              const copy = getSlideCopy(i, lang);
              const isLast = i === ABOUT_CARDS.length - 1;
              return (
                <View key={card.num} style={styles.section}>
                  <Text style={[styles.sectionKicker, { color: accent }]}>
                    {card.num} · {copy.tag}
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
                  {!isLast ? <View style={styles.sectionRule} /> : null}
                </View>
              );
            })}
          </ScrollView>

          <Button
            title={translate('mobile.onboarding.get_started', lang)}
            onPress={dismiss}
            style={styles.ctaBtn}
          />
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

  scroll: { flexGrow: 0, maxHeight: 420 },
  scrollContent: { gap: 4, paddingBottom: 4 },

  section: { gap: 5, paddingVertical: 4 },
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
  sectionRule: {
    height: 1,
    backgroundColor: colors.borderSoft,
    marginTop: 12,
  },
  bulletList: { gap: 6 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletMark: { fontSize: 18, fontWeight: '900', lineHeight: 20, width: 10 },
  bulletText: { flex: 1, fontSize: 13.5, color: colors.textSoft, lineHeight: 19 },

  ctaBtn: { marginTop: 14 },
});
