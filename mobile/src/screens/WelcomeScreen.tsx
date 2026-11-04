import React, { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';
import { AmbientBackground } from '@/components/AmbientBackground';
import { BrandIdentity } from '@/components/BrandHeader';
import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { Button } from '@/components/Button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/store/LanguageContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { translate } from '@/content/siteTranslations';
import { WelcomeArt } from '@/components/WelcomeArt';
import { colors, fonts } from '@/theme';
import { useToast } from '@/components/Toast';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;
const benefits: Array<{ icon: AppIconName; key: string }> = [
  { icon: 'pill', key: 'slide.1.b0' },
  { icon: 'heart', key: 'slide.1.b2' },
  { icon: 'chart', key: 'slide.2.b2' },
];

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
    <View style={styles.secondary}><Button title={t('nav.signin')} variant="ghost" onPress={() => navigation.navigate('Login')} /><Button title={t('cta.register')} variant="ghost" onPress={() => navigation.navigate('Register')} /></View>
    <Text style={styles.legal}>{t('welcome.legal')}</Text>
  </>;
  return <SafeAreaView style={styles.safe} edges={largeText ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
    <AmbientBackground />
    {!largeText ? header : null}
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={largeText ? styles.largeScroll : styles.scroll}>
      {largeText ? header : null}
      <View style={[page, styles.content]}>
        <View style={styles.art}><WelcomeArt width={Math.min(300, width - 72)} /></View>
        <View style={styles.intro}><Text accessibilityRole="header" style={styles.title}>{t('slide.0.title')}</Text><Text style={styles.body}>{t('slide.0.p0')}</Text></View>
        {largeText ? <View style={styles.actions}>{actions}</View> : null}
        <View style={styles.benefits}>{benefits.map(({ icon, key }, index) => <View key={key} style={[styles.benefit, index === benefits.length - 1 && { borderBottomWidth: 0 }]}><View style={styles.icon}><AppIcon name={icon} size={19} /></View><Text style={styles.benefitText}>{t(key)}</Text></View>)}</View>
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
  secondary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 12 },
  guest: { minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' },
  guestText: { fontSize: 16, lineHeight: 24, color: colors.textMuted },
  legal: { fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center' },
});
