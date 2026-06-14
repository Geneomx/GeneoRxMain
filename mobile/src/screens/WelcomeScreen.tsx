import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ABOUT_CARDS } from '@/content/homeContent';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { colors, layout, portalCard, radius, spacing } from '@/theme';
import { useAuth } from '@/auth/AuthContext';
import { translate } from '@/content/siteTranslations';
import { useLanguage } from '@/store/LanguageContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const SLIDE_ACCENTS = ['#4BAEC8', '#A78BFA', '#FF4FD8', '#34D399'] as const;

const ACCENT_BG: Record<string, string> = {
  '#4BAEC8': colors.primary50,
  '#A78BFA': 'rgba(167, 139, 250, 0.12)',
  '#FF4FD8': 'rgba(255, 79, 216, 0.10)',
  '#34D399': colors.successBg,
};

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

const DnaMark = () => (
  <Svg width={28} height={28} viewBox="0 0 48 60" fill="none">
    <Path d="M8 0C34 18 34 42 8 60" stroke={colors.primaryLight} strokeWidth={5} strokeLinecap="round" />
    <Path d="M40 0C14 18 14 42 40 60" stroke={colors.text} strokeWidth={5} strokeLinecap="round" opacity={0.78} />
    <Path d="M14 12H34" stroke={colors.primaryLight} strokeWidth={4} strokeLinecap="round" />
    <Path d="M10 30H38" stroke={colors.text} strokeWidth={4} strokeLinecap="round" opacity={0.78} />
    <Path d="M14 48H34" stroke={colors.primaryLight} strokeWidth={4} strokeLinecap="round" />
  </Svg>
);

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { continueAsGuest } = useAuth();
  const { language } = useLanguage();
  const lang = language.code;
  const { page, scrollBottom } = useResponsiveLayout();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={[styles.topHeader, page]}>
          <View style={styles.brandRow}>
            <Image source={require('../../assets/logo.png')} style={styles.brandLogo} resizeMode="contain" />
          </View>
          <LanguageSelector compact />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.page, page]}>
            <View style={styles.mainBox}>
              <View style={styles.dnaBadge}>
                <DnaMark />
              </View>
              {ABOUT_CARDS.map((card, i) => {
                const accent = SLIDE_ACCENTS[i] ?? SLIDE_ACCENTS[0];
                const copy = getSlideCopy(i, lang);
                const accentBg = ACCENT_BG[accent] ?? colors.primary50;
                return (
                  <View key={card.num}>
                    {i > 0 ? <View style={styles.sectionRule} /> : null}
                    <View style={[styles.section, card.summary && styles.sectionSummary]}>
                      <Text style={styles.featureTitle}>{copy.title}</Text>

                      {copy.body ? <Text style={styles.featureBody}>{copy.body}</Text> : null}

                      {copy.bullets.length > 0 && (
                        <View style={styles.bulletList}>
                          {copy.bullets.map((b, bi) => (
                            <View key={bi} style={styles.bulletRow}>
                              <View style={[styles.bulletCheck, { backgroundColor: accentBg }]}>
                                <Text style={[styles.bulletCheckMark, { color: accent }]}>✓</Text>
                              </View>
                              <Text style={styles.bulletText}>{b}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {copy.extra ? (
                        <View style={styles.extraPanel}>
                          <Text style={styles.featureExtra}>{copy.extra}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.actionsWrap}>
          <View style={[styles.actions, page]}>
            <Button
              title={translate('cta.register', lang)}
              onPress={() => navigation.navigate('Register')}
            />
            <Button
              title={translate('nav.signin', lang)}
              variant="secondary"
              onPress={() => navigation.navigate('Login')}
            />
            <Pressable
              onPress={() => continueAsGuest()}
              style={({ pressed }) => [styles.guestLink, pressed && { opacity: 0.7 }]}
              hitSlop={8}
            >
              <Text style={styles.guestLinkText}>{translate('welcome.guest', lang)}</Text>
            </Pressable>
            <Text style={styles.legal}>{translate('welcome.legal', lang)}</Text>
          </View>
        </SafeAreaView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    backgroundColor: colors.backgroundAlt,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  brandText: { flex: 1, minWidth: 0 },
  brandLogo: { height: 42, width: 168 },
  brandName: { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  brandTag: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 1 },

  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingTop: spacing.md },
  page: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },

  mainBox: {
    ...portalCard,
    position: 'relative',
    padding: spacing.lg,
    gap: 0,
    overflow: 'hidden',
  },
  dnaBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: colors.primary100,
    opacity: 0.9,
  },

  section: { gap: 8, paddingVertical: 2 },
  sectionSummary: {
    backgroundColor: colors.primary50,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary100,
  },
  sectionRule: {
    height: 1,
    backgroundColor: colors.borderSoft,
    marginVertical: spacing.md,
  },

  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 20,
  },
  featureBody: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },

  bulletList: { gap: 8, marginTop: 4, paddingLeft: 4 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  bulletCheckMark: { fontSize: 10, fontWeight: '900' },
  bulletText: { flex: 1, fontSize: 13, color: colors.textSoft, lineHeight: 19 },

  extraPanel: {
    backgroundColor: colors.ghostBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginTop: 4,
  },
  featureExtra: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  actionsWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.backgroundAlt,
  },
  actions: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: 10,
  },
  guestLink: {
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  guestLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  legal: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingTop: 2,
  },
});
