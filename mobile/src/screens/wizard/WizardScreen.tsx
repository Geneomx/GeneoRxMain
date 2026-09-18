import React, { useEffect, useRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { track } from '@/api/analytics';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Button } from '@/components/Button';
import { useAuth } from '@/auth/AuthContext';
import { useWizard } from '@/store/WizardContext';
import {
  nextVisibleStep,
  normalizeStep,
  prevVisibleStep,
  visibleSteps,
} from '@/content/wizardData';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { useDashboardNavigation } from '@/navigation/useDashboardNavigation';
import { colors, gradients, radius, spacing } from '@/theme';
import { AccountStep } from '@/screens/wizard/steps/AccountStep';
import { MedicationsStep } from '@/screens/wizard/steps/MedicationsStep';
import { SymptomsStep } from '@/screens/wizard/steps/SymptomsStep';
import { WellbeingStep } from '@/screens/wizard/steps/WellbeingStep';
import { ResultsStep } from '@/screens/wizard/steps/ResultsStep';
import { CheckinStep } from '@/screens/wizard/steps/CheckinStep';
import { InsightsStep } from '@/screens/wizard/steps/InsightsStep';
import { ProgressStep } from '@/screens/wizard/steps/ProgressStep';
import { SummaryStep } from '@/screens/wizard/steps/SummaryStep';
import { FeedbackStep } from '@/screens/wizard/steps/FeedbackStep';

const CheckinStepScreen: React.FC = () => <CheckinStep advanceToProgress />;

const STEP_COMPONENTS = [
  AccountStep, MedicationsStep, SymptomsStep, WellbeingStep, ResultsStep,
  CheckinStepScreen, ProgressStep, InsightsStep, SummaryStep, FeedbackStep,
];

export const WizardScreen: React.FC = () => {
  const { state, setStep, reset } = useWizard();
  const { isGuest } = useAuth();
  const { t } = useTranslation();
  const goToDashboard = useDashboardNavigation();
  const insets = useSafeAreaInsets();
  const { horizontal, scrollBottom } = useResponsiveLayout();

  const steps = visibleSteps(isGuest);
  const step = normalizeStep(state.step, isGuest);
  const stepIndex = steps.indexOf(step);
  const total = steps.length;
  const StepComponent = STEP_COMPONENTS[step];
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= total - 1;

  useEffect(() => {
    if (step !== state.step) setStep(step);
  }, [step, state.step, setStep]);

  // Wizard funnel, mirroring the web portal's three events and their names.
  // Keyed off the NORMALIZED step so tab presses, Back/Continue and direct
  // setStep calls are all covered by this one seam; the ref makes it fire only
  // on an actual change (a language switch re-runs the effect but must not
  // re-log the step).
  const lastTrackedStep = useRef<number | null>(null);
  // Keeps the active pill visible in the horizontal tray without the user
  // having to hunt for it after a jump.
  const trayRef = useRef<ScrollView | null>(null);
  const trayX = useRef<Record<number, number>>({});
  useEffect(() => {
    if (lastTrackedStep.current === step) return;
    lastTrackedStep.current = step;

    track('wizard_step_viewed', { step, label: t(`step.${step}`) });
    if (step === 4) track('results_viewed');
    if (step === 8) track('wizard_completed');
  }, [step, t]);

  const confirmReset = () =>
    Alert.alert(t('mobile.reset.title'), t('mobile.reset.body'), [
      { text: t('common.no'), style: 'cancel' },
      { text: t('mobile.reset.confirm'), style: 'destructive', onPress: reset },
    ]);

  useEffect(() => {
    const x = trayX.current[step];
    if (x === undefined) return;
    // Nudge it left of centre so the following steps stay hinted at.
    trayRef.current?.scrollTo({ x: Math.max(0, x - 80), animated: true });
  }, [step]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AmbientBackground />
      <View style={[styles.header, { paddingHorizontal: horizontal }]}>
        {/* Title + subtitle + pill tabs — mirrors the website portal header */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
            {t(`step.${step}`)}
          </Text>
          <Pressable onPress={confirmReset} hitSlop={8} style={styles.resetBtn}>
            <Text style={styles.resetText}>{t('common.reset')}</Text>
          </Pressable>
        </View>
        <Text style={styles.sub} numberOfLines={3}>{t(`step.${step}.sub`)}</Text>

        <ScrollView
          ref={trayRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          keyboardShouldPersistTaps="handled"
        >
          {steps.map((idx) => {
            const isOn = idx === step;
            return (
              <Pressable
                key={idx}
                onPress={() => setStep(idx)}
                onLayout={(e) => {
                  trayX.current[idx] = e.nativeEvent.layout.x;
                }}
                style={[styles.tab, isOn && styles.tabOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isOn }}
              >
                {isOn && (
                  <LinearGradient
                    colors={gradients.stepActive}
                    start={gradients.start}
                    end={gradients.end}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text style={[styles.tabText, isOn && styles.tabTextOn]} numberOfLines={1}>
                  {/* step.N.short exists in every pack and was unused; the
                      full labels are what forced the tray to wrap. */}
                  {t(`step.${idx}.short`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingHorizontal: horizontal, paddingBottom: scrollBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StepComponent />
      </ScrollView>

      <View style={[styles.nav, { paddingHorizontal: horizontal, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {!isFirst ? (
          <View style={{ flex: 1 }}>
            <Button
              title={t('nav.back')}
              variant="secondary"
              onPress={() => setStep(prevVisibleStep(step, isGuest))}
            />
          </View>
        ) : null}
        <View style={{ flex: isFirst ? 1 : 1.5 }}>
          <Button
            title={isLast ? t('nav.home') : t('nav.continue')}
            onPress={isLast ? goToDashboard : () => setStep(nextVisibleStep(step, isGuest))}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },

  /* Pill tab tray — wraps to new rows like website .steps (flex-wrap) */
  // Single scrolling row. Deliberately NOT flexWrap: with 9 steps the wrapping
  // version ran to three rows and cost ~120px before any content rendered.
  tabs: { flexDirection: 'row', gap: 8, paddingVertical: 2, paddingRight: 12 },
  tab: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.ghostBg,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  tabOn: { borderColor: 'rgba(40, 225, 255, 0.35)' },
  tabText: { fontSize: 13, color: colors.textSoft, fontWeight: '600' },
  tabTextOn: { color: colors.onPrimary, fontWeight: '900' },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginTop: 2 },
  sub: { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginTop: -4 },
  resetBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  resetText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },

  body: { gap: spacing.md, paddingTop: spacing.lg },

  nav: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
});
