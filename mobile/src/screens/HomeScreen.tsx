import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from '@/navigation/AppTabs';
import { AmbientBackground } from '@/components/AmbientBackground';
import { MedicationFocusCard } from '@/components/MedicationFocusCard';
import { RecentUpdateStrip } from '@/components/RecentUpdateStrip';
import { AskBubble } from '@/components/AskBubble';
import { TopBar } from '@/components/TopBar';
import { SaveState } from '@/components/SaveState';
import { LatestUpdateCard } from '@/components/LatestUpdateCard';
import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { ListRow, refined } from '@/components/RefinedUI';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { computeDrugInteractions } from '@/wizard/engine';
import { latestUpdate } from '@/wizard/latestUpdate';
import { trackingJourney } from '@/wizard/trackingJourney';
import { Section } from '@/screens/wizard/ui';
import { dashboardPalette as palette } from '@/theme/dashboard';
import { colors } from '@/theme';
import { useLocalDay } from '@/hooks/useLocalDay';
import { useSetup } from '@/store/SetupContext';

type Props = BottomTabScreenProps<AppTabsParamList, 'Home'>;
/** Consecutive weeks (ending this week or last) with at least one check-in. */
export function weeklyCheckinStreak(dates: string[], now: Date = new Date()): number {
  if (!dates.length) return 0;
  const weekOf = (d: Date) => {
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dow = (day.getDay() + 6) % 7; // Monday = 0
    day.setDate(day.getDate() - dow);
    return day.getTime();
  };
  const weeks = new Set(
    dates
      .map((iso) => new Date(iso))
      .filter((d) => !Number.isNaN(d.getTime()))
      .map((d) => weekOf(d)),
  );
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  let cursor = weekOf(now);
  if (!weeks.has(cursor)) cursor -= WEEK_MS; // grace: streak alive if last week logged
  let streak = 0;
  while (weeks.has(cursor)) {
    streak += 1;
    cursor -= WEEK_MS;
  }
  return streak;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  useLocalDay();
  const { state, setStep, syncing, refresh, saveStatus, hydrated } = useWizard();
  const { t, language } = useTranslation();
  const setup = useSetup();
  const { page, scrollBottom, contentWidth, horizontal } = useResponsiveLayout();
  const go = (step: number) => { setStep(step); navigation.navigate('Guided'); };
  const update = latestUpdate(state.checkins, t);
  const journey = trackingJourney(state);
  const interaction = computeDrugInteractions(state, t)[0];
  const { width, fontScale } = useWindowDimensions();
  const stackedLinks = fontScale > 1.3 || width < 340;
  const today = (() => { try { return new Date().toLocaleDateString(language, { weekday: 'long', month: 'short', day: 'numeric' }); } catch { return ''; } })();
  const links: Array<{ icon: AppIconName; step: number }> = [
    { icon: 'chart', step: 6 }, { icon: 'file', step: 8 },
  ];
  return <SafeAreaView style={styles.safe} edges={['top','left','right']}><AmbientBackground backgroundColor={palette.canvas} markOpacity={0} /><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20, paddingBottom: scrollBottom }} refreshControl={<RefreshControl refreshing={syncing} onRefresh={refresh} />}><View style={[page, { gap: 24 }]}>
    <View style={styles.topBar}><TopBar onReviewSymptoms={() => go(2)} /></View>
    <View style={styles.pageHeading}><View style={styles.headingCopy}>{today ? <Text style={styles.date}>{today}</Text> : null}<Text accessibilityRole="header" style={styles.title}>{t('clean.today')}</Text></View></View>
    <SaveState />
    {saveStatus === 'unavailable' ? <Section><Text style={refined.headingText}>{t('tracking.load_title')}</Text><Text style={refined.body}>{t('tracking.load_body')}</Text></Section> : !hydrated ? <Section><Text style={refined.body}>{t('journey.loading')}</Text></Section> : <>
      {journey.stage === 'new' ? <Text style={refined.body}>{t('journey.purpose')}</Text> : null}
      {!journey.firstUpdate ? <RecentUpdateStrip onRecord={() => go(5)} /> : null}
      <MedicationFocusCard onGo={go} onSetup={async () => { if (await setup.begin()) navigation.navigate('Guided'); }} />
      {setup.error ? <Text accessibilityRole="alert" style={refined.body}>{t('setup.error')}</Text> : null}
      {update.checkin ? <LatestUpdateCard update={update} loading={saveStatus === 'loading'} onCheckin={() => go(5)} /> : null}
      {interaction ? <ListRow icon="plan" title={interaction.title} detail={interaction.action} onPress={() => go(4)} /> : null}
      {journey.firstUpdate ? <Text style={refined.meta}>{t('journey.record_help')}</Text> : <View style={styles.navigationArea}>
        <View style={styles.navigationGrid}>
          {links.map(link => <Pressable key={link.step} accessibilityRole="button" accessibilityLabel={t('step.' + link.step)} onPress={() => go(link.step)} style={({ pressed }) => [styles.navigationItem, { width: stackedLinks ? '100%' : (contentWidth - horizontal * 2 - 8) / 2 }, stackedLinks && styles.navigationItemStacked, pressed && styles.pressed]}>
            <AppIcon name={link.icon} size={20} color={palette.accent} /><Text style={[styles.navigationText, stackedLinks && styles.navigationTextStacked]}>{t('step.' + link.step)}</Text>
          </Pressable>)}
        </View>
        <AskBubble onReviewSymptoms={() => go(2)} trigger={open => <Pressable accessibilityRole="button" accessibilityLabel={t('ai.general_title')} onPress={open} style={({ pressed }) => [styles.assistantLink, pressed && styles.pressed]}><AppIcon name="spark" size={20} color={palette.accent} /><Text style={styles.assistantText}>{t('ai.general_title')}</Text><AppIcon name="arrow" size={18} color={palette.accent} /></Pressable>} />
      </View>}
    </>}
  </View></ScrollView></SafeAreaView>;
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.canvas },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: -8 },
  askPill: { minHeight: 44, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.primary50, borderWidth: 1.5, borderColor: colors.sage },
  askPillText: { flexShrink: 1, fontSize: 15, lineHeight: 20, fontWeight: '700', color: colors.pine },
  pageHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  headingCopy: { flex: 1, gap: 6 },
  brand: { width: 60, height: 60, tintColor: palette.accent, opacity: .1 },
  title: { fontSize: 36, lineHeight: 43, fontWeight: '700', color: colors.pine, letterSpacing: -1 },
  date: { fontSize: 15, lineHeight: 23, color: palette.muted },
  navigationArea: { gap: 8 },
  navigationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  navigationItem: { minHeight: 72, paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 28, backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.border },
  navigationItemStacked: { flexDirection: 'row', justifyContent: 'flex-start', gap: 12, paddingHorizontal: 6 },
  navigationText: { flexShrink: 1, fontSize: 16, lineHeight: 24, fontWeight: '500', color: palette.ink, textAlign: 'center' },
  navigationTextStacked: { fontSize: 16, lineHeight: 23, textAlign: 'left' },
  assistantLink: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 18, backgroundColor: colors.primary50 },
  assistantText: { flexShrink: 1, fontSize: 16, lineHeight: 23, fontWeight: '500', color: palette.accent },
  pressed: { backgroundColor: palette.pressed },
});
