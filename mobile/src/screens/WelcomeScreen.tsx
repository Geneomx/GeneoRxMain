import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';
import { AmbientBackground } from '@/components/AmbientBackground';
import { BrandIdentity } from '@/components/BrandHeader';
import { QuestionSlides } from '@/components/QuestionSlides';
import { Button } from '@/components/Button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/store/LanguageContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { translate } from '@/content/siteTranslations';
import { FOUR_QUESTIONS } from '@/content/fourQuestions';
import { colors, fonts } from '@/theme';
import { useToast } from '@/components/Toast';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

/** A brief introduction; the tracking screens explain the details. */
export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { continueAsGuest } = useAuth();
  const { language } = useLanguage();
  const { page } = useResponsiveLayout();
  const toast = useToast();
  const [starting, setStarting] = useState(false);
  const { fontScale, width } = useWindowDimensions();
  const largeText = fontScale > 1.3;
  const t = (key: string) => translate(key, language.code);
  const slideIcons = ['pill', 'focus', 'heart', 'check'] as const;
  const slideShape = [{ p: [0], b: 0 }, { p: [0, 1], b: 3 }, { p: [], b: 4 }, { p: [0], b: 0 }];
  const slides = slideShape.map((shape, i) => language.code === 'en'
    ? { icon: slideIcons[i], accent: i === 3, ...FOUR_QUESTIONS[i] }
    : {
      icon: slideIcons[i], accent: i === 3, tag: t(`slide.${i}.tag`), title: t(`slide.${i}.title`),
      paragraphs: shape.p.map(k => t(`slide.${i}.p${k}`)), bullets: Array.from({ length: shape.b }, (_, k) => t(`slide.${i}.b${k}`)),
    });
  const start = async () => {
    if (starting) return;
    setStarting(true);
    try { await continueAsGuest(); }
    catch { toast.show(t('mobile.alert.try_again'), 'error'); }
    finally { setStarting(false); }
  };
  const header = <View style={[page, styles.header, largeText && styles.headerStacked]}><BrandIdentity /><LanguageSelector compact /></View>;
  const actions = <>
    <Button title={t('journey.get_started')} loading={starting} onPress={() => { void start(); }} />
    <Text style={styles.legal}>{t('journey.guest_note')}</Text>
    <View style={styles.links}>
      <Pressable accessibilityRole="link" onPress={() => navigation.navigate('Login')} style={styles.linkHit}><Text style={styles.link}>{t('nav.signin')}</Text></Pressable>
      <Text style={styles.linkDot}>·</Text>
      <Pressable accessibilityRole="link" onPress={() => navigation.navigate('Register')} style={styles.linkHit}><Text style={styles.link}>{t('cta.register')}</Text></Pressable>
    </View>
    <Text style={styles.legal}>{t('welcome.legal')}</Text>
  </>;
  return <SafeAreaView style={styles.safe} edges={largeText ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
    <AmbientBackground />
    {!largeText ? header : null}
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={largeText ? styles.largeScroll : styles.scroll}>
      {largeText ? header : null}
      <View style={[page, styles.content]}>
        <QuestionSlides slides={slides} width={Math.min(width - 40, 560)} />
      </View>
    </ScrollView>
    {!largeText ? <SafeAreaView edges={['bottom']} style={styles.footer}><View style={[page, styles.actions]}>{actions}</View></SafeAreaView> : null}
  </SafeAreaView>;
};
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12 },
  headerStacked: { flexDirection: 'column', alignItems: 'flex-start' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 },
  largeScroll: { paddingBottom: 24, gap: 20 },
  content: { gap: 24 }, intro: { gap: 12 }, art: { alignItems: 'center' },
  title: { fontFamily: fonts.serif, fontSize: 31, lineHeight: 37, letterSpacing: -0.8, color: colors.pine },
  body: { fontSize: 17, lineHeight: 24, color: colors.textMuted },
  benefits: { paddingHorizontal: 16, borderRadius: 26, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary50, alignItems: 'center', justifyContent: 'center' },
  benefitText: { flex: 1, fontSize: 17, lineHeight: 25, color: colors.text },
  footer: { backgroundColor: colors.background },
  actions: { gap: 8, paddingTop: 16, paddingBottom: 10 },
  links: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', columnGap: 8 },
  linkHit: { minHeight: 44, paddingHorizontal: 6, justifyContent: 'center' },
  link: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: colors.coral },
  linkDot: { fontSize: 16, color: colors.textDim },
  secondary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 12 },
  guest: { minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' },
  guestText: { fontSize: 16, lineHeight: 24, color: colors.textMuted },
  legal: { fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center' },
});
